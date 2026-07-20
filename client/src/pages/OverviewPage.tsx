import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ScoreChip } from "@/components/ui/ScoreChip";
import { StatTile } from "@/components/ui/StatTile";
import { Alert, Skeleton } from "@/components/ui/feedback";
import { useMe } from "@/features/auth/useAuth";
import { useOverview } from "@/features/scoring/useRuns";
import { RecentRunsCard } from "@/features/scoring/RecentRunsCard";

const tileGrid = "grid gap-4 grid-cols-2 lg:grid-cols-4";

export function OverviewPage() {
  const { data: user } = useMe();
  const { data, isPending, isError } = useOverview();

  return (
    <div className="mx-auto flex min-h-full max-w-content flex-col gap-7 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-[-0.01em]">
          Welcome back{user?.username ? `, ${user.username}` : ""}
        </h1>
        <p className="mt-1 text-body text-text-muted">Here's what's happening across your agents.</p>
      </div>

      {isError ? (
        <Alert>Couldn't load your overview. Refresh to try again.</Alert>
      ) : isPending ? (
        <>
          <div className={tileGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[104px] rounded-md" delay={i * 0.08} />
            ))}
          </div>
          <Skeleton className="h-64 rounded-md" delay={0.3} />
        </>
      ) : (
        <>
          <div className={tileGrid}>
            <StatTile label="Agents" value={data.agents} footnote="active projects" />
            <StatTile label="Total runs" value={data.totalRuns} footnote="all time" />
            <StatTile
              label="Runs to score"
              value={data.unscored}
              accent
              footnote={
                data.unscored > 0 ? (
                  <Link to="/scoring" className="font-semibold text-accent hover:text-accent-hover">
                    Score now →
                  </Link>
                ) : (
                  "all caught up"
                )
              }
            />
            <StatTile
              label="Avg. score"
              value={<ScoreChip score={data.avgScore} size="md" />}
              footnote="across scored runs"
            />
          </div>

          {data.unscored > 0 && (
            <Link
              to="/scoring"
              className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hover sm:hidden"
            >
              Score {data.unscored} {data.unscored === 1 ? "run" : "runs"}
              <ArrowRight size={16} />
            </Link>
          )}

          <RecentRunsCard runs={data.recentRuns} />
        </>
      )}
    </div>
  );
}
