import React from 'react';
import { motion } from 'motion/react';
import { ResumeCompletionBreakdown } from '../../types/resume';
import { Award, CheckCircle2, TrendingUp } from 'lucide-react';
import { AnimatedProgressBar, AnimatedStatusBadge, EASE_PREMIUM } from '../../lib/motion';

interface ResumeCompletionBarProps {
  completion: ResumeCompletionBreakdown;
  onSectionClick?: (sectionKey: string) => void;
}

export const ResumeCompletionBar: React.FC<ResumeCompletionBarProps> = ({
  completion,
  onSectionClick,
}) => {
  const { total, encouragementMessage, sections, nextRecommendation } = completion;

  const sectionItems = [
    { key: 'personalInfo', label: 'Personal Info', complete: sections?.personalInfo, points: '20%' },
    { key: 'summary', label: 'Summary', complete: sections?.summary, points: '15%' },
    { key: 'experience', label: 'Experience', complete: sections?.experience, points: '25%' },
    { key: 'education', label: 'Education', complete: sections?.education, points: '15%' },
    { key: 'skills', label: 'Skills', complete: sections?.skills, points: '15%' },
    { key: 'additional', label: 'Projects & More', complete: sections?.additional, points: '10%' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E5EAF0] p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Top Row: Title, Animated Percentage, and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#102B4E]/8 text-[#102B4E] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-[#F47A24]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-extrabold text-[#102B4E] tracking-tight">
                Resume Completion
              </span>
              <span className="text-xs font-bold font-mono tabular-nums text-[#F47A24]">
                {total}%
              </span>
            </div>
            <p className="text-xs text-[#778397] mt-0.5 leading-relaxed">
              {encouragementMessage}
            </p>
          </div>
        </div>

        {total === 100 ? (
          <AnimatedStatusBadge
            status="All Sections Complete"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 self-start sm:self-auto shrink-0"
          />
        ) : nextRecommendation ? (
          <AnimatedStatusBadge
            status={`Next: ${nextRecommendation.section} (+${nextRecommendation.points}%)`}
            icon={<TrendingUp className="w-3.5 h-3.5 text-[#F47A24]" />}
            className="px-3 py-1.5 rounded-lg bg-[#F6F8FB] text-[#102B4E] border border-[#E5EAF0] text-xs font-semibold self-start sm:self-auto shrink-0"
          />
        ) : null}
      </div>

      {/* Live Animated Progress Track */}
      <div className="space-y-1.5">
        <AnimatedProgressBar
          percentage={Math.max(4, total)}
          showLabel={false}
          label="Resume completion progress"
          size="md"
        />
        <div className="flex justify-between items-center text-[10px] font-semibold text-[#778397] px-0.5 tabular-nums">
          <span>0% Basics</span>
          <span>50% Core</span>
          <span>80% Competitive</span>
          <span>100% Ready</span>
        </div>
      </div>

      {/* Interactive Section Jump Controls */}
      <div className="pt-2.5 border-t border-[#E5EAF0] flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-[#778397] mr-1">
          Jump to section:
        </span>
        {sectionItems.map((item) => (
          <motion.button
            key={item.key}
            type="button"
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.14, ease: EASE_PREMIUM }}
            onClick={() => onSectionClick && onSectionClick(item.key)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              item.complete
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
                : 'bg-[#F6F8FB] border-[#E5EAF0] text-[#253449] hover:border-[#102B4E]/30 hover:bg-white'
            }`}
          >
            {item.complete && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            )}
            <span>{item.label}</span>
            {!item.complete && (
              <span className="text-[10px] text-[#778397] font-mono tabular-nums">
                {item.points}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
