import type { Prisma } from "../../generated/prisma/client.js";
import { NotFoundError, ValidationError } from "../../shared/errors/errors.js";
import type { Page } from "../../shared/pagination/pagination.js";
import type {
  GlobalRunListItem,
  GlobalRunsQuery,
  IngestAck,
  IngestRunInput,
  Overview,
  QueueFacets,
  RunDetail,
  ScoredRun,
  SubmitScoresInput,
} from "./runs.schema.js";
import type { RunWithAgent, RunWithRubricAndScores } from "./runs.repo.js";
import { weightedOverall } from "./rollup.js";
import * as repo from "./runs.repo.js";

function toRunDetail(run: RunWithRubricAndScores): RunDetail {
  const scoreByCriterion = new Map(run.scores.map((s) => [s.criterionId, s]));
  const criteria = (run.agentVersion.agent.rubric?.criteria ?? []).map((c) => {
    const s = scoreByCriterion.get(c.id);
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      weight: c.weight,
      score: s ? { value: s.value, justification: s.justification } : null,
    };
  });
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
    criteria,
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

function toGlobalRunListItem(run: RunWithAgent): GlobalRunListItem {
  return {
    id: run.id,
    agentId: run.agentVersion.agent.id,
    agentName: run.agentVersion.agent.name,
    versionLabel: run.agentVersion.label,
    input: run.input,
    status: run.status,
    overallScore: run.overallScore,
    createdAt: run.createdAt,
  };
}

export async function listRuns(
  userId: string,
  query: GlobalRunsQuery,
): Promise<Page<GlobalRunListItem>> {
  const { page, limit, status, agentId, agentName, versionLabel, sort } = query;
  // The queue is an unscored worklist unless the caller asks otherwise.
  const { items, total } = await repo.listRunsForUser(
    userId,
    { page, limit },
    { status: status ?? "unscored", agentId, agentName, versionLabel, sort },
  );
  return { items: items.map(toGlobalRunListItem), page, limit, total };
}

export function getFacets(userId: string): Promise<QueueFacets> {
  return repo.queueFacets(userId);
}

export async function getOverview(userId: string): Promise<Overview> {
  const s = await repo.overviewStats(userId);
  return {
    agents: s.agents,
    totalRuns: s.totalRuns,
    unscored: s.unscored,
    avgScore: s.avgScore,
    recentRuns: s.recentRuns.map(toGlobalRunListItem),
  };
}

export async function getRun(runId: string, userId: string): Promise<RunDetail> {
  const run = await repo.findRun(runId, userId);
  if (!run) throw new NotFoundError("Run not found");
  return toRunDetail(run);
}

export async function submitScores(
  runId: string,
  userId: string,
  input: SubmitScoresInput,
): Promise<ScoredRun> {
  const run = await repo.findRun(runId, userId);
  if (!run) throw new NotFoundError("Run not found");

  const criteria = run.agentVersion.agent.rubric?.criteria ?? [];
  const weightById = new Map(criteria.map((c) => [c.id, c.weight]));
  const submitted = input.scores.map((s) => s.criterionId);

  // The submission must cover each rubric criterion exactly once — no missing, extra, or duplicate.
  if (new Set(submitted).size !== submitted.length) {
    throw new ValidationError("Duplicate criterion in scores");
  }
  if (submitted.length !== criteria.length || !submitted.every((id) => weightById.has(id))) {
    throw new ValidationError("Scores must cover exactly the rubric's criteria");
  }

  const overall = weightedOverall(
    input.scores.map((s) => ({ value: s.value, weight: weightById.get(s.criterionId)! })),
  );
  await repo.replaceScores(runId, input.scores, overall);
  return { id: runId, status: "scored", overallScore: overall };
}
