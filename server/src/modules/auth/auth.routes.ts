import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { env } from "../../config/env.js";
import { authGuard } from "../../shared/middleware/authGuard.js";
import { clearAuthCookie, setAuthCookie } from "../../shared/auth/cookie.js";
import { loginSchema, registerSchema, userSchema } from "./auth.schema.js";
import * as service from "./auth.service.js";

export function authRoutes(app: FastifyInstance): void {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post("/register", { schema: { body: registerSchema, response: { 201: userSchema } } }, async (req, reply) => {
    const user = await service.register(req.body);
    return reply.code(201).send(user);
  });

  r.post("/login", { schema: { body: loginSchema, response: { 200: userSchema } } }, async (req, reply) => {
    const user = await service.login(req.body);
    const token = await reply.jwtSign({ sub: user.id }, { expiresIn: env.JWT_EXPIRES_IN });
    setAuthCookie(reply, token);
    return reply.send(user);
  });

  r.post("/logout", { schema: { response: { 200: z.object({ ok: z.boolean() }) } } }, async (_req, reply) => {
    clearAuthCookie(reply);
    return reply.send({ ok: true });
  });

  r.get("/me", { preHandler: authGuard, schema: { response: { 200: userSchema } } }, async (req, reply) => {
    const user = await service.getById(req.user.sub);
    return reply.send(user);
  });
}
