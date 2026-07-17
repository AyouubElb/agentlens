import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size, borderWidth: size <= 14 ? 2 : 2.5 }}
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-hairline border-t-accent",
        className,
      )}
    />
  );
}

/* `delay` staggers sibling rows so a list shimmers as a wave. */
export function Skeleton({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      style={delay ? { animationDelay: `${delay}s` } : undefined}
      className={cn("h-3.5 animate-shimmer rounded-sm bg-skeleton", className)}
    />
  );
}

const alertTones = {
  danger: "bg-danger-tint border-danger-border text-danger-text",
  warning: "bg-warning-tint border-warning text-warning-text",
  success: "bg-success-tint border-success text-success-text",
  info: "bg-accent-tint border-accent-border text-accent-hover",
} as const;

interface AlertProps {
  children: ReactNode;
  tone?: keyof typeof alertTones;
  className?: string;
}

export function Alert({ children, tone = "danger", className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-[13px]",
        alertTones[tone],
        className,
      )}
    >
      <AlertCircle size={16} className="shrink-0" strokeWidth={1.5} />
      <span>{children}</span>
    </div>
  );
}
