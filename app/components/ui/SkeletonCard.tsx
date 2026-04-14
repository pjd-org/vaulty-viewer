import React from 'react';

const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading content"
      className={`rounded-[var(--radius-card)] animate-pulse p-4 ${className}`}
      style={{ background: 'var(--n-100)' }}
    >
      <div
        className="h-6 rounded w-3/5 mb-3"
        style={{ background: 'var(--n-200)' }}
      />
      <div
        className="h-4 rounded w-full mb-2"
        style={{ background: 'var(--n-200)' }}
      />
      <div
        className="h-4 rounded w-4/5"
        style={{ background: 'var(--n-200)' }}
      />
    </div>
  );
};

export default SkeletonCard;
