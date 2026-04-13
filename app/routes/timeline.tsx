import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { EmptyState, RouteLoadingState } from '../components/ui';
import { timelineSearchParams } from '../../src/lib/routes/search-params';
import {
  getTimelineSurfaceQueryOptions,
  useTimelineSurface,
  type TimelineEventEntry,
} from '../lib/viewer-adapter';
import { UnauthenticatedError } from '../../src/utils/api';

export const Route = createFileRoute('/timeline')({
  validateSearch: timelineSearchParams,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(getTimelineSurfaceQueryOptions());
  },
  component: TimelineRoute,
});

// ---------------------------------------------------------------------------
// Event type badge
// ---------------------------------------------------------------------------

function EventTypeBadge({ type }: { type: string }) {
  const [namespace] = type.split('.');
  const colorClass =
    namespace === 'agents'
      ? 'bg-emerald-100 text-emerald-700'
      : namespace === 'llm'
        ? 'bg-blue-100 text-blue-700'
        : namespace === 'extractions'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-neutral-100 text-neutral-500';
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${colorClass}`}>
      {type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Event row
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
      className={`w-full text-left px-3 py-2.5 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors ${
        selected ? 'bg-neutral-100' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <EventTypeBadge type={event.type} />
        <span className="text-xs text-neutral-400 shrink-0">
          {dateLabel} {timeLabel}
        </span>
      </div>
      {event.meta && typeof event.meta.run_id === 'string' && (
        <p className="text-xs text-neutral-400 mt-1 font-mono truncate">
          {event.meta.run_id}
        </p>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Event detail panel
// ---------------------------------------------------------------------------

function EventDetail({ event }: { event: TimelineEventEntry }) {
  return (
    <div className="space-y-3 text-sm" data-testid="timeline-event-detail">
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
          Type
        </p>
        <EventTypeBadge type={event.type} />
      </div>
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
          Timestamp
        </p>
        <p className="text-xs font-mono text-neutral-700">{event.ts}</p>
      </div>
      {Object.keys(event.meta).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
            Meta
          </p>
          <pre className="text-xs font-mono text-neutral-600 bg-neutral-50 rounded p-2 overflow-auto max-h-32">
            {JSON.stringify(event.meta, null, 2)}
          </pre>
        </div>
      )}
      {Object.keys(event.data).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
            Data
          </p>
          <pre className="text-xs font-mono text-neutral-600 bg-neutral-50 rounded p-2 overflow-auto max-h-40">
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
}: {
  data: { events: TimelineEventEntry[]; total: number };
  selectedId: string | undefined;
  selectedEvent: TimelineEventEntry | null;
  onSelect: (id: string) => void;
}) {
  if (data.events.length === 0) {
    return (
      <div data-testid="timeline-empty-state" className="space-y-2">
        <p className="text-sm font-medium text-neutral-600">
          No timeline events yet.
        </p>
        <p className="text-xs text-neutral-400">
          Adapter context is wired. Live and audit event streams will appear
          once the runtime surface connects.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="timeline-content">
      <p className="text-xs text-neutral-400 mb-2 px-1">
        {data.total} events total
      </p>
      <div className="rounded-xl border border-neutral-200 overflow-hidden">
        {data.events.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            selected={event.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
      {selectedEvent && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <EventDetail event={selectedEvent} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route component
// ---------------------------------------------------------------------------

function TimelineRoute() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data, isLoading, error } = useTimelineSurface({ limit: 50 });

  const selectedId = search.selectedId ?? undefined;
  const selectedEvent = data?.events.find((e) => e.id === selectedId) ?? null;

  React.useEffect(() => {
    if (error instanceof UnauthenticatedError) {
      void navigate({ to: '/login' });
    }
  }, [error, navigate]);

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
          detail: 'Huey, pipelines, schedules, agents',
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
            onSelect={(id) =>
              void navigate({ search: (prev) => ({ ...prev, selectedId: id }) })
            }
          />
        ) : (
          <div data-testid="timeline-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No timeline events yet.
            </p>
            <p className="text-xs text-neutral-400">
              Adapter context is wired. Live and audit event streams will appear
              once the runtime surface connects.
            </p>
          </div>
        )
      }
    />
  );
}
