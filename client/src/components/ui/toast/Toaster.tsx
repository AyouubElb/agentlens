import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, TriangleAlert, X, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToasts, dismiss, type Toast, type ToastTone } from "./toast-store";

const tones: Record<ToastTone, { rail: string; tile: string; bar: string; icon: typeof Check }> = {
  success: { rail: "border-l-success", tile: "bg-success-tint text-success-text", bar: "bg-success", icon: Check },
  warning: { rail: "border-l-warning", tile: "bg-warning-tint text-warning-text", bar: "bg-warning", icon: TriangleAlert },
  danger: { rail: "border-l-danger", tile: "bg-danger-tint text-danger-text", bar: "bg-danger", icon: X },
  info: { rail: "border-l-accent", tile: "bg-accent-tint text-accent-hover", bar: "bg-accent", icon: Info },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { rail, tile, bar, icon: Icon } = tones[toast.tone];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "relative flex w-80 gap-3 overflow-hidden rounded-md border border-l-[3px] border-hairline bg-surface px-4 pb-4 pt-3.5 shadow-lg",
        rail,
      )}
    >
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", tile)}>
        <Icon size={15} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-text">{toast.title}</div>
        {toast.detail && <div className="text-[13px] text-text-muted">{toast.detail}</div>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="absolute right-2 top-2 text-text-faint hover:text-text"
      >
        <X size={14} />
      </button>
      {toast.duration > 0 && (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: toast.duration / 1000, ease: "linear" }}
          className={cn("absolute bottom-0 left-0 h-0.5", bar)}
        />
      )}
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToasts();

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
