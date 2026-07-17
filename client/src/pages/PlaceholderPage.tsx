/* Stand-in for routes built in later slices, so the shell renders end-to-end now. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-content p-8">
      <h1 className="text-page font-extrabold">{title}</h1>
      <p className="mt-2 font-mono text-code text-text-faint">Coming in a later slice.</p>
    </div>
  );
}
