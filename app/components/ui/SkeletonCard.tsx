import React from 'react';

const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div role="status" aria-busy="true" aria-label="Loading content" className={`rounded-2xl bg-slate-100 animate-pulse p-4 ${className}`}>
      <div className="h-6 bg-slate-200 rounded w-3/5 mb-3" />
      <div className="h-4 bg-slate-200 rounded w-full mb-2" />
      <div className="h-4 bg-slate-200 rounded w-4/5" />
    </div>
  );
};

export default SkeletonCard;
