import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";

interface Tab {
  to: string;
  label: string;
}

// URL-driven tab bar; active state comes from the route, not internal state.
export function Tabs({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="flex gap-7 border-b border-hairline">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            cn(
              "relative py-3.5 text-sm transition-colors",
              isActive ? "font-bold text-text" : "font-normal text-text-muted hover:text-text",
            )
          }
        >
          {({ isActive }) => (
            <>
              {tab.label}
              {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
