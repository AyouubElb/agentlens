import { useSyncExternalStore } from "react";

export type ToastTone = "success" | "warning" | "danger" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
  duration: number;
}

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let nextId = 0;

function emit() {
  listeners.forEach((l) => l());
}

function push(tone: ToastTone, title: string, detail?: string, duration = 5000) {
  const id = nextId++;
  toasts = [...toasts, { id, tone, title, detail, duration }];
  emit();
  if (duration > 0) setTimeout(() => dismiss(id), duration);
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (title: string, detail?: string) => push("success", title, detail),
  warning: (title: string, detail?: string) => push("warning", title, detail),
  error: (title: string, detail?: string) => push("danger", title, detail),
  info: (title: string, detail?: string) => push("info", title, detail),
};

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
  );
}
