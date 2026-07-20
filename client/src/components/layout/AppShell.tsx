import { useState, type ComponentType } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Bot, ClipboardCheck, ChevronDown, LogOut, Menu, X } from "lucide-react";
import { Reticle } from "@/components/ui/Logo";
import { useLogout, useMe } from "@/features/auth/useAuth";
import { useAgent } from "@/features/agents/useAgents";
import { cn } from "@/lib/cn";

type IconType = ComponentType<{ size?: number; strokeWidth?: number }>;

const nav: { to: string; label: string; icon: IconType }[] = [
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

// On an agent-detail route, the header reads "Agents / <name>"; elsewhere it's the plain page title.
function HeaderTitle({ pathname }: { pathname: string }) {
  const detailId = pathname.match(/^\/agents\/([^/]+)/)?.[1];
  const { data: agent } = useAgent(detailId ?? "");

  if (!detailId) return <span>{pageTitle(pathname)}</span>;

  return (
    <span className="flex items-center gap-2">
      <Link to="/agents" className="font-normal text-text-muted hover:text-text">
        Agents
      </Link>
      <span className="text-text-faint">/</span>
      <span>{agent?.name ?? "…"}</span>
    </span>
  );
}

// Labelled row for the desktop sidebar and the mobile drawer.
function NavItem({
  to,
  label,
  icon: Icon,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: IconType;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
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
          {isActive && <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-sm bg-accent" />}
          <span className={cn("flex", isActive && "text-accent")}>
            <Icon size={18} strokeWidth={2} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

function NavHeading() {
  return (
    <div className="px-3 pb-2 pt-1.5 font-mono text-eyebrow uppercase text-text-faint">Navigate</div>
  );
}

function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-[11px]", className)}>
      <Reticle size={24} />
      <span className="text-[17px] font-extrabold tracking-[-0.01em]">AgentLens</span>
    </div>
  );
}

// Desktop (lg+): full 240px labelled sidebar.
function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-surface lg:flex">
      <div className="flex h-14 items-center border-b border-hairline px-5">
        <Brand />
      </div>
      <nav className="flex flex-col gap-1 p-3">
        <NavHeading />
        {nav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </aside>
  );
}

// Tablet (md–lg): 64px icon-only rail.
function SidebarRail() {
  return (
    <aside className="hidden w-16 shrink-0 flex-col items-center border-r border-hairline bg-surface md:flex lg:hidden">
      <div className="flex h-14 w-full items-center justify-center border-b border-hairline">
        <Reticle size={24} />
      </div>
      <nav className="flex w-full flex-col items-center gap-1.5 py-3.5">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              cn(
                "relative flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                isActive
                  ? "bg-accent-tint text-accent"
                  : "text-text-muted hover:bg-raised hover:text-text",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-sm bg-accent" />}
                <Icon size={20} strokeWidth={2} />
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

// Mobile (<md): fixed bottom tab bar.
function BottomNav() {
  return (
    <nav className="flex h-16 shrink-0 items-stretch border-t border-hairline bg-surface md:hidden">
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 text-caption transition-colors",
              isActive ? "font-semibold text-accent" : "font-normal text-text-muted",
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute inset-x-[22%] top-0 h-0.5 rounded-sm bg-accent" />}
              <Icon size={20} strokeWidth={2} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

// Mobile (<md): off-canvas labelled drawer over a scrim.
function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 md:hidden">
      <button type="button" aria-label="Close menu" className="absolute inset-0 bg-scrim" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-hairline bg-surface">
        <div className="flex h-14 items-center justify-between border-b border-hairline px-5">
          <Brand />
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-raised hover:text-text"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          <NavHeading />
          {nav.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={onClose} />
          ))}
        </nav>
      </aside>
    </div>
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
        className="flex items-center gap-2.5 rounded-md border border-hairline bg-surface p-1.5 hover:bg-raised sm:pr-2"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-accent-border bg-accent-tint text-caption font-bold text-accent-hover">
          {initials}
        </span>
        <span className="hidden text-sm text-text-muted sm:inline">{username}</span>
        <ChevronDown size={16} className="hidden text-text-faint sm:block" />
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text">
      <Sidebar />
      <SidebarRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-hairline bg-raised px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface text-text hover:bg-raised md:hidden"
            >
              <Menu size={18} />
            </button>
            <Brand className="md:hidden" />
            <div className="hidden truncate text-lg font-bold md:block">
              <HeaderTitle pathname={pathname} />
            </div>
          </div>
          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
