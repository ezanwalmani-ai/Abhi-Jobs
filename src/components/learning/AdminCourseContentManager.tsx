import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Database,
  Edit3,
  FileText,
  Film,
  Loader2,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { LEARNING_CATALOGUE_COURSES } from '../../data/learningCatalog';
import {
  deleteAdminCourseLesson,
  isSafeExternalResourceUrl,
  loadHydratedCourse,
  parseSafeVideoEmbed,
  saveAdminCourseLesson,
} from '../../services/courseContentService';
import {
  CourseResetInspectionReport,
  executeSafeFirestoreCourseReset,
  inspectAffectedFirestoreCourseRecords,
} from '../../services/learningResetService';
import {
  CourseLesson,
  LearningCourseItem,
  LessonAttachment,
  LessonAttachmentType,
} from '../../types/learning';

interface AdminCourseContentManagerProps {
  adminUserId: string;
  initialCourseId?: string;
  onNotify?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
  onPreviewCourse?: (slug: string) => void;
  onBack?: () => void;
}

const ATTACHMENT_TYPES: LessonAttachmentType[] = [
  'PDF',
  'Workbook',
  'Checklist',
  'Template',
  'Resource',
];

export const AdminCourseContentManager: React.FC<AdminCourseContentManagerProps> = ({
  adminUserId,
  initialCourseId,
  onNotify,
  onPreviewCourse,
  onBack,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    if (initialCourseId && LEARNING_CATALOGUE_COURSES.some((c) => c.id === initialCourseId)) {
      return initialCourseId;
    }
    return LEARNING_CATALOGUE_COURSES[0]?.id || '';
  });
  const [hydratedCourse, setHydratedCourse] = useState<LearningCourseItem | null>(
    () =>
      LEARNING_CATALOGUE_COURSES.find((c) => c.id === selectedCourseId) ||
      LEARNING_CATALOGUE_COURSES[0] ||
      null
  );
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    hydratedCourse?.modules[0]?.id || ''
  );
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);

  // Two-step Safe Database Course Reset Inspector state
  const [isInspectingReset, setIsInspectingReset] = useState(false);
  const [isExecutingReset, setIsExecutingReset] = useState(false);
  const [resetInspection, setResetInspection] = useState<CourseResetInspectionReport | null>(null);
  const [confirmResetArmed, setConfirmResetArmed] = useState(false);
  const [resetCompletedMessage, setResetCompletedMessage] = useState<string | null>(null);

  // Lesson Form State
  const [showForm, setShowForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [writtenContent, setWrittenContent] = useState('');
  const [exerciseTitle, setExerciseTitle] = useState('');
  const [exerciseInstructions, setExerciseInstructions] = useState('');
  const [exerciseDeliverable, setExerciseDeliverable] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15);
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);

  // Attachment draft inputs
  const [newAttTitle, setNewAttTitle] = useState('');
  const [newAttUrl, setNewAttUrl] = useState('');
  const [newAttType, setNewAttType] = useState<LessonAttachmentType>('PDF');

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refreshCourse = async (courseIdToLoad: string) => {
    const base =
      LEARNING_CATALOGUE_COURSES.find((c) => c.id === courseIdToLoad) ||
      LEARNING_CATALOGUE_COURSES[0] ||
      null;
    if (!base) {
      setHydratedCourse(null);
      setSelectedModuleId('');
      return;
    }
    setIsLoadingCourse(true);
    try {
      const loaded = await loadHydratedCourse(base);
      setHydratedCourse(loaded);
      setSelectedModuleId((prev) =>
        loaded.modules.some((m) => m.id === prev) ? prev : loaded.modules[0]?.id || ''
      );
    } finally {
      setIsLoadingCourse(false);
    }
  };

  useEffect(() => {
    if (!selectedCourseId) {
      setHydratedCourse(null);
      setSelectedModuleId('');
      return;
    }
    void refreshCourse(selectedCourseId);
  }, [selectedCourseId]);

  const activeModule = useMemo(
    () =>
      hydratedCourse?.modules.find((m) => m.id === selectedModuleId) ||
      hydratedCourse?.modules[0] ||
      null,
    [hydratedCourse, selectedModuleId]
  );

  const handleInspectDatabaseCourseRecords = async () => {
    setIsInspectingReset(true);
    setConfirmResetArmed(false);
    setResetCompletedMessage(null);
    try {
      const report = await inspectAffectedFirestoreCourseRecords();
      setResetInspection(report);
      onNotify?.(
        'info',
        'Course Database Inspection Complete',
        report.totalAffectedDocs === 0
          ? 'No legacy course records remain in Firestore.'
          : `Found ${report.totalAffectedDocs} course-specific Firestore document(s) ready for safe cleanup.`
      );
    } finally {
      setIsInspectingReset(false);
    }
  };

  const handleExecuteDatabaseCourseReset = async () => {
    if (!resetInspection) return;
    setIsExecutingReset(true);
    try {
      const result = await executeSafeFirestoreCourseReset(resetInspection);
      if (!result.success) {
        onNotify?.('error', 'Database Reset Failed', result.error);
        return;
      }
      setConfirmResetArmed(false);
      const summary = `Deleted ${result.deletedFirestoreDocs} course record(s) from Firestore and cleared ${result.clearedLocalKeys} course cache key(s). Candidate accounts, jobs, resumes, and Career Readiness Assessments were preserved.`;
      setResetCompletedMessage(summary);
      onNotify?.('success', 'Course Database Reset Complete', summary);
      // Re-inspect to confirm 0 remaining docs
      const refreshed = await inspectAffectedFirestoreCourseRecords();
      setResetInspection(refreshed);
    } finally {
      setIsExecutingReset(false);
    }
  };

  const videoValidation = useMemo(() => {
    if (!videoUrl.trim()) return null;
    return parseSafeVideoEmbed(videoUrl);
  }, [videoUrl]);

  const resetFormForCreate = () => {
    const nextOrder = (activeModule?.lessons.length || 0) + 1;
    setEditingLessonId(null);
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setWrittenContent('');
    setExerciseTitle('');
    setExerciseInstructions('');
    setExerciseDeliverable('');
    setOrder(nextOrder);
    setEstimatedMinutes(15);
    setAttachments([]);
    setNewAttTitle('');
    setNewAttUrl('');
    setNewAttType('PDF');
    setFormError(null);
    setShowForm(true);
  };

  const openFormForEdit = (lesson: CourseLesson) => {
    setEditingLessonId(lesson.id);
    setSelectedModuleId(lesson.moduleId);
    setTitle(lesson.title);
    setDescription(lesson.description);
    setVideoUrl(lesson.videoUrl || '');
    setWrittenContent(lesson.writtenContent || '');
    setExerciseTitle(lesson.exercise?.title || '');
    setExerciseInstructions(lesson.exercise?.instructions || '');
    setExerciseDeliverable(lesson.exercise?.deliverable || '');
    setOrder(lesson.order);
    setEstimatedMinutes(lesson.estimatedMinutes || 15);
    setAttachments(lesson.attachments || []);
    setNewAttTitle('');
    setNewAttUrl('');
    setNewAttType('PDF');
    setFormError(null);
    setShowForm(true);
  };

  const handleAddAttachment = () => {
    const cleanTitle = newAttTitle.trim();
    const cleanUrl = newAttUrl.trim();
    if (!cleanTitle) {
      setFormError('Enter a resource title before adding an attachment.');
      return;
    }
    if (cleanUrl && !isSafeExternalResourceUrl(cleanUrl)) {
      setFormError('Attachment URL must begin with https:// or http://.');
      return;
    }

    setFormError(null);
    setAttachments((prev) => [
      ...prev,
      {
        id: `att_${Date.now()}_${prev.length + 1}`,
        title: cleanTitle,
        url: cleanUrl,
        fileType: newAttType,
        sizeLabel: cleanUrl ? 'External Resource' : 'PDF Study Sheet',
      },
    ]);
    setNewAttTitle('');
    setNewAttUrl('');
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter a lesson title.');
      return;
    }

    if (!hydratedCourse || !activeModule) {
      setFormError('Please select a target course and module.');
      return;
    }

    if (videoUrl.trim() && videoValidation?.kind === 'invalid') {
      setFormError(videoValidation.providerLabel);
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveAdminCourseLesson(
        {
          id: editingLessonId || undefined,
          courseId: hydratedCourse.id,
          moduleId: activeModule.id,
          title,
          description,
          videoUrl,
          writtenContent,
          exerciseTitle,
          exerciseInstructions,
          exerciseDeliverable,
          attachments,
          order,
          estimatedMinutes,
        },
        adminUserId
      );

      if (!result.success) {
        setFormError(result.error || 'Could not save lesson.');
        return;
      }

      await refreshCourse(hydratedCourse.id);
      setShowForm(false);
      onNotify?.(
        'success',
        editingLessonId ? 'Lesson updated' : 'Lesson added',
        `"${title.trim()}" is now live in ${hydratedCourse.title}.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async (lesson: CourseLesson) => {
    if (!hydratedCourse) return;
    await deleteAdminCourseLesson(hydratedCourse.id, lesson.id);
    await refreshCourse(hydratedCourse.id);
    onNotify?.(
      'info',
      'Lesson updated',
      lesson.id.startsWith('les_custom_')
        ? `Removed custom lesson "${lesson.title}".`
        : `Restored "${lesson.title}" to its default curriculum version.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#566479] hover:text-[#102B4E] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Learn with ABHI</span>
            </button>
          )}
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#102B4E]">
            Learn with ABHI — Course Content &amp; Lesson Manager
          </h2>
          <p className="text-xs sm:text-sm text-[#566479]">
            Add or update lesson titles, descriptions, embedded video URLs, written material, downloadable attachments, practical exercises, and lesson order for any catalogue course.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onPreviewCourse && hydratedCourse && (
            <button
              type="button"
              onClick={() => onPreviewCourse(hydratedCourse.slug)}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E] text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
            >
              Open Course Player
            </button>
          )}
          {hydratedCourse && (
            <button
              type="button"
              onClick={resetFormForCreate}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lesson</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty Catalogue State (Preserves Course Management Tools & Adds Safe Firestore Reset Inspector) */}
      {!hydratedCourse ? (
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-8 sm:p-10 text-center space-y-3">
          <h3 className="font-display text-lg font-bold text-[#102B4E]">
            No courses in the Learn with ABHI catalogue yet
          </h3>
          <p className="text-sm text-[#566479] max-w-xl mx-auto leading-relaxed">
            All previous sample courses, modules, lessons, quizzes, enrolments, and certificates have been cleared from the platform. Course management tools remain fully intact and ready whenever you add new courses from scratch.
          </p>
        </div>
      ) : (
        <>
          {/* Course & Module Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-2xl border border-[#E5EAF0] p-5">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-course-select"
                className="block text-xs font-semibold text-[#102B4E]"
              >
                Select Course ({LEARNING_CATALOGUE_COURSES.length} catalogue courses)
              </label>
              <select
                id="admin-course-select"
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setShowForm(false);
                }}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] bg-[#FAFBFD] text-sm text-[#102B4E] focus:outline-none focus:ring-2 focus:ring-[#102B4E]"
              >
                {LEARNING_CATALOGUE_COURSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.categoryName})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-module-select"
                className="block text-xs font-semibold text-[#102B4E]"
              >
                Select Module ({hydratedCourse.modules.length} modules)
              </label>
              <select
                id="admin-module-select"
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value);
                  setShowForm(false);
                }}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] bg-[#FAFBFD] text-sm text-[#102B4E] focus:outline-none focus:ring-2 focus:ring-[#102B4E]"
              >
                {hydratedCourse.modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    Module 0{m.order}: {m.title} ({m.lessons.length} lessons)
                  </option>
                ))}
              </select>
            </div>
          </div>

      {/* Add / Edit Lesson Form */}
      {showForm && activeModule && (
        <form
          onSubmit={handleSaveLesson}
          className="bg-white rounded-2xl border border-[#102B4E]/30 p-5 sm:p-7 space-y-6"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#E5EAF0] pb-4">
            <div>
              <p className="text-xs font-semibold text-[#F47A24]">
                {hydratedCourse.title} · Module 0{activeModule.order}
              </p>
              <h3 className="font-display text-lg font-bold text-[#102B4E]">
                {editingLessonId ? 'Edit Lesson Content' : 'Add New Lesson'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-[#566479] hover:bg-[#F6F8FB] cursor-pointer"
              aria-label="Close lesson form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs sm:text-sm text-rose-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-1.5">
              <label className="block text-xs font-semibold text-[#102B4E]">
                Lesson Title *
              </label>
              <input
                type="text"
                required
                maxLength={160}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Creating Dynamic PivotTables for Weekly Reports"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:ring-2 focus:ring-[#102B4E]"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-[#102B4E]">
                Lesson Order *
              </label>
              <input
                type="number"
                min={1}
                max={200}
                required
                value={order}
                onChange={(e) => setOrder(Number(e.target.value) || 1)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#102B4E]"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-[#102B4E]">
                Est. Minutes
              </label>
              <input
                type="number"
                min={1}
                max={300}
                required
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value) || 15)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#102B4E]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#102B4E]">
              Lesson Description
            </label>
            <input
              type="text"
              maxLength={600}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Concise 1–2 sentence overview of what learners will achieve in this lesson."
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:ring-2 focus:ring-[#102B4E]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#102B4E]">
              Embedded Video URL (Optional — Leave blank for a written-only lesson)
            </label>
            <input
              type="url"
              maxLength={500}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or Vimeo / Loom / direct .mp4 HTTPS link"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] focus:outline-none focus:ring-2 focus:ring-[#102B4E]"
            />
            {videoValidation && (
              <p
                className={`text-xs font-medium ${
                  videoValidation.kind === 'invalid' ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {videoValidation.kind === 'invalid'
                  ? videoValidation.providerLabel
                  : `Valid ${videoValidation.providerLabel} embed detected.`}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#102B4E]">
              Written Learning Material
            </label>
            <textarea
              rows={6}
              maxLength={20000}
              value={writtenContent}
              onChange={(e) => setWrittenContent(e.target.value)}
              placeholder="Write clear explanations, examples, or bullet points (separate paragraphs with a blank line)."
              className="w-full px-3.5 py-3 rounded-xl border border-[#D4DCE6] text-sm text-[#102B4E] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#102B4E]"
            />
          </div>

          {/* Practical Exercise Fields */}
          <div className="rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] p-4 sm:p-5 space-y-4">
            <p className="text-xs font-bold text-[#102B4E]">Practical Exercise / Activity</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#566479]">
                  Exercise Title
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={exerciseTitle}
                  onChange={(e) => setExerciseTitle(e.target.value)}
                  placeholder="e.g., Build a Regional Sales Lookup Sheet"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#566479]">
                  Expected Output / Deliverable (Optional)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={exerciseDeliverable}
                  onChange={(e) => setExerciseDeliverable(e.target.value)}
                  placeholder="e.g., A 2-tab workbook with clean exact-match formulas"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#566479]">
                Exercise Instructions
              </label>
              <textarea
                rows={3}
                maxLength={4000}
                value={exerciseInstructions}
                onChange={(e) => setExerciseInstructions(e.target.value)}
                placeholder="Step-by-step instructions for what the candidate should practice."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E]"
              />
            </div>
          </div>

          {/* Attachments / Downloadable Resources */}
          <div className="rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] p-4 sm:p-5 space-y-4">
            <p className="text-xs font-bold text-[#102B4E]">
              Downloadable Attachments &amp; PDF Resources ({attachments.length}/15)
            </p>

            {attachments.length > 0 && (
              <div className="divide-y divide-[#E5EAF0] border-y border-[#E5EAF0] bg-white rounded-xl px-3">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#102B4E] truncate">{att.title}</p>
                      <p className="text-[#778397] truncate">
                        {att.fileType} · {att.url || 'Generated PDF Study Sheet'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-semibold text-[#566479]">
                  Resource Title
                </label>
                <input
                  type="text"
                  value={newAttTitle}
                  onChange={(e) => setNewAttTitle(e.target.value)}
                  placeholder="e.g., Practice Dataset PDF"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#D4DCE6] bg-white text-xs sm:text-sm"
                />
              </div>
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-semibold text-[#566479]">
                  PDF / File URL (HTTPS)
                </label>
                <input
                  type="url"
                  value={newAttUrl}
                  onChange={(e) => setNewAttUrl(e.target.value)}
                  placeholder="https://example.com/workbook.pdf"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#D4DCE6] bg-white text-xs sm:text-sm"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-semibold text-[#566479]">
                  Type
                </label>
                <select
                  value={newAttType}
                  onChange={(e) => setNewAttType(e.target.value as LessonAttachmentType)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#D4DCE6] bg-white text-xs sm:text-sm"
                >
                  {ATTACHMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Add File
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm font-semibold text-[#566479] hover:text-[#102B4E] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{editingLessonId ? 'Save Changes' : 'Create Lesson'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Existing Lessons in Selected Module */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm sm:text-base font-bold text-[#102B4E]">
              {activeModule
                ? `Module 0${activeModule.order}: ${activeModule.title}`
                : 'Lessons'}
            </h3>
            <p className="text-xs text-[#778397]">
              Ordered by lesson sequence. Click edit to attach a video URL, refine written material, or add PDF resources.
            </p>
          </div>
          {isLoadingCourse && <Loader2 className="w-4 h-4 animate-spin text-[#102B4E]" />}
        </div>

        {activeModule && activeModule.lessons.length > 0 ? (
          <div className="divide-y divide-[#E5EAF0]">
            {activeModule.lessons
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((lesson) => {
                const hasVideo = Boolean(
                  lesson.videoUrl &&
                    parseSafeVideoEmbed(lesson.videoUrl)?.kind !== 'invalid'
                );
                return (
                  <div
                    key={lesson.id}
                    className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <span className="font-display text-sm font-bold text-[#F47A24] tabular-nums pt-0.5 shrink-0">
                        #{lesson.order}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-bold text-[#102B4E]">{lesson.title}</p>
                        <p className="text-xs text-[#566479] line-clamp-2">
                          {lesson.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#778397] pt-0.5 tabular-nums">
                          <span className="inline-flex items-center gap-1 font-medium text-[#253449]">
                            {hasVideo ? (
                              <>
                                <Film className="w-3.5 h-3.5 text-[#F47A24]" />
                                <span>Video Attached</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-3.5 h-3.5 text-[#566479]" />
                                <span>Written Only</span>
                              </>
                            )}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{lesson.estimatedMinutes} min</span>
                          <span aria-hidden="true">·</span>
                          <span>{lesson.attachments.length} attachment(s)</span>
                          {lesson.exercise && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Exercise included</span>
                            </>
                          )}
                          {lesson.isAdminManaged && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Admin Saved</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openFormForEdit(lesson)}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {lesson.isAdminManaged && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteLesson(lesson)}
                          className="min-h-[40px] px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title={
                            lesson.id.startsWith('les_custom_')
                              ? 'Delete custom lesson'
                              : 'Reset to default lesson'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>
                            {lesson.id.startsWith('les_custom_') ? 'Delete' : 'Reset'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[#778397]">
            No lessons in this module yet. Click "Add Lesson" above to create one.
          </div>
        )}
      </div>
        </>
      )}

      {/* Audited Two-Step Firestore Course Database Reset Inspector */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E5EAF0] pb-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#F47A24] inline-flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Safe Database Maintenance</span>
            </p>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#102B4E]">
              Inspect &amp; Purge Legacy Course Records in Firestore
            </h3>
            <p className="text-xs sm:text-sm text-[#566479] max-w-2xl leading-relaxed">
              Audit Firestore first to verify exact affected records across Learn with ABHI course collections (lessons, quiz configs, enrolments, test attempts, and course certificates) before permanently deleting them.
            </p>
          </div>

          <button
            type="button"
            disabled={isInspectingReset || isExecutingReset}
            onClick={() => void handleInspectDatabaseCourseRecords()}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60"
          >
            {isInspectingReset ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Inspecting Records...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Inspect Affected Records</span>
              </>
            )}
          </button>
        </div>

        {/* Guaranteed Preserved Data Checklist */}
        <div className="rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] p-4 space-y-2">
          <p className="text-xs font-bold text-[#102B4E] inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Strictly Preserved (Never Modified or Deleted)</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#566479]">
            <span>• Candidate accounts &amp; profiles</span>
            <span>• Google authentication &amp; admin permissions</span>
            <span>• Career Readiness Assessments &amp; reports</span>
            <span>• Job listings, applications &amp; resumes</span>
          </div>
        </div>

        {resetCompletedMessage && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{resetCompletedMessage}</span>
          </div>
        )}

        {resetInspection && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#566479]">
              <span>
                Total affected learning-course documents:{' '}
                <strong className="text-[#102B4E] tabular-nums">
                  {resetInspection.totalAffectedDocs}
                </strong>
              </span>
              <span>
                Inspected at {new Date(resetInspection.inspectedAt).toLocaleTimeString()}
              </span>
            </div>

            {resetInspection.warnings.length > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1">
                {resetInspection.warnings.map((w, idx) => (
                  <p key={idx}>• {w}</p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {resetInspection.buckets.map((bucket) => (
                <div
                  key={bucket.key}
                  className="rounded-xl border border-[#E5EAF0] bg-[#FAFBFD] p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#102B4E] truncate">{bucket.label}</p>
                    <span className="text-sm font-extrabold text-[#102B4E] tabular-nums shrink-0">
                      {bucket.count}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[#778397] truncate">
                    {bucket.collectionPath}
                  </p>
                </div>
              ))}
            </div>

            {resetInspection.totalAffectedDocs === 0 ? (
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-900 inline-flex items-center gap-2 w-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Firestore is clean — zero legacy Learn with ABHI course records remain.
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-3">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <p>
                    Ready to permanently delete strictly the{' '}
                    <strong className="tabular-nums">{resetInspection.totalAffectedDocs}</strong>{' '}
                    inspected learning-course document(s) above. Unrelated ABHI JOBS records will not be touched.
                  </p>
                </div>

                {!confirmResetArmed ? (
                  <button
                    type="button"
                    onClick={() => setConfirmResetArmed(true)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Course-Only Cleanup</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isExecutingReset}
                      onClick={() => void handleExecuteDatabaseCourseReset()}
                      className="min-h-[44px] px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                    >
                      {isExecutingReset ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Deleting Course Records...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>
                            Permanently Delete {resetInspection.totalAffectedDocs} Course Record(s)
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isExecutingReset}
                      onClick={() => setConfirmResetArmed(false)}
                      className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D4DCE6] bg-white text-xs sm:text-sm font-semibold text-[#566479] hover:text-[#102B4E] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourseContentManager;
