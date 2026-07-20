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
import type { PageParams } from "../../shared/pagination/pagination.js";
import { skipTake } from "../../shared/pagination/pagination.js";
import type {
  CreateAgentInput,
  CreateCriterionInput,
  UpdateAgentInput,
  UpdateCriterionInput,
  UpdateRubricInput,
} from "./agents.schema.js";

export type RubricWithCriteria = Rubric & { criteria: Criterion[] };
export type AgentWithRubric = Agent & { rubric: RubricWithCriteria };

export async function listAgents(
  userId: string,
  page: PageParams,
): Promise<{ items: Agent[]; total: number }> {
  const where = { userId };
  const [items, total] = await Promise.all([
    prisma.agent.findMany({ where, orderBy: { createdAt: "desc" }, ...skipTake(page) }),
    prisma.agent.count({ where }),
  ]);
  return { items, total };
}

export interface AgentRunStats {
  runs: number;
  unscored: number;
  sumScore: number;
  scoredCount: number;
}

// One snapshot: version→agent map + run aggregates grouped by version, so a concurrent ingest can't skew the fold.
export async function runStatsForAgents(agentIds: string[]): Promise<Map<string, AgentRunStats>> {
  const stats = new Map<string, AgentRunStats>(
    agentIds.map((id) => [id, { runs: 0, unscored: 0, sumScore: 0, scoredCount: 0 }]),
  );
  if (agentIds.length === 0) return stats;

  const [versions, grouped] = await prisma.$transaction([
    prisma.agentVersion.findMany({
      where: { agentId: { in: agentIds } },
      select: { id: true, agentId: true },
    }),
    prisma.run.groupBy({
      by: ["agentVersionId", "status"],
      where: { agentVersion: { agentId: { in: agentIds } } },
      _count: { _all: true },
      _sum: { overallScore: true },
    }),
  ]);

  const agentByVersion = new Map(versions.map((v) => [v.id, v.agentId]));
  for (const g of grouped) {
    const agentId = agentByVersion.get(g.agentVersionId);
    const s = agentId ? stats.get(agentId) : undefined;
    if (!s) continue;
    const count = g._count._all;
    s.runs += count;
    if (g.status === "unscored") {
      s.unscored += count;
    } else {
      s.scoredCount += count;
      s.sumScore += g._sum.overallScore ?? 0;
    }
  }
  return stats;
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

export async function listKeys(
  agentId: string,
  userId: string,
  page: PageParams,
): Promise<{ items: ApiKey[]; total: number }> {
  const where = { agentId, agent: { userId } };
  const [items, total] = await Promise.all([
    prisma.apiKey.findMany({ where, orderBy: { createdAt: "desc" }, ...skipTake(page) }),
    prisma.apiKey.count({ where }),
  ]);
  return { items, total };
}

export async function revokeKey(kid: string, agentId: string, userId: string): Promise<boolean> {
  const { count } = await prisma.apiKey.updateMany({
    where: { id: kid, agentId, agent: { userId }, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count > 0;
}

export type RunWithLabel = Run & { agentVersion: Pick<AgentVersion, "label"> };

export async function listRuns(
  agentId: string,
  userId: string,
  page: PageParams,
  status?: RunStatus,
): Promise<{ items: RunWithLabel[]; total: number }> {
  const where = { agentVersion: { agentId, agent: { userId } }, ...(status ? { status } : {}) };
  const [items, total] = await Promise.all([
    prisma.run.findMany({
      where,
      include: { agentVersion: { select: { label: true } } },
      orderBy: { createdAt: "desc" },
      ...skipTake(page),
    }),
    prisma.run.count({ where }),
  ]);
  return { items: items as RunWithLabel[], total };
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
