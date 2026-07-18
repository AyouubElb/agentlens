import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form";
import { useIssueKey } from "./useApiKeys";
import { issueKeySchema, type CreatedApiKey, type IssueKeyInput } from "./schemas";

export function IssueKeyModal({
  agentId,
  open,
  onClose,
}: {
  agentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const issue = useIssueKey(agentId);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IssueKeyInput>({ resolver: zodResolver(issueKeySchema) });

  function close() {
    onClose();
    // Clear after the exit animation so the reveal doesn't flash back to the form.
    setTimeout(() => {
      setCreated(null);
      reset();
    }, 200);
  }

  async function onSubmit(values: IssueKeyInput) {
    const key = await issue.mutateAsync(values).catch(() => null);
    if (key) setCreated(key);
  }

  return (
    <Modal open={open} onClose={close} title={created ? "API key created" : "Issue API key"}>
      {created ? (
        <RevealedKey created={created} onDone={close} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col">
          <Input
            label="Key name"
            help="A label to recognize it later, e.g. Production"
            error={errors.name}
            {...register("name")}
          />
          <div className="mt-6 flex justify-end gap-2.5 border-t border-hairline pt-4">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={issue.isPending}>
              Issue key
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function RevealedKey({ created, onDone }: { created: CreatedApiKey; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(created.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col">
      <p className="text-body text-text-muted">Copy this key now — it won't be shown again.</p>

      <label className="mb-1.5 mt-4 block text-caption font-semibold text-text-muted">
        Secret key
      </label>
      <div className="flex gap-2">
        <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-hairline bg-raised px-3 py-2.5 font-mono text-code text-text">
          {created.key}
        </div>
        <Button variant="secondary" onClick={copy}>
          {copied ? <Check size={15} className="text-success-text" /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="mt-3.5 flex items-start gap-2.5 rounded-md border border-warning/35 bg-warning-tint px-3 py-2.5 text-[13px] text-warning-text">
        <TriangleAlert size={16} className="mt-px shrink-0" strokeWidth={2} />
        <span>
          Store it in your agent's secrets. Anyone with this key can push runs to this agent.
        </span>
      </div>

      <div className="mt-5 flex justify-end border-t border-hairline pt-4">
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}
