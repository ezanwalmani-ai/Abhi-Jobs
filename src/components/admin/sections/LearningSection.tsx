import React, { useEffect, useState } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { LEARNING_CATALOGUE_COURSES } from '../../../data/learningCatalog';
import { AdminCourseContentManager } from '../../learning/AdminCourseContentManager';
import { AdminAssessmentManager } from '../../learning/AdminAssessmentManager';
import { AdminCertificateQueuePanel } from '../AdminCertificateQueuePanel';
import { AdminDataTable } from '../AdminDataTable';
import {
  listCourseEnrolmentsAdmin,
  listVideoProgressAdmin,
  listAssessmentAttemptsAdmin,
  listPublicCertificatesAdmin,
  setPublicCertificateStatusAdmin,
  verifyPublicCertificateById,
  listCertificateTemplatesAdmin,
  upsertCertificateTemplateAdmin,
  deleteCertificateTemplateAdmin,
  type AdminCourseEnrolmentRecord,
  type AdminVideoProgressRecord,
  type AdminAssessmentAttemptRecord,
  type AdminIssuedCertificateRecord,
  type AdminCertificateTemplateRecord,
} from '../../../services/adminPanelService';
import type { AdminModuleId } from '../adminNavConfig';
import type { ResolvedAdminSession } from '../../../services/adminRbacService';
import type { AdminConfirmDialogProps } from '../AdminConfirmDialog';

export interface LearningSectionProps {
  activeModule: AdminModuleId;
  adminSession: ResolvedAdminSession;
  liveEnrolments?: AdminCourseEnrolmentRecord[];
  liveAttempts?: AdminAssessmentAttemptRecord[];
  liveIssuedCerts?: AdminIssuedCertificateRecord[];
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onNavigatePublic: (path: string) => void;
  onNavigateModule: (moduleId: AdminModuleId) => void;
  onInspectRecord: (title: string, subtitle: string, record: Record<string, unknown>) => void;
  onRequestConfirm: (
    config: Omit<AdminConfirmDialogProps, 'isOpen' | 'busy' | 'onCancel'>
  ) => void;
}

