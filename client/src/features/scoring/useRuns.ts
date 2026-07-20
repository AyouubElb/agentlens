import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { runKeys } from "@/lib/constants/query-keys";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { scoringApi } from "./scoring.api";
import type { QueueParams, RunStatus, SubmitScoresBody } from "./schemas";

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

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

export function useRun(id: string) {
  return useQuery({
    queryKey: runKeys.detail(id),
    queryFn: () => scoringApi.getRun(id),
    enabled: id !== "",
  });
}

export function useSubmitScores(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitScoresBody) => scoringApi.submitScores(id, body),
    onSuccess: (run) => {
      toast.success("Run scored", `Overall ${run.overallScore.toFixed(1)} saved.`);
      qc.invalidateQueries({ queryKey: runKeys.detail(id) });
      // The run leaves the unscored queue and its aggregates change across lists.
      qc.invalidateQueries({ queryKey: runKeys.all });
    },
    onError: (error) => toast.error("Couldn't save scores", message(error, "Please try again.")),
  });
}
