import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthPage } from "@/pages/AuthPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";

export const router = createBrowserRouter([
  { path: "/login", element: <AuthPage mode="login" /> },
  { path: "/register", element: <AuthPage mode="register" /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <Navigate to="/overview" replace /> },
          { path: "/overview", element: <PlaceholderPage title="Overview" /> },
          { path: "/agents", element: <PlaceholderPage title="Agents" /> },
          { path: "/scoring", element: <PlaceholderPage title="Scoring queue" /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/overview" replace /> },
]);