export const LearningSection: React.FC<LearningSectionProps> = ({
  activeModule,
  adminSession,
  liveEnrolments,
  liveAttempts,
  liveIssuedCerts,
  onNotify,
  onNavigatePublic,
  onNavigateModule,
  onInspectRecord,
  onRequestConfirm,
}) => {
  const [enrolments, setEnrolments] = useState<AdminCourseEnrolmentRecord[]>(liveEnrolments ?? []);
  const [videoProgress, setVideoProgress] = useState<AdminVideoProgressRecord[]>([]);
  const [attempts, setAttempts] = useState<AdminAssessmentAttemptRecord[]>(liveAttempts ?? []);
  const [issuedCerts, setIssuedCerts] = useState<AdminIssuedCertificateRecord[]>(liveIssuedCerts ?? []);
  const [templates, setTemplates] = useState<AdminCertificateTemplateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canExportCsv = Boolean(adminSession.permissions?.canExportCsv);
  const handleCsvExported = (rowCount: number, filename: string) => {
    onNotify(
      'success',
      'CSV Export Downloaded',
      `Exported ${rowCount} visible ${rowCount === 1 ? 'record' : 'records'} to ${filename}.`
    );
  };

  useEffect(() => {
    if (liveEnrolments && liveEnrolments.length > 0) setEnrolments(liveEnrolments);
  }, [liveEnrolments]);

  useEffect(() => {
    if (liveAttempts && liveAttempts.length > 0) setAttempts(liveAttempts);
  }, [liveAttempts]);

  useEffect(() => {
    if (liveIssuedCerts && liveIssuedCerts.length > 0) setIssuedCerts(liveIssuedCerts);
  }, [liveIssuedCerts]);

  // Public Certificate Verification Lookup
  const [verifyInput, setVerifyInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<
    | { state: 'idle' }
    | { state: 'found'; cert: AdminIssuedCertificateRecord }
    | { state: 'not_found'; id: string }
    | { state: 'error'; message: string }
  >({ state: 'idle' });

  // Certificate Template form
  const [tplId, setTplId] = useState('default_abhi_certificate');
  const [tplName, setTplName] = useState('ABHI JOBS Official Certificate');
  const [tplOrg, setTplOrg] = useState('ABHI JOBS — Learn with ABHI');
  const [tplTitle, setTplTitle] = useState('Certificate of Completion');
  const [tplSubtitle, setTplSubtitle] = useState('Awarded for successfully completing the verified curriculum');
  const [tplSigName, setTplSigName] = useState('ABHI JOBS Academic Board');
  const [tplSigRole, setTplSigRole] = useState('Director of Career Readiness');
  const [tplPrimary, setTplPrimary] = useState('#102B4E');
  const [tplAccent, setTplAccent] = useState('#F47A24');
  const [tplDefault, setTplDefault] = useState(true);
  const [savingTpl, setSavingTpl] = useState(false);

  const loadLearningRecords = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const results = await Promise.allSettled([
        listCourseEnrolmentsAdmin(150),
        listVideoProgressAdmin(150),
        listAssessmentAttemptsAdmin(150),
        listPublicCertificatesAdmin(150),
        listCertificateTemplatesAdmin(),
      ]);
      if (results[0].status === 'fulfilled') setEnrolments(results[0].value);
      if (results[1].status === 'fulfilled') setVideoProgress(results[1].value);
      if (results[2].status === 'fulfilled') setAttempts(results[2].value);
      if (results[3].status === 'fulfilled') setIssuedCerts(results[3].value);
      if (results[4].status === 'fulfilled') setTemplates(results[4].value);

      const firstError = results.find((r) => r.status === 'rejected') as
        | PromiseRejectedResult
        | undefined;
      if (firstError) {
        setLoadError(
          'Some Learn with ABHI collections require Course Admin or Super Admin permissions in Firestore rules.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      [
        'learning-dashboard',
        'learning-enrolments',
        'learning-attempts',
        'learning-video-progress',
        'learning-certificates',
        'learning-cert-templates',
      ].includes(activeModule)
    ) {
      loadLearningRecords();
    }
  }, [activeModule]);

  // Courses / Modules / Lessons — reuse existing working AdminCourseContentManager
  if (
    activeModule === 'learning-courses' ||
    activeModule === 'learning-modules' ||
    activeModule === 'learning-lessons'
  ) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-[#081D36]">
              Learn with ABHI Curriculum ({LEARNING_CATALOGUE_COURSES.length} core courses)
            </span>
            <span className="text-slate-500 ml-2">
              Changes write directly to Firestore{' '}
              <code className="font-mono">/learning_courses</code>,{' '}
              <code className="font-mono">/modules</code>, and{' '}
              <code className="font-mono">/lessons</code> without altering student progress.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigatePublic('/learning')}
            className="text-xs font-semibold text-[#102B4E] hover:underline shrink-0 cursor-pointer"
          >
            Open Learner Portal →
          </button>
        </div>

        <AdminCourseContentManager
          adminUserId={adminSession.uid || 'admin'}
          onNotify={onNotify}
          onPreviewCourse={(slug) => onNavigatePublic(`/learning/courses/${slug}`)}
        />
      </div>
    );
  }

  // Quiz Management — reuse existing working AdminAssessmentManager
  if (activeModule === 'learning-quizzes') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs text-slate-600">
          <span className="font-bold text-[#081D36]">Protected Quiz Answer Keys: </span>
          Answer keys inside <code className="font-mono">/learning_courses/&#123;id&#125;/quiz_configs</code> are strictly denied to learners by Firestore security rules.
        </div>
        <AdminAssessmentManager onNotify={onNotify} />
      </div>
    );
  }

  // Enrolments Table
  if (activeModule === 'learning-enrolments') {
    return (
      <AdminDataTable<AdminCourseEnrolmentRecord>
        key="table-learning-enrolments"
        rows={enrolments}
        rowKey={(e) => e.id}
        loading={loading}
        error={loadError}
        csvExportFilename="course-enrolments"
        canExportCsv={canExportCsv}
        onCsvExported={handleCsvExported}
        searchPlaceholder="Search learner UID, course title, or status..."
        searchText={(e) => `${e.userId} ${e.courseTitle} ${e.courseSlug} ${e.status}`}
        headerActions={
          <button
            type="button"
            onClick={loadLearningRecords}
            className="min-h-[36px] px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#081D36] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
        columns={[
          {
            key: 'course',
            header: 'Course',
            sortValue: (e) => e.courseTitle,
            csvColumns: [
              { header: 'Course', value: (e) => e.courseTitle },
              { header: 'Learner UID', value: (e) => e.userId },
            ],
            render: (e) => (
              <div>
                <div className="font-semibold text-[#081D36]">{e.courseTitle}</div>
                <div className="text-[11px] font-mono text-slate-500">UID: {e.userId}</div>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            sortValue: (e) => e.status,
            csvValue: (e) => (e.status || 'enrolled').replace('_', ' '),
            render: (e) => (
              <span
                className={`text-xs font-semibold capitalize ${
                  e.status === 'completed'
                    ? 'text-emerald-700'
                    : e.status === 'in_progress'
                    ? 'text-[#102B4E]'
                    : 'text-slate-600'
                }`}
              >
                {(e.status || 'enrolled').replace('_', ' ')}
              </span>
            ),
          },
          {
            key: 'progress',
            header: 'Progress',
            align: 'right',
            sortValue: (e) => e.progressPercent,
            csvValue: (e) => `${e.progressPercent}%`,
            render: (e) => (
              <span className="font-mono tabular-nums font-semibold text-[#081D36]">
                {e.progressPercent}%
              </span>
            ),
          },
          {
            key: 'lessons',
            header: 'Lessons / Quizzes',
            align: 'right',
            csvColumns: [
              { header: 'Completed Lessons', value: (e) => e.completedLessonsCount },
              { header: 'Passed Quizzes', value: (e) => e.passedQuizzesCount },
            ],
            render: (e) => (
              <span className="font-mono tabular-nums text-xs text-slate-600">
                {e.completedLessonsCount} lessons · {e.passedQuizzesCount} quizzes
              </span>
            ),
          },
          {
            key: 'accessed',
            header: 'Last Active',
            sortValue: (e) => e.lastAccessedAt,
            csvValue: (e) => (e.lastAccessedAt ? e.lastAccessedAt.slice(0, 10) : ''),
            render: (e) => (
              <span className="font-mono text-xs text-slate-500">
                {e.lastAccessedAt ? e.lastAccessedAt.slice(0, 10) : '—'}
              </span>
            ),
          },
        ]}
        onRowClick={(e) =>
          onInspectRecord(
            e.courseTitle,
            `Enrolment · UID ${e.userId}`,
            e as unknown as Record<string, unknown>
          )
        }
        emptyTitle="No course enrolments found"
        emptyDescription="Learner enrolments in /users/{uid}/course_enrolments will appear here."
      />
    );
  }

  // Assessment Attempts Table
  if (activeModule === 'learning-attempts') {
    return (
      <AdminDataTable<AdminAssessmentAttemptRecord>
        key="table-learning-attempts"
        rows={attempts}
        rowKey={(a) => a.id}
        loading={loading}
        error={loadError}
        csvExportFilename="assessment-attempts"
        canExportCsv={canExportCsv}
        onCsvExported={handleCsvExported}
        searchPlaceholder="Search learner UID, course, or assessment title..."
        searchText={(a) => `${a.userId} ${a.courseTitle} ${a.assessmentTitle} ${a.assessmentType}`}
        columns={[
          {
            key: 'assessment',
            header: 'Assessment',
            csvColumns: [
              { header: 'Assessment', value: (a) => a.assessmentTitle },
              { header: 'Course', value: (a) => a.courseTitle },
              { header: 'Learner UID', value: (a) => a.userId },
            ],
            render: (a) => (
              <div>
                <div className="font-semibold text-[#081D36]">{a.assessmentTitle}</div>
                <div className="text-[11px] text-slate-500">
                  {a.courseTitle} · UID: <span className="font-mono">{a.userId}</span>
                </div>
              </div>
            ),
          },
          {
            key: 'type',
            header: 'Type',
            csvColumns: [
              { header: 'Type', value: (a) => (a.assessmentType || 'module_quiz').replace('_', ' ') },
              { header: 'Attempt', value: (a) => a.attemptNumber || 1 },
            ],
            render: (a) => (
              <span className="text-xs text-slate-700 capitalize">
                {(a.assessmentType || 'module_quiz').replace('_', ' ')} #{a.attemptNumber || 1}
              </span>
            ),
          },
          {
            key: 'score',
            header: 'Score',
            align: 'right',
            sortValue: (a) => a.scorePercent,
            csvColumns: [
              { header: 'Score (%)', value: (a) => a.scorePercent },
              { header: 'Correct Answers', value: (a) => a.correctAnswers },
              { header: 'Total Questions', value: (a) => a.totalQuestions },
            ],
            render: (a) => (
              <span className="font-mono tabular-nums font-semibold text-[#081D36]">
                {a.scorePercent}% ({a.correctAnswers}/{a.totalQuestions})
              </span>
            ),
          },
          {
            key: 'result',
            header: 'Outcome',
            csvValue: (a) => (a.passed ? 'Passed' : 'Not Passed'),
            render: (a) => (
              <span
                className={`text-xs font-semibold ${
                  a.passed ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {a.passed ? 'Passed' : 'Not Passed'}
              </span>
            ),
          },
          {
            key: 'submitted',
            header: 'Submitted',
            sortValue: (a) => a.submittedAt,
            csvValue: (a) => (a.submittedAt ? a.submittedAt.slice(0, 10) : ''),
            render: (a) => (
              <span className="font-mono text-xs text-slate-500">
                {a.submittedAt ? a.submittedAt.slice(0, 10) : '—'}
              </span>
            ),
          },
        ]}
        onRowClick={(a) =>
          onInspectRecord(
            a.assessmentTitle,
            `Attempt #${a.attemptNumber} · ${a.scorePercent}%`,
            a as unknown as Record<string, unknown>
          )
        }
        emptyTitle="No assessment attempts recorded yet"
        emptyDescription="Submitted quiz and final assessment attempts will appear here."
      />
    );
  }

  // Video Progress Table
  if (activeModule === 'learning-video-progress') {
    return (
      <AdminDataTable<AdminVideoProgressRecord>
        key="table-learning-video-progress"
        rows={videoProgress}
        rowKey={(v) => `${v.userId}_${v.id}`}
        loading={loading}
        error={loadError}
        csvExportFilename="video-progress"
        canExportCsv={canExportCsv}
        onCsvExported={handleCsvExported}
        searchPlaceholder="Search learner UID, course ID, lesson ID, or YouTube ID..."
        searchText={(v) => `${v.userId} ${v.courseId} ${v.lessonId} ${v.youtubeVideoId}`}
        columns={[
          {
            key: 'lesson',
            header: 'Course / Lesson',
            csvColumns: [
              { header: 'Course ID', value: (v) => v.courseId },
              { header: 'Lesson ID', value: (v) => v.lessonId },
              { header: 'Learner UID', value: (v) => v.userId },
              { header: 'YouTube Video ID', value: (v) => v.youtubeVideoId },
            ],
            render: (v) => (
              <div>
                <div className="font-semibold text-[#081D36] font-mono text-xs">
                  {v.courseId} / {v.lessonId}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  UID: {v.userId} · YT: {v.youtubeVideoId}
                </div>
              </div>
            ),
          },
          {
            key: 'watched',
            header: 'Max Watched',
            align: 'right',
            sortValue: (v) => v.maxPercentWatched,
            csvValue: (v) => `${Math.round(v.maxPercentWatched)}%`,
            render: (v) => (
              <span className="font-mono tabular-nums font-semibold text-[#081D36]">
                {Math.round(v.maxPercentWatched)}%
              </span>
            ),
          },
          {
            key: 'completion',
            header: 'Completion',
            csvValue: (v) =>
              v.completedViaPlayer
                ? 'Completed (Player)'
                : v.manualCompleted
                ? 'Completed (Manual)'
                : 'In Progress',
            render: (v) => (
              <span
                className={`text-xs font-semibold ${
                  v.completedViaPlayer || v.manualCompleted
                    ? 'text-emerald-700'
                    : 'text-slate-500'
                }`}
              >
                {v.completedViaPlayer
                  ? 'Completed (Player)'
                  : v.manualCompleted
                  ? 'Completed (Manual)'
                  : 'In Progress'}
              </span>
            ),
          },
          {
            key: 'updated',
            header: 'Updated',
            sortValue: (v) => v.updatedAt,
            csvValue: (v) => (v.updatedAt ? v.updatedAt.slice(0, 10) : ''),
            render: (v) => (
              <span className="font-mono text-xs text-slate-500">
                {v.updatedAt ? v.updatedAt.slice(0, 10) : '—'}
              </span>
            ),
          },
        ]}
        emptyTitle="No video progress telemetry yet"
        emptyDescription="YouTube playback completion records from /users/{uid}/video_progress will appear here."
      />
    );
  }

  // Certificates Queue + Issued Public Certificates Registry
  if (activeModule === 'learning-certificates') {
    const handleToggleCertStatus = (cert: AdminIssuedCertificateRecord) => {
      const nextStatus: 'valid' | 'revoked' = cert.status === 'valid' ? 'revoked' : 'valid';
      onRequestConfirm({
        title: nextStatus === 'revoked' ? 'Revoke Issued Certificate?' : 'Restore Certificate Validity?',
        description:
          nextStatus === 'revoked'
            ? 'Revoking sets status = "revoked" on /public_certificates/{certificateId}. Public verification lookups will immediately reflect revocation.'
            : 'Restoring sets status = "valid" on /public_certificates/{certificateId}.',
        confirmLabel: nextStatus === 'revoked' ? 'Revoke Certificate' : 'Restore Certificate',
        tone: nextStatus === 'revoked' ? 'danger' : 'primary',
        details: [
          { label: 'Certificate ID', value: cert.certificateId },
          { label: 'Candidate', value: cert.candidateName },
          { label: 'Course', value: cert.courseTitle },
          { label: 'Issuance Method', value: cert.issuanceMethod },
        ],
        onConfirm: async () => {
          try {
            await setPublicCertificateStatusAdmin(cert.certificateId, nextStatus);
            onNotify(
              'success',
              'Certificate Status Updated',
              `${cert.certificateId} marked as ${nextStatus}.`
            );
            await loadLearningRecords();
          } catch (err: any) {
            onNotify('error', 'Update Failed', err?.message || 'Could not update certificate.');
          }
        },
      });
    };

    return (
      <div className="space-y-6">
        <AdminCertificateQueuePanel adminUid={adminSession.uid || ''} onNotify={onNotify} />

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#081D36]">
            Issued Public Certificates Registry (/public_certificates)
          </h3>
          <AdminDataTable<AdminIssuedCertificateRecord>
            key="table-learning-certificates"
            rows={issuedCerts}
            rowKey={(c) => c.certificateId}
            loading={loading}
            error={loadError}
            csvExportFilename="issued-certificates"
            canExportCsv={canExportCsv}
            onCsvExported={handleCsvExported}
            searchPlaceholder="Search certificate ID, candidate name, or course..."
            searchText={(c) => `${c.certificateId} ${c.candidateName} ${c.courseTitle} ${c.issuanceMethod}`}
            columns={[
              {
                key: 'certId',
                header: 'Certificate ID',
                csvValue: (c) => c.certificateId,
                render: (c) => (
                  <span className="font-mono text-xs font-bold text-[#102B4E]">
                    {c.certificateId}
                  </span>
                ),
              },
              {
                key: 'candidate',
                header: 'Learner & Course',
                csvColumns: [
                  { header: 'Candidate Name', value: (c) => c.candidateName },
                  { header: 'Course', value: (c) => c.courseTitle },
                ],
                render: (c) => (
                  <div>
                    <div className="font-semibold text-[#081D36]">{c.candidateName}</div>
                    <div className="text-[11px] text-slate-500">{c.courseTitle}</div>
                  </div>
                ),
              },
              {
                key: 'method',
                header: 'Issuance',
                csvValue: (c) => c.issuanceMethod,
                render: (c) => (
                  <span className="font-mono text-xs text-slate-600">{c.issuanceMethod}</span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                csvValue: (c) => c.status,
                render: (c) => (
                  <span
                    className={`text-xs font-semibold capitalize ${
                      c.status === 'valid' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {c.status}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Action',
                align: 'right',
                excludeFromCsv: true,
                render: (c) => (
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleToggleCertStatus(c);
                    }}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                      c.status === 'valid'
                        ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {c.status === 'valid' ? 'Revoke' : 'Restore'}
                  </button>
                ),
              },
            ]}
            emptyTitle="No issued certificates in /public_certificates"
            emptyDescription="Approved or server-signed certificates will appear here."
          />
        </div>
      </div>
    );
  }

  // Certificate Templates CRUD (/certificate_templates)
  if (activeModule === 'learning-cert-templates') {
    const handleSaveTemplate = async (e: React.FormEvent) => {
      e.preventDefault();
      setSavingTpl(true);
      try {
        await upsertCertificateTemplateAdmin({
          id: tplId,
          name: tplName,
          organizationName: tplOrg,
          certificateTitle: tplTitle,
          subtitle: tplSubtitle,
          signatoryName: tplSigName,
          signatoryDesignation: tplSigRole,
          primaryColor: tplPrimary,
          accentColor: tplAccent,
          isDefault: tplDefault,
          updatedBy: adminSession.uid || '',
        });
        onNotify('success', 'Template Saved', `Saved /certificate_templates/${tplId}.`);
        await loadLearningRecords();
      } catch (err: any) {
        onNotify('error', 'Save Failed', err?.message || 'Firestore rejected template update.');
      } finally {
        setSavingTpl(false);
      }
    };

    const handleDeleteTemplate = (tpl: AdminCertificateTemplateRecord) => {
      onRequestConfirm({
        title: 'Delete Certificate Template?',
        description: `Removes /certificate_templates/${tpl.id} from Firestore.`,
        confirmLabel: 'Delete Template',
        tone: 'danger',
        onConfirm: async () => {
          try {
            await deleteCertificateTemplateAdmin(tpl.id);
            onNotify('info', 'Template Deleted', `Removed ${tpl.name}.`);
            await loadLearningRecords();
          } catch (err: any) {
            onNotify('error', 'Delete Failed', err?.message || 'Could not delete template.');
          }
        },
      });
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form
          onSubmit={handleSaveTemplate}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-3.5"
        >
          <h3 className="text-sm font-bold text-[#081D36] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#102B4E]" />
            <span>Create / Edit Certificate Template (/certificate_templates)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#081D36] mb-1">Template ID *</label>
              <input
                type="text"
                required
                value={tplId}
                onChange={(e) => setTplId(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081D36] mb-1">Template Name *</label>
              <input
                type="text"
                required
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081D36] mb-1">Organization *</label>
              <input
                type="text"
                required
                value={tplOrg}
                onChange={(e) => setTplOrg(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081D36] mb-1">Certificate Title *</label>
              <input
                type="text"
                required
                value={tplTitle}
                onChange={(e) => setTplTitle(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081D36] mb-1">Signatory Name</label>
              <input
                type="text"
                value={tplSigName}
                onChange={(e) => setTplSigName(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081D36] mb-1">Designation</label>
              <input
                type="text"
                value={tplSigRole}
                onChange={(e) => setTplSigRole(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081D36] mb-1">Primary Color</label>
              <input
                type="text"
                value={tplPrimary}
                onChange={(e) => setTplPrimary(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081D36] mb-1">Accent Color</label>
              <input
                type="text"
                value={tplAccent}
                onChange={(e) => setTplAccent(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#081D36] mb-1">Subtitle</label>
            <input
              type="text"
              value={tplSubtitle}
              onChange={(e) => setTplSubtitle(e.target.value)}
              className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={tplDefault}
              onChange={(e) => setTplDefault(e.target.checked)}
            />
            <span>Set as default certificate template</span>
          </label>
          <button
            type="submit"
            disabled={savingTpl}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            {savingTpl ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Save Template</span>
          </button>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#081D36]">
              Stored Templates ({templates.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {templates.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#081D36] truncate">
                    {t.name} {t.isDefault ? '· Default' : ''}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {t.organizationName} · <span className="font-mono">{t.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTplId(t.id);
                      setTplName(t.name);
                      setTplOrg(t.organizationName);
                      setTplTitle(t.certificateTitle);
                      setTplSubtitle(t.subtitle);
                      setTplSigName(t.signatoryName);
                      setTplSigRole(t.signatoryDesignation);
                      setTplPrimary(t.primaryColor);
                      setTplAccent(t.accentColor);
                      setTplDefault(t.isDefault);
                    }}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-[#102B4E] cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(t)}
                    aria-label={`Delete ${t.name}`}
                    className="min-h-[34px] px-2 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                No custom certificate templates stored in Firestore yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Public Certificate Verification Lookup
  if (activeModule === 'learning-cert-verify') {
    const handleVerifyLookup = async (e: React.FormEvent) => {
      e.preventDefault();
      setVerifying(true);
      try {
        const found = await verifyPublicCertificateById(verifyInput);
        if (found) {
          setVerifyResult({ state: 'found', cert: found });
        } else {
          setVerifyResult({ state: 'not_found', id: verifyInput.trim().toUpperCase() });
        }
      } catch (err: any) {
        setVerifyResult({ state: 'error', message: err?.message || 'Verification failed.' });
      } finally {
        setVerifying(false);
      }
    };

    return (
      <div className="max-w-2xl space-y-4">
        <form
          onSubmit={handleVerifyLookup}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
        >
          <div>
            <h3 className="text-sm font-bold text-[#081D36]">
              Public Certificate Registry Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Performs a direct single-document lookup against{' '}
              <code className="font-mono">/public_certificates/&#123;certificateId&#125;</code>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="Enter Certificate ID (e.g. ABHI-2026-XXXXXXXX)"
                className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:border-[#102B4E]"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Verify ID</span>
            </button>
          </div>
        </form>

        {verifyResult.state === 'found' && (
          <div
            className={`rounded-xl border p-5 space-y-2 ${
              verifyResult.cert.status === 'valid'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-[#081D36]">
              {verifyResult.cert.status === 'valid' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              )}
              <span>
                {verifyResult.cert.status === 'valid'
                  ? 'Valid Certificate Record Found'
                  : 'Certificate Revoked'}
              </span>
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <p>Certificate ID: <span className="font-mono font-semibold">{verifyResult.cert.certificateId}</span></p>
              <p>Candidate: <span className="font-semibold">{verifyResult.cert.candidateName}</span></p>
              <p>Course: <span className="font-semibold">{verifyResult.cert.courseTitle}</span></p>
              <p>Issue Date: <span className="font-mono">{(verifyResult.cert.issueDate || '').slice(0, 10) || '—'}</span></p>
              <p>Issuance Method: <span className="font-mono">{verifyResult.cert.issuanceMethod}</span></p>
            </div>
          </div>
        )}

        {verifyResult.state === 'not_found' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            No certificate record found for <span className="font-mono font-semibold">{verifyResult.id}</span> in <code className="font-mono">/public_certificates</code>.
          </div>
        )}

        {verifyResult.state === 'error' && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
            {verifyResult.message}
          </div>
        )}
      </div>
    );
  }

  // Default: Learning Dashboard Overview
  const completedCount = enrolments.filter((e) => e.status === 'completed').length;
  const passedAttempts = attempts.filter((a) => a.passed).length;
  const passRate = attempts.length > 0 ? Math.round((passedAttempts / attempts.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateModule('learning-courses')}
          className="text-left bg-white rounded-xl border border-slate-200 hover:border-[#102B4E]/50 p-4 cursor-pointer"
        >
          <div className="text-xs text-slate-500 font-medium">Catalog Courses</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#081D36] mt-1">
            {LEARNING_CATALOGUE_COURSES.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Learn with ABHI curriculum</div>
        </button>
        <button
          type="button"
          onClick={() => onNavigateModule('learning-enrolments')}
          className="text-left bg-white rounded-xl border border-slate-200 hover:border-[#102B4E]/50 p-4 cursor-pointer"
        >
          <div className="text-xs text-slate-500 font-medium">Loaded Enrolments</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#081D36] mt-1">
            {enrolments.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {completedCount} completed
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigateModule('learning-attempts')}
          className="text-left bg-white rounded-xl border border-slate-200 hover:border-[#102B4E]/50 p-4 cursor-pointer"
        >
          <div className="text-xs text-slate-500 font-medium">Assessment Pass Rate</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#081D36] mt-1">
            {passRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {passedAttempts} / {attempts.length} attempts passed
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigateModule('learning-certificates')}
          className="text-left bg-white rounded-xl border border-slate-200 hover:border-[#102B4E]/50 p-4 cursor-pointer"
        >
          <div className="text-xs text-slate-500 font-medium">Public Certificates</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#081D36] mt-1">
            {issuedCerts.filter((c) => c.status === 'valid').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {issuedCerts.filter((c) => c.status === 'revoked').length} revoked
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#081D36] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#102B4E]" />
          <span>Learn with ABHI Active Course Catalog</span>
        </h3>
        <div className="divide-y divide-slate-100">
          {LEARNING_CATALOGUE_COURSES.map((course) => {
            const count = enrolments.filter((e) => e.courseId === course.id).length;
            return (
              <div key={course.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-semibold text-[#081D36]">{course.title}</div>
                  <div className="text-slate-500">
                    {course.categoryName} · {course.level} · {course.modules.length} modules · {course.estimatedDuration}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono tabular-nums text-slate-600">{count} enrolments</span>
                  <button
                    type="button"
                    onClick={() => onNavigateModule('learning-lessons')}
                    className="text-[#102B4E] font-semibold hover:underline cursor-pointer"
                  >
                    Manage Content
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
