import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  CareerAssessmentRecord,
  CareerGoalType,
  SkillEvaluationKey,
  SkillProficiencyLevel,
} from '../../../types/careerAssessment';
import {
  SKILL_EVALUATION_ITEMS,
  SKILL_LEVEL_OPTIONS,
  QUALIFICATION_OPTIONS,
  WORK_EXPERIENCE_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  PREFERRED_INDUSTRY_OPTIONS,
  PRACTICAL_KNOWLEDGE_QUESTIONS,
  createInitialAssessment,
  calculateCareerReadinessReport,
} from '../../../services/careerAssessmentEngine';
import {
  loadCandidateAssessments,
  saveAssessmentDraft,
  submitCareerAssessment,
} from '../../../services/careerAssessmentService';
import { AssessmentIntroView } from './AssessmentIntroView';
import { AssessmentResultsReport } from './AssessmentResultsReport';
import { EASE_PREMIUM } from '../../../lib/motion';

interface ProfileEvaluationTestProps {
  onBackToLearn: () => void;
  onExploreCourses: () => void;
  onNavigateLogin: () => void;
  onNavigateResume: () => void;
  onNavigateJobs: () => void;
}

type TestStage = 'intro' | 'form' | 'report';

const STEPS = [
  { code: 'A', title: 'Basic Information', subtitle: 'Confirm your contact and location details.' },
  { code: 'B', title: 'Education', subtitle: 'Tell us about your academic background.' },
  { code: 'C', title: 'Professional Experience', subtitle: 'Share your current work experience stage.' },
  { code: 'D', title: 'Career Preferences', subtitle: 'Describe the roles and direction you want next.' },
  { code: 'E', title: 'Skills Evaluation', subtitle: 'Rate your current comfort level honestly across 9 areas.' },
  {
    code: 'F',
    title: 'Practical Knowledge Assessment',
    subtitle: 'Answer 10 short workplace scenario questions.',
  },
];

