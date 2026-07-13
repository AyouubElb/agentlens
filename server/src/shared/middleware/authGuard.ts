import type { FastifyRequest } from "fastify";
import { UnauthorizedError } from "../errors/errors.js";

export async function authGuard(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError();
  }
}
