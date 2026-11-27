import React, { useState } from 'react';
import type { DateTrendPoint } from '../../services/adminPanelService';

export interface AdminTrendChartProps {
  title: string;
  subtitle: string;
  points: DateTrendPoint[];
  accentColor?: string;
  emptyLabel?: string;
}

export const AdminTrendChart: React.FC<AdminTrendChartProps> = ({
  title,
  subtitle,
  points,
  accentColor = '#102B4E',
  emptyLabel = 'No timestamped Firestore records in the selected window yet.',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const totalInWindow = points.reduce((sum, p) => sum + p.count, 0);
  const maxVal = Math.max(1, ...points.map((p) => p.count));
  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#081D36] truncate">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold font-mono tabular-nums text-[#081D36]">
            {activePoint ? activePoint.count : totalInWindow}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {activePoint ? activePoint.label : `${points.length}d total`}
          </div>
        </div>
      </div>

      {totalInWindow === 0 ? (
        <div className="h-32 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center px-4 text-center text-xs text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className="h-32 w-full flex items-end gap-1.5 pt-2"
            role="img"
            aria-label={`${title}: ${totalInWindow} total records over ${points.length} days`}
          >
            {points.map((pt, idx) => {
              const heightPct = pt.count === 0 ? 4 : Math.max(12, Math.round((pt.count / maxVal) * 100));
              const isHovered = hoveredIdx === idx;
              return (
                <button
                  key={pt.dateKey}
                  type="button"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  title={`${pt.label}: ${pt.count}`}
                  className="flex-1 h-full flex items-end group focus:outline-none cursor-pointer"
                >
                  <span
                    className="w-full rounded-t transition-all duration-150"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: pt.count === 0 ? '#E2E8F0' : accentColor,
                      opacity: hoveredIdx === null || isHovered ? 1 : 0.45,
                    }}
                  />
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>{points[0]?.label}</span>
            <span>{points[Math.floor(points.length / 2)]?.label}</span>
            <span>{points[points.length - 1]?.label}</span>
          </div>
        </div>
      )}
    </div>
  );
};
