import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ShieldCheck, Clock, FileCheck2 } from 'lucide-react';
import { CareerAssessmentRecord } from '../../../types/careerAssessment';
import { PRACTICAL_KNOWLEDGE_QUESTIONS, SKILL_EVALUATION_ITEMS } from '../../../services/careerAssessmentEngine';
import { EASE_PREMIUM } from '../../../lib/motion';

interface AssessmentIntroViewProps {
  isAuthenticated: boolean;
  candidateName?: string | null;
  activeDraft: CareerAssessmentRecord | null;
  latestSubmitted: CareerAssessmentRecord | null;
  onStartNew: () => void;
  onResumeDraft: () => void;
  onViewLastReport: () => void;
  onBackToLearn: () => void;
  onNavigateLogin: () => void;
}

const SECTION_OVERVIEW = [
  { code: 'A', label: 'Basic Information', count: '5 fields' },
  { code: 'B', label: 'Education', count: '4 questions' },
  { code: 'C', label: 'Professional Experience', count: '5 questions' },
  { code: 'D', label: 'Career Preferences', count: '4 questions' },
  { code: 'E', label: 'Skills Evaluation', count: `${SKILL_EVALUATION_ITEMS.length} skills` },
  {
    code: 'F',
    label: 'Practical Knowledge Assessment',
    count: `${PRACTICAL_KNOWLEDGE_QUESTIONS.length} scenarios`,
  },
];

export const AssessmentIntroView: React.FC<AssessmentIntroViewProps> = ({
  isAuthenticated,
  candidateName,
  activeDraft,
  latestSubmitted,
  onStartNew,
  onResumeDraft,
  onViewLastReport,
  onBackToLearn,
  onNavigateLogin,
}) => {
  const totalQuestions = 5 + 4 + 5 + 4 + SKILL_EVALUATION_ITEMS.length + PRACTICAL_KNOWLEDGE_QUESTIONS.length;
  const draftStepPercent = activeDraft
    ? Math.min(95, Math.max(12, Math.round(((activeDraft.currentStep + 1) / 6) * 100)))
    : 0;

  return (
    <div className="min-h-[75vh] bg-[#F6F8FB] py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={onBackToLearn}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#566479] hover:text-[#102B4E] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Learn with ABHI</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_PREMIUM }}
          className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-10 lg:p-12 space-y-8"
        >
          {/* Header & Intro Copy */}
          <div className="space-y-4">
            <p className="text-xs sm:text-sm font-medium text-[#778397]">
              <span className="font-semibold text-[#102B4E]">Learn with ABHI</span>
              <span aria-hidden="true"> · </span>
              <span className="text-[#F47A24] font-semibold">Job Seeker Profile Evaluation Test</span>
            </p>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#102B4E] tracking-tight leading-tight [text-wrap:balance]">
              Let&apos;s Understand Your Career Profile
            </h1>

            <p className="text-sm sm:text-base text-[#566479] leading-relaxed max-w-2xl">
              Answer a few questions about your education, experience, skills and career goals. We&apos;ll use your answers to understand your current profile and recommend useful courses to help you grow.
            </p>
          </div>

          {/* Key Metadata Row (Unboxed Editorial Metrics) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-[#E5EAF0]">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#778397]">
                <Clock className="w-3.5 h-3.5 text-[#F47A24]" />
                <span>Estimated Completion Time</span>
              </div>
              <p className="font-display text-lg font-bold text-[#102B4E] tabular-nums">
                5–8 minutes
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#778397]">
                <FileCheck2 className="w-3.5 h-3.5 text-[#F47A24]" />
                <span>Number of Questions</span>
              </div>
              <p className="font-display text-lg font-bold text-[#102B4E] tabular-nums">
                {totalQuestions} items · 6 sections
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#778397]">
                <span>Your Progress</span>
                <span className="text-[#102B4E] tabular-nums">
                  {activeDraft ? `${draftStepPercent}% saved` : latestSubmitted ? 'Completed' : '0%'}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#EDF2F7] overflow-hidden">
                <div
                  style={{
                    width: activeDraft
                      ? `${draftStepPercent}%`
                      : latestSubmitted
                      ? '100%'
                      : '0%',
                  }}
                  className="h-full rounded-full bg-[#F47A24] transition-all duration-300"
                />
              </div>
              <p className="text-[11px] text-[#778397]">
                {activeDraft
                  ? `Draft saved on Section ${SECTION_OVERVIEW[Math.min(activeDraft.currentStep, 5)].code}`
                  : 'Progress saves automatically at every step'}
              </p>
            </div>
          </div>

          {/* Clean 6-Section Outline */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#778397]">
              What This Evaluation Covers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5">
              {SECTION_OVERVIEW.map((sec) => (
                <div key={sec.code} className="flex items-baseline gap-2.5 text-sm">
                  <span className="font-display text-xs font-bold text-[#F47A24] shrink-0">
                    {sec.code}.
                  </span>
                  <div className="min-w-0">
                    <span className="font-semibold text-[#102B4E]">{sec.label}</span>
                    <span className="text-xs text-[#778397]"> · {sec.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account & Privacy Assurance */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#102B4E]">
              <ShieldCheck className="w-4 h-4 text-[#F47A24] shrink-0" />
              <span>Your Privacy &amp; Fair Evaluation Commitment</span>
            </div>
            <p className="text-xs sm:text-sm text-[#566479] leading-relaxed">
              Your assessment answers are private to your account
              {candidateName ? ` (${candidateName})` : ''} and are never exposed to other candidates. We use your responses to recommend learning content, ask for explicit optional consent before any recruitment review, and{' '}
              <strong className="text-[#102B4E]">
                never automatically reject or rank candidates
              </strong>{' '}
              based on this assessment.
            </p>
            {!isAuthenticated && (
              <p className="text-xs text-[#102B4E] pt-1">
                Sign in with your existing ABHI JOBS account to sync your draft and save your Career Readiness Report permanently across devices.{' '}
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="font-bold text-[#F47A24] hover:underline cursor-pointer"
                >
                  Sign in now
                </button>
              </p>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
            {activeDraft ? (
              <>
                <button
                  type="button"
                  onClick={onResumeDraft}
                  className="min-h-[48px] px-7 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <span>Resume Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onStartNew}
                  className="min-h-[48px] px-6 py-3 rounded-xl border border-[#D4DCE6] hover:border-[#102B4E] text-[#102B4E] text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
                >
                  Start Fresh
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onStartNew}
                className="min-h-[48px] px-8 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
              >
                <span>Start Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {latestSubmitted?.report && (
              <button
                type="button"
                onClick={onViewLastReport}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
              >
                View Saved Readiness Report
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AssessmentIntroView;
