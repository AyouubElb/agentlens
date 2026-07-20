import { renderJson } from "./json-render";

// Renders opaque context/metadata: key/value table for flat metadata, pretty JSON otherwise.
export function JsonView({ value, preferTable }: { value: unknown; preferTable: boolean }) {
  const view = renderJson(value, preferTable);

  if (view.kind === "empty") {
    return <p className="px-[18px] py-4 text-[13px] text-text-faint">None provided.</p>;
  }

  if (view.kind === "table") {
    return (
      <div className="px-[18px] pb-3.5 pt-2">
        {view.rows.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[160px_1fr] gap-3 border-t border-hairline py-2 font-mono text-[13px] first:border-t-0"
          >
            <span className="text-text-muted">{k}</span>
            <span className="break-words text-text">{v}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <pre className="m-3.5 overflow-auto rounded-md border border-hairline bg-bg px-4 py-3.5 font-mono text-[13px] leading-relaxed text-text">
      {view.text}
    </pre>
  );
}
