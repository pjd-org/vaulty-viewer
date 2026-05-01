import React from 'react';
import {
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { EmptyState, RouteLoadingState } from '../components/ui';
import { GlassCard } from '../components/ui/glass-card';
import { GlassInput } from '../components/ui/glass-input';
import { GlassBadge } from '../components/ui/glass-badge';
import Timeline, {
  TimelineItem,
  TimelineItemDate,
  TimelineItemTitle,
  TimelineItemDescription,
} from '../components/ui/timeline';
import { timelineSearchParams } from '../../src/lib/routes/search-params';
import {
  getTimelineSurfaceQueryOptions,
  useTimelineSurface,
  type TimelineEventEntry,
} from '../lib/viewer-adapter';
import { UnauthenticatedError } from '../../src/utils/api';
import { buildAuthTransitionPath } from '../../src/lib/auth-transition';
import { getAuthFailureKind } from '../hooks/use-login-redirect';
import { cn } from '@/src/lib/utils';

export const Route = createFileRoute('/timeline')({
  validateSearch: timelineSearchParams,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(getTimelineSurfaceQueryOptions());
  },
  component: TimelineRoute,
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const NAMESPACE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Agents', value: 'agents' },
  { label: 'LLM', value: 'llm' },
  { label: 'Extractions', value: 'extractions' },
] as const;

// ---------------------------------------------------------------------------
// Event type badge
// ---------------------------------------------------------------------------

function EventTypeBadge({ type }: { type: string }) {
  const [namespace] = type.split('.');
  const variant =
    namespace === 'agents'
      ? 'success'
      : namespace === 'llm'
        ? 'primary'
        : namespace === 'extractions'
          ? 'warning'
          : 'default';
  return (
    <GlassBadge variant={variant} size="sm">
      {type}
    </GlassBadge>
  );
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

function FilterBar({
  q,
  onQ,
  activeNamespace,
  onNamespace,
}: {
  q: string;
  onQ: (v: string) => void;
  activeNamespace: string;
  onNamespace: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      <GlassInput
        type="search"
        placeholder="Search events…"
        value={q}
        onChange={(e) => onQ(e.target.value)}
        aria-label="Search events"
      />
      <div className="flex items-center gap-2 flex-wrap">
        {NAMESPACE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onNamespace(f.value)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-200',
              'border cursor-pointer',
              activeNamespace === f.value
                ? 'bg-[var(--n-900)] border-[var(--n-900)] text-[var(--n-0)]'
                : 'bg-[var(--surf-elevated)] border-[var(--border-glass-soft)] text-[var(--text-secondary)] hover:bg-[var(--surf-utility)] hover:text-[var(--text-primary)]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event row (timeline card content)
// ---------------------------------------------------------------------------

function EventRow({
  event,
  selected,
  onSelect,
}: {
  event: TimelineEventEntry;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const date = new Date(event.ts);
  const eventLabel =
    event.type.split('.').at(-1)?.replaceAll('_', ' ') ?? event.type;
  const timeLabel = isNaN(date.getTime())
    ? event.ts
    : date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
  const dateLabel = isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <button
      type="button"
      data-testid="timeline-event-row"
      onClick={() => onSelect(event.id)}
      className={cn(
        'w-full rounded-xl px-3 py-2.5 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--a-sky)]/60',
        selected
          ? 'bg-[color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))]'
          : 'hover:bg-[var(--surf-utility)] bg-transparent'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <TimelineItemTitle className="text-sm font-semibold text-[var(--text-primary)]">
          {eventLabel}
        </TimelineItemTitle>
        <TimelineItemDate className="shrink-0 text-[11px] text-[var(--text-secondary)]">
          {date}
        </TimelineItemDate>
      </div>
      <TimelineItemDescription className="mt-2 text-xs text-[var(--text-secondary)]">
        {event.id}
      </TimelineItemDescription>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <EventTypeBadge type={event.type} />
        <span className="shrink-0 text-xs text-[var(--text-secondary)]">
          {dateLabel} {timeLabel}
        </span>
      </div>
      {event.meta && typeof event.meta.run_id === 'string' && (
        <p className="mt-2 truncate font-mono text-xs text-[var(--text-secondary)]">
          {event.meta.run_id}
        </p>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-xs text-[var(--text-secondary)]">
        Page {page + 1} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
          className={cn(
            'px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-200',
            'border',
            page === 0
              ? 'bg-[var(--surf-base)] border-[var(--border-glass-soft)] text-[var(--text-tertiary)] cursor-not-allowed'
              : 'bg-[var(--surf-elevated)] border-[var(--border-glass-soft)] text-[var(--text-secondary)] hover:bg-[var(--surf-utility)] hover:text-[var(--text-primary)] cursor-pointer'
          )}
        >
          ← Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
          className={cn(
            'px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-200',
            'border',
            page >= totalPages - 1
              ? 'bg-[var(--surf-base)] border-[var(--border-glass-soft)] text-[var(--text-tertiary)] cursor-not-allowed'
              : 'bg-[var(--surf-elevated)] border-[var(--border-glass-soft)] text-[var(--text-secondary)] hover:bg-[var(--surf-utility)] hover:text-[var(--text-primary)] cursor-pointer'
          )}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event detail panel (glass)
// ---------------------------------------------------------------------------

function EventDetail({ event }: { event: TimelineEventEntry }) {
  return (
    <div
      className="flex flex-col gap-3 text-sm"
      data-testid="timeline-event-detail"
    >
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
          Type
        </p>
        <EventTypeBadge type={event.type} />
      </div>
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
          Timestamp
        </p>
        <p className="font-mono text-xs text-[var(--text-secondary)]">{event.ts}</p>
      </div>
      {Object.keys(event.meta).length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Meta
          </p>
          <pre className="max-h-32 overflow-auto rounded-xl border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-2 font-mono text-xs text-[var(--text-secondary)]">
            {JSON.stringify(event.meta, null, 2)}
          </pre>
        </div>
      )}
      {Object.keys(event.data).length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Data
          </p>
          <pre className="max-h-40 overflow-auto rounded-xl border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-2 font-mono text-xs text-[var(--text-secondary)]">
            {JSON.stringify(event.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline content
// ---------------------------------------------------------------------------

function TimelineContent({
  data,
  selectedId,
  selectedEvent,
  onSelect,
  eventTypeFilter,
  onEventTypeFilter,
}: {
  data: { events: TimelineEventEntry[]; total: number };
  selectedId: string | undefined;
  selectedEvent: TimelineEventEntry | null;
  onSelect: (id: string) => void;
  eventTypeFilter: string;
  onEventTypeFilter: (v: string) => void;
}) {
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(0);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(0);
  }, [q, eventTypeFilter]);

  const filtered = React.useMemo(() => {
    let evts = data.events;
    if (eventTypeFilter) {
      evts = evts.filter((e) => e.type.startsWith(eventTypeFilter));
    }
    if (q.trim()) {
      const lower = q.toLowerCase();
      evts = evts.filter(
        (e) =>
          e.type.toLowerCase().includes(lower) ||
          e.id.toLowerCase().includes(lower) ||
          (typeof e.meta?.run_id === 'string' &&
            e.meta.run_id.toLowerCase().includes(lower))
      );
    }
    return evts;
  }, [data.events, q, eventTypeFilter]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (data.events.length === 0) {
    return (
      <div data-testid="timeline-empty-state" className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          No timeline events yet.
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">
          Adapter context is wired. Live and audit event streams will appear
          once the runtime surface connects.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="timeline-content" className="flex flex-col gap-4">
      <FilterBar
        q={q}
        onQ={setQ}
        activeNamespace={eventTypeFilter}
        onNamespace={onEventTypeFilter}
      />

      <p className="px-1 text-xs text-[var(--text-secondary)]">
        {filtered.length} of {data.total} events
        {q || eventTypeFilter ? ' (filtered)' : ''}
      </p>

      <GlassCard
        variant="light"
        glowEffect={false}
        className="genie-surface genie-surface--utility overflow-hidden rounded-[20px] p-3 sm:p-4"
      >
        {paginated.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
            No events match the current filter.
          </p>
        ) : (
          <Timeline
            orientation="vertical"
            alternating
            vertItemSpacing={130}
            vertItemMaxWidth={620}
            className="min-h-[560px]"
          >
            {paginated.map((event) => {
              const selected = event.id === selectedId;
              return (
                <TimelineItem
                  key={event.id}
                  variant={selected ? 'glass' : 'outline'}
                  hollow={!selected}
                >
                  <EventRow
                    event={event}
                    selected={selected}
                    onSelect={onSelect}
                  />
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </GlassCard>

      <Pagination
        page={page}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onPage={setPage}
      />

      {selectedEvent && (
        <GlassCard
          variant="light"
          glowEffect={false}
          className="genie-surface genie-surface--utility rounded-[20px] p-4"
        >
          <EventDetail event={selectedEvent} />
        </GlassCard>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route component
// ---------------------------------------------------------------------------

function TimelineRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const search = Route.useSearch();
  const { data, isLoading, error } = useTimelineSurface({ limit: 50 });

  const selectedId = search.selectedId ?? undefined;
  const selectedEvent = data?.events.find((e) => e.id === selectedId) ?? null;

  const eventTypeFilter = search.eventType ?? '';
  const authFailureKind = getAuthFailureKind(error);

  React.useEffect(() => {
    if (error instanceof UnauthenticatedError) {
      void navigate({
        to: buildAuthTransitionPath(
          `${location.pathname}${location.search}`
        ),
      });
    }
  }, [error, location.pathname, location.search, navigate]);

  if (error instanceof UnauthenticatedError) return null;

  const summaryItems = data
    ? [
        { label: 'Total', value: String(data.total), detail: 'domain events' },
        {
          label: 'Shown',
          value: String(data.events.length),
          detail: `of ${data.total}`,
        },
        {
          label: 'Mode',
          value: 'Audit',
          detail: 'Live and replay params reserved',
        },
        {
          label: 'Updated',
          value: new Date(data.fetchedAt).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          }),
          detail: 'last fetch',
        },
      ]
    : [
        { label: 'Total', value: '—', detail: 'Loading…' },
        { label: 'Shown', value: '—', detail: 'Loading…' },
        {
          label: 'Mode',
          value: 'Audit',
          detail: 'Live and replay params reserved',
        },
        {
          label: 'Runs',
          value: '—',
          detail: 'Primary Agent, pipelines, schedules, agents',
        },
      ];

  return (
    <WorkspaceScaffold
      title="Timeline"
      subtitle="Replay and audit surface for interventions, incidents, rejections, and runs."
      summaryItems={summaryItems}
      primaryTitle="Event Stream"
      primarySubtitle="Timeline list and filter controls."
      primary={
        isLoading ? (
          <RouteLoadingState label="Loading event stream..." />
        ) : authFailureKind === 'forbidden' ? (
          <EmptyState
            title="Timeline access forbidden"
            description="You are signed in, but this account cannot read the timeline surface."
          />
        ) : error && !data ? (
          <EmptyState
            title="Timeline data temporarily unavailable."
            description="The shell is intact. Retry once the runtime responds again."
          />
        ) : data != null ? (
          <TimelineContent
            data={data}
            selectedId={selectedId}
            selectedEvent={selectedEvent}
            eventTypeFilter={eventTypeFilter}
            onEventTypeFilter={(v) =>
              void navigate({
                to: '/timeline',
                search: (prev) =>
                  ({
                    ...prev,
                    eventType: v || undefined,
                    selectedId: undefined,
                  }) as ReturnType<typeof timelineSearchParams>,
              })
            }
            onSelect={(id) =>
              void navigate({
                to: '/timeline',
                search: (prev) =>
                  ({ ...prev, selectedId: id }) as ReturnType<
                    typeof timelineSearchParams
                  >,
              })
            }
          />
        ) : (
          <div
            data-testid="timeline-empty-state"
            className="flex flex-col gap-2"
          >
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              No timeline events yet.
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Adapter context is wired. Live and audit event streams will appear
              once the runtime surface connects.
            </p>
          </div>
        )
      }
    />
  );
}
