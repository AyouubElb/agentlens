import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/lib/constants/query-keys";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { authApi } from "./auth.api";
import type { User } from "./schemas";

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => qc.setQueryData(authKeys.me(), user),
    onError: (error) => toast.error("Sign in failed", message(error, "Please try again.")),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => toast.success("Account created", "You can now sign in."),
    onError: (error) => toast.error("Couldn't create account", message(error, "Please try again.")),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => qc.setQueryData<User | null>(authKeys.me(), null),
    onError: (error) => toast.error("Sign out failed", message(error, "Please try again.")),
  });
}
