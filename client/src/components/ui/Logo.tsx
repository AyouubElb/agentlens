import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type CornerKey = "tl" | "tr" | "bl" | "br";

const cornerPos: Record<CornerKey, string> = {
  tl: "top-0 left-0",
  tr: "top-0 right-0",
  bl: "bottom-0 left-0",
  br: "bottom-0 right-0",
};

/* Which two edges each corner draws. */
function cornerEdges(key: CornerKey, w: number): CSSProperties {
  return {
    borderTopWidth: key.startsWith("t") ? w : 0,
    borderBottomWidth: key.startsWith("b") ? w : 0,
    borderLeftWidth: key.endsWith("l") ? w : 0,
    borderRightWidth: key.endsWith("r") ? w : 0,
    borderStyle: "solid",
  };
}

interface ReticleProps {
  size?: number;
  /* `ink` renders the mark in dark ink, for use on a cyan tile. */
  tone?: "default" | "ink";
  className?: string;
}

/* Viewfinder reticle — three neutral corners, one cyan (top-right), cyan center dot. */
export function Reticle({ size = 36, tone = "default", className }: ReticleProps) {
  const arm = size / 3;
  const width = Math.max(1.5, size / 14.4);
  const dot = Math.max(3, size / 7.2);

  const neutral = tone === "ink" ? "border-accent-ink" : "border-text";
  const accent = tone === "ink" ? "border-accent-ink" : "border-accent";
  const dotColor = tone === "ink" ? "bg-accent-ink" : "bg-accent";

  return (
    <div
      style={{ width: size, height: size }}
      className={cn("relative shrink-0", className)}
      aria-hidden="true"
    >
      {(Object.keys(cornerPos) as CornerKey[]).map((key) => (
        <div
          key={key}
          style={{ width: arm, height: arm, ...cornerEdges(key, width) }}
          className={cn("absolute", cornerPos[key], key === "tr" ? accent : neutral)}
        />
      ))}
      <div
        style={{ width: dot, height: dot }}
        className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", dotColor)}
      />
    </div>
  );
}

export function Logo({
  size = 36,
  className,
  wordmarkClassName,
}: {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3.5", className)}>
      <Reticle size={size} />
      <span className={cn("text-2xl font-bold tracking-[-0.02em]", wordmarkClassName)}>
        Agent<span className="text-accent">Lens</span>
      </span>
    </div>
  );
}
