import React from 'react';
import { motion } from 'motion/react';
import { Check, CheckCircle2, XCircle, Ban, Clock } from 'lucide-react';
import { ApplicationStatus, ApplicationTimelineEvent } from '../../types';
import { EASE_PREMIUM } from '../../lib/motion';

export type NormalizedStage =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'selected'
  | 'not_selected'
  | 'withdrawn';

export function normalizeApplicationStatus(status: ApplicationStatus | string): NormalizedStage {
  const norm = (status || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (norm === 'under_review' || norm === 'review' || norm === 'in_review') return 'under_review';
  if (norm === 'shortlisted') return 'shortlisted';
  if (norm === 'interview' || norm === 'interview_scheduled') return 'interview_scheduled';
  if (norm === 'selected' || norm === 'hired' || norm === 'offered') return 'selected';
  if (norm === 'rejected' || norm === 'not_selected' || norm === 'declined' || norm === 'archived') {
    return 'not_selected';
  }
  if (norm === 'withdrawn') return 'withdrawn';
  return 'applied';
}

const PROGRESSION_STAGES: Array<{
  key: 'applied' | 'under_review' | 'shortlisted' | 'interview_scheduled';
  label: string;
  shortLabel: string;
}> = [
  { key: 'applied', label: 'Application Submitted', shortLabel: 'Submitted' },
  { key: 'under_review', label: 'Under Review', shortLabel: 'Review' },
  { key: 'shortlisted', label: 'Shortlisted', shortLabel: 'Shortlisted' },
  { key: 'interview_scheduled', label: 'Interview Scheduled', shortLabel: 'Interview' },
];

const STAGE_ORDER: Record<'applied' | 'under_review' | 'shortlisted' | 'interview_scheduled', number> = {
  applied: 0,
  under_review: 1,
  shortlisted: 2,
  interview_scheduled: 3,
};

interface ApplicationProgressTrackerProps {
  status: ApplicationStatus | string;
  timeline?: ApplicationTimelineEvent[];
  compact?: boolean;
}

/**
 * Purposeful visual progress tracker built strictly from authorized application
 * status and recorded history. Never auto-advances stages; represents Selected,
 * Not Selected, and Withdrawn as explicit Final Decision outcomes.
 */
export const ApplicationProgressTracker: React.FC<ApplicationProgressTrackerProps> = ({
  status,
  timeline = [],
  compact = false,
}) => {
  const currentStage = normalizeApplicationStatus(status);
  const isFinalOutcome =
    currentStage === 'selected' ||
    currentStage === 'not_selected' ||
    currentStage === 'withdrawn';

  // Determine which progression stages were actually reached based on real status + timeline
  const recordedStages = new Set<NormalizedStage>(['applied']);
  timeline.forEach((event) => {
    recordedStages.add(normalizeApplicationStatus(event.status));
  });
  recordedStages.add(currentStage);

  let highestProgressIndex = 0;

  if (!isFinalOutcome) {
    // Active stage in pipeline — reflect exact authorized stage index
    highestProgressIndex = STAGE_ORDER[currentStage];
  } else {
    // Final outcome: only mark progression stages that actually appeared in history
    // (or if selected with minimal history, mark up to highest recorded stage)
    let maxFromHistory = 0;
    PROGRESSION_STAGES.forEach((stage, idx) => {
      if (recordedStages.has(stage.key) && idx > maxFromHistory) {
        maxFromHistory = idx;
      }
    });
    highestProgressIndex = maxFromHistory;
  }

  // Build visual step states for the 4 pipeline stages
  const getStepState = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (isFinalOutcome) {
      return index <= highestProgressIndex ? 'completed' : 'upcoming';
    }
    if (index < highestProgressIndex) return 'completed';
    if (index === highestProgressIndex) return 'current';
    return 'upcoming';
  };

  // Connector progress percentage across the 5-node track (4 stages + Final Decision)
  const totalSegments = 4; // 4 connectors between 5 nodes
  const completedSegments = isFinalOutcome
    ? currentStage === 'selected'
      ? 4
      : Math.min(4, highestProgressIndex + 1)
    : highestProgressIndex;
  const fillPercent = Math.round((completedSegments / totalSegments) * 100);

  // Final decision visual presentation
  const finalDecisionConfig = (() => {
    if (currentStage === 'selected') {
      return {
        label: 'Selected',
        shortLabel: 'Selected',
        badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        nodeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-xs',
        icon: CheckCircle2,
      };
    }
    if (currentStage === 'not_selected') {
      return {
        label: 'Not Selected',
        shortLabel: 'Not Selected',
        badgeClass: 'bg-slate-100 border-slate-200 text-slate-600',
        nodeClass: 'bg-slate-500 border-slate-500 text-white',
        icon: XCircle,
      };
    }
    if (currentStage === 'withdrawn') {
      return {
        label: 'Withdrawn',
        shortLabel: 'Withdrawn',
        badgeClass: 'bg-slate-100 border-slate-200 text-slate-600',
        nodeClass: 'bg-slate-400 border-slate-400 text-white',
        icon: Ban,
      };
    }
    return {
      label: 'Final Decision',
      shortLabel: 'Decision',
      badgeClass: 'bg-slate-50 border-slate-200 text-slate-400',
      nodeClass: 'bg-white border-slate-200 text-slate-300',
      icon: Clock,
    };
  })();

  const FinalIcon = finalDecisionConfig.icon;
  const currentStageLabel = isFinalOutcome
    ? `Final Decision: ${finalDecisionConfig.label}`
    : PROGRESSION_STAGES[highestProgressIndex].label;

  return (
    <div
      className={compact ? 'space-y-2.5' : 'space-y-3.5'}
      aria-label={`Application progress: ${currentStageLabel}`}
    >
      {/* Mobile-friendly compact summary header (visible on small screens) */}
      <div className="flex sm:hidden items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-[#102B4E] truncate">{currentStageLabel}</span>
        {isFinalOutcome ? (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${finalDecisionConfig.badgeClass}`}
          >
            <FinalIcon className="w-3 h-3" />
            <span>{finalDecisionConfig.label}</span>
          </span>
        ) : (
          <span className="text-[11px] font-medium text-[#778397] shrink-0">
            Stage {highestProgressIndex + 1} of 4
          </span>
        )}
      </div>

      {/* Mobile segmented progress bar */}
      <div className="sm:hidden flex items-center gap-1.5">
        {PROGRESSION_STAGES.map((stage, idx) => {
          const state = getStepState(idx);
          const barColor =
            state === 'completed'
              ? 'bg-[#102B4E]'
              : state === 'current'
              ? 'bg-[#F47A24]'
              : 'bg-[#E5EAF0]';
          return (
            <div
              key={stage.key}
              className="flex-1 h-1.5 rounded-full bg-[#E5EAF0] overflow-hidden"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: state === 'upcoming' ? 0 : 1 }}
                transition={{ duration: 0.45, ease: EASE_PREMIUM, delay: idx * 0.05 }}
                style={{ transformOrigin: 'left center' }}
                className={`h-full w-full rounded-full ${barColor}`}
              />
            </div>
          );
        })}
        {/* Final decision segment */}
        <div className="flex-1 h-1.5 rounded-full bg-[#E5EAF0] overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isFinalOutcome ? 1 : 0 }}
            transition={{ duration: 0.45, ease: EASE_PREMIUM, delay: 0.22 }}
            style={{ transformOrigin: 'left center' }}
            className={`h-full w-full rounded-full ${
              currentStage === 'selected'
                ? 'bg-emerald-600'
                : isFinalOutcome
                ? 'bg-slate-400'
                : 'bg-[#E5EAF0]'
            }`}
          />
        </div>
      </div>

      {/* Tablet & Desktop 5-step horizontal visual timeline */}
      <div className="hidden sm:block relative pt-1">
        {/* Background track */}
        <div
          className="absolute top-[15px] left-[8%] right-[8%] h-0.5 bg-[#E5EAF0] rounded-full"
          aria-hidden="true"
        />

        {/* Animated active fill track */}
        <div
          className="absolute top-[15px] left-[8%] right-[8%] h-0.5 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 0.55, ease: EASE_PREMIUM }}
            className={`h-full rounded-full ${
              currentStage === 'selected'
                ? 'bg-emerald-600'
                : currentStage === 'not_selected' || currentStage === 'withdrawn'
                ? 'bg-slate-400'
                : 'bg-gradient-to-r from-[#102B4E] to-[#F47A24]'
            }`}
          />
        </div>

        {/* 5 Nodes: 4 Pipeline Stages + 1 Final Decision Outcome */}
        <ol className="relative grid grid-cols-5 gap-1">
          {PROGRESSION_STAGES.map((stage, idx) => {
            const state = getStepState(idx);
            const isCompleted = state === 'completed';
            const isCurrent = state === 'current';

            return (
              <li key={stage.key} className="flex flex-col items-center text-center min-w-0">
                <motion.div
                  initial={{ scale: 0.88, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05, ease: EASE_PREMIUM }}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isCompleted
                      ? 'bg-[#102B4E] border-[#102B4E] text-white'
                      : isCurrent
                      ? 'bg-[#F47A24] border-[#F47A24] text-white ring-4 ring-[#F47A24]/15'
                      : 'bg-white border-[#D6DEE8] text-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  )}
                </motion.div>

                <span
                  className={`mt-2 text-[11px] leading-tight px-0.5 ${
                    isCurrent
                      ? 'font-bold text-[#102B4E]'
                      : isCompleted
                      ? 'font-semibold text-[#253449]'
                      : 'font-medium text-[#94A3B8]'
                  }`}
                >
                  {compact ? stage.shortLabel : stage.label}
                </span>
              </li>
            );
          })}

          {/* 5th Node: Final Decision Outcome */}
          <li className="flex flex-col items-center text-center min-w-0">
            <motion.div
              initial={{ scale: 0.88, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.22, ease: EASE_PREMIUM }}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                finalDecisionConfig.nodeClass
              } ${
                currentStage === 'selected'
                  ? 'ring-4 ring-emerald-500/15'
                  : isFinalOutcome
                  ? 'ring-4 ring-slate-200/70'
                  : ''
              }`}
            >
              {isFinalOutcome ? (
                <FinalIcon className="w-3.5 h-3.5" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              )}
            </motion.div>

            <span
              className={`mt-2 text-[11px] leading-tight px-1 ${
                currentStage === 'selected'
                  ? 'font-bold text-emerald-700'
                  : isFinalOutcome
                  ? 'font-bold text-slate-600'
                  : 'font-medium text-[#94A3B8]'
              }`}
            >
              {isFinalOutcome
                ? compact
                  ? finalDecisionConfig.shortLabel
                  : finalDecisionConfig.label
                : compact
                ? 'Decision'
                : 'Final Decision'}
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default ApplicationProgressTracker;
