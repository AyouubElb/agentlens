import type { AgentVersion, Criterion, Run, Score } from "../../generated/prisma/client.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/client.js";

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
