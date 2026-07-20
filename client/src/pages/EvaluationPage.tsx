import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Alert, Skeleton } from "@/components/ui/feedback";
import { useRun } from "@/features/scoring/useRuns";
import { EvaluationHeader } from "@/features/scoring/EvaluationHeader";
import { RunPanel } from "@/features/scoring/RunPanel";
import { GradingForm } from "@/features/scoring/GradingForm";

const grid = "grid grid-cols-1 items-start gap-6 px-8 pb-10 pt-6 lg:grid-cols-[minmax(0,1fr)_420px]";

export function EvaluationPage() {
  const { id = "" } = useParams();
  const { data: run, isPending, isError } = useRun(id);

  if (isPending) {
    return (
      <div className={grid}>
        <div className="flex flex-col gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-md" delay={i * 0.08} />
          ))}
        </div>
        <Skeleton className="h-[520px] rounded-md" />
      </div>
    );
  }

  if (isError || !run) {
    return (
      <div className="mx-auto max-w-content p-8">
        <Alert>Run not found.</Alert>
        <Link
          to="/scoring"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover"
        >
          <ArrowLeft size={15} />
          Back to scoring queue
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <EvaluationHeader run={run} />
      <div className={grid}>
        <RunPanel run={run} />
        {/* Re-key on server score changes so the form re-initialises from fresh data after submit. */}
        <GradingForm key={`${run.id}:${run.overallScore ?? "unscored"}`} run={run} />
      </div>
    </div>
  );
}
