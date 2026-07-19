import "dotenv/config";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildApp } from "../src/app.js";

// The Zod→OpenAPI transform relocates recursive z.json() schemas (opaque run context/metadata) into
// components.schemas but never registers them, leaving a dangling $ref that breaks codegen. These
// fields are opaque anyway, so collapse the broken ref to an open schema ({} = "any JSON").
function inlineDanglingJsonRefs(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(inlineDanglingJsonRefs);
    return;
  }
  if (!node || typeof node !== "object") return;

  const obj = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    const ref = (value as { allOf?: { $ref?: string }[] })?.allOf?.[0]?.$ref;
    if (ref?.startsWith("#/components/schemas/schema")) {
      obj[key] = {};
    } else {
      inlineDanglingJsonRefs(value);
    }
  }
}

const app = buildApp();
await app.ready();

const spec = app.swagger();
inlineDanglingJsonRefs(spec);

const out = fileURLToPath(new URL("../openapi.json", import.meta.url));
writeFileSync(out, JSON.stringify(spec, null, 2) + "\n");
await app.close();

console.log(`Wrote ${out}`);
