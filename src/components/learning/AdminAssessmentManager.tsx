import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { LEARNING_CATALOGUE_COURSES } from '../../data/learningCatalog';
import {
  checkAdminAssessmentAuthStatus,
  claimAdminAssessmentPasscode,
  createAdminQuestion,
  deleteAdminAssessmentAttempt,
  deleteAdminQuestion,
  fetchAdminAssessmentAttempts,
  fetchAdminCourseAssessments,
  loginAdminAssessmentPasscode,
  updateAdminAssessmentConfig,
  updateAdminQuestion,
} from '../../services/assessmentService';
import {
  AdminAssessmentConfig,
  AdminAttemptSummary,
  AdminEditableQuestion,
} from '../../types/learning';

interface AdminAssessmentManagerProps {
  initialCourseId?: string;
  onNotify?: (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message?: string
  ) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

interface QuestionFormState {
  id?: string;
  prompt: string;
  options: [string, string, string, string];
  correctOptionIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

const EMPTY_FORM: QuestionFormState = {
  prompt: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
  explanation: '',
};

export const AdminAssessmentManager: React.FC<AdminAssessmentManagerProps> = ({
  initialCourseId,
  onNotify,
}) => {
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passcodeMode, setPasscodeMode] = useState<'env' | 'claimed' | 'needs_setup'>('needs_setup');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeConfirm, setPasscodeConfirm] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'questions' | 'attempts'>('questions');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId || LEARNING_CATALOGUE_COURSES[0]?.id || ''
  );

  const [moduleQuizzes, setModuleQuizzes] = useState<AdminAssessmentConfig[]>([]);
  const [finalAssessment, setFinalAssessment] = useState<AdminAssessmentConfig | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  // Settings editor fields
  const [editTitle, setEditTitle] = useState('');
  const [editPassPercentage, setEditPassPercentage] = useState(70);
  const [editQuestionCount, setEditQuestionCount] = useState(3);
  const [editRandomize, setEditRandomize] = useState(true);
  const [editRequired, setEditRequired] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Question editor modal/inline form
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(EMPTY_FORM);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Attempts tab
  const [attempts, setAttempts] = useState<AdminAttemptSummary[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [attemptCourseFilter, setAttemptCourseFilter] = useState<string>('all');
  const [attemptTypeFilter, setAttemptTypeFilter] = useState<string>('all');

  const notify = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message?: string
  ) => {
    if (onNotify) onNotify(type, title, message);
  };

  const checkAuth = useCallback(async () => {
    setAuthChecking(true);
    try {
      const status = await checkAdminAssessmentAuthStatus();
      setIsAuthorized(status.authenticated);
      setPasscodeMode(status.passcodeMode);
    } catch {
      setIsAuthorized(false);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const loadCourseConfigs = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setLoadingConfigs(true);
    try {
      const res = await fetchAdminCourseAssessments(courseId);
      setModuleQuizzes(res.moduleQuizzes);
      setFinalAssessment(res.finalAssessment);
      const firstId = res.moduleQuizzes[0]?.id || res.finalAssessment?.id || '';
      setSelectedConfigId((prev) => {
        const stillExists =
          res.moduleQuizzes.some((m) => m.id === prev) || res.finalAssessment?.id === prev;
        return stillExists ? prev : firstId;
      });
    } catch (err: any) {
      notify('error', 'Could not load assessments', err?.message || 'Please try again.');
    } finally {
      setLoadingConfigs(false);
    }
  }, []);

  const loadAttempts = useCallback(async () => {
    setLoadingAttempts(true);
    try {
      const data = await fetchAdminAssessmentAttempts({
        courseId: attemptCourseFilter,
        assessmentType: attemptTypeFilter,
      });
      setAttempts(data);
    } catch (err: any) {
      notify('error', 'Could not load attempts', err?.message || 'Please try again.');
    } finally {
      setLoadingAttempts(false);
    }
  }, [attemptCourseFilter, attemptTypeFilter]);

  useEffect(() => {
    if (isAuthorized && selectedCourseId) {
      void loadCourseConfigs(selectedCourseId);
    }
  }, [isAuthorized, selectedCourseId, loadCourseConfigs]);

  useEffect(() => {
    if (isAuthorized && activeSubTab === 'attempts') {
      void loadAttempts();
    }
  }, [isAuthorized, activeSubTab, loadAttempts]);

  const allConfigs = useMemo(() => {
    const list = [...moduleQuizzes];
    if (finalAssessment) list.push(finalAssessment);
    return list;
  }, [moduleQuizzes, finalAssessment]);

  const activeConfig = useMemo(
    () => allConfigs.find((c) => c.id === selectedConfigId) || null,
    [allConfigs, selectedConfigId]
  );

  // Sync settings form whenever activeConfig changes
  useEffect(() => {
    if (!activeConfig) return;
    setEditTitle(activeConfig.title);
    setEditPassPercentage(activeConfig.passPercentage);
    setEditQuestionCount(activeConfig.questionCount);
    setEditRandomize(activeConfig.randomizeOrder);
    setEditRequired(activeConfig.requiredForCompletion);
    setShowQuestionForm(false);
    setQuestionForm(EMPTY_FORM);
  }, [activeConfig?.id, activeConfig?.title, activeConfig?.passPercentage, activeConfig?.questionCount, activeConfig?.randomizeOrder, activeConfig?.requiredForCompletion]);

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const trimmed = passcodeInput.trim();
    if (passcodeMode === 'needs_setup') {
      if (trimmed.length < 8) {
        setAuthError('Passcode must be at least 8 characters long.');
        return;
      }
      if (trimmed !== passcodeConfirm.trim()) {
        setAuthError('Passcodes do not match.');
        return;
      }
    } else if (!trimmed) {
      setAuthError('Please enter the administrator passcode.');
      return;
    }

    setAuthSubmitting(true);
    try {
      if (passcodeMode === 'needs_setup') {
        await claimAdminAssessmentPasscode(trimmed);
      } else {
        await loginAdminAssessmentPasscode(trimmed);
      }
      setPasscodeInput('');
      setPasscodeConfirm('');
      setIsAuthorized(true);
      notify('success', 'Assessment Manager unlocked', 'You can now manage questions and review attempts.');
    } catch (err: any) {
      setAuthError(err?.message || 'Verification failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const applyUpdatedConfig = (updated: AdminAssessmentConfig) => {
    if (updated.assessmentType === 'final_assessment') {
      setFinalAssessment(updated);
    } else {
      setModuleQuizzes((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConfig) return;
    setSavingSettings(true);
    try {
      const updated = await updateAdminAssessmentConfig({
        configId: activeConfig.id,
        title: editTitle,
        passPercentage: editPassPercentage,
        questionCount: editQuestionCount,
        randomizeOrder: editRandomize,
        requiredForCompletion: editRequired,
      });
      applyUpdatedConfig(updated);
      notify('success', 'Assessment settings updated', `${updated.title} settings saved.`);
    } catch (err: any) {
      notify('error', 'Failed to update settings', err?.message || 'Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  const openNewQuestionForm = () => {
    setQuestionForm(EMPTY_FORM);
    setShowQuestionForm(true);
  };

  const openEditQuestionForm = (q: AdminEditableQuestion) => {
    setQuestionForm({
      id: q.id,
      prompt: q.prompt,
      options: [...q.options] as [string, string, string, string],
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation,
    });
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConfig) return;
    if (
      !questionForm.prompt.trim() ||
      !questionForm.explanation.trim() ||
      questionForm.options.some((o) => !o.trim())
    ) {
      notify(
        'warning',
        'Complete all fields',
        'Please fill in the question prompt, all 4 answer options, and the explanation.'
      );
      return;
    }

    setSavingQuestion(true);
    try {
      const updated = questionForm.id
        ? await updateAdminQuestion({
            questionId: questionForm.id,
            configId: activeConfig.id,
            prompt: questionForm.prompt,
            options: questionForm.options,
            correctOptionIndex: questionForm.correctOptionIndex,
            explanation: questionForm.explanation,
          })
        : await createAdminQuestion({
            configId: activeConfig.id,
            prompt: questionForm.prompt,
            options: questionForm.options,
            correctOptionIndex: questionForm.correctOptionIndex,
            explanation: questionForm.explanation,
          });
      applyUpdatedConfig(updated);
      setShowQuestionForm(false);
      setQuestionForm(EMPTY_FORM);
      notify(
        'success',
        questionForm.id ? 'Question updated' : 'Question added',
        `Saved to ${updated.title}.`
      );
    } catch (err: any) {
      notify('error', 'Could not save question', err?.message || 'Please try again.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!activeConfig) return;
    try {
      const updated = await deleteAdminQuestion(activeConfig.id, questionId);
      applyUpdatedConfig(updated);
      notify('success', 'Question removed');
    } catch (err: any) {
      notify('error', 'Cannot remove question', err?.message || 'At least 1 question is required.');
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    try {
      await deleteAdminAssessmentAttempt(attemptId);
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
      notify('success', 'Attempt record removed');
    } catch (err: any) {
      notify('error', 'Failed to remove attempt', err?.message || 'Please try again.');
    }
  };

  if (authChecking) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-10 flex items-center justify-center gap-3 text-sm text-[#566479]">
        <Loader2 className="w-5 h-5 animate-spin text-[#102B4E]" />
        <span>Verifying administrator access...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 max-w-lg mx-auto space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-[#F47A24]" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-[#102B4E]">
              {passcodeMode === 'needs_setup'
                ? 'Set Assessment Manager Passcode'
                : 'Unlock Quiz & Assessment Manager'}
            </h2>
            <p className="text-xs sm:text-sm text-[#566479] leading-relaxed">
              {passcodeMode === 'needs_setup'
                ? 'Answer keys are protected on the backend. Sign in with your verified Google Admin account, or set a passcode below (minimum 8 characters) to manage quiz questions and candidate attempts.'
                : 'Enter your Assessment Manager passcode (or sign in with your verified Google Admin account) to edit answer keys and review attempts.'}
            </p>
          </div>
        </div>

        {authError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800 flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handlePasscodeSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-assessment-passcode"
              className="block text-xs font-semibold text-[#102B4E]"
            >
              {passcodeMode === 'needs_setup' ? 'Create Administrator Passcode' : 'Administrator Passcode'}
            </label>
            <input
              id="admin-assessment-passcode"
              type="password"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={passcodeMode === 'needs_setup' ? 8 : 1}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
            />
          </div>

          {passcodeMode === 'needs_setup' && (
            <div className="space-y-1.5">
              <label
                htmlFor="admin-assessment-passcode-confirm"
                className="block text-xs font-semibold text-[#102B4E]"
              >
                Confirm Passcode
              </label>
              <input
                id="admin-assessment-passcode-confirm"
                type="password"
                value={passcodeConfirm}
                onChange={(e) => setPasscodeConfirm(e.target.value)}
                placeholder="Re-enter passcode"
                required
                minLength={8}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={authSubmitting}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
          >
            {authSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#F47A24]" />
                <span>
                  {passcodeMode === 'needs_setup' ? 'Save Passcode & Unlock' : 'Unlock Manager'}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Sub-tab Switch */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#F47A24] inline-flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Learn with ABHI · Backend-Validated Assessments</span>
          </p>
          <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#102B4E]">
            Quiz &amp; Final Assessment Manager
          </h2>
          <p className="text-xs sm:text-sm text-[#566479]">
            Manage module quiz questions, final assessment banks, passing scores, and candidate attempts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('questions')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeSubTab === 'questions'
                ? 'bg-[#102B4E] text-white'
                : 'bg-[#FAFBFD] border border-[#E5EAF0] text-[#566479] hover:text-[#102B4E]'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Question Bank</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('attempts')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeSubTab === 'attempts'
                ? 'bg-[#102B4E] text-white'
                : 'bg-[#FAFBFD] border border-[#E5EAF0] text-[#566479] hover:text-[#102B4E]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Attempts</span>
          </button>
        </div>
      </div>

      {/* TAB 1: QUESTION BANK & SETTINGS */}
      {activeSubTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Selector Column */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5EAF0] p-5 space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-assessment-course"
                className="block text-xs font-bold text-[#102B4E]"
              >
                Select Course
              </label>
              <select
                id="admin-assessment-course"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
              >
                {LEARNING_CATALOGUE_COURSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-[#778397]">Course Assessments</p>

              {loadingConfigs ? (
                <div className="py-6 flex items-center justify-center text-xs text-[#778397] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {moduleQuizzes.map((mq) => {
                    const active = mq.id === selectedConfigId;
                    return (
                      <button
                        key={mq.id}
                        type="button"
                        onClick={() => setSelectedConfigId(mq.id)}
                        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#102B4E] text-white'
                            : 'bg-[#FAFBFD] border border-[#E5EAF0] text-[#253449] hover:border-[#102B4E]/40'
                        }`}
                      >
                        <p className="text-xs font-bold truncate">{mq.title}</p>
                        <p
                          className={`text-[11px] tabular-nums mt-0.5 ${
                            active ? 'text-slate-300' : 'text-[#778397]'
                          }`}
                        >
                          {mq.questions.length} in bank · serves {mq.questionCount} · pass{' '}
                          {mq.passPercentage}%
                        </p>
                      </button>
                    );
                  })}

                  {finalAssessment && (
                    <button
                      type="button"
                      onClick={() => setSelectedConfigId(finalAssessment.id)}
                      className={`w-full min-h-[48px] px-3.5 py-3 rounded-xl text-left transition-colors cursor-pointer ${
                        finalAssessment.id === selectedConfigId
                          ? 'bg-[#102B4E] text-white'
                          : 'bg-[#FFF8F2] border border-[#F47A24]/30 text-[#102B4E] hover:border-[#F47A24]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Award
                          className={`w-3.5 h-3.5 shrink-0 ${
                            finalAssessment.id === selectedConfigId
                              ? 'text-[#F47A24]'
                              : 'text-[#F47A24]'
                          }`}
                        />
                        <p className="text-xs font-bold truncate">{finalAssessment.title}</p>
                      </div>
                      <p
                        className={`text-[11px] tabular-nums mt-0.5 ${
                          finalAssessment.id === selectedConfigId
                            ? 'text-slate-300'
                            : 'text-[#566479]'
                        }`}
                      >
                        {finalAssessment.questions.length} in bank · serves{' '}
                        {finalAssessment.questionCount} · pass {finalAssessment.passPercentage}%
                      </p>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Editor Column */}
          <div className="lg:col-span-8 space-y-6">
            {activeConfig ? (
              <>
                {/* Settings Form */}
                <form
                  onSubmit={handleSaveSettings}
                  className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5EAF0] pb-3">
                    <div>
                      <p className="text-xs font-semibold text-[#F47A24]">
                        {activeConfig.assessmentType === 'final_assessment'
                          ? 'Final Course Assessment Settings'
                          : 'Module Quiz Settings'}
                      </p>
                      <h3 className="font-display text-base font-bold text-[#102B4E]">
                        {activeConfig.title}
                      </h3>
                    </div>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {savingSettings ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Settings</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-xs font-semibold text-[#253449]">
                        Assessment Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#253449]">
                        Pass Percentage (%)
                      </label>
                      <input
                        type="number"
                        min={activeConfig.assessmentType === 'final_assessment' ? 70 : 40}
                        max={100}
                        value={editPassPercentage}
                        onChange={(e) => setEditPassPercentage(Number(e.target.value))}
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] tabular-nums"
                      />
                      {activeConfig.assessmentType === 'final_assessment' && (
                        <p className="text-[11px] text-[#778397]">Minimum 70% for final exam</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#253449]">
                        Questions Per Attempt
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={Math.min(
                          activeConfig.assessmentType === 'final_assessment' ? 20 : 15,
                          Math.max(1, activeConfig.questions.length)
                        )}
                        value={editQuestionCount}
                        onChange={(e) => setEditQuestionCount(Number(e.target.value))}
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] tabular-nums"
                      />
                      <p className="text-[11px] text-[#778397] tabular-nums">
                        Max {activeConfig.questions.length} available
                      </p>
                    </div>

                    <div className="flex flex-col justify-center gap-2.5 pt-1">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#253449] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editRandomize}
                          onChange={(e) => setEditRandomize(e.target.checked)}
                          className="w-4 h-4 accent-[#F47A24]"
                        />
                        <span>Randomize question order</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#253449] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editRequired}
                          onChange={(e) => setEditRequired(e.target.checked)}
                          className="w-4 h-4 accent-[#F47A24]"
                        />
                        <span>Required for course completion</span>
                      </label>
                    </div>
                  </div>
                </form>

                {/* Questions List + Add/Edit Form */}
                <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#102B4E] tabular-nums">
                        Questions ({activeConfig.questions.length})
                      </h3>
                      <p className="text-xs text-[#778397]">
                        Each question requires 4 options, 1 correct answer, and a post-submission explanation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openNewQuestionForm}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {showQuestionForm && (
                    <form
                      onSubmit={handleSaveQuestion}
                      className="rounded-2xl bg-[#FAFBFD] border border-[#D4DCE6] p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display text-sm font-bold text-[#102B4E]">
                          {questionForm.id ? 'Edit Question' : 'Create New Question'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuestionForm(false);
                            setQuestionForm(EMPTY_FORM);
                          }}
                          className="p-1.5 text-[#566479] hover:text-[#102B4E] cursor-pointer"
                          aria-label="Close question form"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#253449]">
                          Question Prompt
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={questionForm.prompt}
                          onChange={(e) =>
                            setQuestionForm((prev) => ({ ...prev, prompt: e.target.value }))
                          }
                          placeholder="Enter a clear, practical question grounded in the course lesson..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E]"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-[#253449]">
                          Answer Options (select the radio button for the 1 correct answer)
                        </p>
                        {([0, 1, 2, 3] as const).map((optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="correct_option_selector"
                              checked={questionForm.correctOptionIndex === optIdx}
                              onChange={() =>
                                setQuestionForm((prev) => ({
                                  ...prev,
                                  correctOptionIndex: optIdx,
                                }))
                              }
                              aria-label={`Mark option ${OPTION_LETTERS[optIdx]} as correct`}
                              className="w-4 h-4 accent-emerald-600 shrink-0 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-[#566479] w-4 shrink-0">
                              {OPTION_LETTERS[optIdx]}
                            </span>
                            <input
                              type="text"
                              required
                              value={questionForm.options[optIdx]}
                              onChange={(e) => {
                                const nextOpts = [...questionForm.options] as [
                                  string,
                                  string,
                                  string,
                                  string
                                ];
                                nextOpts[optIdx] = e.target.value;
                                setQuestionForm((prev) => ({ ...prev, options: nextOpts }));
                              }}
                              placeholder={`Option ${OPTION_LETTERS[optIdx]}`}
                              className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E]"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#253449]">
                          Explanation for Correct Answer (shown only after submission)
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={questionForm.explanation}
                          onChange={(e) =>
                            setQuestionForm((prev) => ({ ...prev, explanation: e.target.value }))
                          }
                          placeholder="Explain why the correct answer is right..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuestionForm(false);
                            setQuestionForm(EMPTY_FORM);
                          }}
                          className="min-h-[40px] px-4 py-2 rounded-xl border border-[#D4DCE6] bg-white text-xs font-semibold text-[#566479] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingQuestion}
                          className="min-h-[40px] px-5 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {savingQuestion ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          <span>{questionForm.id ? 'Update Question' : 'Save Question'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="divide-y divide-[#E5EAF0] border-y border-[#E5EAF0]">
                    {activeConfig.questions.map((q, idx) => (
                      <div key={q.id} className="py-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="font-display text-xs font-bold text-[#F47A24] tabular-nums pt-0.5 shrink-0">
                              Q{idx + 1}
                            </span>
                            <p className="text-sm font-bold text-[#102B4E] leading-snug">
                              {q.prompt}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditQuestionForm(q)}
                              className="min-h-[34px] px-2.5 py-1.5 rounded-lg border border-[#E5EAF0] hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteQuestion(q.id)}
                              disabled={activeConfig.questions.length <= 1}
                              className="min-h-[34px] px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="sr-only sm:not-sr-only">Delete</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-0 sm:pl-6 text-xs">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = optIdx === q.correctOptionIndex;
                            return (
                              <div
                                key={optIdx}
                                className={`px-3 py-2 rounded-lg border flex items-start gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                                    : 'bg-[#FAFBFD] border-[#E5EAF0] text-[#566479]'
                                }`}
                              >
                                <span className="shrink-0">{OPTION_LETTERS[optIdx]}.</span>
                                <span className="flex-1">{opt}</span>
                                {isCorrect && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <p className="text-xs text-[#566479] pl-0 sm:pl-6">
                          <span className="font-semibold text-[#102B4E]">Explanation: </span>
                          {q.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E5EAF0] p-8 text-center text-sm text-[#778397]">
                Select a module quiz or final assessment to edit its questions and settings.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATE ASSESSMENT ATTEMPTS */}
      {activeSubTab === 'attempts' && (
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={attemptCourseFilter}
                onChange={(e) => setAttemptCourseFilter(e.target.value)}
                aria-label="Filter attempts by course"
                className="min-h-[42px] px-3 py-2 rounded-xl border border-[#D4DCE6] bg-white text-xs sm:text-sm text-[#102B4E]"
              >
                <option value="all">All Courses</option>
                {LEARNING_CATALOGUE_COURSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <select
                value={attemptTypeFilter}
                onChange={(e) => setAttemptTypeFilter(e.target.value)}
                aria-label="Filter attempts by type"
                className="min-h-[42px] px-3 py-2 rounded-xl border border-[#D4DCE6] bg-white text-xs sm:text-sm text-[#102B4E]"
              >
                <option value="all">All Assessment Types</option>
                <option value="module_quiz">Module Quizzes</option>
                <option value="final_assessment">Final Assessments</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => void loadAttempts()}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Attempts</span>
            </button>
          </div>

          {loadingAttempts ? (
            <div className="py-10 flex items-center justify-center gap-2 text-xs text-[#778397]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading assessment attempts...</span>
            </div>
          ) : attempts.length === 0 ? (
            <div className="py-10 text-center space-y-1">
              <p className="text-sm font-bold text-[#102B4E]">No assessment attempts recorded yet</p>
              <p className="text-xs text-[#778397]">
                Candidate quiz and final assessment submissions will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="border-b border-[#E5EAF0] text-[11px] uppercase tracking-wider text-[#778397]">
                    <th className="py-2.5 pr-4 font-semibold">Candidate</th>
                    <th className="py-2.5 px-4 font-semibold">Course &amp; Assessment</th>
                    <th className="py-2.5 px-4 font-semibold">Score</th>
                    <th className="py-2.5 px-4 font-semibold">Attempt</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Submitted</th>
                    <th className="py-2.5 pl-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAF0] text-xs sm:text-sm">
                  {attempts.map((att) => (
                    <tr key={att.id} className="hover:bg-[#FAFBFD]">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-[#102B4E]">{att.candidateName}</p>
                        {att.candidateEmail && (
                          <p className="text-[11px] text-[#778397]">{att.candidateEmail}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#102B4E]">{att.assessmentTitle}</p>
                        <p className="text-[11px] text-[#778397]">
                          {att.courseTitle} ·{' '}
                          {att.assessmentType === 'final_assessment' ? 'Final Assessment' : 'Module Quiz'}
                        </p>
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        <span className="font-bold text-[#102B4E]">{att.scorePercent}%</span>
                        <span className="text-[11px] text-[#778397] ml-1.5">
                          ({att.correctAnswers}/{att.totalQuestions})
                        </span>
                      </td>
                      <td className="py-3 px-4 tabular-nums text-[#566479]">
                        #{att.attemptNumber}
                      </td>
                      <td className="py-3 px-4">
                        {att.passed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#778397] whitespace-nowrap">
                        {new Date(att.submittedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => void handleDeleteAttempt(att.id)}
                          className="min-h-[34px] px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAssessmentManager;
