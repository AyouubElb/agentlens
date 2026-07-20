import { describe, expect, test } from "vitest";
import { renderJson } from "./json-render";

describe("renderJson", () => {
  test("null/undefined → empty", () => {
    expect(renderJson(null, true)).toEqual({ kind: "empty" });
    expect(renderJson(undefined, true)).toEqual({ kind: "empty" });
  });

  test("flat primitive object → key/value table when preferTable", () => {
    const result = renderJson({ model: "gpt-4o", latency_ms: 2140, ok: true }, true);
    expect(result).toEqual({
      kind: "table",
      rows: [
        ["model", "gpt-4o"],
        ["latency_ms", "2140"],
        ["ok", "true"],
      ],
    });
  });

  test("nested object → JSON, even when preferTable", () => {
    const result = renderJson({ model: "gpt-4o", usage: { prompt: 600 } }, true);
    expect(result.kind).toBe("json");
    if (result.kind === "json") expect(result.count).toBeNull();
  });

  test("array → JSON with a count", () => {
    const result = renderJson([{ source: "a" }, { source: "b" }], false);
    expect(result.kind).toBe("json");
    if (result.kind === "json") expect(result.count).toBe(2);
  });

  test("preferTable=false keeps a flat object as JSON (context path)", () => {
    expect(renderJson({ a: 1 }, false).kind).toBe("json");
  });
});
