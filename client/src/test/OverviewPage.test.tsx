import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OverviewPage } from "@/pages/OverviewPage";
import { useOverview } from "@/features/scoring/useRuns";
import { useMe } from "@/features/auth/useAuth";
import type { Overview } from "@/lib/types/api";

vi.mock("@/features/scoring/useRuns", () => ({ useOverview: vi.fn() }));
vi.mock("@/features/auth/useAuth", () => ({ useMe: vi.fn() }));

const mockOverview = vi.mocked(useOverview);
const mockMe = vi.mocked(useMe);

function overview(over: Partial<Overview> = {}): Overview {
  return {
    agents: 4,
    totalRuns: 128,
    unscored: 12,
    avgScore: 3.8,
    recentRuns: [
      {
        id: "run_abc",
        agentId: "ag_1",
        agentName: "Support Copilot",
        versionLabel: "v2",
        input: "hi",
        status: "scored",
        overallScore: 4,
        createdAt: new Date().toISOString(),
      },
    ],
    ...over,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <OverviewPage />
    </MemoryRouter>,
  );
}

describe("OverviewPage", () => {
  test("renders the four stat tiles and a recent run", () => {
    mockMe.mockReturnValue({ data: { username: "ayoub" } } as ReturnType<typeof useMe>);
    mockOverview.mockReturnValue({
      data: overview(),
      isPending: false,
      isError: false,
    } as ReturnType<typeof useOverview>);

    renderPage();

    expect(screen.getByText("Welcome back, ayoub")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getAllByText("Support Copilot").length).toBeGreaterThan(0);
  });

  test("shows an error alert when the overview fails to load", () => {
    mockMe.mockReturnValue({ data: undefined } as ReturnType<typeof useMe>);
    mockOverview.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    } as ReturnType<typeof useOverview>);

    renderPage();
    expect(screen.getByText(/couldn't load your overview/i)).toBeInTheDocument();
  });
});
