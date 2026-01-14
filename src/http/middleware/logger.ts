import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        startTime?: number;
    }
}

export const logger = async (req: FastifyRequest, res: FastifyReply) => {
    if (req.startTime) {
        const duration = Date.now() - req.startTime;
        req.log.info({
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        }, 'Request completed');
    }
};

