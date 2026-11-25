import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  AssessmentAttemptRecord,
  AssessmentSummaryItem,
  StartedAssessmentSession,
} from '../../types/learning';
import {
  startAssessmentSession,
  submitAssessmentSession,
} from '../../services/assessmentService';
import { EASE_PREMIUM } from '../../lib/motion';

interface CourseAssessmentRunnerProps {
  assessment: AssessmentSummaryItem;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  pastAttempts: AssessmentAttemptRecord[];
  onAttemptCompleted: (attempt: AssessmentAttemptRecord) => Promise<void> | void;
  onContinueAfterPass?: () => void;
  continueLabel?: string;
  onBackToLesson?: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const CourseAssessmentRunner: React.FC<CourseAssessmentRunnerProps> = ({
  assessment,
  candidateId,
  candidateName,
  candidateEmail,
  pastAttempts,
  onAttemptCompleted,
  onContinueAfterPass,
  continueLabel = 'Continue Course',
  onBackToLesson,
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'results'>('intro');
  const [session, setSession] = useState<StartedAssessmentSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [latestResult, setLatestResult] = useState<AssessmentAttemptRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFinal = assessment.assessmentType === 'final_assessment';

  const bestPastAttempt = useMemo(() => {
    if (pastAttempts.length === 0) return null;
    return pastAttempts.reduce((best, cur) =>
      cur.scorePercent > best.scorePercent ? cur : best
    );
  }, [pastAttempts]);

  const hasPassedPreviously = useMemo(
    () => pastAttempts.some((a) => a.passed),
    [pastAttempts]
  );

  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return session.questions.filter((q) => typeof answers[q.id] === 'number').length;
  }, [session, answers]);

  const allAnswered = Boolean(
    session && session.questions.length > 0 && answeredCount === session.questions.length
  );

