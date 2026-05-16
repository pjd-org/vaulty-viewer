import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
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
  Terminal,
} from 'lucide-react';
import { Button } from '@/app/components/ui';
import {
  GlassSurface,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@vault/ui';
import {
  Separator,
} from '@/app/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { VaultyLogo } from '@/app/components/ui/vaulty-logo';
import { useIsMobile } from '../../hooks/use-mobile';
import { dispatchNavOverlay } from '../../../src/lib/nav-overlays';
import { useUIStore } from '../../../src/store/ui';
import {
  VIEWER_OVERLAY_NAV,
  VIEWER_PRIMARY_NAV,
  VIEWER_SECONDARY_NAV,
  VIEWER_STATUS_NAV,
  VIEWER_UTILITY_NAV,
} from '../../../src/lib/routes/v3-routing';
import { cn } from '../../../src/lib/utils';

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
  '/cod-status': Activity,
  '/graph': Share2,
  '/timeline': Clock,
  '/archive': Archive,
  '/primary-agent': Bot,
  '/agent-shell': Terminal,
  '/settings': Settings,
};

const OVERLAY_ICONS: Record<string, React.ElementType> = {
  avatar: User,
  cod: Activity,
};

function useActivePath() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (to: string): boolean => {
    if (to === '/') return pathname === '/';
    return pathname === to || pathname.startsWith(`${to}/`);
  };
}

function ShellSection({
  title,
  collapsed,
  children,
}: {
  title: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <p
        className={cn(
          'px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]',
          collapsed && 'sr-only'
        )}
      >
        {title}
      </p>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

function ShellNavButton({
  to,
  label,
  Icon,
  active,
  collapsed,
  onNavigate,
}: {
  to: string;
  label: string;
  Icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Button
      asChild
      variant={active ? 'secondary' : 'ghost'}
      size="md"
      className={cn(
        '!rounded-2xl transition-all duration-200',
        collapsed ? '!h-10 !w-10 !justify-center !px-0' : '!h-11 !w-full !justify-start !px-3',
        active && 'shadow-sm'
      )}
    >
      <Link
        to={to as never}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? label : undefined}
        onClick={onNavigate}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className={cn('truncate', collapsed && 'sr-only')}>{label}</span>
      </Link>
    </Button>
  );
}

function ShellActionButton({
  label,
  Icon,
  collapsed,
  onClick,
}: {
  label: string;
  Icon: React.ElementType;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="md"
      className={cn(
        '!rounded-2xl transition-all duration-200',
        collapsed ? '!h-10 !w-10 !justify-center !px-0' : '!h-11 !w-full !justify-start !px-3'
      )}
      onClick={onClick}
      aria-label={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className={cn('truncate', collapsed && 'sr-only')}>{label}</span>
    </Button>
  );
}

function ShellRailContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const isActive = useActivePath();

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="md"
          className={cn(
            '!rounded-2xl transition-all duration-200',
            collapsed
              ? '!h-10 !w-10 !justify-center !px-0'
              : '!h-11 !w-full !justify-start !px-3'
          )}
        >
          <Link
            to="/"
            aria-label="Vault home"
            onClick={onNavigate}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--a-sky),var(--a-mint))] text-[#0f172a] shadow-[0_10px_24px_rgba(51,95,255,0.28)]">
              <VaultyLogo className="h-5 w-5" />
            </span>
            <span
              className={cn(
                'min-w-0 truncate text-sm font-semibold tracking-[0.14em] text-[var(--text-primary)]',
                collapsed && 'sr-only'
              )}
            >
              Vault
            </span>
          </Link>
        </Button>
      </div>

      <Separator />

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
        <ShellSection title="Primary navigation" collapsed={collapsed}>
          {VIEWER_PRIMARY_NAV.map((item) => {
            const Icon = ROUTE_ICONS[item.to] ?? Home;
            return (
              <ShellNavButton
                key={item.to}
                to={item.to}
                label={item.label}
                Icon={Icon}
                active={isActive(item.to)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            );
          })}
        </ShellSection>

        <Separator />

        <ShellSection title="Secondary navigation" collapsed={collapsed}>
          {VIEWER_SECONDARY_NAV.map((item) => {
            const Icon = ROUTE_ICONS[item.to] ?? BookOpen;
            return (
              <ShellNavButton
                key={item.to}
                to={item.to}
                label={item.label}
                Icon={Icon}
                active={isActive(item.to)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            );
          })}
        </ShellSection>

        <Separator />

        <ShellSection title="Status" collapsed={collapsed}>
          {VIEWER_STATUS_NAV.map((item) => {
            const Icon = ROUTE_ICONS[item.to] ?? Heart;
            return (
              <ShellNavButton
                key={item.to}
                to={item.to}
                label={item.label}
                Icon={Icon}
                active={isActive(item.to)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            );
          })}
        </ShellSection>

        <Separator />

        <ShellSection title="Utility" collapsed={collapsed}>
          {VIEWER_UTILITY_NAV.map((item) => {
            const Icon = ROUTE_ICONS[item.to] ?? Settings;
            return (
              <ShellNavButton
                key={item.to}
                to={item.to}
                label={item.label}
                Icon={Icon}
                active={isActive(item.to)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            );
          })}
        </ShellSection>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <Separator />
        <ShellSection title="Overlays" collapsed={collapsed}>
          {VIEWER_OVERLAY_NAV.map((item) => {
            const Icon = OVERLAY_ICONS[item.overlay] ?? User;
            return (
              <ShellActionButton
                key={item.overlay}
                label={item.label}
                Icon={Icon}
                collapsed={collapsed}
                onClick={() => {
                  onNavigate?.();
                  dispatchNavOverlay(item.overlay);
                }}
              />
            );
          })}
        </ShellSection>
      </div>
    </div>
  );
}

export function ViewerSidebar({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const {
    leftSidebarCollapsed,
    mobileNavOpen,
    closeMobileNav,
    setMobileNavOpen,
  } = useUIStore(
    useShallow((state) => ({
      leftSidebarCollapsed: state.layout.leftSidebarCollapsed,
      mobileNavOpen: state.layout.mobileNavOpen,
      closeMobileNav: state.closeMobileNav,
      setMobileNavOpen: state.setMobileNavOpen,
    }))
  );

  React.useEffect(() => {
    if (!isMobile && mobileNavOpen) {
      closeMobileNav();
    }
  }, [closeMobileNav, isMobile, mobileNavOpen]);

  const collapsed = leftSidebarCollapsed;
  const desktopWidth = collapsed ? '5rem' : '17rem';

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden bg-[var(--bg)] text-[var(--ink)]">
      <aside
        aria-label="Main navigation"
        className="hidden shrink-0 px-4 py-4 md:block"
        style={{ width: desktopWidth }}
      >
        <GlassSurface
          as="div"
          variant="canvas"
          radius="2xl"
          shadow="md"
          border="default"
          className="sticky top-4 h-[calc(100dvh-2rem)] overflow-hidden"
        >
          <ShellRailContent collapsed={collapsed} />
        </GlassSurface>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent
        side="left"
        className="w-[min(18rem,85vw)] !border-r !border-[var(--border-glass)] !bg-[var(--surf-canvas)] !p-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Main navigation</SheetTitle>
          <SheetDescription>Viewer navigation and overlay controls.</SheetDescription>
        </SheetHeader>
        <ShellRailContent collapsed={false} onNavigate={closeMobileNav} />
      </SheetContent>
    </Sheet>
  </div>
);
}
