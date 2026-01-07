import { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../../errors/";

export const errorHandler = (err: FastifyError, req: FastifyRequest, res: FastifyReply) => {
  const isAppError = err instanceof AppError;

  if (isAppError) {
    res.status(err.statusCode).send({
      message: err.message,
      code: err.code,
    });
    return;
  }

  req.log?.error({ err }, "Unhandled error");

  res.status(err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500).send({
    message: "Internal Server Error",
    code: "INTERNAL_SERVER_ERROR",
  });
};
