import { useState, type ComponentType } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Bot, ClipboardCheck, ChevronDown, LogOut } from "lucide-react";
import { Reticle } from "@/components/ui/Logo";
import { useLogout, useMe } from "@/features/auth/useAuth";
import { cn } from "@/lib/cn";

const nav = [
  { to: "/overview", label: "Overview", icon: LayoutGrid },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/scoring", label: "Scoring", icon: ClipboardCheck },
];

// Longest prefix wins so /agents/:id still reads "Agents".
function pageTitle(pathname: string): string {
  return (
    nav
      .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
      .sort((a, b) => b.to.length - a.to.length)[0]?.label ?? ""
  );
}

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-[11px] rounded-md px-3 py-2.5 text-sm transition-colors",
          isActive
            ? "bg-accent-tint font-semibold text-text"
            : "font-normal text-text-muted hover:bg-raised hover:text-text",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-sm bg-accent" />
          )}
          <span className={cn("flex", isActive && "text-accent")}>
            <Icon size={18} strokeWidth={2} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-hairline bg-surface">
      <div className="flex h-14 items-center gap-[11px] border-b border-hairline px-5">
        <Reticle size={24} />
        <span className="text-[17px] font-extrabold tracking-[-0.01em]">AgentLens</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        <div className="px-3 pb-2 pt-1.5 font-mono text-eyebrow uppercase text-text-faint">
          Navigate
        </div>
        {nav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </aside>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: user } = useMe();
  const logout = useLogout();

  const username = user?.username ?? "";
  const initials = username.slice(0, 2).toUpperCase() || "··";

  async function handleSignOut() {
    await logout.mutateAsync().catch(() => null);
    navigate("/login");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-md border border-hairline bg-surface p-1.5 pr-2 hover:bg-raised"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-accent-border bg-accent-tint text-caption font-bold text-accent-hover">
          {initials}
        </span>
        <span className="text-sm text-text-muted">{username}</span>
        <ChevronDown size={16} className="text-text-faint" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-10 w-44 rounded-md border border-hairline bg-raised p-1 shadow-lg">
          <div className="mb-1 border-b border-hairline px-2.5 py-2">
            <div className="text-[13px] font-semibold text-text">{username}</div>
            <div className="truncate font-mono text-[11px] text-text-faint">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-sm bg-danger-tint px-2.5 py-2 text-[13px] font-semibold text-danger-text hover:bg-danger-tint-hover"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-raised px-6">
          <div className="text-lg font-bold">{pageTitle(pathname)}</div>
          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
