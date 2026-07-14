import type {
  Agent,
  AgentVersion,
  ApiKey,
  Criterion,
  Rubric,
  Run,
  RunStatus,
} from "../../generated/prisma/client.js";
import { prisma } from "../../db/client.js";
import type {
  CreateAgentInput,
  CreateCriterionInput,
  UpdateAgentInput,
  UpdateCriterionInput,
  UpdateRubricInput,
} from "./agents.schema.js";

export type RubricWithCriteria = Rubric & { criteria: Criterion[] };
export type AgentWithRubric = Agent & { rubric: RubricWithCriteria };

export function listAgents(userId: string): Promise<Agent[]> {
  return prisma.agent.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export function findAgent(id: string, userId: string): Promise<Agent | null> {
  return prisma.agent.findFirst({ where: { id, userId } });
}

export function findAgentDetail(id: string, userId: string): Promise<AgentWithRubric | null> {
  return prisma.agent.findFirst({
    where: { id, userId },
    include: { rubric: { include: { criteria: true } } },
  }) as Promise<AgentWithRubric | null>;
}

export function createAgentWithRubric(
  userId: string,
  input: CreateAgentInput,
): Promise<AgentWithRubric> {
  return prisma.agent.create({
    data: {
      userId,
      name: input.name,
      rubric: {
        create: {
          name: input.rubric.name,
          criteria: { create: input.rubric.criteria },
        },
      },
    },
    include: { rubric: { include: { criteria: true } } },
  }) as Promise<AgentWithRubric>;
}

export async function updateAgent(
  id: string,
  userId: string,
  data: UpdateAgentInput,
): Promise<Agent | null> {
  const { count } = await prisma.agent.updateMany({ where: { id, userId }, data });
  return count === 0 ? null : prisma.agent.findFirst({ where: { id, userId } });
}

export async function deleteAgent(id: string, userId: string): Promise<boolean> {
  const { count } = await prisma.agent.deleteMany({ where: { id, userId } });
  return count > 0;
}

export function findRubric(agentId: string, userId: string): Promise<RubricWithCriteria | null> {
  return prisma.rubric.findFirst({
    where: { agentId, agent: { userId } },
    include: { criteria: true },
  }) as Promise<RubricWithCriteria | null>;
}

export async function updateRubric(
  agentId: string,
  userId: string,
  data: UpdateRubricInput,
): Promise<RubricWithCriteria | null> {
  const { count } = await prisma.rubric.updateMany({
    where: { agentId, agent: { userId } },
    data,
  });
  return count === 0 ? null : findRubric(agentId, userId);
}

export async function addCriterion(
  agentId: string,
  userId: string,
  data: CreateCriterionInput,
): Promise<Criterion | null> {
  const rubric = await prisma.rubric.findFirst({
    where: { agentId, agent: { userId } },
    select: { id: true },
  });
  if (!rubric) return null;
  return prisma.criterion.create({ data: { ...data, rubricId: rubric.id } });
}

export async function updateCriterion(
  cid: string,
  agentId: string,
  userId: string,
  data: UpdateCriterionInput,
): Promise<Criterion | null> {
  const { count } = await prisma.criterion.updateMany({
    where: { id: cid, rubric: { agentId, agent: { userId } } },
    data,
  });
  return count === 0 ? null : prisma.criterion.findUnique({ where: { id: cid } });
}

export async function deleteCriterion(
  cid: string,
  agentId: string,
  userId: string,
): Promise<boolean> {
  const { count } = await prisma.criterion.deleteMany({
    where: { id: cid, rubric: { agentId, agent: { userId } } },
  });
  return count > 0;
}

export async function createKey(
  agentId: string,
  userId: string,
  data: { name: string; prefix: string; keyHash: string },
): Promise<ApiKey | null> {
  const agent = await prisma.agent.findFirst({ where: { id: agentId, userId }, select: { id: true } });
  if (!agent) return null;
  return prisma.apiKey.create({ data: { ...data, agentId } });
}

export function listKeys(agentId: string, userId: string): Promise<ApiKey[]> {
  return prisma.apiKey.findMany({
    where: { agentId, agent: { userId } },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeKey(kid: string, agentId: string, userId: string): Promise<boolean> {
  const { count } = await prisma.apiKey.updateMany({
    where: { id: kid, agentId, agent: { userId }, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count > 0;
}

export type RunWithLabel = Run & { agentVersion: Pick<AgentVersion, "label"> };

export function listRuns(
  agentId: string,
  userId: string,
  status?: RunStatus,
): Promise<RunWithLabel[]> {
  return prisma.run.findMany({
    where: { agentVersion: { agentId, agent: { userId } }, ...(status ? { status } : {}) },
    include: { agentVersion: { select: { label: true } } },
    orderBy: { createdAt: "desc" },
  }) as Promise<RunWithLabel[]>;
}

export function listVersions(agentId: string, userId: string): Promise<AgentVersion[]> {
  return prisma.agentVersion.findMany({
    where: { agentId, agent: { userId } },
    orderBy: { createdAt: "desc" },
  });
}

export function findVersion(
  agentId: string,
  userId: string,
  label: string,
): Promise<AgentVersion | null> {
  return prisma.agentVersion.findFirst({ where: { agentId, label, agent: { userId } } });
}
