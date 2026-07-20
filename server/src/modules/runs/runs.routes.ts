import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { apiKeyGuard } from "../../shared/middleware/apiKeyGuard.js";
import { authGuard } from "../../shared/middleware/authGuard.js";
import {
  globalRunPageSchema,
  globalRunsQuery,
  ingestAckSchema,
  ingestRunSchema,
  queueFacetsSchema,
  runDetailSchema,
  runIdParam,
  scoredRunSchema,
  submitScoresSchema,
} from "./runs.schema.js";
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

  // The cross-agent scoring queue — all of the caller's runs, filterable + paginated.
  r.get(
    "/",
    { schema: { querystring: globalRunsQuery, response: { 200: globalRunPageSchema } } },
    async (req) => {
      return service.listRuns(req.user.sub, req.query);
    },
  );

  // Registered before "/:id" so "facets" isn't matched as a run id.
  r.get("/facets", { schema: { response: { 200: queueFacetsSchema } } }, async (req) => {
    return service.getFacets(req.user.sub);
  });

  r.get("/:id", { schema: { params: runIdParam, response: { 200: runDetailSchema } } }, async (req) => {
    return service.getRun(req.params.id, req.user.sub);
  });

  r.post(
    "/:id/scores",
    { schema: { params: runIdParam, body: submitScoresSchema, response: { 200: scoredRunSchema } } },
    async (req) => {
      return service.submitScores(req.params.id, req.user.sub, req.body);
    },
  );
}
