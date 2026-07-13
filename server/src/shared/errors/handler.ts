import type { FastifyError, FastifyInstance } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { DomainError } from "./errors.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.code(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "Request does not match the schema",
        details: err.validation,
      });
    }

    // A malformed response is our bug, not the client's.
    if (isResponseSerializationError(err)) {
      req.log.error(err);
      return reply.code(500).send({
        statusCode: 500,
        error: "Internal Server Error",
        message: "Response does not match the schema",
      });
    }

    if (err instanceof DomainError) {
      return reply.code(err.statusCode).send({
        statusCode: err.statusCode,
        error: err.name,
        message: err.message,
      });
    }

    // Fastify's own client errors (e.g. body parse) carry a <500 statusCode.
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
      return reply.code(err.statusCode).send({
        statusCode: err.statusCode,
        error: err.name,
        message: err.message,
      });
    }

    req.log.error(err);
    return reply.code(500).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Something went wrong",
    });
  });
}
