import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { apiKeyGuard } from "../../shared/middleware/apiKeyGuard.js";
import { authGuard } from "../../shared/middleware/authGuard.js";
import { ingestAckSchema, ingestRunSchema, runDetailSchema, runIdParam } from "./runs.schema.js";
import * as service from "./runs.service.js";

// Machine ingest surface (API-key auth).
export function runsIngestRoutes(app: FastifyInstance): void {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", apiKeyGuard);

  r.post(
    "/runs",
    { schema: { body: ingestRunSchema, response: { 201: ingestAckSchema } } },
    async (req, reply) => {
      const ack = await service.ingestRun(req.agentId, req.body);
      return reply.code(201).send(ack);
    },
  );
}

// Dashboard run reads (session-JWT auth).
export function runsDashboardRoutes(app: FastifyInstance): void {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authGuard);

  r.get("/:id", { schema: { params: runIdParam, response: { 200: runDetailSchema } } }, async (req) => {
    return service.getRun(req.params.id, req.user.sub);
  });
}