  const handleStart = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const started = await startAssessmentSession({
        courseId: assessment.courseId,
        assessmentType: assessment.assessmentType,
        moduleId: assessment.moduleId,
        candidateId,
        candidateName,
        candidateEmail,
      });
      setSession(started);
      setAnswers({});
      setLatestResult(null);
      setPhase('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load assessment questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!allAnswered) {
      setErrorMsg(
        `Please answer all ${session.questions.length} questions before submitting (${session.questions.length - answeredCount} remaining).`
      );
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const { attempt } = await submitAssessmentSession({
        sessionId: session.sessionId,
        answers,
        appUserId: candidateId,
      });
      setLatestResult(attempt);
      setPhase('results');
      await onAttemptCompleted(attempt);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not submit your answers. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      key={`${assessment.id}-${phase}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE_PREMIUM }}
      className="space-y-6"
    >
      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs sm:text-sm text-red-900 flex items-start gap-2.5"
        >
          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PHASE 1: ASSESSMENT INTRO / OVERVIEW */}
      {phase === 'intro' && (
        <section className="bg-white rounded-xl border border-[#E5EAF0] p-5 sm:p-6 space-y-6">
          <div className="space-y-2.5 border-b border-[#E5EAF0] pb-5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#778397] tabular-nums">
              <span className="font-semibold text-[#F47A24] inline-flex items-center gap-1.5">
                {isFinal ? (
                  <Award className="w-4 h-4" />
                ) : (
                  <ClipboardCheck className="w-4 h-4" />
                )}
                <span>{isFinal ? 'Final Course Assessment' : 'Module Quiz'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{assessment.questionCount} questions</span>
              <span aria-hidden="true">·</span>
              <span>Passing score: {assessment.passPercentage}%</span>
              <span aria-hidden="true">·</span>
              <span>Retakes allowed</span>
            </div>

            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#102B4E] leading-tight [text-wrap:balance]">
              {assessment.title}
            </h1>

            <p className="text-sm sm:text-[15px] text-[#566479] leading-[1.65] max-w-[68ch]">
              {assessment.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <h2 className="font-display text-sm sm:text-base font-bold text-[#102B4E]">
                Assessment Rules
              </h2>
              <ul className="space-y-2 text-sm text-[#253449]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#F47A24] shrink-0 mt-0.5" />
                  <span>
                    One correct answer per multiple-choice question.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#F47A24] shrink-0 mt-0.5" />
                  <span>
                    Score at least{' '}
                    <strong className="font-semibold text-[#102B4E] tabular-nums">
                      {assessment.passPercentage}%
                    </strong>{' '}
                    to pass{assessment.requiredForCompletion ? ' and satisfy course completion requirements' : ''}.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#102B4E] shrink-0 mt-0.5" />
                  <span>
                    Answers are verified securely after submission, with detailed explanations shown immediately.
                  </span>
                </li>
                {assessment.randomizeOrder && (
                  <li className="flex items-start gap-2.5">
                    <RefreshCw className="w-4 h-4 text-[#566479] shrink-0 mt-0.5" />
                    <span>
                      Questions appear in randomized order on every attempt.
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Prior Attempt Summary */}
            <div className="rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] p-5 space-y-3">
              <h2 className="font-display text-sm sm:text-base font-bold text-[#102B4E]">
                Your Attempt Summary
              </h2>
              {bestPastAttempt ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
                    {hasPassedPreviously ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Passed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                        <XCircle className="w-4 h-4" />
                        <span>Not yet passed</span>
                      </span>
                    )}
                    <span aria-hidden="true" className="text-[#9AA6B8]">·</span>
                    <span className="text-[#566479] tabular-nums">
                      Best score: <strong className="text-[#102B4E]">{bestPastAttempt.scorePercent}%</strong>
                    </span>
                    <span aria-hidden="true" className="text-[#9AA6B8]">·</span>
                    <span className="text-[#566479] tabular-nums">
                      {pastAttempts.length} {pastAttempts.length === 1 ? 'attempt' : 'attempts'}
                    </span>
                  </div>
                  <p className="text-xs text-[#778397]">
                    Latest attempt ({new Date(pastAttempts[0].submittedAt).toLocaleDateString()}):{' '}
                    <span className="font-semibold text-[#253449] tabular-nums">
                      {pastAttempts[0].correctAnswers}/{pastAttempts[0].totalQuestions} correct (
                      {pastAttempts[0].scorePercent}%)
                    </span>
                  </p>
                  {pastAttempts[0].questionResults && pastAttempts[0].questionResults.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLatestResult(pastAttempts[0]);
                        setPhase('results');
                      }}
                      className="text-xs font-semibold text-[#102B4E] hover:text-[#F47A24] underline underline-offset-4 cursor-pointer"
                    >
                      Review your latest attempt explanations
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#566479] leading-relaxed">
                  You have not attempted this {isFinal ? 'final assessment' : 'module quiz'} yet.
                  Take your time and answer every question carefully.
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5EAF0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {onBackToLesson ? (
              <button
                type="button"
                onClick={onBackToLesson}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E] text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Review Lessons</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              disabled={isLoading}
              onClick={() => void handleStart()}
              className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Questions...</span>
                </>
              ) : (
                <>
                  <span>
                    {pastAttempts.length > 0
                      ? isFinal
                        ? 'Retake Final Assessment'
                        : 'Retake Module Quiz'
                      : isFinal
                      ? 'Start Final Assessment'
                      : 'Start Module Quiz'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* PHASE 2: ACTIVE QUESTIONNAIRE */}
      {phase === 'active' && session && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sticky Header Bar */}
          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-semibold text-[#F47A24]">
                  {isFinal ? 'Final Course Assessment' : 'Module Quiz'} · Pass Mark {session.passPercentage}%
                </p>
                <h1 className="font-display text-lg sm:text-2xl font-extrabold text-[#102B4E]">
                  {session.title}
                </h1>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#102B4E] tabular-nums shrink-0">
                Answered {answeredCount} of {session.totalQuestions}
              </div>
            </div>
            <div
              className="h-1.5 w-full rounded-full bg-[#E8EEF5] overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round((answeredCount / Math.max(1, session.totalQuestions)) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Questions answered"
            >
              <div
                className="h-full bg-[#F47A24] rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((answeredCount / Math.max(1, session.totalQuestions)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Question Cards */}
          <div className="space-y-5">
            {session.questions.map((q, qIndex) => {
              const selectedIdx = answers[q.id];
              return (
                <fieldset
                  key={q.id}
                  className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-7 space-y-4"
                >
                  <legend className="sr-only">
                    Question {qIndex + 1}: {q.prompt}
                  </legend>
                  <div className="flex items-start gap-3">
                    <span className="font-display text-xs sm:text-sm font-bold text-[#F47A24] tabular-nums pt-0.5 shrink-0">
                      Q{qIndex + 1}
                    </span>
                    <p className="text-[15px] sm:text-base font-bold text-[#102B4E] leading-snug">
                      {q.prompt}
                    </p>
                  </div>

                  <div className="space-y-2.5 pl-0 sm:pl-7">
                    {q.options.map((optText, optIndex) => {
                      const isSelected = selectedIdx === optIndex;
                      const inputId = `${q.id}_opt_${optIndex}`;
                      return (
                        <label
                          key={inputId}
                          htmlFor={inputId}
                          className={`min-h-[48px] px-4 py-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#102B4E] border-[#102B4E] text-white'
                              : 'bg-[#FAFBFD] border-[#E5EAF0] text-[#253449] hover:border-[#102B4E]/50 hover:bg-white'
                          }`}
                        >
                          <input
                            id={inputId}
                            type="radio"
                            name={`question_${q.id}`}
                            value={optIndex}
                            checked={isSelected}
                            onChange={() => handleSelectOption(q.id, optIndex)}
                            className="sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border ${
                              isSelected
                                ? 'bg-[#F47A24] border-[#F47A24] text-white'
                                : 'bg-white border-[#CBD5E1] text-[#566479]'
                            }`}
                          >
                            {OPTION_LETTERS[optIndex]}
                          </span>
                          <span className="text-sm leading-relaxed">{optText}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>

