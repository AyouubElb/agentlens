import { describe, expect, test } from "vitest";
import { weightedOverall } from "./rollup.js";

describe("weightedOverall", () => {
  test("weighted average across differing weights", () => {
    // (4*2 + 5*1) / (2+1) = 13/3
    expect(weightedOverall([{ value: 4, weight: 2 }, { value: 5, weight: 1 }])).toBeCloseTo(13 / 3);
  });

  test("equal weights reduce to the plain mean", () => {
    expect(weightedOverall([{ value: 2, weight: 1 }, { value: 4, weight: 1 }])).toBe(3);
  });

  test("single criterion is its own value", () => {
    expect(weightedOverall([{ value: 5, weight: 3 }])).toBe(5);
  });

  test("throws when total weight is not positive", () => {
    expect(() => weightedOverall([{ value: 5, weight: 0 }])).toThrow();
  });
});
