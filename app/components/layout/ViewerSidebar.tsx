import React from 'react';
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
      <Sidebar collapsible="icon">
        {/* ---- Header: logo ---- */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Vault home"
                isActive={isActive('/')}
                size="lg"
                className="font-bold uppercase tracking-[0.12em]"
              >
                <Link to={'/' as never} aria-label="Vault home">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--a-sky),var(--a-mint))] text-[#0f172a] text-xs font-bold shadow-sm">
                    V3
                  </span>
                  <span className="truncate text-sm font-semibold">Vault</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ---- Content: primary + secondary nav ---- */}
        <SidebarContent>
          {/* Primary — core execution */}
          <SidebarGroup>
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
                      >
                        <Link to={item.to as never}>
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
          <SidebarGroup>
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
                      >
                        <Link to={item.to as never}>
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
                  >
                    <Link to={item.to as never}>
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