          {/* Submit Bar */}
          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-[#566479] tabular-nums">
              {allAnswered
                ? `All ${session.totalQuestions} questions answered. Submit to see your verified score and explanations.`
                : `${session.totalQuestions - answeredCount} ${
                    session.totalQuestions - answeredCount === 1 ? 'question' : 'questions'
                  } remaining before submission.`}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPhase('intro');
                  setErrorMsg(null);
                }}
                disabled={isSubmitting}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E] text-sm font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !allAnswered}
                className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Grading Answers...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answers</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* PHASE 3: ASSESSMENT RESULTS & POST-SUBMISSION EXPLANATIONS */}
      {phase === 'results' && latestResult && (
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 space-y-6">
            {/* Explicit Pass / Fail Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E5EAF0] pb-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  {latestResult.passed ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Passed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-bold text-red-700">
                      <XCircle className="w-4 h-4" />
                      <span>Not Passed</span>
                    </span>
                  )}
                  <span aria-hidden="true" className="text-[#9AA6B8]">·</span>
                  <span className="text-[#566479] tabular-nums">
                    Attempt #{latestResult.attemptNumber}
                  </span>
                  <span aria-hidden="true" className="text-[#9AA6B8]">·</span>
                  <span className="text-[#566479] tabular-nums">
                    Required: {latestResult.passPercentage}%
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#102B4E]">
                  {latestResult.passed
                    ? isFinal
                      ? 'Final Assessment Passed'
                      : 'Module Quiz Passed'
                    : 'Review & Try Again'}
                </h1>

                <p className="text-sm text-[#566479] max-w-[64ch] leading-relaxed">
                  {latestResult.passed
                    ? isFinal
                      ? `You scored ${latestResult.scorePercent}% (${latestResult.correctAnswers}/${latestResult.totalQuestions}) on ${latestResult.assessmentTitle}. Your verified result has been saved to your ABHI JOBS profile.`
                      : `You scored ${latestResult.scorePercent}% (${latestResult.correctAnswers}/${latestResult.totalQuestions}) on ${latestResult.assessmentTitle}. You passed — the next module is now unlocked! Review the explanations below.`
                    : `You scored ${latestResult.scorePercent}% (${latestResult.correctAnswers}/${latestResult.totalQuestions}), which is below the ${latestResult.passPercentage}% passing mark. The next module remains locked — review each explanation below and retake the quiz whenever you are ready.`}
                </p>
              </div>

              <div className="shrink-0 sm:text-right">
                <p className="text-xs font-semibold text-[#778397]">Score</p>
                <p
                  className={`font-display text-4xl sm:text-[36px] font-extrabold tabular-nums ${
                    latestResult.passed ? 'text-emerald-700' : 'text-[#102B4E]'
                  }`}
                >
                  {latestResult.scorePercent}%
                </p>
              </div>
            </div>

            {/* 4 Clean Scorecard Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0]">
                <p className="text-xs text-[#778397]">Total Questions</p>
                <p className="font-display text-xl sm:text-2xl font-extrabold text-[#102B4E] tabular-nums mt-1">
                  {latestResult.totalQuestions}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0]">
                <p className="text-xs text-[#778397]">Correct Answers</p>
                <p className="font-display text-xl sm:text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">
                  {latestResult.correctAnswers}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0]">
                <p className="text-xs text-[#778397]">Incorrect Answers</p>
                <p className="font-display text-xl sm:text-2xl font-extrabold text-red-700 tabular-nums mt-1">
                  {latestResult.incorrectAnswers}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0]">
                <p className="text-xs text-[#778397]">Status</p>
                <p
                  className={`font-display text-lg sm:text-xl font-extrabold mt-1 inline-flex items-center gap-1.5 ${
                    latestResult.passed ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {latestResult.passed ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>Passed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 shrink-0" />
                      <span>Failed</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Action Row */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void handleStart()}
                className={`min-h-[46px] px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-60 ${
                  !latestResult.passed
                    ? 'bg-[#F47A24] hover:bg-[#DE6816] text-white'
                    : 'border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E]'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>{latestResult.passed ? 'Retake Assessment' : 'Retry Assessment'}</span>
              </button>

              {latestResult.passed && onContinueAfterPass && (
                <button
                  type="button"
                  onClick={onContinueAfterPass}
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <span>{continueLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </section>

          {/* Question-by-Question Answer Explanations */}
          {latestResult.questionResults && latestResult.questionResults.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 space-y-5">
              <div className="space-y-1 border-b border-[#E5EAF0] pb-4">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#102B4E]">
                  Answer Review &amp; Explanations
                </h2>
                <p className="text-xs sm:text-sm text-[#778397]">
                  Review each question, your selected answer, and the verified explanation.
                </p>
              </div>

              <div className="divide-y divide-[#E5EAF0]">
                {latestResult.questionResults.map((item, idx) => (
                  <div key={item.questionId} className="py-5 first:pt-1 last:pb-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="font-display text-xs font-bold text-[#F47A24] tabular-nums pt-1 shrink-0">
                          Q{idx + 1}
                        </span>
                        <p className="text-sm sm:text-[15px] font-bold text-[#102B4E] leading-snug">
                          {item.prompt}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold shrink-0 ${
                          item.isCorrect ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {item.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Correct</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>Incorrect</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="space-y-1.5 pl-0 sm:pl-7 text-xs sm:text-sm">
                      <p className="text-[#566479]">
                        <span className="font-semibold text-[#253449]">Your answer: </span>
                        <span className={item.isCorrect ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>
                          {OPTION_LETTERS[item.selectedOptionIndex]}. {item.options[item.selectedOptionIndex]}
                        </span>
                      </p>
                      {!item.isCorrect && (
                        <p className="text-[#566479]">
                          <span className="font-semibold text-[#253449]">Correct answer: </span>
                          <span className="text-emerald-700 font-semibold">
                            {OPTION_LETTERS[item.correctOptionIndex]}. {item.options[item.correctOptionIndex]}
                          </span>
                        </p>
                      )}
                      <p className="text-[#253449] bg-[#FAFBFD] border border-[#E5EAF0] rounded-xl p-3.5 leading-relaxed mt-2">
                        <span className="font-semibold text-[#102B4E]">Explanation: </span>
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default CourseAssessmentRunner;
