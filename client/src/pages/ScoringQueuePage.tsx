import { ScoringQueuePanel } from "@/features/scoring/ScoringQueuePanel";

export function ScoringQueuePage() {
  return (
    <div className="mx-auto max-w-content p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-[24px] font-extrabold tracking-[-0.01em]">Scoring queue</h1>
        <p className="mt-1 text-body text-text-muted">Score the runs your agents have pushed.</p>
      </div>
      <ScoringQueuePanel />
    </div>
  );
}
