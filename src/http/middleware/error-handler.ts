import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export const errorHandler = (
  err: FastifyError,
  req: FastifyRequest,
  res: FastifyReply
) => {
  console.error(err);
  res.status(err.statusCode || 500).send({
    message: err.message || 'Internal Server Error',
    code: err.code || undefined,
  });
};

