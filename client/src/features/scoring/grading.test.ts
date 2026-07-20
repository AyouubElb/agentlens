import { describe, expect, test } from "vitest";
import { allScored, overallScore, toSubmitBody } from "./grading";
import type { GradeValue } from "./schemas";

const grade = (over: Partial<GradeValue>): GradeValue => ({
  criterionId: "c",
  weight: 1,
  value: null,
  justification: "",
  ...over,
});

describe("overallScore", () => {
  test("null until at least one criterion is scored", () => {
    expect(overallScore([grade({}), grade({})])).toBeNull();
  });

  test("weighted mean matches the server math", () => {
    // (4*2 + 5*1) / (2+1) = 13/3
    const scores = [grade({ weight: 2, value: 4 }), grade({ weight: 1, value: 5 })];
    expect(overallScore(scores)).toBeCloseTo(13 / 3);
  });

  test("ignores unscored criteria in the running total", () => {
    const scores = [grade({ weight: 2, value: 4 }), grade({ weight: 1, value: null })];
    expect(overallScore(scores)).toBe(4);
  });
});

describe("allScored", () => {
  test("true only when every criterion has a value", () => {
    expect(allScored([grade({ value: 3 }), grade({ value: 5 })])).toBe(true);
    expect(allScored([grade({ value: 3 }), grade({ value: null })])).toBe(false);
    expect(allScored([])).toBe(false);
  });
});

describe("toSubmitBody", () => {
  test("keeps non-empty justifications and drops empty/whitespace ones", () => {
    const body = toSubmitBody({
      scores: [
        grade({ criterionId: "a", value: 4, justification: "grounded" }),
        grade({ criterionId: "b", value: 5, justification: "   " }),
      ],
    });
    expect(body).toEqual({
      scores: [
        { criterionId: "a", value: 4, justification: "grounded" },
        { criterionId: "b", value: 5 },
      ],
    });
  });
});
