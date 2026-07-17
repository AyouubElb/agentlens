import { apiClient } from "@/lib/api-client";
import type { LoginInput, RegisterInput, User } from "./schemas";

export const authApi = {
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  },

  login: async (body: LoginInput): Promise<User> => {
    const { data } = await apiClient.post<User>("/auth/login", body);
    return data;
  },

  register: async (body: RegisterInput): Promise<User> => {
    const { data } = await apiClient.post<User>("/auth/register", body);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },
};
