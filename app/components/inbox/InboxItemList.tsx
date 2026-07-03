import React from 'react';
import { EmptyState } from '../ui';

interface InboxItemListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
  className?: string;
}

export function InboxItemList<T>({
  items,
  renderItem,
  emptyTitle,
  emptyDescription,
  emptyAction,
  className = '',
}: InboxItemListProps<T>) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <div className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>{items.map(renderItem)}</div>;
}
