import React from 'react';
import { SectionHeader } from '../layout';
import type { KanbanTask } from '../../../src/lib/kanban-logic';

interface ProjectBoardSectionProps {
  tasks: KanbanTask[];
  projectId: string;
}

interface Column {
  key: string;
  label: string;
  tasks: KanbanTask[];
  accent?: boolean;
}

function TaskCard({ task, accent }: { task: KanbanTask; accent?: boolean }) {
  const borderAccent = accent ? 'border-l-2 border-l-primary' : '';
  return (
    <div
      className={`genie-surface genie-surface--utility rounded-xl px-4 py-3 mb-2 ${borderAccent}`}
    >
      <p className="text-sm font-medium text-slate-100 leading-snug">
        {task.title}
      </p>
      {task.estimatedTimeMin != null && task.estimatedTimeMin > 0 && (
        <span
          aria-hidden="true"
          className="mt-1.5 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300"
        >
          ⏱ {task.estimatedTimeMin}m
        </span>
      )}
    </div>
  );
}

export function ProjectBoardSection({ tasks }: ProjectBoardSectionProps) {
  const columns: Column[] = [
    {
      key: 'todo',
      label: 'To do',
      tasks: tasks.filter((t) => t.status === 'todo' || t.status === 'backlog'),
    },
    {
      key: 'in-progress',
      label: 'In progress',
      tasks: tasks.filter((t) => t.status === 'in-progress'),
      accent: true,
    },
    {
      key: 'done',
      label: 'Done',
      tasks: tasks.filter(
        (t) => t.status === 'completed' || t.status === 'done'
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => (
        <div key={col.key}>
          <SectionHeader
            title={col.label}
            subtitle={`${col.tasks.length} task${col.tasks.length !== 1 ? 's' : ''}`}
          />
          {col.tasks.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">—</p>
          ) : (
            col.tasks.map((task) => (
              <TaskCard key={task.id} task={task} accent={col.accent} />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
