import React from 'react';
import { VaultyLogo } from '@/app/components/ui/vaulty-logo';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  Home,
  Inbox,
  Zap,
  Cpu,
  Briefcase,
  BookOpen,
  FileText,
  FolderKanban,
  MessageCircle,
  Heart,
  Share2,
  Clock,
  Archive,
  Bot,
  Settings,
  User,
  Activity,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from '@/app/components/ui/sidebar';
import { dispatchNavOverlay } from '../../../src/lib/nav-overlays';
import {
  VIEWER_OVERLAY_NAV,
  VIEWER_PRIMARY_NAV,
  VIEWER_SECONDARY_NAV,
  VIEWER_UTILITY_NAV,
} from '../../../src/lib/routes/v3-routing';

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const ROUTE_ICONS: Record<string, React.ElementType> = {
  '/': Home,
  '/inbox': Inbox,
  '/actions': Zap,
  '/automation': Cpu,
  '/work': Briefcase,
  '/knowledge': BookOpen,
  '/notes': FileText,
  '/portfolio': FolderKanban,
  '/bubble': MessageCircle,
  '/health': Heart,
  '/graph': Share2,
  '/timeline': Clock,
  '/archive': Archive,
  '/primary-agent': Bot,
  '/settings': Settings,
};

const OVERLAY_ICONS: Record<string, React.ElementType> = {
  avatar: User,
  cod: Activity,
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function useActivePath() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (to: string): boolean => {
    if (to === '/') return pathname === '/';
    return pathname === to || pathname.startsWith(`${to}/`);
  };
}

// ---------------------------------------------------------------------------
// ViewerSidebar
// ---------------------------------------------------------------------------

/**
 * Full shadcn sidebar layout.
 *
 * Renders `SidebarProvider` + `Sidebar` (collapsible="icon") + `SidebarInset`.
 * `children` is placed inside `SidebarInset` — the main content area.
 *
 * Open state is cookie-persisted by `SidebarProvider` (`sidebar_state`).
 * Keyboard shortcut: Cmd/Ctrl+B.
 */
export function ViewerSidebar({ children }: { children: React.ReactNode }) {
  const isActive = useActivePath();

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* ---- Header: logo ---- */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Vault home"
                isActive={isActive('/')}
                size="lg"
                className="rounded-[20px] border border-white/10 bg-white/5 font-bold uppercase tracking-[0.18em] shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
              >
                <Link to={'/' as never} aria-label="Vault home">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--a-sky),var(--a-mint))] text-[#0f172a] shadow-[0_10px_24px_rgba(51,95,255,0.28)]">
                    <VaultyLogo className="h-5 w-5" />
                  </span>
                  <span className="truncate text-sm font-semibold tracking-[0.14em] text-[var(--text-primary)]">
                    Vault
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ---- Content: primary + secondary nav ---- */}
        <SidebarContent className="px-2">
          {/* Primary — core execution */}
          <SidebarGroup aria-label="Primary navigation">
            <SidebarGroupContent>
              <SidebarMenu>
                {VIEWER_PRIMARY_NAV.map((item) => {
                  const Icon = ROUTE_ICONS[item.to] ?? Home;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        isActive={isActive(item.to)}
                        className="rounded-2xl px-3 py-2.5 transition-all duration-200 data-[active=true]:shadow-[0_14px_28px_rgba(12,18,31,0.26)] data-[active=true]:ring-1 data-[active=true]:ring-white/10"
                      >
                        <Link
                          to={item.to as never}
                          aria-current={isActive(item.to) ? 'page' : undefined}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Secondary — supporting surfaces */}
          <SidebarGroup aria-label="Secondary navigation">
            <SidebarGroupContent>
              <SidebarMenu>
                {VIEWER_SECONDARY_NAV.map((item) => {
                  const Icon = ROUTE_ICONS[item.to] ?? BookOpen;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        isActive={isActive(item.to)}
                        className="rounded-2xl px-3 py-2.5 transition-all duration-200 data-[active=true]:shadow-[0_14px_28px_rgba(12,18,31,0.26)] data-[active=true]:ring-1 data-[active=true]:ring-white/10"
                      >
                        <Link
                          to={item.to as never}
                          aria-current={isActive(item.to) ? 'page' : undefined}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ---- Footer: utility + overlay items ---- */}
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            {VIEWER_UTILITY_NAV.map((item) => {
              const Icon = ROUTE_ICONS[item.to] ?? Settings;
              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive(item.to)}
                    className="rounded-2xl px-3 py-2.5 transition-all duration-200 data-[active=true]:shadow-[0_14px_28px_rgba(12,18,31,0.26)] data-[active=true]:ring-1 data-[active=true]:ring-white/10"
                  >
                    <Link
                      to={item.to as never}
                      aria-current={isActive(item.to) ? 'page' : undefined}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
            {VIEWER_OVERLAY_NAV.map((item) => {
              const Icon = OVERLAY_ICONS[item.overlay] ?? User;
              return (
                <SidebarMenuItem key={item.overlay}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    onClick={() => dispatchNavOverlay(item.overlay)}
                    className="rounded-2xl px-3 py-2.5 transition-all duration-200"
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* ---- Main content area ---- */}
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
