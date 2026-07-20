import { describe, expect, test } from "vitest";
import { foldAvgScore } from "./agents.service.js";

describe("foldAvgScore", () => {
  test("weighted by scored-run count, not an average of per-version averages", () => {
    // v1: two runs summing 7 (avg 3.5); v2: one run of 5. True mean = 12/3 = 4, not (3.5+5)/2.
    expect(foldAvgScore({ runs: 3, unscored: 0, sumScore: 12, scoredCount: 3 })).toBe(4);
  });

  test("null when no scored runs", () => {
    expect(foldAvgScore({ runs: 2, unscored: 2, sumScore: 0, scoredCount: 0 })).toBeNull();
  });
});
