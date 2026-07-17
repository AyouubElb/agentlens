import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "@/features/auth/useAuth";
import { Spinner } from "@/components/ui/feedback";

export function ProtectedRoute() {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <Spinner />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
