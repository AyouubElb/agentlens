import axios, { AxiosError } from "axios";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

interface ServerError {
  message?: string;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ServerError>) => {
    const status = error.response?.status ?? 0;
    const message = error.response?.data?.message ?? error.message;

    // /auth/me 401 = logged out; the query handles it. Redirect only elsewhere.
    const isMeCheck = error.config?.url?.includes("/auth/me");
    if (status === 401 && !isMeCheck && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }

    return Promise.reject(new ApiError(status, message));
  },
);
