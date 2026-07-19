import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { env } from "./config/env.js";
import "./shared/auth/jwt.js";
import "./shared/auth/apiKeyRequest.js";
import { registerErrorHandler } from "./shared/errors/handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { agentRoutes } from "./modules/agents/agents.routes.js";
import { runsDashboardRoutes, runsIngestRoutes } from "./modules/runs/runs.routes.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: { level: env.NODE_ENV === "test" ? "silent" : "info" },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerErrorHandler(app);

  app.register(helmet);
  app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
  // Tests fire many requests from one origin; the per-IP limit would make them order-dependent.
  app.register(rateLimit, { max: env.NODE_ENV === "test" ? Number.MAX_SAFE_INTEGER : 100, timeWindow: "1 minute" });
  app.register(cookie);
  app.register(jwt, { secret: env.JWT_SECRET, cookie: { cookieName: "token", signed: false } });
  app.register(sensible);
  app.register(swagger, {
    openapi: { info: { title: "AgentLens API", version: "0.1.0" } },
    // Render the routes' Zod schemas as JSON Schema so the spec describes real payloads.
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });
  app.register(swaggerUi, { routePrefix: "/docs" });

  app.decorateRequest("agentId", "");

  app.withTypeProvider<ZodTypeProvider>().get("/health", () => ({ status: "ok" }));

  app.register(async (instance) => authRoutes(instance), { prefix: "/api/v1/auth" });
  app.register(async (instance) => agentRoutes(instance), { prefix: "/api/v1/agents" });
  app.register(async (instance) => runsIngestRoutes(instance), { prefix: "/api/v1" });
  app.register(async (instance) => runsDashboardRoutes(instance), { prefix: "/api/v1/runs" });

  return app;
}
