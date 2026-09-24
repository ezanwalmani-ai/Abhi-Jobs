import React from 'react';
import { ResumeCompletionBreakdown } from '../../types/resume';
import { Award, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';

interface ResumeCompletionBarProps {
  completion: ResumeCompletionBreakdown;
  onSectionClick?: (sectionKey: string) => void;
}

export const ResumeCompletionBar: React.FC<ResumeCompletionBarProps> = ({
  completion,
  onSectionClick,
}) => {
  const { total, encouragementMessage, sections, nextRecommendation } = completion;

  const getProgressColor = () => {
    if (total >= 80) return 'from-teal-600 to-[#004D40]';
    if (total >= 50) return 'from-teal-500 to-teal-700';
    if (total >= 25) return 'from-amber-400 to-amber-600';
    return 'from-amber-500 to-amber-600';
  };

  const getBadgeStyle = () => {
    if (total >= 80) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (total >= 50) return 'bg-teal-50 text-teal-800 border-teal-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  const sectionPills = [
    { key: 'personalInfo', label: 'Personal Info', complete: sections?.personalInfo, points: '20%' },
    { key: 'summary', label: 'Summary', complete: sections?.summary, points: '15%' },
    { key: 'experience', label: 'Experience', complete: sections?.experience, points: '25%' },
    { key: 'education', label: 'Education', complete: sections?.education, points: '15%' },
    { key: 'skills', label: 'Skills', complete: sections?.skills, points: '15%' },
    { key: 'additional', label: 'Projects & More', complete: sections?.additional, points: '10%' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5 transition-all">
      {/* Top Row: Title, Percentage, and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center shrink-0 shadow-2xs">
            <Award className="w-5 h-5 text-[#004D40]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                Resume Completion
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${getBadgeStyle()}`}
              >
                {total}%
              </span>
            </div>
            {/* Helpful encouragement message */}
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {encouragementMessage}
            </p>
          </div>
        </div>

        {total === 100 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 self-start sm:self-auto shrink-0 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All Sections Complete</span>
          </div>
        ) : nextRecommendation ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 text-[#004D40] border border-teal-200 text-[11px] font-semibold self-start sm:self-auto shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-[#004D40]" />
            <span>Next: {nextRecommendation.section} (+{nextRecommendation.points}%)</span>
          </div>
        ) : null}
      </div>

      {/* Progress Track */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5">
          <div
            className={`h-full transition-all duration-700 ease-out rounded-full bg-gradient-to-r ${getProgressColor()}`}
            style={{ width: `${Math.max(5, total)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 px-0.5">
          <span>0% Basics</span>
          <span>50% Core Background</span>
          <span>80% Competitive</span>
          <span>100% Ready</span>
        </div>
      </div>

      {/* Section Status Checklist Pills */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
          Sections:
        </span>
        {sectionPills.map((pill) => (
          <button
            key={pill.key}
            type="button"
            onClick={() => onSectionClick && onSectionClick(pill.key)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              pill.complete
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {pill.complete ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
            <span>{pill.label}</span>
            {!pill.complete && (
              <span className="text-[10px] text-slate-400 font-normal">
                {pill.points}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
