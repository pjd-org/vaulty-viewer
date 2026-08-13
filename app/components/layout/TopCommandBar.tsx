import React from 'react';
import { Link } from '@tanstack/react-router';
import { Activity, Heart, PanelLeft, Search } from 'lucide-react';
import { GlassBadge, GlassSurface } from '@vault/ui';
import { Button } from '@/app/components/ui';
import { useIsMobile } from '../../hooks/use-mobile';
import { CreateArtifactDialog } from './CreateArtifactDialog';
import { useUIStore } from '../../../src/store/ui';
import { dispatchNavOverlay } from '../../../src/lib/nav-overlays';
import { useHealthSurface } from '../../lib/viewer-adapter';
import useCODStatus from '../../../src/hooks/useCODStatus';

interface TopCommandBarProps {
  /** Optional scope label — e.g. project or context name — shown as a chip */
  scopeEcho?: string;
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

export function TopCommandBar({ scopeEcho, accentColor }: TopCommandBarProps) {
  const accent = accentColor ?? 'var(--a-sky)';
  const isMobile = useIsMobile();
  const [createOpen, setCreateOpen] = React.useState(false);
  const { data: healthData, isLoading: healthLoading, error: healthError } =
    useHealthSurface();
  const {
    validation: codValidation,
    loading: codLoading,
    error: codError,
  } = useCODStatus();
  const leftSidebarCollapsed = useUIStore(
    (state) => state.layout.leftSidebarCollapsed
  );
  const mobileNavOpen = useUIStore((state) => state.layout.mobileNavOpen);
  const toggleLeftSidebar = useUIStore((state) => state.toggleLeftSidebar);
  const toggleMobileNav = useUIStore((state) => state.toggleMobileNav);
  const toggleCommandPalette = useUIStore(
    (state) => state.toggleCommandPalette
  );

  const handleMenuToggle = React.useCallback(() => {
    if (isMobile) {
      toggleMobileNav();
      return;
    }

    toggleLeftSidebar();
  }, [isMobile, toggleLeftSidebar, toggleMobileNav]);

  const menuPressed = isMobile ? mobileNavOpen : !leftSidebarCollapsed;
  const healthStatus = healthLoading
    ? 'Loading'
    : healthError
      ? 'Offline'
      : healthData?.overall === 'ok'
        ? 'OK'
        : 'Degraded';
  const healthTone = healthLoading
    ? 'aqua'
    : healthError
      ? 'rose'
      : healthData?.overall === 'ok'
        ? 'mint'
        : 'sun';

  const codStatus = codLoading
    ? 'Loading'
    : codError
      ? 'Offline'
      : codValidation.status;
  const codTone = codLoading
    ? 'aqua'
    : codError
      ? 'rose'
      : codValidation.status === 'PASS'
        ? 'mint'
        : codValidation.status === 'WARN'
          ? 'sun'
          : codValidation.status === 'FAIL'
            ? 'rose'
            : 'aqua';

  return (
    <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <GlassSurface
        as="header"
        variant="overlay"
        radius="2xl"
        shadow="md"
        border="default"
        className="px-4 py-3"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="!h-10 !w-10 !shrink-0 !rounded-2xl"
              onClick={handleMenuToggle}
              aria-pressed={menuPressed}
              aria-label={isMobile ? 'Toggle navigation' : 'Toggle sidebar'}
            >
              <PanelLeft className="h-4 w-4" aria-hidden="true" />
            </Button>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Viewer V3
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  COD command center
                </p>
                {scopeEcho && (
                  <GlassBadge
                    tone="sky"
                    dot
                    size="sm"
                    className="shrink-0"
                    style={{
                      background: `color-mix(in srgb, ${accent} 20%, transparent)`,
                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 35%, transparent)`,
                    }}
                  >
                    {scopeEcho}
                  </GlassBadge>
                )}
              </div>
            </div>
          </div>

          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-pill border border-[var(--border-glass)] bg-[var(--surf-utility)] px-4 py-2.5 lg:max-w-xl">
            <Search
              className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Search
            </span>
            <input
              aria-label="Search viewer"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus-visible:outline-none"
              placeholder="Find notes, projects, signals, and runs…"
              type="search"
            />
          </label>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="!rounded-full !bg-transparent !text-[var(--text-primary)] hover:!bg-[var(--surf-utility)]"
            >
              <Link
                to="/health"
                search={{ tab: undefined, selectedId: undefined }}
                aria-label="Open health status"
              >
                <Heart className="h-4 w-4" aria-hidden="true" />
                <span>Health</span>
                <GlassBadge tone={healthTone} size="sm" className="shrink-0">
                  {healthStatus}
                </GlassBadge>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="!rounded-full"
              onClick={() => dispatchNavOverlay('cod')}
              aria-haspopup="dialog"
              aria-label="Open COD status"
            >
              <Activity className="h-4 w-4" aria-hidden="true" />
              <span>COD</span>
              <GlassBadge tone={codTone} size="sm" className="shrink-0">
                {codStatus}
              </GlassBadge>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="!rounded-full"
              onClick={() => toggleCommandPalette()}
            >
              <span className="text-xs font-semibold">⌘</span>
              <span>Quick Command</span>
            </Button>

            <Button asChild variant="secondary" size="sm" className="!rounded-full">
              <Link to="/inbox">Review Inbox</Link>
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="!rounded-full"
              onClick={() => setCreateOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={createOpen}
            >
              + Create
            </Button>
          </div>
        </div>
      </GlassSurface>
      <CreateArtifactDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
