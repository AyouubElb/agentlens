import { Plus } from "lucide-react";
import { Reticle } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export function AgentsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex max-w-[340px] flex-col items-center gap-4 text-center">
        <Reticle size={44} className="opacity-85" />
        <div className="text-lg font-bold">No agents yet</div>
        <p className="text-body text-text-muted">
          Create an agent to start collecting and scoring its runs.
        </p>
        <Button onClick={onCreate} className="mt-1">
          <Plus size={16} />
          New agent
        </Button>
      </div>
    </div>
  );
}
