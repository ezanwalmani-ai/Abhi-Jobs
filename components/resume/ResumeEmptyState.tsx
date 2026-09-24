import React from 'react';
import { FileText, Sparkles, ArrowRight, UserCheck } from 'lucide-react';

interface ResumeEmptyStateProps {
  onStartBlank: () => void;
  onStartWithProfile: () => void;
  hasProfileData: boolean;
}

export const ResumeEmptyState: React.FC<ResumeEmptyStateProps> = ({
  onStartBlank,
  onStartWithProfile,
  hasProfileData,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-sm space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#004D40] flex items-center justify-center mx-auto shadow-inner">
        <FileText className="w-8 h-8 text-[#004D40]" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Build Your Professional Resume
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Create a professional resume using your experience, education, skills, and achievements.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {hasProfileData && (
          <button
            type="button"
            onClick={onStartWithProfile}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Start with Profile Information</span>
          </button>
        )}

        <button
          type="button"
          onClick={onStartBlank}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <span>Start Building</span>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-left">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-xs font-bold text-slate-900 block">ATS Friendly</span>
          <span className="text-[11px] text-slate-500">
            Engineered to pass automated recruiter screening systems.
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-xs font-bold text-slate-900 block">Live Preview</span>
          <span className="text-[11px] text-slate-500">
            Real-time updates as you type with instant formatting.
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-xs font-bold text-slate-900 block">Vector PDF Export</span>
          <span className="text-[11px] text-slate-500">
            Standard A4 size with clickable links and crisp typography.
          </span>
        </div>
      </div>
    </div>
  );
};
