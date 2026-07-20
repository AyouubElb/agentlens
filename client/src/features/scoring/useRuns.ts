import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { runKeys } from "@/lib/constants/query-keys";
import { scoringApi } from "./scoring.api";
import type { QueueParams, RunStatus } from "./schemas";

export function useRuns(agentId: string, status: RunStatus | undefined, page: number) {
  return useQuery({
    queryKey: runKeys.list(agentId, status, page),
    queryFn: () => scoringApi.listRuns(agentId, status, page),
    placeholderData: keepPreviousData,
  });
}

export function useQueue(params: QueueParams) {
  return useQuery({
    queryKey: runKeys.queue(params),
    queryFn: () => scoringApi.listQueue(params),
    placeholderData: keepPreviousData,
  });
}

export function useQueueFacets() {
  return useQuery({
    queryKey: runKeys.facets(),
    queryFn: scoringApi.getFacets,
  });
}
