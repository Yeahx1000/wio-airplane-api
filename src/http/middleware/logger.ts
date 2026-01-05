import { FastifyRequest, FastifyReply } from 'fastify';
import { recordRequest } from '../../observability/metrics.js';

declare module 'fastify' {
    interface FastifyRequest {
        startTime?: number;
    }
}

export const logger = async (req: FastifyRequest, res: FastifyReply) => {
    if (req.startTime) {
        const duration = Date.now() - req.startTime;
        recordRequest(req.method, req.url, duration);
        req.log.info({
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        }, 'Request completed');
    }
};

