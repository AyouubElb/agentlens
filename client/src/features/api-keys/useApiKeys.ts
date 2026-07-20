import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { keyKeys } from "@/lib/constants/query-keys";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { apiKeysApi } from "./api-keys.api";
import type { IssueKeyInput } from "./schemas";

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useApiKeys(agentId: string, page: number) {
  return useQuery({
    queryKey: keyKeys.list(agentId, page),
    queryFn: () => apiKeysApi.list(agentId, page),
    placeholderData: keepPreviousData,
  });
}

export function useIssueKey(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: IssueKeyInput) => apiKeysApi.issue(agentId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keyKeys.lists(agentId) }),
    onError: (error) => toast.error("Couldn't issue key", message(error, "Please try again.")),
  });
}

export function useRevokeKey(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => apiKeysApi.revoke(agentId, keyId),
    onSuccess: () => {
      toast.success("Key revoked", "It can no longer push runs.");
      qc.invalidateQueries({ queryKey: keyKeys.lists(agentId) });
    },
    onError: (error) => toast.error("Couldn't revoke key", message(error, "Please try again.")),
  });
}
