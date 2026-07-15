import type { AgentVersion, Run } from "../../generated/prisma/client.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/client.js";

export type RunWithVersion = Run & { agentVersion: Pick<AgentVersion, "label"> };

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

export function findRun(runId: string, userId: string): Promise<RunWithVersion | null> {
  return prisma.run.findFirst({
    where: { id: runId, agentVersion: { agent: { userId } } },
    include: { agentVersion: { select: { label: true } } },
  }) as Promise<RunWithVersion | null>;
}
