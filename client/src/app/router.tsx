import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthPage } from "@/pages/AuthPage";
import { AgentsPage } from "@/pages/AgentsPage";
import { AgentDetailPage, RubricTab, KeysTab, RunsTab } from "@/pages/AgentDetailPage";
import { OverviewPage } from "@/pages/OverviewPage";
import { ScoringQueuePage } from "@/pages/ScoringQueuePage";
import { EvaluationPage } from "@/pages/EvaluationPage";

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
          { path: "/overview", element: <OverviewPage /> },
          { path: "/agents", element: <AgentsPage /> },
          {
            path: "/agents/:id",
            element: <AgentDetailPage />,
            children: [
              { index: true, element: <Navigate to="rubric" replace /> },
              { path: "rubric", element: <RubricTab /> },
              { path: "keys", element: <KeysTab /> },
              { path: "runs", element: <RunsTab /> },
            ],
          },
          { path: "/scoring", element: <ScoringQueuePage /> },
          { path: "/runs/:id", element: <EvaluationPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/overview" replace /> },
]);
