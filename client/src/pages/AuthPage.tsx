import { AuthCard, type AuthMode } from "@/features/auth/AuthCard";

export function AuthPage({ mode }: { mode: AuthMode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-14">
      <AuthCard initialMode={mode} />
    </div>
  );
}
