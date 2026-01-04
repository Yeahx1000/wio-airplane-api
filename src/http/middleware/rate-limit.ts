import { FastifyRequest, FastifyReply } from 'fastify';
import { redisClient } from '../../cache/index.js';
import { cacheKeys } from '../../cache/keys.js';
import { config } from '../../config/env.js';

interface RateLimitResult {
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

    const globalKey = cacheKeys.rateLimit.global(config.rateLimit.globalWindowMs);
    const globalResult = await checkRateLimit(
        globalKey,
        config.rateLimit.globalMax,
        config.rateLimit.globalWindowMs
    );

    if (!globalResult.allowed) {
        const retryAfter = Math.ceil((globalResult.reset - Date.now()) / 1000);
        res.status(429)
            .header('Retry-After', retryAfter.toString())
            .header('X-RateLimit-Limit', globalResult.limit.toString())
            .header('X-RateLimit-Remaining', globalResult.remaining.toString())
            .header('X-RateLimit-Reset', new Date(globalResult.reset).toISOString())
            .send({
                error: 'Rate limit exceeded',
                message: `Global rate limit exceeded. Limit: ${globalResult.limit} requests per second`,
                retryAfter,
            });
        return;
    }

    const ip = getClientIp(req);
    const ipKey = cacheKeys.rateLimit.ip(ip, config.rateLimit.windowMs);
    const ipResult = await checkRateLimit(
        ipKey,
        config.rateLimit.perIp,
        config.rateLimit.windowMs
    );

    res.header('X-RateLimit-Limit', ipResult.limit.toString());
    res.header('X-RateLimit-Remaining', ipResult.remaining.toString());
    res.header('X-RateLimit-Reset', new Date(ipResult.reset).toISOString());
    res.header('X-RateLimit-Global-Limit', globalResult.limit.toString());
    res.header('X-RateLimit-Global-Remaining', globalResult.remaining.toString());

    if (!ipResult.allowed) {
        const retryAfter = Math.ceil((ipResult.reset - Date.now()) / 1000);
        res.status(429)
            .header('Retry-After', retryAfter.toString())
            .send({
                error: 'Rate limit exceeded',
                message: `Too many requests from this IP. Limit: ${ipResult.limit} per ${config.rateLimit.windowMs / 1000} seconds`,
                retryAfter,
            });
        return;
    }
};
