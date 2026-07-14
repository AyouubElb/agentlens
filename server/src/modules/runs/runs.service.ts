import type { Prisma } from "../../generated/prisma/client.js";
import { NotFoundError } from "../../shared/errors/errors.js";
import type { IngestAck, IngestRunInput, RunDetail } from "./runs.schema.js";
import type { RunWithVersion } from "./runs.repo.js";
import * as repo from "./runs.repo.js";

function toRunDetail(run: RunWithVersion): RunDetail {
  return {
    id: run.id,
    versionLabel: run.agentVersion.label,
    input: run.input,
    output: run.output,
    context: run.context as RunDetail["context"],
    metadata: run.metadata as RunDetail["metadata"],
    status: run.status,
    overallScore: run.overallScore,
    createdAt: run.createdAt,
  };
}

export async function ingestRun(agentId: string, input: IngestRunInput): Promise<IngestAck> {
  const version = await repo.findOrCreateVersion(agentId, input.versionLabel);
  const run = await repo.createRun(version.id, {
    input: input.input,
    output: input.output,
    context: input.context as Prisma.InputJsonValue | undefined,
    metadata: input.metadata as Prisma.InputJsonValue | undefined,
  });
  return { id: run.id, status: run.status, createdAt: run.createdAt };
}

export async function getRun(runId: string, userId: string): Promise<RunDetail> {
  const run = await repo.findRun(runId, userId);
  if (!run) throw new NotFoundError("Run not found");
  return toRunDetail(run);
}
