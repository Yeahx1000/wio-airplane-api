import { FastifyRequest, FastifyReply } from 'fastify';

export const rateLimit = async (req: FastifyRequest, res: FastifyReply) => {
    return res
        .status(429)
        .header('Retry-After', '60')
        .send({ error: 'Rate limit exceeded' });
};

