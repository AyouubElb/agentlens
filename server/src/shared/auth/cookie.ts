import type { FastifyReply } from "fastify";
import { env } from "../../config/env.js";

export const AUTH_COOKIE = "token";

const baseOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(AUTH_COOKIE, token, baseOptions);
}

export function clearAuthCookie(reply: FastifyReply): void {
  reply.clearCookie(AUTH_COOKIE, baseOptions);
}
