import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GradingForm } from "@/features/scoring/GradingForm";
import { scoringApi } from "@/features/scoring/scoring.api";
import type { RunDetail } from "@/features/scoring/schemas";

vi.mock("@/features/scoring/scoring.api", () => ({
  scoringApi: { submitScores: vi.fn() },
}));

vi.mock("@/components/ui/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const submitScores = vi.mocked(scoringApi.submitScores);

function makeRun(over: Partial<RunDetail> = {}): RunDetail {
  return {
    id: "run_1",
    versionLabel: "v1",
    input: "in",
    output: "out",
    context: null,
    metadata: null,
    status: "unscored",
    overallScore: null,
    createdAt: new Date().toISOString(),
    criteria: [
      { id: "c1", name: "Groundedness", description: "d", weight: 2, score: null },
      { id: "c2", name: "Relevance", description: "d", weight: 1, score: null },
    ],
    ...over,
  } as RunDetail;
}

function renderForm(run: RunDetail) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <GradingForm run={run} />
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("GradingForm", () => {
  test("submit is disabled until every criterion is scored", async () => {
    renderForm(makeRun());
    const submit = screen.getByRole("button", { name: "Submit scores" });
    expect(submit).toBeDisabled();

    // Score only the first criterion → still disabled.
    const groundedness = screen.getByRole("radiogroup", { name: "Groundedness" });
    await userEvent.click(within(groundedness).getByRole("radio", { name: "4" }));
    expect(submit).toBeDisabled();

    const relevance = screen.getByRole("radiogroup", { name: "Relevance" });
    await userEvent.click(within(relevance).getByRole("radio", { name: "5" }));
    expect(submit).toBeEnabled();
  });

  test("submitting sends one score per criterion, dropping empty justifications", async () => {
    submitScores.mockResolvedValue({ id: "run_1", status: "scored", overallScore: 4.3 });
    renderForm(makeRun());

    await userEvent.click(
      within(screen.getByRole("radiogroup", { name: "Groundedness" })).getByRole("radio", { name: "4" }),
    );
    await userEvent.click(
      within(screen.getByRole("radiogroup", { name: "Relevance" })).getByRole("radio", { name: "5" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit scores" }));

    await waitFor(() => expect(submitScores).toHaveBeenCalledTimes(1));
    expect(submitScores).toHaveBeenCalledWith("run_1", {
      scores: [
        { criterionId: "c1", value: 4 },
        { criterionId: "c2", value: 5 },
      ],
    });
  });

  test("a scored run prefills its scores and shows 'Update scores'", () => {
    renderForm(
      makeRun({
        status: "scored",
        overallScore: 4.3,
        criteria: [
          { id: "c1", name: "Groundedness", description: "d", weight: 2, score: { value: 4, justification: "ok" } },
          { id: "c2", name: "Relevance", description: "d", weight: 1, score: { value: 5, justification: null } },
        ],
      }),
    );

    expect(screen.getByRole("button", { name: "Update scores" })).toBeEnabled();
    expect(
      within(screen.getByRole("radiogroup", { name: "Groundedness" })).getByRole("radio", { name: "4" }),
    ).toBeChecked();
    expect(screen.getByDisplayValue("ok")).toBeInTheDocument();
  });
});
