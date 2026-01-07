import { FastifyReply } from 'fastify';

export const unauthorizedResponse = (res: FastifyReply, message: string) => {
    res.code(401);
    return {
        error: 'Unauthorized',
        message,
    };
};

