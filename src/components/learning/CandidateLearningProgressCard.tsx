import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  GraduationCap,
  XCircle,
} from 'lucide-react';
import { loadCandidateEnrolments } from '../../services/courseEnrolmentService';
import { loadCandidateAssessmentAttempts } from '../../services/assessmentService';
import { loadCandidateCertificates } from '../../services/certificateService';
import { downloadCertificatePdf } from '../../services/certificatePdfGenerator';
import { CertificateViewerModal } from './CertificateDocument';
import { getCourseById } from '../../data/learningCatalog';
import {
  cleanupOwnLegacyCourseRecords,
  purgeLegacyLocalLearningData,
} from '../../services/learningResetService';
import {
  AssessmentAttemptRecord,
  CourseCertificateRecord,
  CourseEnrolmentRecord,
} from '../../types/learning';

interface CandidateLearningProgressCardProps {
  userId: string;
  navigate: (route: string) => void;
}

interface AggregatedAssessmentRow {
  key: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  assessmentTitle: string;
  assessmentType: 'module_quiz' | 'final_assessment';
  bestScorePercent: number;
  latestScorePercent: number;
  passPercentage: number;
  passed: boolean;
  attemptsCount: number;
  latestSubmittedAt: string;
}

export const CandidateLearningProgressCard: React.FC<CandidateLearningProgressCardProps> = ({
  userId,
  navigate,
}) => {
  const [enrolments, setEnrolments] = useState<CourseEnrolmentRecord[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttemptRecord[]>([]);
  const [certificates, setCertificates] = useState<CourseCertificateRecord[]>([]);
  const [viewingCert, setViewingCert] = useState<CourseCertificateRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    purgeLegacyLocalLearningData(false);

    cleanupOwnLegacyCourseRecords(userId)
      .catch(() => 0)
      .then(() =>
        Promise.all([
          loadCandidateEnrolments(userId),
          loadCandidateAssessmentAttempts(userId),
          loadCandidateCertificates(userId),
        ])
      )
      .then(([enrRes, attRes, certRes]) => {
        if (!active) return;
        setEnrolments(enrRes.enrolments);
        setAttempts(attRes.attempts);
        setCertificates(certRes.certificates);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const certByCourseId = useMemo(() => {
    const map = new Map<string, CourseCertificateRecord>();
    certificates.forEach((c) => map.set(c.courseId, c));
    return map;
  }, [certificates]);

  const completedCourses = useMemo(
    () => enrolments.filter((e) => e.status === 'completed'),
    [enrolments]
  );

  const activeCourses = useMemo(
    () => enrolments.filter((e) => e.status !== 'completed'),
    [enrolments]
  );

  const assessmentSummaries = useMemo<AggregatedAssessmentRow[]>(() => {
    const grouped = new Map<string, AssessmentAttemptRecord[]>();
    for (const att of attempts) {
      const key =
        att.assessmentType === 'final_assessment'
          ? `final::${att.courseId}`
          : `quiz::${att.courseId}::${att.moduleId || att.assessmentTitle}`;
      const list = grouped.get(key) || [];
      list.push(att);
      grouped.set(key, list);
    }

    const rows: AggregatedAssessmentRow[] = [];
    for (const [key, list] of grouped.entries()) {
      const sorted = [...list].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      const latest = sorted[0];
      const bestScore = sorted.reduce((max, item) => Math.max(max, item.scorePercent), 0);
      const passed = sorted.some((item) => item.passed);
      const matchedCourse = getCourseById(latest.courseId);

      rows.push({
        key,
        courseId: latest.courseId,
        courseSlug: matchedCourse?.slug || '',
        courseTitle: latest.courseTitle || matchedCourse?.title || 'Learn with ABHI Course',
        assessmentTitle: latest.assessmentTitle,
        assessmentType: latest.assessmentType,
        bestScorePercent: bestScore,
        latestScorePercent: latest.scorePercent,
        passPercentage: latest.passPercentage,
        passed,
        attemptsCount: sorted.length,
        latestSubmittedAt: latest.submittedAt,
      });
    }

    return rows.sort(
      (a, b) =>
        new Date(b.latestSubmittedAt).getTime() - new Date(a.latestSubmittedAt).getTime()
    );
  }, [attempts]);

  const passedFinalCount = useMemo(
    () => assessmentSummaries.filter((r) => r.assessmentType === 'final_assessment' && r.passed).length,
    [assessmentSummaries]
  );

  const hasAnyLearningData = enrolments.length > 0 || assessmentSummaries.length > 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap className="w-4 h-4 text-[#F47A24] shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-[#102B4E] truncate">
            My Learning
          </h2>
        </div>

        <button
          type="button"
          onClick={() => navigate('/learning')}
          className="text-xs font-bold text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer shrink-0"
        >
          Learn with ABHI &rarr;
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-[#778397]">
          Loading your learning progress...
        </div>
      ) : hasAnyLearningData ? (
        <div className="space-y-5">
          {/* Concise Unboxed Summary Line */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#566479] tabular-nums">
            <span>
              <strong className="text-[#102B4E]">{enrolments.length}</strong> enrolled
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-emerald-700">{completedCourses.length}</strong> completed
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-[#102B4E]">{passedFinalCount}</strong> final{' '}
              {passedFinalCount === 1 ? 'assessment' : 'assessments'} passed
            </span>
          </div>

          {/* Completed Courses */}
          {completedCourses.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Completed Courses ({completedCourses.length})</span>
              </p>
              <div className="space-y-2">
                {completedCourses.map((course) => {
                  const cert = certByCourseId.get(course.courseId);
                  return (
                    <div
                      key={course.courseId}
                      className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-[#102B4E] truncate">
                            {course.courseTitle}
                          </h3>
                          <p className="text-[11px] text-emerald-800 font-medium tabular-nums mt-0.5">
                            Completed
                            {typeof course.bestFinalScorePercent === 'number'
                              ? ` · Final Score ${course.bestFinalScorePercent}%`
                              : ''}
                            {cert ? ` · ID ${cert.certificateId}` : ''}
                          </p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {cert && (
                          <>
                            <button
                              type="button"
                              onClick={() => setViewingCert(cert)}
                              className="flex-1 min-h-[38px] px-2.5 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#C59B43]" />
                              <span>View Certificate</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void downloadCertificatePdf(cert)}
                              className="min-h-[38px] px-3 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white border border-emerald-200 hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                              aria-label={`Download PDF certificate for ${course.courseTitle}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/learning/courses/${course.courseSlug}/learn`)}
                          className={`${
                            cert ? 'w-full' : 'w-full'
                          } min-h-[38px] inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white border border-emerald-200 hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold transition-colors cursor-pointer`}
                        >
                          <span>Review Course</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Courses */}
          {activeCourses.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#778397]">
                In Progress ({activeCourses.length})
              </p>
              <div className="space-y-2.5">
                {activeCourses.slice(0, 4).map((course) => (
                  <div
                    key={course.courseId}
                    className="p-3.5 rounded-2xl border border-[#E5EAF0] bg-[#FAFBFD] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-[#102B4E] truncate">
                          {course.courseTitle}
                        </h3>
                        <div className="text-[11px] text-[#778397] mt-0.5 tabular-nums">
                          {course.completedLessonIds.length} lessons ·{' '}
                          {course.passedModuleQuizIds.length} quizzes passed
                          {typeof course.bestFinalScorePercent === 'number'
                            ? ` · Final ${course.bestFinalScorePercent}%`
                            : ''}
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#102B4E] tabular-nums shrink-0">
                        {course.progressPercent}%
                      </span>
                    </div>

                    <div className="w-full bg-[#E5EAF0] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#F47A24] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${course.progressPercent}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/learning/courses/${course.courseSlug}/learn`)}
                      className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white border border-[#D4DCE6] hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>Continue Learning</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz & Final Assessment Scores */}
          {assessmentSummaries.length > 0 && (
            <div className="space-y-2.5 pt-1 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#778397] flex items-center gap-1.5 pt-2">
                <ClipboardCheck className="w-3.5 h-3.5 text-[#F47A24]" />
                <span>Quiz &amp; Assessment Results</span>
              </p>

              <div className="divide-y divide-[#E5EAF0] border-y border-[#E5EAF0]">
                {assessmentSummaries.slice(0, 6).map((row) => (
                  <div
                    key={row.key}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-bold text-[#102B4E] truncate">
                        {row.assessmentTitle}
                      </p>
                      <p className="text-[11px] text-[#778397] truncate">
                        {row.courseTitle} ·{' '}
                        {row.assessmentType === 'final_assessment' ? 'Final Assessment' : 'Module Quiz'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#566479] tabular-nums pt-0.5">
                        <span>
                          {row.attemptsCount} {row.attemptsCount === 1 ? 'attempt' : 'attempts'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Best {row.bestScorePercent}%</span>
                        {row.courseSlug && (
                          <>
                            <span aria-hidden="true">·</span>
                            <button
                              type="button"
                              onClick={() => navigate(`/learning/courses/${row.courseSlug}/learn`)}
                              className="font-semibold text-[#102B4E] hover:text-[#F47A24] underline underline-offset-2 cursor-pointer"
                            >
                              Open
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-xs font-extrabold text-[#102B4E] tabular-nums">
                        {row.latestScorePercent}%
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          row.passed ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {row.passed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Passed</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Retry</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-[#FFF4EC] border border-[#F47A24]/20 flex items-center justify-center text-[#F47A24]">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-xs sm:text-sm font-bold text-[#102B4E]">
              Your learning journey starts here.
            </div>
            <p className="text-[11px] text-[#566479] max-w-xs mx-auto">
              Enrol in free practical courses, complete module quizzes, and pass final assessments to demonstrate your skills.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/learning')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer min-h-[40px]"
          >
            <span>Explore Learn with ABHI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <CertificateViewerModal
        certificate={viewingCert}
        onClose={() => setViewingCert(null)}
        onVerifyCertificate={(certId) => navigate(`/verify-certificate/${certId}`)}
      />
    </div>
  );
};

export default CandidateLearningProgressCard;
