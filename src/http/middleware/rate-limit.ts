import { FastifyRequest, FastifyReply } from 'fastify';
import { redisClient } from '../../cache/index.js';
import { cacheKeys } from '../../cache/keys.js';
import { config } from '../../config/env.js';

type RateLimitResult = {
    allowed: boolean;
    remaining: number;
    reset: number;
    limit: number;
}

function getClientIp(req: FastifyRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
}

function getCurrentWindow(windowMs: number): number {
    return Math.floor(Date.now() / windowMs);
}

async function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): Promise<RateLimitResult> {
    const window = getCurrentWindow(windowMs);
    const redisKey = `${key}:${window}`;
    const reset = (window + 1) * windowMs;

    try {
        const client = redisClient.getClient();

        if (client.status !== 'ready' && client.status !== 'connect') {
            await redisClient.connect();
        }

        const current = await client.incr(redisKey);

        if (current === 1) {
            await client.pexpire(redisKey, windowMs);
        }

        const remaining = Math.max(0, limit - current);
        const allowed = current <= limit;

        return {
            allowed,
            remaining,
            reset,
            limit,
        };
    } catch (error) {
        console.error('Rate limit Redis error:', error);
        return {
            allowed: true,
            remaining: limit,
            reset: Date.now() + windowMs,
            limit,
        };
    }
}

const SKIP_PATHS = ['/health', '/docs', '/docs/json'];

function shouldSkipRateLimit(path: string): boolean {
    return SKIP_PATHS.some((skipPath) => path.startsWith(skipPath));
}

export const rateLimit = async (
    req: FastifyRequest,
    res: FastifyReply
): Promise<void> => {
    if (!config.rateLimit.enabled) {
        return;
    }

    if (shouldSkipRateLimit(req.url)) {
        return;
    }

    try {
        const client = redisClient.getClient();
        if (client.status !== 'ready' && client.status !== 'connect') {
            await redisClient.connect();
        }

        const globalKey = cacheKeys.rateLimit.global(config.rateLimit.globalWindowMs);
        const ip = getClientIp(req);
        const ipKey = cacheKeys.rateLimit.ip(ip, config.rateLimit.windowMs);

        const globalWindow = getCurrentWindow(config.rateLimit.globalWindowMs);
        const ipWindow = getCurrentWindow(config.rateLimit.windowMs);
        const globalRedisKey = `${globalKey}:${globalWindow}`;
        const ipRedisKey = `${ipKey}:${ipWindow}`;

        const pipeline = client.pipeline();
        pipeline.incr(globalRedisKey);
        pipeline.incr(ipRedisKey);
        pipeline.ttl(globalRedisKey);
        pipeline.ttl(ipRedisKey);

        const results = await pipeline.exec();
        if (!results || results.length < 4) {
            console.error('Rate limit pipeline failed, allowing request');
            return;
        }

        const globalError = results[0][0];
        const ipError = results[1][0];
        if (globalError || ipError) {
            console.error('Rate limit pipeline error:', globalError || ipError);
            return;
        }

        const globalCurrent = results[0][1] as number;
        const ipCurrent = results[1][1] as number;

        if (globalCurrent === 1) {
            await client.pexpire(globalRedisKey, config.rateLimit.globalWindowMs);
        }
        if (ipCurrent === 1) {
            await client.pexpire(ipRedisKey, config.rateLimit.windowMs);
        }

        const globalRemaining = Math.max(0, config.rateLimit.globalMax - globalCurrent);
        const globalAllowed = globalCurrent <= config.rateLimit.globalMax;
        const globalReset = (globalWindow + 1) * config.rateLimit.globalWindowMs;

        if (!globalAllowed) {
            const retryAfter = Math.ceil((globalReset - Date.now()) / 1000);
            res.status(429)
                .header('Retry-After', retryAfter.toString())
                .header('X-RateLimit-Limit', config.rateLimit.globalMax.toString())
                .header('X-RateLimit-Remaining', globalRemaining.toString())
                .header('X-RateLimit-Reset', new Date(globalReset).toISOString())
                .send({
                    error: 'Rate limit exceeded',
                    message: `Global rate limit exceeded. Limit: ${config.rateLimit.globalMax} requests per second`,
                    retryAfter,
                });
            return;
        }

        const ipRemaining = Math.max(0, config.rateLimit.perIp - ipCurrent);
        const ipAllowed = ipCurrent <= config.rateLimit.perIp;
        const ipReset = (ipWindow + 1) * config.rateLimit.windowMs;

        res.header('X-RateLimit-Limit', config.rateLimit.perIp.toString());
        res.header('X-RateLimit-Remaining', ipRemaining.toString());
        res.header('X-RateLimit-Reset', new Date(ipReset).toISOString());
        res.header('X-RateLimit-Global-Limit', config.rateLimit.globalMax.toString());
        res.header('X-RateLimit-Global-Remaining', globalRemaining.toString());

        if (!ipAllowed) {
            const retryAfter = Math.ceil((ipReset - Date.now()) / 1000);
            res.status(429)
                .header('Retry-After', retryAfter.toString())
                .send({
                    error: 'Rate limit exceeded',
                    message: `Too many requests from this IP. Limit: ${config.rateLimit.perIp} per ${config.rateLimit.windowMs / 1000} seconds`,
                    retryAfter,
                });
            return;
        }
    } catch (error) {
        console.error('Rate limit Redis error:', error);
    }
};
