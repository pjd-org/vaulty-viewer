import React from 'react';
import {
  elapsedMinutes,
  type ActiveSession,
} from '../../../src/lib/focus-logic';
import { PrimaryButton, SecondaryButton } from '../ui';

interface ActiveSessionBannerProps {
  session: ActiveSession;
  onResume: () => void;
  onEnd: () => void;
}

export function ActiveSessionBanner({
  session,
  onResume,
  onEnd,
}: ActiveSessionBannerProps) {
  const elapsed = session.startedAt ? elapsedMinutes(session.startedAt) : null;
  const tasksDone =
    session.tasks?.filter((t) => t.status === 'done').length ?? 0;
  const tasksTotal = session.tasks?.length ?? 0;
  const [confirmingEnd, setConfirmingEnd] = React.useState(false);

  return (
    <div className="rounded-[28px] border border-[var(--border-default)] bg-[var(--surf-utility)] p-4 flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-[var(--text-info)] uppercase tracking-wide">
          Session active
        </span>
        {session.title && (
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {session.title}
          </span>
        )}
        <span className="text-xs text-[var(--text-tertiary)]">
          {elapsed !== null && (
            <>
              {elapsed}m elapsed{tasksTotal > 0 ? ' · ' : ''}
            </>
          )}
          {tasksTotal > 0 && (
            <>
              {tasksDone}/{tasksTotal} tasks
            </>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <PrimaryButton onClick={onResume}>Resume</PrimaryButton>
        {confirmingEnd ? (
          <>
            <SecondaryButton
              onClick={() => {
                onEnd();
                setConfirmingEnd(false);
              }}
            >
              Confirm end
            </SecondaryButton>
            <SecondaryButton onClick={() => setConfirmingEnd(false)}>
              Cancel
            </SecondaryButton>
          </>
        ) : (
          <SecondaryButton onClick={() => setConfirmingEnd(true)}>
            End
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}
