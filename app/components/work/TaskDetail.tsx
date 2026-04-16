import React from 'react';
import { Link } from '@tanstack/react-router';
import type { NextAction } from '../../../src/lib/focus-logic';

const taskChipClass =
  'rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-slate-500';
const taskSkyLinkClass =
  'inline-block text-xs text-sky-600 underline underline-offset-2 transition hover:text-sky-800';
const taskVioletLinkClass =
  'inline-block text-xs text-violet-600 underline underline-offset-2 transition hover:text-violet-800';

export function TaskDetail({ task }: { task: NextAction }) {
  const blockers =
    (task.blockers as { description?: string }[] | undefined) ?? [];

  return (
    <div className="space-y-4 text-sm" data-testid="work-task-detail">
      <div>
        <p className="font-medium leading-snug text-slate-800">{task.title}</p>
        {task.description ? (
          <p className="mt-1 text-xs text-slate-500">{task.description}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-400 italic">
            No description. Open the note to add context.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {task.priority > 0 && (
          <span className="rounded-full border [background:color-mix(in_srgb,var(--a-sky)_12%,white)] [border-color:color-mix(in_srgb,var(--a-sky)_28%,transparent)] [color:color-mix(in_srgb,var(--a-sky)_65%,#1c2230)] px-2 py-0.5 text-[11px]">
            p{task.priority}
          </span>
        )}
        {task.effortScore > 0 && (
          <span className={taskChipClass}>effort {task.effortScore}</span>
        )}
        {task.focusCost > 0 && (
          <span className={taskChipClass}>focus {task.focusCost}</span>
        )}
        {task.estimatedTimeMin > 0 && (
          <span className={taskChipClass}>{task.estimatedTimeMin}m</span>
        )}
        {task.dueDate && (
          <span className="rounded-full border [background:color-mix(in_srgb,var(--a-sun)_14%,white)] [border-color:color-mix(in_srgb,var(--a-sun)_30%,transparent)] [color:color-mix(in_srgb,var(--a-sun)_80%,#1c2230)] px-2 py-0.5 text-[11px]">
            due {task.dueDate}
          </span>
        )}
        <span
          className={[
            'rounded-full border px-2 py-0.5 text-[11px]',
            task.status === 'blocked'
              ? '[background:color-mix(in_srgb,var(--a-rose)_14%,white)] [border-color:color-mix(in_srgb,var(--a-rose)_28%,transparent)] [color:color-mix(in_srgb,var(--a-rose)_70%,#1c2230)]'
              : '[background:color-mix(in_srgb,var(--a-mint)_14%,white)] [border-color:color-mix(in_srgb,var(--a-mint)_28%,transparent)] [color:color-mix(in_srgb,var(--a-mint)_70%,#1c2230)]',
          ].join(' ')}
        >
          {task.status}
        </span>
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span key={tag} className={taskChipClass}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {blockers.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-slate-500">
            Blockers
          </p>
          <ul className="space-y-1">
            {blockers.map((b, i) => (
              <li
                key={i}
                className="text-xs [color:color-mix(in_srgb,var(--a-rose)_75%,#1c2230)]"
              >
                {b.description ?? String(b)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {task.path && (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/note"
            search={{ p: task.path }}
            className="inline-block text-xs text-slate-500 underline underline-offset-2 transition hover:text-slate-700"
          >
            Open note →
          </Link>
          <Link
            to="/knowledge"
            search={{ tab: 'notes' }}
            onClick={() => {
              try {
                const hint =
                  task.tags.length > 0
                    ? task.tags[0]
                    : task.title.split(' ').slice(0, 3).join(' ');
                sessionStorage.setItem('knowledge-search-hint', hint);
              } catch {
                // sessionStorage unavailable — silently skip
              }
            }}
            className={taskSkyLinkClass}
          >
            Related knowledge →
          </Link>
          <Link
            to="/primary-agent"
            onClick={() => {
              try {
                sessionStorage.setItem('primary-agent-task-hint', task.title);
              } catch {
                // sessionStorage unavailable — silently skip
              }
            }}
            className={taskVioletLinkClass}
          >
            Ask Primary Agent about this →
          </Link>
        </div>
      )}
      {!task.path && (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/knowledge"
            search={{ tab: 'notes' }}
            onClick={() => {
              try {
                sessionStorage.setItem(
                  'knowledge-search-hint',
                  task.title.split(' ').slice(0, 3).join(' ')
                );
              } catch {
                // sessionStorage unavailable — silently skip
              }
            }}
            className={taskSkyLinkClass}
          >
            Related knowledge →
          </Link>
          <Link
            to="/primary-agent"
            onClick={() => {
              try {
                sessionStorage.setItem('primary-agent-task-hint', task.title);
              } catch {
                // sessionStorage unavailable — silently skip
              }
            }}
            className={taskVioletLinkClass}
          >
            Ask Primary Agent about this →
          </Link>
        </div>
      )}
    </div>
  );
}
