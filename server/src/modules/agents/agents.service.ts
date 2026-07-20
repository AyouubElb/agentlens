import type { Agent, AgentVersion, ApiKey, Criterion } from "../../generated/prisma/client.js";
import { NotFoundError } from "../../shared/errors/errors.js";
import { generateApiKey } from "../../shared/auth/apiKey.js";
import type {
  CreateAgentInput,
  CreateCriterionInput,
  CreateKeyInput,
  CreatedApiKey,
  PublicAgent,
  PublicAgentDetail,
  PublicAgentListItem,
  PublicApiKey,
  PublicCriterion,
  PublicRubric,
  PublicRunListItem,
  PublicVersion,
  RunsQuery,
  UpdateAgentInput,
  UpdateCriterionInput,
  UpdateRubricInput,
} from "./agents.schema.js";
import type { AgentRunStats, AgentWithRubric, RubricWithCriteria, RunWithLabel } from "./agents.repo.js";
import type { Page, PageParams } from "../../shared/pagination/pagination.js";
import * as repo from "./agents.repo.js";

function toAgent(a: Agent): PublicAgent {
  return { id: a.id, name: a.name, createdAt: a.createdAt };
}

// Weighted over the agent's scored runs (sum/count), never an average of per-version averages.
export function foldAvgScore(stats: AgentRunStats): number | null {
  return stats.scoredCount > 0 ? stats.sumScore / stats.scoredCount : null;
}

function toAgentListItem(a: Agent, stats: AgentRunStats): PublicAgentListItem {
  return { ...toAgent(a), runs: stats.runs, unscored: stats.unscored, avgScore: foldAvgScore(stats) };
}

function toCriterion(c: Criterion): PublicCriterion {
  return { id: c.id, name: c.name, description: c.description, weight: c.weight };
}

function toRubric(r: RubricWithCriteria): PublicRubric {
  return { id: r.id, name: r.name, criteria: r.criteria.map(toCriterion) };
}

function toAgentDetail(a: AgentWithRubric): PublicAgentDetail {
  return { ...toAgent(a), rubric: toRubric(a.rubric) };
}

// Omits keyHash — a public key shape never carries the secret material.
function toApiKey(k: ApiKey): PublicApiKey {
  return {
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    createdAt: k.createdAt,
    revokedAt: k.revokedAt,
    lastUsedAt: k.lastUsedAt,
    status: k.revokedAt ? "revoked" : "active",
  };
}

export async function list(userId: string, page: PageParams): Promise<Page<PublicAgentListItem>> {
  const { items, total } = await repo.listAgents(userId, page);
  const stats = await repo.runStatsForAgents(items.map((a) => a.id));
  const empty: AgentRunStats = { runs: 0, unscored: 0, sumScore: 0, scoredCount: 0 };
  const listItems = items.map((a) => toAgentListItem(a, stats.get(a.id) ?? empty));
  return { items: listItems, page: page.page, limit: page.limit, total };
}

export async function create(userId: string, input: CreateAgentInput): Promise<PublicAgentDetail> {
  return toAgentDetail(await repo.createAgentWithRubric(userId, input));
}

export async function getDetail(id: string, userId: string): Promise<PublicAgentDetail> {
  const agent = await repo.findAgentDetail(id, userId);
  if (!agent) throw new NotFoundError("Agent not found");
  return toAgentDetail(agent);
}

export async function rename(
  id: string,
  userId: string,
  input: UpdateAgentInput,
): Promise<PublicAgent> {
  const agent = await repo.updateAgent(id, userId, input);
  if (!agent) throw new NotFoundError("Agent not found");
  return toAgent(agent);
}

export async function remove(id: string, userId: string): Promise<void> {
  if (!(await repo.deleteAgent(id, userId))) throw new NotFoundError("Agent not found");
}

export async function getRubric(agentId: string, userId: string): Promise<PublicRubric> {
  const rubric = await repo.findRubric(agentId, userId);
  if (!rubric) throw new NotFoundError("Rubric not found");
  return toRubric(rubric);
}

export async function editRubric(
  agentId: string,
  userId: string,
  input: UpdateRubricInput,
): Promise<PublicRubric> {
  const rubric = await repo.updateRubric(agentId, userId, input);
  if (!rubric) throw new NotFoundError("Rubric not found");
  return toRubric(rubric);
}

export async function addCriterion(
  agentId: string,
  userId: string,
  input: CreateCriterionInput,
): Promise<PublicCriterion> {
  const criterion = await repo.addCriterion(agentId, userId, input);
  if (!criterion) throw new NotFoundError("Rubric not found");
  return toCriterion(criterion);
}

export async function editCriterion(
  cid: string,
  agentId: string,
  userId: string,
  input: UpdateCriterionInput,
): Promise<PublicCriterion> {
  const criterion = await repo.updateCriterion(cid, agentId, userId, input);
  if (!criterion) throw new NotFoundError("Criterion not found");
  return toCriterion(criterion);
}

export async function removeCriterion(cid: string, agentId: string, userId: string): Promise<void> {
  if (!(await repo.deleteCriterion(cid, agentId, userId))) {
    throw new NotFoundError("Criterion not found");
  }
}

export async function issueKey(
  agentId: string,
  userId: string,
  input: CreateKeyInput,
): Promise<CreatedApiKey> {
  const { plaintext, prefix, keyHash } = generateApiKey();
  const key = await repo.createKey(agentId, userId, { name: input.name, prefix, keyHash });
  if (!key) throw new NotFoundError("Agent not found");
  return { ...toApiKey(key), key: plaintext };
}

export async function listKeys(
  agentId: string,
  userId: string,
  page: PageParams,
): Promise<Page<PublicApiKey>> {
  if (!(await repo.findAgent(agentId, userId))) throw new NotFoundError("Agent not found");
  const { items, total } = await repo.listKeys(agentId, userId, page);
  return { items: items.map(toApiKey), page: page.page, limit: page.limit, total };
}

export async function revokeKey(kid: string, agentId: string, userId: string): Promise<void> {
  if (!(await repo.revokeKey(kid, agentId, userId))) {
    throw new NotFoundError("API key not found");
  }
}

function toVersion(v: AgentVersion): PublicVersion {
  return { id: v.id, label: v.label, createdAt: v.createdAt };
}

function toRunListItem(r: RunWithLabel): PublicRunListItem {
  return {
    id: r.id,
    versionLabel: r.agentVersion.label,
    input: r.input,
    status: r.status,
    overallScore: r.overallScore,
    createdAt: r.createdAt,
  };
}

export async function listRuns(
  agentId: string,
  userId: string,
  query: RunsQuery,
): Promise<Page<PublicRunListItem>> {
  if (!(await repo.findAgent(agentId, userId))) throw new NotFoundError("Agent not found");
  const { page, limit, status } = query;
  const { items, total } = await repo.listRuns(agentId, userId, { page, limit }, status);
  return { items: items.map(toRunListItem), page, limit, total };
}

export async function listVersions(agentId: string, userId: string): Promise<PublicVersion[]> {
  if (!(await repo.findAgent(agentId, userId))) throw new NotFoundError("Agent not found");
  return (await repo.listVersions(agentId, userId)).map(toVersion);
}

export async function getVersion(
  agentId: string,
  userId: string,
  label: string,
): Promise<PublicVersion> {
  const version = await repo.findVersion(agentId, userId, label);
  if (!version) throw new NotFoundError("Version not found");
  return toVersion(version);
}
