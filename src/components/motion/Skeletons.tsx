import React from 'react';

/**
 * Reusable skeleton elements with subtle pulse/shimmer animation.
 * Maintains identical dimensions to real cards to eliminate layout shifts.
 */

export const ShimmerBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-200/75 animate-pulse rounded-lg ${className}`} />
);

export const JobCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 sm:p-6 shadow-2xs space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 w-full">
        <ShimmerBlock className="w-12 h-12 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <ShimmerBlock className="w-24 h-3.5" />
          <ShimmerBlock className="w-48 h-5" />
        </div>
      </div>
      <ShimmerBlock className="w-8 h-8 rounded-lg shrink-0" />
    </div>

    <div className="flex gap-3 pt-1">
      <ShimmerBlock className="w-20 h-3" />
      <ShimmerBlock className="w-24 h-3" />
      <ShimmerBlock className="w-28 h-3" />
    </div>

    <div className="space-y-2 pt-1">
      <ShimmerBlock className="w-full h-3" />
      <ShimmerBlock className="w-4/5 h-3" />
    </div>

    <div className="flex gap-2 pt-2">
      <ShimmerBlock className="w-16 h-5 rounded-md" />
      <ShimmerBlock className="w-20 h-5 rounded-md" />
      <ShimmerBlock className="w-14 h-5 rounded-md" />
    </div>

    <div className="pt-4 border-t border-[#E4E7EC] flex items-center justify-between">
      <ShimmerBlock className="w-24 h-4" />
      <div className="flex gap-2">
        <ShimmerBlock className="w-20 h-9 rounded-xl" />
        <ShimmerBlock className="w-24 h-9 rounded-xl" />
      </div>
    </div>
  </div>
);

export const TalentCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 sm:p-6 shadow-2xs space-y-4">
    <div className="flex items-start gap-3">
      <ShimmerBlock className="w-14 h-14 rounded-2xl shrink-0" />
      <div className="space-y-2 flex-1">
        <ShimmerBlock className="w-32 h-4" />
        <ShimmerBlock className="w-24 h-3" />
      </div>
    </div>
    <div className="flex gap-2">
      <ShimmerBlock className="w-16 h-3" />
      <ShimmerBlock className="w-20 h-3" />
    </div>
    <div className="flex gap-1.5 flex-wrap">
      <ShimmerBlock className="w-14 h-5 rounded-md" />
      <ShimmerBlock className="w-18 h-5 rounded-md" />
      <ShimmerBlock className="w-12 h-5 rounded-md" />
    </div>
    <div className="pt-3 border-t border-[#E4E7EC] flex items-center justify-between">
      <ShimmerBlock className="w-20 h-4" />
      <ShimmerBlock className="w-28 h-9 rounded-xl" />
    </div>
  </div>
);

export const DashboardCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 sm:p-6 shadow-2xs space-y-3">
    <div className="flex items-center justify-between">
      <ShimmerBlock className="w-28 h-3.5" />
      <ShimmerBlock className="w-9 h-9 rounded-xl" />
    </div>
    <ShimmerBlock className="w-20 h-7" />
    <ShimmerBlock className="w-36 h-3" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden shadow-2xs">
    <div className="p-4 border-b border-[#E4E7EC] flex items-center justify-between bg-slate-50/60">
      <ShimmerBlock className="w-32 h-4" />
      <ShimmerBlock className="w-20 h-4" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <ShimmerBlock className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <ShimmerBlock className="w-48 h-3.5" />
              <ShimmerBlock className="w-32 h-3" />
            </div>
          </div>
          <ShimmerBlock className="w-20 h-4" />
          <ShimmerBlock className="w-24 h-8 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);
