import { describe, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AgentCard } from "@/features/agents/AgentCard";
import type { Agent } from "@/features/agents/schemas";

function makeAgent(over: Partial<Agent> = {}): Agent {
  return {
    id: "ag_1",
    name: "Support Copilot",
    createdAt: new Date("2026-06-01").toISOString(),
    runs: 12,
    unscored: 3,
    avgScore: 3.8,
    ...over,
  };
}

function renderCard(agent: Agent) {
  return render(
    <MemoryRouter>
      <AgentCard agent={agent} />
    </MemoryRouter>,
  );
}

function statValue(label: string) {
  // Each Stat renders its uppercase label next to the value in the same flex column.
  return screen.getByText(label).parentElement as HTMLElement;
}

describe("AgentCard", () => {
  test("renders real run and unscored counts", () => {
    renderCard(makeAgent({ runs: 12, unscored: 3 }));
    expect(within(statValue("runs")).getByText("12")).toBeInTheDocument();
    expect(within(statValue("unscored")).getByText("3")).toBeInTheDocument();
  });

  test("shows the average as a score chip", () => {
    renderCard(makeAgent({ avgScore: 3.8 }));
    expect(within(statValue("avg")).getByText("3.8")).toBeInTheDocument();
  });

  test("dashes the average when no runs are scored yet", () => {
    renderCard(makeAgent({ avgScore: null }));
    expect(within(statValue("avg")).getByText("—")).toBeInTheDocument();
  });

  test("renders a plain zero for unscored when caught up", () => {
    renderCard(makeAgent({ unscored: 0 }));
    expect(within(statValue("unscored")).getByText("0")).toBeInTheDocument();
  });
});
