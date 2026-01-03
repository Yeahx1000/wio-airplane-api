import { FastifyRequest, FastifyReply } from 'fastify';

export const logger = async (req: FastifyRequest, res: FastifyReply) => {
    const start = Date.now();
    const duration = Date.now() - start;
    req.log.info(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
};

