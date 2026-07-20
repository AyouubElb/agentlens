import type { AgentVersion, Criterion, Run, RunStatus, Score } from "../../generated/prisma/client.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/client.js";
import type { PageParams } from "../../shared/pagination/pagination.js";
import { skipTake } from "../../shared/pagination/pagination.js";

// A run with everything the evaluation page needs: version label, its rubric's criteria, its scores.
export type RunWithRubricAndScores = Run & {
  agentVersion: {
    label: string;
    agent: { rubric: { criteria: Criterion[] } | null };
  };
  scores: Score[];
};

const runDetailInclude = {
  agentVersion: {
    select: {
      label: true,
      agent: { select: { rubric: { select: { criteria: true } } } },
    },
  },
  scores: true,
} satisfies Prisma.RunInclude;

export function findOrCreateVersion(agentId: string, label: string): Promise<AgentVersion> {
  return prisma.agentVersion.upsert({
    where: { agentId_label: { agentId, label } },
    create: { agentId, label },
    update: {},
  });
}

export function createRun(
  agentVersionId: string,
  data: {
    input: string;
    output: string;
    context?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
  },
): Promise<Run> {
  return prisma.run.create({ data: { agentVersionId, ...data } });
}

export function findRun(runId: string, userId: string): Promise<RunWithRubricAndScores | null> {
  return prisma.run.findFirst({
    where: { id: runId, agentVersion: { agent: { userId } } },
    include: runDetailInclude,
  }) as Promise<RunWithRubricAndScores | null>;
}

// A run plus its version label and owning agent's id/name — the cross-agent queue row.
export type RunWithAgent = Run & {
  agentVersion: { label: string; agent: { id: string; name: string } };
};

const globalRunInclude = {
  agentVersion: { select: { label: true, agent: { select: { id: true, name: true } } } },
} satisfies Prisma.RunInclude;

export interface QueueFilter {
  status?: RunStatus;
  agentId?: string;
  agentName?: string;
  versionLabel?: string;
  sort: "oldest" | "newest";
}

// All of a user's runs across every agent, tenant-scoped via the version→agent→user chain, filtered
// and sorted for the scoring queue.
export async function listRunsForUser(
  userId: string,
  page: PageParams,
  filter: QueueFilter,
): Promise<{ items: RunWithAgent[]; total: number }> {
  const where: Prisma.RunWhereInput = {
    agentVersion: {
      agent: {
        userId,
        ...(filter.agentId ? { id: filter.agentId } : {}),
        ...(filter.agentName ? { name: { contains: filter.agentName, mode: "insensitive" } } : {}),
      },
      ...(filter.versionLabel ? { label: filter.versionLabel } : {}),
    },
    ...(filter.status ? { status: filter.status } : {}),
  };
  const orderBy = { createdAt: filter.sort === "oldest" ? "asc" : "desc" } as const;

  const [items, total] = await Promise.all([
    prisma.run.findMany({ where, include: globalRunInclude, orderBy, ...skipTake(page) }),
    prisma.run.count({ where }),
  ]);
  return { items: items as RunWithAgent[], total };
}

// Distinct agents + version labels for the queue's filter dropdowns.
export async function queueFacets(
  userId: string,
): Promise<{ agents: { id: string; name: string }[]; versions: string[] }> {
  const [agents, versionRows] = await Promise.all([
    prisma.agent.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.agentVersion.findMany({
      where: { agent: { userId } },
      select: { label: true },
      distinct: ["label"],
      orderBy: { label: "asc" },
    }),
  ]);
  return { agents, versions: versionRows.map((v) => v.label) };
}

// Replace the run's scores and its rollup atomically: upsert each score, then flip the run to scored.
export function replaceScores(
  runId: string,
  entries: { criterionId: string; value: number; justification?: string }[],
  overall: number,
): Promise<unknown> {
  return prisma.$transaction([
    ...entries.map((e) =>
      prisma.score.upsert({
        where: { runId_criterionId: { runId, criterionId: e.criterionId } },
        create: { runId, criterionId: e.criterionId, value: e.value, justification: e.justification },
        update: { value: e.value, justification: e.justification ?? null },
      }),
    ),
    prisma.run.update({ where: { id: runId }, data: { overallScore: overall, status: "scored" } }),
  ]);
}
