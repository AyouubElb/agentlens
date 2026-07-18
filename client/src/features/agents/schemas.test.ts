import { describe, expect, it } from "vitest";
import { createAgentSchema } from "./schemas";

const valid = {
  name: "Support Copilot",
  rubric: {
    name: "Answer quality",
    criteria: [{ name: "Groundedness", description: "Supported by context?", weight: 2 }],
  },
};

describe("createAgentSchema", () => {
  it("accepts a valid agent and coerces weight to a number", () => {
    const parsed = createAgentSchema.parse({
      ...valid,
      rubric: { ...valid.rubric, criteria: [{ ...valid.rubric.criteria[0], weight: "2" }] },
    });
    expect(parsed.rubric.criteria[0].weight).toBe(2);
  });

  it("rejects a short agent name", () => {
    expect(createAgentSchema.safeParse({ ...valid, name: "ab" }).success).toBe(false);
  });

  it("rejects an empty criteria array", () => {
    expect(
      createAgentSchema.safeParse({ ...valid, rubric: { ...valid.rubric, criteria: [] } }).success,
    ).toBe(false);
  });

  it("rejects a non-positive weight", () => {
    expect(
      createAgentSchema.safeParse({
        ...valid,
        rubric: { ...valid.rubric, criteria: [{ ...valid.rubric.criteria[0], weight: 0 }] },
      }).success,
    ).toBe(false);
  });
});
