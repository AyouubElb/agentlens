export type JsonRender =
  | { kind: "empty" }
  | { kind: "table"; rows: [string, string][] }
  | { kind: "json"; text: string; count: number | null };

function isPrimitive(v: unknown): v is string | number | boolean {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function isFlatObject(v: unknown): v is Record<string, string | number | boolean> {
  return (
    typeof v === "object" && v !== null && !Array.isArray(v) && Object.values(v).every(isPrimitive)
  );
}

// Opaque context/metadata → how to display it. `preferTable` favours the key/value table (metadata).
export function renderJson(value: unknown, preferTable: boolean): JsonRender {
  if (value == null) return { kind: "empty" };
  if (preferTable && isFlatObject(value)) {
    return { kind: "table", rows: Object.entries(value).map(([k, v]) => [k, String(v)]) };
  }
  return {
    kind: "json",
    text: JSON.stringify(value, null, 2),
    count: Array.isArray(value) ? value.length : null,
  };
}
