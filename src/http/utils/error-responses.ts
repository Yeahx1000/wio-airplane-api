import { FastifyReply } from "fastify";

export const unauthorizedResponse = (res: FastifyReply, message: string): void => {
    res.status(401).send({
        error: "Unauthorized",
        message,
    });
};
