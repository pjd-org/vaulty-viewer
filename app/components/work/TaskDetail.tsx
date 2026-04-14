import React from 'react';
import { Link } from '@tanstack/react-router';
import type { NextAction } from '../../../src/lib/focus-logic';

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
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700">
            p{task.priority}
          </span>
        )}
        {task.effortScore > 0 && (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-slate-500">
            effort {task.effortScore}
          </span>
        )}
        {task.focusCost > 0 && (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-slate-500">
            focus {task.focusCost}
          </span>
        )}
        {task.estimatedTimeMin > 0 && (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-slate-500">
            {task.estimatedTimeMin}m
          </span>
        )}
        {task.dueDate && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
            due {task.dueDate}
          </span>
        )}
        <span
          className={[
            'rounded-full px-2 py-0.5 text-[11px]',
            task.status === 'blocked'
              ? 'bg-red-100 text-red-700'
              : 'bg-emerald-100 text-emerald-700',
          ].join(' ')}
        >
          {task.status}
        </span>
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-slate-500"
            >
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
              <li key={i} className="text-xs text-red-600">
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
            className="inline-block text-xs text-sky-600 underline underline-offset-2 transition hover:text-sky-800"
          >
            Related knowledge →
          </Link>
          <Link
            to="/huey"
            onClick={() => {
              try {
                sessionStorage.setItem('huey-task-hint', task.title);
              } catch {
                // sessionStorage unavailable — silently skip
              }
            }}
            className="inline-block text-xs text-violet-600 underline underline-offset-2 transition hover:text-violet-800"
          >
            Ask Huey about this →
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
            className="inline-block text-xs text-sky-600 underline underline-offset-2 transition hover:text-sky-800"
          >
            Related knowledge →
          </Link>
          <Link
            to="/huey"
            onClick={() => {
              try {
                sessionStorage.setItem('huey-task-hint', task.title);
              } catch {
                // sessionStorage unavailable — silently skip
              }
            }}
            className="inline-block text-xs text-violet-600 underline underline-offset-2 transition hover:text-violet-800"
          >
            Ask Huey about this →
          </Link>
        </div>
      )}
    </div>
  );
}
