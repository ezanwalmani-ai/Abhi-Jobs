import React from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import type { CandidateProfile } from '../../types';
import type { ProfileCompletionReport, ProfileSectionId } from '../../utils/profileCompletion';

interface ProfileSidebarProps {
  profile: CandidateProfile;
  report: ProfileCompletionReport;
  activeSectionId?: ProfileSectionId | null;
  onJumpToSection: (sectionId: ProfileSectionId, openEditor?: boolean) => void;
  onUpdateVisibility: (visibility: 'employers_only' | 'private') => void;
  onToggleOpportunities: (open: boolean) => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  profile,
  report,
  activeSectionId,
  onJumpToSection,
  onUpdateVisibility,
  onToggleOpportunities,
}) => {
  const isEmployerVisible = profile.profileVisibility !== 'private';

  const progressBarColor =
    report.percentage >= 80
      ? 'bg-emerald-600'
      : report.percentage >= 50
      ? 'bg-[#F47A24]'
      : 'bg-[#102B4E]';

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      {/* 1. Profile Completion & Interactive Quick Links */}
      <div className="bg-white rounded-xl border border-[#E5EAF0] overflow-hidden">
        <div className="p-5 border-b border-[#EEF2F6]">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#102B4E]">Profile Completion</h2>
            <span className="text-xl font-bold text-[#102B4E] tabular-nums">
              {report.percentage}%
            </span>
          </div>

          <div className="w-full h-2 bg-[#EEF2F6] rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
              style={{ width: `${report.percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#64748B] mt-2.5">
            <span className="font-medium text-[#334155]">{report.strengthTier}</span>
            <span className="tabular-nums">
              {report.completedCount} of {report.totalSections} sections complete
            </span>
          </div>
        </div>

        {/* 11-Section Quick Navigation & Completion Checklist */}
        <div className="p-3">
          <p className="px-2.5 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Profile Checklist
          </p>
          <nav aria-label="Profile sections checklist" className="space-y-0.5">
            {report.sections.map((sec) => {
              const missingPts = Math.max(0, sec.weight - sec.earned);
              const isActive = activeSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onJumpToSection(sec.id, !sec.completed)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#F1F5FA] text-[#102B4E] font-semibold'
                      : 'text-[#334155] hover:bg-[#F6F8FB]'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {sec.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#CBD5E1] shrink-0" />
                    )}
                    <span className="truncate">{sec.title}</span>
                  </span>

                  <span className="shrink-0 flex items-center gap-1">
                    {sec.completed ? (
                      <span className="text-[11px] text-[#64748B] font-normal">
                        {sec.statusLabel}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#DE6816] tabular-nums">
                        +{missingPts}%
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 2. Missing Information & Recommended Actions */}
      <div className="bg-white rounded-xl border border-[#E5EAF0] p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#102B4E]">
            {report.recommendedActions.length > 0 ? 'Recommended Actions' : 'Profile Ready'}
          </h3>
          {report.missingSections.length > 0 && (
            <span className="text-xs font-medium text-[#64748B] tabular-nums">
              {report.missingSections.length} pending
            </span>
          )}
        </div>

        {report.recommendedActions.length === 0 ? (
          <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/80 p-3.5 text-xs text-emerald-900 leading-relaxed">
            Your profile is 100% complete. Keep your resume, recent roles, and availability current so recruiters see accurate details.
          </div>
        ) : (
          <ul className="divide-y divide-[#EEF2F6]">
            {report.recommendedActions.map((action) => (
              <li key={action.sectionId} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#F47A24] shrink-0" />
                      <p className="text-xs font-semibold text-[#0F172A] truncate">
                        {action.title}
                      </p>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#DE6816] tabular-nums shrink-0">
                    +{action.impactPoints}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onJumpToSection(action.sectionId, true)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer"
                >
                  <span>{action.actionLabel}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. Profile Visibility & Job-Search Status */}
      <div className="bg-white rounded-xl border border-[#E5EAF0] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#102B4E]">Profile Visibility</h3>
          <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
            Control how ABHI JOBS recruitment specialists and verified employers discover your profile.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onUpdateVisibility('employers_only')}
            className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-2.5 ${
              isEmployerVisible
                ? 'border-[#102B4E] bg-[#F6F8FB]'
                : 'border-[#E5EAF0] bg-white hover:bg-[#FAFBFD]'
            }`}
          >
            <Eye className={`w-4 h-4 mt-0.5 shrink-0 ${isEmployerVisible ? 'text-[#102B4E]' : 'text-[#94A3B8]'}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0F172A]">
                Visible to Verified Employers
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                Recruiters on ABHI JOBS can shortlist your profile for matching openings.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateVisibility('private')}
            className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-2.5 ${
              !isEmployerVisible
                ? 'border-[#102B4E] bg-[#F6F8FB]'
                : 'border-[#E5EAF0] bg-white hover:bg-[#FAFBFD]'
            }`}
          >
            <EyeOff className={`w-4 h-4 mt-0.5 shrink-0 ${!isEmployerVisible ? 'text-[#102B4E]' : 'text-[#94A3B8]'}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0F172A]">
                Private (Applications Only)
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                Hidden from recruiter search; only shared when you apply for a job.
              </p>
            </div>
          </button>
        </div>

        <div className="pt-3 border-t border-[#EEF2F6] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#0F172A]">Open to Opportunities</p>
            <p className="text-[11px] text-[#64748B]">
              {profile.availableForOpportunities
                ? `Active · ${profile.availability || 'Immediate'} availability`
                : 'Paused from active outreach'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(profile.availableForOpportunities)}
            onClick={() => onToggleOpportunities(!profile.availableForOpportunities)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
              profile.availableForOpportunities ? 'bg-[#102B4E]' : 'bg-[#CBD5E1]'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform mt-0.5 ${
                profile.availableForOpportunities ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
};
