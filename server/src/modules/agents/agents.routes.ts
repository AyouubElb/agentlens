import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { authGuard } from "../../shared/middleware/authGuard.js";
import {
  agentDetailSchema,
  agentSchema,
  createAgentSchema,
  createCriterionSchema,
  criterionParam,
  criterionSchema,
  idParam,
  okSchema,
  rubricSchema,
  updateAgentSchema,
  updateCriterionSchema,
  updateRubricSchema,
} from "./agents.schema.js";
import * as service from "./agents.service.js";
import { z } from "zod";

export function agentRoutes(app: FastifyInstance): void {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authGuard);

  r.get("/", { schema: { response: { 200: z.array(agentSchema) } } }, async (req) => {
    return service.list(req.user.sub);
  });

  r.post(
    "/",
    { schema: { body: createAgentSchema, response: { 201: agentDetailSchema } } },
    async (req, reply) => {
      const agent = await service.create(req.user.sub, req.body);
      return reply.code(201).send(agent);
    },
  );

  r.get("/:id", { schema: { params: idParam, response: { 200: agentDetailSchema } } }, async (req) => {
    return service.getDetail(req.params.id, req.user.sub);
  });

  r.patch(
    "/:id",
    { schema: { params: idParam, body: updateAgentSchema, response: { 200: agentSchema } } },
    async (req) => {
      return service.rename(req.params.id, req.user.sub, req.body);
    },
  );

  r.delete("/:id", { schema: { params: idParam, response: { 200: okSchema } } }, async (req) => {
    await service.remove(req.params.id, req.user.sub);
    return { ok: true };
  });

  r.get(
    "/:id/rubric",
    { schema: { params: idParam, response: { 200: rubricSchema } } },
    async (req) => {
      return service.getRubric(req.params.id, req.user.sub);
    },
  );

  r.patch(
    "/:id/rubric",
    { schema: { params: idParam, body: updateRubricSchema, response: { 200: rubricSchema } } },
    async (req) => {
      return service.editRubric(req.params.id, req.user.sub, req.body);
    },
  );

  r.post(
    "/:id/rubric/criteria",
    { schema: { params: idParam, body: createCriterionSchema, response: { 201: criterionSchema } } },
    async (req, reply) => {
      const criterion = await service.addCriterion(req.params.id, req.user.sub, req.body);
      return reply.code(201).send(criterion);
    },
  );

  r.patch(
    "/:id/rubric/criteria/:cid",
    {
      schema: {
        params: criterionParam,
        body: updateCriterionSchema,
        response: { 200: criterionSchema },
      },
    },
    async (req) => {
      return service.editCriterion(req.params.cid, req.params.id, req.user.sub, req.body);
    },
  );

  r.delete(
    "/:id/rubric/criteria/:cid",
    { schema: { params: criterionParam, response: { 200: okSchema } } },
    async (req) => {
      await service.removeCriterion(req.params.cid, req.params.id, req.user.sub);
      return { ok: true };
    },
  );
}
