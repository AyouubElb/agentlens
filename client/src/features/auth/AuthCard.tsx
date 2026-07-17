import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { cn } from "@/lib/cn";

export type AuthMode = "login" | "register";

const tabs: { mode: AuthMode; label: string }[] = [
  { mode: "login", label: "Sign in" },
  { mode: "register", label: "Create account" },
];

export function AuthCard({ initialMode = "login" }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-[18px]">
      <Logo size={26} wordmarkClassName="text-xl font-extrabold" />

      {/* height:auto animates the card as the taller register form swaps in */}
      <motion.div
        layout
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full overflow-hidden rounded-lg border border-hairline bg-surface p-6"
      >
        <div className="relative mb-[22px] grid grid-cols-2 rounded-md border border-hairline bg-bg p-1">
          {tabs.map(({ mode: m, label }) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "relative z-10 rounded-sm py-[9px] text-center text-[13px] font-semibold transition-colors",
                mode === m ? "bg-raised text-text" : "text-text-muted hover:text-text",
              )}
            >
              {label}
            </button>
          ))}
          <motion.div
            layout
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ left: mode === "login" ? 4 : "calc(50% + 2px)" }}
            className="absolute bottom-0.5 h-0.5 w-[calc(50%-6px)] rounded-sm bg-accent"
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {mode === "login" ? (
              <LoginForm />
            ) : (
              <RegisterForm onRegistered={() => setMode("login")} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