export const ProfileEvaluationTest: React.FC<ProfileEvaluationTestProps> = ({
  onBackToLearn,
  onExploreCourses,
  onNavigateLogin,
  onNavigateResume,
  onNavigateJobs,
}) => {
  const { currentUser, currentCandidate, showToast } = useApp();
  const isAuthenticated = Boolean(currentUser);
  const appUserId = currentUser?.id || 'guest_candidate';
  const candidateName = currentCandidate?.name || currentUser?.name || null;

  const [isLoading, setIsLoading] = useState(true);
  const [stage, setStage] = useState<TestStage>('intro');

  const [activeDraft, setActiveDraft] = useState<CareerAssessmentRecord | null>(null);
  const [latestSubmitted, setLatestSubmitted] = useState<CareerAssessmentRecord | null>(null);
  const [record, setRecord] = useState<CareerAssessmentRecord | null>(null);
  const [step, setStep] = useState<number>(0);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedToCloud, setSavedToCloud] = useState(false);
  const [lastSavedLabel, setLastSavedLabel] = useState<string>('');
  const [customIndustryInput, setCustomIndustryInput] = useState('');

  // Load any saved draft or submitted assessment strictly for this authenticated candidate
  useEffect(() => {
    let mounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const res = await loadCandidateAssessments(appUserId);
        if (!mounted) return;
        setActiveDraft(res.activeDraft);
        setLatestSubmitted(res.latestSubmitted);
        setSavedToCloud(res.syncedFromCloud);
      } catch {
        // Non-blocking fallback
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [appUserId]);

  const handleStartNew = () => {
    const fresh = createInitialAssessment(appUserId, currentUser, currentCandidate);
    setRecord(fresh);
    setStep(0);
    setErrors({});
    setStage('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeDraft = () => {
    if (!activeDraft) {
      handleStartNew();
      return;
    }
    setRecord(activeDraft);
    setStep(Math.min(STEPS.length - 1, Math.max(0, activeDraft.currentStep || 0)));
    setErrors({});
    setStage('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewLastReport = () => {
    if (!latestSubmitted?.report) return;
    setRecord(latestSubmitted);
    setStage('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const persistProgress = useCallback(
    async (nextRecord: CareerAssessmentRecord, nextStepIndex: number, notifyToast = false) => {
      setIsSaving(true);
      try {
        const toSave: CareerAssessmentRecord = {
          ...nextRecord,
          currentStep: nextStepIndex,
        };
        const res = await saveAssessmentDraft(appUserId, toSave);
        setActiveDraft(res.record);
        setRecord(res.record);
        setSavedToCloud(res.savedToCloud);
        setLastSavedLabel('Progress saved');
        if (notifyToast) {
          showToast(
            res.savedToCloud
              ? 'Progress saved to your account — you can resume anytime.'
              : 'Progress saved — you can resume right where you left off.',
            'success'
          );
        }
      } finally {
        setIsSaving(false);
      }
    },
    [appUserId, showToast]
  );

  // Per-section strict validation
  const validateStep = (stepIdx: number, data: CareerAssessmentRecord): Record<string, string> => {
    const nextErrors: Record<string, string> = {};

    if (stepIdx === 0) {
      if (!data.basicInfo.fullName.trim()) nextErrors.fullName = 'Please enter your full name.';
      if (!data.basicInfo.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.basicInfo.email.trim())) {
        nextErrors.email = 'Please enter a valid email address.';
      }
      if (!data.basicInfo.mobileNumber.trim() || data.basicInfo.mobileNumber.replace(/\D/g, '').length < 7) {
        nextErrors.mobileNumber = 'Please enter a valid mobile number.';
      }
      if (!data.basicInfo.currentCity.trim()) nextErrors.currentCity = 'Please enter your current city.';
      if (!data.basicInfo.preferredJobLocation.trim()) {
        nextErrors.preferredJobLocation = 'Please enter your preferred job location.';
      }
    }

    if (stepIdx === 1) {
      if (!data.education.highestQualification.trim()) {
        nextErrors.highestQualification = 'Please select your highest qualification.';
      }
      if (!data.education.fieldOfStudy.trim()) {
        nextErrors.fieldOfStudy = 'Please enter your field of study.';
      }
      if (!data.education.graduationYear.trim()) {
        nextErrors.graduationYear = 'Please enter your graduation or expected graduation year.';
      }
      if (!data.education.currentlyStudying) {
        nextErrors.currentlyStudying = 'Please indicate whether you are currently studying.';
      }
    }

    if (stepIdx === 2) {
      if (!data.experience.experienceType) {
        nextErrors.experienceType = 'Please select whether you are a fresher or experienced.';
      }
      if (!data.experience.totalWorkExperience.trim()) {
        nextErrors.totalWorkExperience = 'Please select your total work experience.';
      }
      if (!data.experience.currentEmploymentStatus.trim()) {
        nextErrors.currentEmploymentStatus = 'Please select your current employment status.';
      }
      if (data.experience.experienceType === 'experienced') {
        if (!data.experience.previousOrCurrentRole.trim()) {
          nextErrors.previousOrCurrentRole = 'Please enter your previous or current job role.';
        }
        if (!data.experience.industryOfExperience.trim()) {
          nextErrors.industryOfExperience = 'Please enter your industry of experience.';
        }
      }
    }

    if (stepIdx === 3) {
      if (!data.careerPreferences.preferredJobRoles.trim()) {
        nextErrors.preferredJobRoles = 'Please specify at least one preferred job role.';
      }
      if (data.careerPreferences.preferredIndustries.length === 0) {
        nextErrors.preferredIndustries = 'Please choose at least one preferred industry.';
      }
      if (!data.careerPreferences.careerObjective.trim()) {
        nextErrors.careerObjective = 'Please share a brief career objective.';
      }
      if (!data.careerPreferences.careerGoal) {
        nextErrors.careerGoal = 'Please choose what best matches your current goal.';
      }
    }

    if (stepIdx === 4) {
      const missingSkills = SKILL_EVALUATION_ITEMS.filter(
        (item) => !data.skillsEvaluation[item.key]
      );
      if (missingSkills.length > 0) {
        nextErrors.skillsEvaluation = `Please evaluate all 9 skills before continuing (${missingSkills.length} remaining).`;
      }
    }

    if (stepIdx === 5) {
      const unanswered = PRACTICAL_KNOWLEDGE_QUESTIONS.filter(
        (q) => !data.practicalAnswers[q.id]
      );
      if (unanswered.length > 0) {
        nextErrors.practicalAnswers = `Please answer all ${PRACTICAL_KNOWLEDGE_QUESTIONS.length} practical questions (${unanswered.length} remaining).`;
      }
      if (!data.learningRecommendationConsent) {
        nextErrors.learningRecommendationConsent =
          'Please confirm consent to generate your personalized course recommendations.';
      }
    }

    return nextErrors;
  };

  const handleContinue = async () => {
    if (!record) return;
    const validationErrors = validateStep(step, record);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please complete the required fields in this section.', 'warning');
      return;
    }

    setErrors({});
    const nextStep = step + 1;
    if (nextStep < STEPS.length) {
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await persistProgress(record, nextStep, false);
    }
  };

  const handlePrevious = async () => {
    if (!record || step === 0) return;
    setErrors({});
    const prevStep = step - 1;
    setStep(prevStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await persistProgress(record, prevStep, false);
  };

  const handleSubmit = async () => {
    if (!record) return;
    const validationErrors = validateStep(5, record);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please answer all practical questions and confirm learning consent.', 'warning');
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const report = calculateCareerReadinessReport(record);
      const finalized: CareerAssessmentRecord = {
        ...record,
        status: 'submitted',
        currentStep: STEPS.length,
        report,
      };
      const result = await submitCareerAssessment(appUserId, finalized);
      if (result.success) {
        setRecord(result.record);
        setLatestSubmitted(result.record);
        setActiveDraft(null);
        setSavedToCloud(result.savedToCloud);
        setStage('report');
        showToast('Your Career Readiness Report is ready.', 'success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showToast(result.error || 'Could not submit assessment. Please retry.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePreferredIndustry = (industry: string) => {
    if (!record) return;
    const exists = record.careerPreferences.preferredIndustries.includes(industry);
    const next = exists
      ? record.careerPreferences.preferredIndustries.filter((i) => i !== industry)
      : [...record.careerPreferences.preferredIndustries, industry].slice(0, 10);
    setRecord({
      ...record,
      careerPreferences: {
        ...record.careerPreferences,
        preferredIndustries: next,
      },
    });
    setErrors((prev) => ({ ...prev, preferredIndustries: '' }));
  };

  const handleAddCustomIndustry = () => {
    const val = customIndustryInput.trim();
    if (!val || !record) return;
    if (!record.careerPreferences.preferredIndustries.includes(val)) {
      setRecord({
        ...record,
        careerPreferences: {
          ...record.careerPreferences,
          preferredIndustries: [...record.careerPreferences.preferredIndustries, val].slice(0, 10),
        },
      });
    }
    setCustomIndustryInput('');
    setErrors((prev) => ({ ...prev, preferredIndustries: '' }));
  };

  if (isLoading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center bg-[#F6F8FB] p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-7 h-7 text-[#F47A24] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#102B4E]">
            Loading your career evaluation...
          </p>
        </div>
      </div>
    );
  }

  if (stage === 'intro') {
    return (
      <AssessmentIntroView
        isAuthenticated={isAuthenticated}
        candidateName={candidateName}
        activeDraft={activeDraft}
        latestSubmitted={latestSubmitted}
        onStartNew={handleStartNew}
        onResumeDraft={handleResumeDraft}
        onViewLastReport={handleViewLastReport}
        onBackToLearn={onBackToLearn}
        onNavigateLogin={onNavigateLogin}
      />
    );
  }

  if (stage === 'report' && record?.report) {
    return (
      <AssessmentResultsReport
        record={record}
        savedToCloud={savedToCloud}
        onRetakeAssessment={handleStartNew}
        onExploreCourses={onExploreCourses}
        onNavigateResume={onNavigateResume}
        onNavigateJobs={onNavigateJobs}
        onBackToLearn={onBackToLearn}
      />
    );
  }

  if (!record) return null;

  const progressPercent = Math.round(((step + 1) / STEPS.length) * 100);
  const currentStepMeta = STEPS[step];
  const answeredPracticalCount = PRACTICAL_KNOWLEDGE_QUESTIONS.filter(
    (q) => Boolean(record.practicalAnswers[q.id])
  ).length;
  const ratedSkillCount = SKILL_EVALUATION_ITEMS.filter(
    (item) => Boolean(record.skillsEvaluation[item.key])
  ).length;

  return (
    <div className="min-h-screen bg-[#F6F8FB] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Navigation & Save Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={async () => {
              await persistProgress(record, step, false);
              setStage('intro');
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#566479] hover:text-[#102B4E] cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Assessment Overview</span>
          </button>

          <div className="flex items-center gap-3">
            {lastSavedLabel && (
              <span className="text-xs text-[#778397] inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lastSavedLabel}</span>
              </span>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => persistProgress(record, step, true)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-[#D4DCE6] hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-[#F47A24]" />
              )}
              <span>Save &amp; Resume Later</span>
            </button>
          </div>
        </div>

        {/* Progress Header Card */}
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
            <span className="font-semibold text-[#102B4E]">
              Section {currentStepMeta.code} of F · {currentStepMeta.title}
            </span>
            <span className="font-bold text-[#F47A24] tabular-nums">
              {progressPercent}% complete
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-[#EDF2F7] overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full rounded-full bg-[#F47A24] transition-all duration-300"
            />
          </div>

          {/* Step Indicator Row */}
          <div className="grid grid-cols-6 gap-1.5 pt-1">
            {STEPS.map((s, idx) => {
              const isCompleted = idx < step;
              const isCurrent = idx === step;
              return (
                <button
                  key={s.code}
                  type="button"
                  disabled={idx > step}
                  onClick={() => {
                    if (idx < step) {
                      setErrors({});
                      setStep(idx);
                    }
                  }}
                  className={`py-2 px-1.5 rounded-lg text-center text-[11px] font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-[#102B4E] text-white'
                      : isCompleted
                      ? 'bg-[#F6F8FB] text-[#102B4E] hover:bg-[#EDF2F7] cursor-pointer'
                      : 'bg-[#FAFBFD] text-[#94A3B8] cursor-not-allowed'
                  }`}
                >
                  <span className="sm:hidden">{s.code}</span>
                  <span className="hidden sm:inline truncate">
                    {s.code}. {s.title.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE_PREMIUM }}
            className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 lg:p-10 space-y-6"
          >
            <div className="space-y-1.5 pb-4 border-b border-[#E5EAF0]">
              <p className="text-xs font-semibold text-[#F47A24]">
                Section {currentStepMeta.code}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#102B4E]">
                {currentStepMeta.title}
              </h2>
              <p className="text-sm text-[#566479]">{currentStepMeta.subtitle}</p>
            </div>

            {/* SECTION A: BASIC INFORMATION */}
            {step === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={record.basicInfo.fullName}
                    onChange={(e) => {
                      setRecord({
                        ...record,
                        basicInfo: { ...record.basicInfo, fullName: e.target.value },
                      });
                      setErrors((p) => ({ ...p, fullName: '' }));
                    }}
                    placeholder="Enter your full name"
                    className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                  />
                  {errors.fullName && (
                    <p className="text-xs text-rose-600 mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={record.basicInfo.email}
                    onChange={(e) => {
                      setRecord({
                        ...record,
                        basicInfo: { ...record.basicInfo, email: e.target.value },
                      });
                      setErrors((p) => ({ ...p, email: '' }));
                    }}
                    placeholder="you@example.com"
                    className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                  />
                  {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={record.basicInfo.mobileNumber}
                    onChange={(e) => {
                      setRecord({
                        ...record,
                        basicInfo: { ...record.basicInfo, mobileNumber: e.target.value },
                      });
                      setErrors((p) => ({ ...p, mobileNumber: '' }));
                    }}
                    placeholder="+91 98765 43210"
                    className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                  />
                  {errors.mobileNumber && (
                    <p className="text-xs text-rose-600 mt-1">{errors.mobileNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Current City *
                  </label>
                  <input
                    type="text"
                    value={record.basicInfo.currentCity}
                    onChange={(e) => {
                      setRecord({
                        ...record,
                        basicInfo: { ...record.basicInfo, currentCity: e.target.value },
                      });
                      setErrors((p) => ({ ...p, currentCity: '' }));
                    }}
                    placeholder="e.g. Bengaluru, Mumbai, Pune"
                    className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                  />
                  {errors.currentCity && (
                    <p className="text-xs text-rose-600 mt-1">{errors.currentCity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Preferred Job Location *
                  </label>
                  <input
                    type="text"
                    value={record.basicInfo.preferredJobLocation}
                    onChange={(e) => {
                      setRecord({
                        ...record,
                        basicInfo: {
                          ...record.basicInfo,
                          preferredJobLocation: e.target.value,
                        },
                      });
                      setErrors((p) => ({ ...p, preferredJobLocation: '' }));
                    }}
                    placeholder="e.g. Hyderabad, Remote, Any Metro City"
                    className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                  />
                  {errors.preferredJobLocation && (
                    <p className="text-xs text-rose-600 mt-1">{errors.preferredJobLocation}</p>
                  )}
                </div>
              </div>
            )}

            {/* SECTION B: EDUCATION */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Highest Qualification *
                  </label>
                  <select
                    value={record.education.highestQualification}
                    onChange={(e) => {
                      setRecord({
                        ...record,
                        education: { ...record.education, highestQualification: e.target.value },
                      });
                      setErrors((p) => ({ ...p, highestQualification: '' }));
                    }}
                    className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                  >
                    <option value="">Select qualification</option>
                    {QUALIFICATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {errors.highestQualification && (
                    <p className="text-xs text-rose-600 mt-1">{errors.highestQualification}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Field of Study *
                  </label>
                  <input
                    type="text"
                    value={record.education.fieldOfStudy}
                    onChange={(e) => {
                      setRecord({
                        ...record,
                        education: { ...record.education, fieldOfStudy: e.target.value },
                      });
                      setErrors((p) => ({ ...p, fieldOfStudy: '' }));
                    }}
                    placeholder="e.g. Commerce, Computer Science, Mechanical Engineering"
                    className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                  />
                  {errors.fieldOfStudy && (
                    <p className="text-xs text-rose-600 mt-1">{errors.fieldOfStudy}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Graduation Year (or Expected Year) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={record.education.graduationYear}
                    onChange={(e) => {
                      setRecord({
                        ...record,
                        education: {
                          ...record.education,
                          graduationYear: e.target.value.replace(/[^0-9]/g, '').slice(0, 4),
                        },
                      });
                      setErrors((p) => ({ ...p, graduationYear: '' }));
                    }}
                    placeholder="e.g. 2025"
                    className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                  />
                  {errors.graduationYear && (
                    <p className="text-xs text-rose-600 mt-1">{errors.graduationYear}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Are you currently studying? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { value: 'yes', label: 'Yes, currently studying' },
                        { value: 'no', label: 'No, completed' },
                      ] as const
                    ).map((opt) => {
                      const active = record.education.currentlyStudying === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setRecord({
                              ...record,
                              education: { ...record.education, currentlyStudying: opt.value },
                            });
                            setErrors((p) => ({ ...p, currentlyStudying: '' }));
                          }}
                          className={`min-h-[46px] px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#102B4E] text-white border-[#102B4E]'
                              : 'bg-white text-[#253449] border-[#D4DCE6] hover:border-[#102B4E]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.currentlyStudying && (
                    <p className="text-xs text-rose-600 mt-1">{errors.currentlyStudying}</p>
                  )}
                </div>
              </div>
            )}

            {/* SECTION C: PROFESSIONAL EXPERIENCE */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Are you a fresher or experienced professional? *
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    {(
                      [
                        { value: 'fresher', label: 'Fresher' },
                        { value: 'experienced', label: 'Experienced' },
                      ] as const
                    ).map((opt) => {
                      const active = record.experience.experienceType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setRecord({
                              ...record,
                              experience: {
                                ...record.experience,
                                experienceType: opt.value,
                                totalWorkExperience:
                                  opt.value === 'fresher'
                                    ? '0 years (Fresher)'
                                    : record.experience.totalWorkExperience === '0 years (Fresher)'
                                    ? ''
                                    : record.experience.totalWorkExperience,
                              },
                            });
                            setErrors((p) => ({ ...p, experienceType: '' }));
                          }}
                          className={`min-h-[46px] px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#102B4E] text-white border-[#102B4E]'
                              : 'bg-white text-[#253449] border-[#D4DCE6] hover:border-[#102B4E]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.experienceType && (
                    <p className="text-xs text-rose-600 mt-1">{errors.experienceType}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                      Total Work Experience *
                    </label>
                    <select
                      value={record.experience.totalWorkExperience}
                      onChange={(e) => {
                        setRecord({
                          ...record,
                          experience: { ...record.experience, totalWorkExperience: e.target.value },
                        });
                        setErrors((p) => ({ ...p, totalWorkExperience: '' }));
                      }}
                      className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                    >
                      <option value="">Select total experience</option>
                      {WORK_EXPERIENCE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.totalWorkExperience && (
                      <p className="text-xs text-rose-600 mt-1">{errors.totalWorkExperience}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                      Current Employment Status *
                    </label>
                    <select
                      value={record.experience.currentEmploymentStatus}
                      onChange={(e) => {
                        setRecord({
                          ...record,
                          experience: {
                            ...record.experience,
                            currentEmploymentStatus: e.target.value,
                          },
                        });
                        setErrors((p) => ({ ...p, currentEmploymentStatus: '' }));
                      }}
                      className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                    >
                      <option value="">Select employment status</option>
                      {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.currentEmploymentStatus && (
                      <p className="text-xs text-rose-600 mt-1">
                        {errors.currentEmploymentStatus}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                      Previous or Current Job Role{' '}
                      {record.experience.experienceType === 'experienced' ? '*' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      value={record.experience.previousOrCurrentRole}
                      onChange={(e) => {
                        setRecord({
                          ...record,
                          experience: {
                            ...record.experience,
                            previousOrCurrentRole: e.target.value,
                          },
                        });
                        setErrors((p) => ({ ...p, previousOrCurrentRole: '' }));
                      }}
                      placeholder="e.g. Sales Executive, Accounts Associate, Intern"
                      className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                    />
                    {errors.previousOrCurrentRole && (
                      <p className="text-xs text-rose-600 mt-1">{errors.previousOrCurrentRole}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                      Industry of Experience{' '}
                      {record.experience.experienceType === 'experienced' ? '*' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      value={record.experience.industryOfExperience}
                      onChange={(e) => {
                        setRecord({
                          ...record,
                          experience: {
                            ...record.experience,
                            industryOfExperience: e.target.value,
                          },
                        });
                        setErrors((p) => ({ ...p, industryOfExperience: '' }));
                      }}
                      placeholder="e.g. IT Services, Retail, Banking, Logistics"
                      className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                    />
                    {errors.industryOfExperience && (
                      <p className="text-xs text-rose-600 mt-1">{errors.industryOfExperience}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION D: CAREER PREFERENCES */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Are you looking for your first job, a better job, or a career change? *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        {
                          value: 'first_job' as CareerGoalType,
                          label: 'My first job',
                          sub: 'Starting my professional career',
                        },
                        {
                          value: 'better_job' as CareerGoalType,
                          label: 'A better job',
                          sub: 'Growing in my current domain',
                        },
                        {
                          value: 'career_change' as CareerGoalType,
                          label: 'A career change',
                          sub: 'Moving into a new domain or function',
                        },
                      ] as const
                    ).map((opt) => {
                      const active = record.careerPreferences.careerGoal === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setRecord({
                              ...record,
                              careerPreferences: {
                                ...record.careerPreferences,
                                careerGoal: opt.value,
                              },
                            });
                            setErrors((p) => ({ ...p, careerGoal: '' }));
                          }}
                          className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#102B4E] text-white border-[#102B4E]'
                              : 'bg-white text-[#102B4E] border-[#D4DCE6] hover:border-[#102B4E]'
                          }`}
                        >
                          <div className="text-sm font-bold">{opt.label}</div>
                          <div
                            className={`text-xs mt-0.5 ${
                              active ? 'text-slate-300' : 'text-[#778397]'
                            }`}
                          >
                            {opt.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.careerGoal && (
                    <p className="text-xs text-rose-600 mt-1">{errors.careerGoal}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Preferred Job Roles *
                  </label>
                  <input
                    type="text"
                    value={record.careerPreferences.preferredJobRoles}
                    onChange={(e) => {
                      setRecord({
                        ...record,
                        careerPreferences: {
                          ...record.careerPreferences,
                          preferredJobRoles: e.target.value,
                        },
                      });
                      setErrors((p) => ({ ...p, preferredJobRoles: '' }));
                    }}
                    placeholder="e.g. Business Analyst, HR Coordinator, Digital Marketing Executive"
                    className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                  />
                  {errors.preferredJobRoles && (
                    <p className="text-xs text-rose-600 mt-1">{errors.preferredJobRoles}</p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-[#102B4E]">
                    Preferred Industries * (Select one or more)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PREFERRED_INDUSTRY_OPTIONS.map((ind) => {
                      const active = record.careerPreferences.preferredIndustries.includes(ind);
                      return (
                        <button
                          key={ind}
                          type="button"
                          onClick={() => togglePreferredIndustry(ind)}
                          className={`min-h-[40px] px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#102B4E] text-white border-[#102B4E]'
                              : 'bg-white text-[#253449] border-[#D4DCE6] hover:border-[#102B4E]'
                          }`}
                        >
                          {ind}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 pt-1 max-w-md">
                    <input
                      type="text"
                      value={customIndustryInput}
                      onChange={(e) => setCustomIndustryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomIndustry();
                        }
                      }}
                      placeholder="Add another industry..."
                      className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-[#D4DCE6] text-xs text-[#102B4E]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomIndustry}
                      className="min-h-[42px] px-4 py-2 rounded-xl border border-[#102B4E] text-[#102B4E] hover:bg-[#102B4E] hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {errors.preferredIndustries && (
                    <p className="text-xs text-rose-600 mt-1">{errors.preferredIndustries}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Career Objective *
                  </label>
                  <textarea
                    rows={3}
                    value={record.careerPreferences.careerObjective}
                    onChange={(e) => {
                      setRecord({
                        ...record,
                        careerPreferences: {
                          ...record.careerPreferences,
                          careerObjective: e.target.value,
                        },
                      });
                      setErrors((p) => ({ ...p, careerObjective: '' }));
                    }}
                    placeholder="Briefly describe what you want to achieve in the next 1–2 years..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] leading-relaxed focus:outline-none focus:border-[#102B4E]"
                  />
                  {errors.careerObjective && (
                    <p className="text-xs text-rose-600 mt-1">{errors.careerObjective}</p>
                  )}
                </div>
              </div>
            )}

            {/* SECTION E: SKILLS EVALUATION */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#778397]">
                  <span>Select the level that honestly reflects your current ability.</span>
                  <span className="font-semibold text-[#102B4E] tabular-nums">
                    {ratedSkillCount} / {SKILL_EVALUATION_ITEMS.length} rated
                  </span>
                </div>

                {errors.skillsEvaluation && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.skillsEvaluation}</span>
                  </div>
                )}

                <div className="divide-y divide-[#E5EAF0] border-y border-[#E5EAF0]">
                  {SKILL_EVALUATION_ITEMS.map((item) => {
                    const selected = record.skillsEvaluation[item.key];
                    return (
                      <div
                        key={item.key}
                        className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div className="space-y-0.5 max-w-md">
                          <h3 className="text-sm font-bold text-[#102B4E]">{item.label}</h3>
                          <p className="text-xs text-[#778397]">{item.hint}</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                          {SKILL_LEVEL_OPTIONS.map((level: SkillProficiencyLevel) => {
                            const active = selected === level;
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => {
                                  setRecord({
                                    ...record,
                                    skillsEvaluation: {
                                      ...record.skillsEvaluation,
                                      [item.key as SkillEvaluationKey]: level,
                                    },
                                  });
                                  setErrors((p) => ({ ...p, skillsEvaluation: '' }));
                                }}
                                className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-[#102B4E] text-white border-[#102B4E]'
                                    : 'bg-white text-[#253449] border-[#D4DCE6] hover:border-[#102B4E]'
                                }`}
                              >
                                {level}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION F: PRACTICAL KNOWLEDGE ASSESSMENT + CONSENT */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#778397]">
                  <span>Choose the most practical response for each workplace scenario.</span>
                  <span className="font-semibold text-[#102B4E] tabular-nums">
                    {answeredPracticalCount} / {PRACTICAL_KNOWLEDGE_QUESTIONS.length} answered
                  </span>
                </div>

                {errors.practicalAnswers && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.practicalAnswers}</span>
                  </div>
                )}

                <div className="divide-y divide-[#E5EAF0] border-y border-[#E5EAF0]">
                  {PRACTICAL_KNOWLEDGE_QUESTIONS.map((q, idx) => {
                    const selectedOpt = record.practicalAnswers[q.id];
                    return (
                      <div key={q.id} className="py-6 space-y-3.5">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#778397]">
                            <span className="text-[#F47A24] tabular-nums">
                              Question {idx + 1} of {PRACTICAL_KNOWLEDGE_QUESTIONS.length}
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span>{q.domainLabel}</span>
                          </p>
                          <p className="text-xs sm:text-sm text-[#566479] leading-relaxed">
                            {q.scenario}
                          </p>
                          <h3 className="text-sm sm:text-base font-bold text-[#102B4E] leading-snug pt-0.5">
                            {q.question}
                          </h3>
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt) => {
                            const active = selectedOpt === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setRecord({
                                    ...record,
                                    practicalAnswers: {
                                      ...record.practicalAnswers,
                                      [q.id]: opt.id,
                                    },
                                  });
                                  setErrors((p) => ({ ...p, practicalAnswers: '' }));
                                }}
                                className={`w-full min-h-[46px] p-3.5 rounded-xl border text-left text-xs sm:text-sm flex items-start gap-3 transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-[#102B4E] text-white border-[#102B4E]'
                                    : 'bg-white text-[#253449] border-[#D4DCE6] hover:border-[#102B4E]'
                                }`}
                              >
                                <span
                                  className={`font-bold shrink-0 ${
                                    active ? 'text-[#F47A24]' : 'text-[#102B4E]'
                                  }`}
                                >
                                  {opt.id}.
                                </span>
                                <span className="leading-relaxed">{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Data Privacy & Consent Section */}
                <div className="p-5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#102B4E]">
                    <ShieldCheck className="w-4 h-4 text-[#F47A24] shrink-0" />
                    <span>Data Usage &amp; Consent</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#566479] leading-relaxed">
                    Your responses are linked strictly to your private account and are never visible to other candidates. This assessment is used to recommend relevant learning content and{' '}
                    <strong className="text-[#102B4E]">
                      will never automatically reject or rank your job applications
                    </strong>
                    .
                  </p>

                  <label className="flex items-start gap-3 text-xs sm:text-sm text-[#102B4E] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={record.learningRecommendationConsent}
                      onChange={(e) => {
                        setRecord({
                          ...record,
                          learningRecommendationConsent: e.target.checked,
                        });
                        setErrors((p) => ({ ...p, learningRecommendationConsent: '' }));
                      }}
                      className="mt-1 w-4 h-4 shrink-0 cursor-pointer"
                    />
                    <span>
                      <strong>Required:</strong> I understand my assessment responses will be saved to my account to generate my Career Readiness Report and recommend learning courses on Learn with ABHI.
                    </span>
                  </label>
                  {errors.learningRecommendationConsent && (
                    <p className="text-xs text-rose-600 pl-7">
                      {errors.learningRecommendationConsent}
                    </p>
                  )}

                  <label className="flex items-start gap-3 text-xs sm:text-sm text-[#253449] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={record.recruitmentConsent}
                      onChange={(e) =>
                        setRecord({
                          ...record,
                          recruitmentConsent: e.target.checked,
                        })
                      }
                      className="mt-1 w-4 h-4 shrink-0 cursor-pointer"
                    />
                    <span>
                      <strong>Optional recruitment consent:</strong> I give explicit permission for ABHI JOBS recruitment consultants to review this summary when suggesting matching roles. (Leaving this unchecked will not limit access to courses or job applications.)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Footer (Previous / Continue or Submit) */}
            <div className="pt-6 border-t border-[#E5EAF0] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={step === 0}
                className="min-h-[46px] px-5 py-3 rounded-xl border border-[#D4DCE6] hover:border-[#102B4E] text-[#102B4E] text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="min-h-[46px] px-7 py-3 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Continue to Section {STEPS[step + 1].code}</span>
                  <ArrowRight className="w-4 h-4 text-[#F47A24]" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="min-h-[46px] px-8 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Calculating Readiness Report...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit &amp; View Career Report</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfileEvaluationTest;
