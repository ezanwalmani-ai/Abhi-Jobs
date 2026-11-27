import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderGit2,
  Globe,
  GraduationCap,
  Hash,
  History,
  Languages as LanguagesIcon,
  Layers,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import type {
  Application,
  CandidateDocumentRecord,
  CandidateProfile,
  CandidateRecruitmentStatus,
  Interview,
} from '../../types';
import {
  addCandidateInternalNoteAdmin,
  fetchCandidateFullDossierAdmin,
  recordAdminAuditAction,
  updateCandidateRecruitmentStatusAdmin,
  type AdminAssessmentAttemptRecord,
  type AdminCandidateFullDossier,
  type AdminCourseEnrolmentRecord,
  type AdminIssuedCertificateRecord,
  type AdminUserRecord,
} from '../../services/adminPanelService';
import {
  downloadAuthorizedCandidateDocument,
  fetchAuthorizedCandidateDocumentBlob,
} from '../../services/candidateDocumentService';
import {
  CANDIDATE_ID_LABEL,
  ensureCandidateCodeAssigned,
  isValidCandidateCode,
} from '../../services/candidateIdService';
import type { ResolvedAdminSession } from '../../services/adminRbacService';
import type { AdminModuleId } from './adminNavConfig';
import type { AdminConfirmDialogProps } from './AdminConfirmDialog';
import {
  calculateProfileCompletion,
  formatDisplayDate,
  formatFileSize,
  getNormalizedDetailedSkills,
  sanitizeExternalUrl,
  sortEducationReverseChronological,
  sortExperiencesReverseChronological,
} from '../../utils/profileCompletion';

export interface AdminCandidateDetailViewProps {
  candidate: CandidateProfile;
  userRecord?: AdminUserRecord;
  adminSession: ResolvedAdminSession;
  applications: Application[];
  interviews: Interview[];
  enrolments: AdminCourseEnrolmentRecord[];
  attempts: AdminAssessmentAttemptRecord[];
  issuedCerts: AdminIssuedCertificateRecord[];
  onBack: () => void;
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onRequestConfirm: (
    config: Omit<AdminConfirmDialogProps, 'isOpen' | 'busy' | 'onCancel'>
  ) => void;
  onNavigateModule: (moduleId: AdminModuleId) => void;
}

const RECRUITMENT_STATUS_OPTIONS: CandidateRecruitmentStatus[] = [
  'Active',
  'Under Review',
  'Shortlisted',
  'Interviewing',
  'Placed',
  'On Hold',
  'Archived',
];

const NOTE_CATEGORIES = ['Screening', 'Interview', 'Verification', 'General'] as const;

function formatDateTime(value?: string): string {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTimeFull(value?: string): string {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function displayText(value?: string | number | null, fallback = 'Not provided'): string {
  if (value === undefined || value === null) return fallback;
  const s = String(value).trim();
  return s ? s : fallback;
}

function formatSalaryAmount(amount?: number, currency = 'INR'): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return '';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en-IN')}`;
  }
}

const SectionCard: React.FC<{
  id?: string;
  code?: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}> = ({ id, code, title, subtitle, icon, rightSlot, children }) => (
  <section
    id={id}
    className="bg-white rounded-xl border border-[#E5EAF0] shadow-[0_1px_2px_rgba(16,43,78,0.03)] overflow-hidden scroll-mt-24"
  >
    <div className="px-4 sm:px-5 py-3.5 border-b border-[#E5EAF0] bg-[#FAFBFD] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#102B4E]/8 text-[#102B4E] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {code && (
              <span className="text-[11px] font-mono font-bold text-[#F47A24] uppercase tracking-wider shrink-0">
                {code}
              </span>
            )}
            <h3 className="text-sm sm:text-[15px] font-bold text-[#081D36] truncate">{title}</h3>
          </div>
          {subtitle && <p className="text-[11px] text-[#64748B] truncate">{subtitle}</p>}
        </div>
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

const FieldRow: React.FC<{ label: string; value?: React.ReactNode; mono?: boolean }> = ({
  label,
  value,
  mono = false,
}) => (
  <div className="min-w-0">
    <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">{label}</dt>
    <dd
      className={`mt-0.5 text-xs sm:text-[13.5px] text-[#081D36] break-words ${
        mono ? 'font-mono tabular-nums' : 'font-medium'
      }`}
    >
      {value ?? <span className="text-slate-400 font-normal">Not provided</span>}
    </dd>
  </div>
);

export const AdminCandidateDetailView: React.FC<AdminCandidateDetailViewProps> = ({
  candidate,
  userRecord,
  adminSession,
  applications,
  interviews,
  enrolments,
  attempts,
  issuedCerts,
  onBack,
  onRefresh,
  onNotify,
  onRequestConfirm,
  onNavigateModule,
}) => {
  const candidateUid = candidate.userId || candidate.id;
  const candidateCode = isValidCandidateCode(candidate.candidateCode)
    ? candidate.candidateCode.trim()
    : isValidCandidateCode(userRecord?.candidateCode)
    ? userRecord!.candidateCode!.trim()
    : undefined;

  const canManageCandidates = Boolean(adminSession.permissions?.canManageCandidates);
  const accountStatus = userRecord?.status || 'active';

  const [dossier, setDossier] = useState<AdminCandidateFullDossier>({
    documents: [],
    internalNotes: [],
    careerAssessments: [],
    structuredResumes: [],
    auditHistory: [],
  });
  const [loadingDossier, setLoadingDossier] = useState(true);
  const [assigningCode, setAssigningCode] = useState(false);

  // Private internal note form
  const [noteCategory, setNoteCategory] = useState<string>('Screening');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Secure document preview modal
  const [previewDoc, setPreviewDoc] = useState<{
    doc: CandidateDocumentRecord;
    objectUrl: string;
    mimeType: string;
  } | null>(null);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const notesSectionRef = useRef<HTMLDivElement | null>(null);
  const loggedViewRef = useRef<string>('');

  const loadDossier = useCallback(async () => {
    setLoadingDossier(true);
    try {
      const data = await fetchCandidateFullDossierAdmin(candidateUid);
      setDossier(data);
    } finally {
      setLoadingDossier(false);
    }
  }, [candidateUid]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  // Audit log view once per candidate switch
  useEffect(() => {
    if (!candidateUid || loggedViewRef.current === candidateUid) return;
    loggedViewRef.current = candidateUid;
    recordAdminAuditAction({
      action: 'candidate_profile_viewed',
      targetType: 'candidate',
      targetId: candidateUid,
      candidateCode,
      summary: `Viewed complete candidate profile (${candidate.name || candidateUid}).`,
    });
  }, [candidateUid, candidateCode, candidate.name]);

  // Revoke object URL on unmount / preview close
  useEffect(() => {
    return () => {
      if (previewDoc?.objectUrl) {
        URL.revokeObjectURL(previewDoc.objectUrl);
      }
    };
  }, [previewDoc]);

  const completionReport = useMemo(() => calculateProfileCompletion(candidate), [candidate]);
  const normalizedSkills = useMemo(() => getNormalizedDetailedSkills(candidate), [candidate]);
  const primarySkills = useMemo(() => normalizedSkills.filter((s) => s.isPrimary), [normalizedSkills]);
  const secondarySkills = useMemo(() => normalizedSkills.filter((s) => !s.isPrimary), [normalizedSkills]);
  const sortedExperiences = useMemo(
    () => sortExperiencesReverseChronological(candidate.experiences || []),
    [candidate.experiences]
  );
  const sortedEducation = useMemo(
    () => sortEducationReverseChronological(candidate.education || []),
    [candidate.education]
  );

  const candidateApplications = useMemo(() => {
    const emailLower = (candidate.email || '').trim().toLowerCase();
    return applications
      .filter(
        (a) =>
          a.candidateId === candidateUid ||
          (emailLower && (a.candidateEmail || '').trim().toLowerCase() === emailLower)
      )
      .sort((a, b) => (b.appliedAt || b.appliedDate || '').localeCompare(a.appliedAt || a.appliedDate || ''));
  }, [applications, candidateUid, candidate.email]);

  const candidateInterviewsByAppId = useMemo(() => {
    const map = new Map<string, Interview>();
    for (const iv of interviews) {
      if (iv.candidateId === candidateUid && iv.applicationId) {
        map.set(iv.applicationId, iv);
      }
    }
    return map;
  }, [interviews, candidateUid]);

  const candidateEnrolments = useMemo(
    () => enrolments.filter((en) => en.userId === candidateUid),
    [enrolments, candidateUid]
  );

  const candidateAttempts = useMemo(
    () => attempts.filter((att) => att.userId === candidateUid),
    [attempts, candidateUid]
  );

  const candidateCertificates = useMemo(() => {
    const lowerName = (candidate.name || '').trim().toLowerCase();
    return issuedCerts.filter(
      (cert) =>
        (cert.userId && cert.userId === candidateUid) ||
        (!cert.userId && lowerName && (cert.candidateName || '').trim().toLowerCase() === lowerName)
    );
  }, [issuedCerts, candidateUid, candidate.name]);

  const resumeDocuments = useMemo(
    () => dossier.documents.filter((d) => d.category === 'resume'),
    [dossier.documents]
  );
  const otherDocuments = useMemo(
    () => dossier.documents.filter((d) => d.category !== 'resume'),
    [dossier.documents]
  );
  const latestResumeDoc = useMemo(
    () => resumeDocuments.find((d) => d.isLatest) || resumeDocuments[0] || null,
    [resumeDocuments]
  );

  const hasResumeUploaded = Boolean(
    latestResumeDoc || (candidate.resumeName && candidate.resumeName.trim()) || candidate.resumeDocId
  );

  const latestAssessment = dossier.careerAssessments[0] || null;
  const assessmentCompleted = Boolean(
    latestAssessment &&
      (latestAssessment.status === 'completed' ||
        typeof latestAssessment.readinessScore === 'number' ||
        Boolean(latestAssessment.completedAt))
  );

  const currentRecruitmentStatus: CandidateRecruitmentStatus =
    candidate.recruitmentStatus || 'Active';

  const handleAssignMissingId = async () => {
    if (!canManageCandidates || assigningCode) return;
    setAssigningCode(true);
    try {
      const res = await ensureCandidateCodeAssigned(candidateUid);
      if (res.ok && res.candidateCode) {
        await recordAdminAuditAction({
          action: 'candidate_id_assigned_by_admin',
          targetType: 'candidate',
          targetId: candidateUid,
          candidateCode: res.candidateCode,
          summary: `Assigned ${CANDIDATE_ID_LABEL} ${res.candidateCode} to candidate.`,
        });
        onNotify(
          'success',
          `${CANDIDATE_ID_LABEL} Assigned`,
          `Assigned ${CANDIDATE_ID_LABEL}: ${res.candidateCode} to ${candidate.name}.`
        );
        await onRefresh();
        await loadDossier();
      } else {
        onNotify(
          'error',
          res.capacityExhausted ? 'Candidate ID Capacity Reached' : 'Assignment Failed',
          res.error || 'Could not assign a 4-digit Candidate ID.'
        );
      }
    } finally {
      setAssigningCode(false);
    }
  };

  const handleStatusChange = (nextStatus: CandidateRecruitmentStatus) => {
    if (nextStatus === currentRecruitmentStatus) return;
    onRequestConfirm({
      title: `Update Recruitment Status to "${nextStatus}"?`,
      description:
        'This updates only the internal recruitment workflow status on /candidates/{uid}. Candidate-submitted profile details remain untouched and this action is recorded in the admin audit log.',
      confirmLabel: `Set to ${nextStatus}`,
      tone: nextStatus === 'Archived' ? 'danger' : 'primary',
      details: [
        { label: 'Candidate', value: candidate.name || candidateUid },
        { label: CANDIDATE_ID_LABEL, value: candidateCode || 'Unassigned' },
        { label: 'Current Status', value: currentRecruitmentStatus },
        { label: 'New Status', value: nextStatus },
      ],
      onConfirm: async () => {
        try {
          await updateCandidateRecruitmentStatusAdmin({
            candidateUid,
            candidateCode,
            status: nextStatus,
          });
          onNotify(
            'success',
            'Recruitment Status Updated',
            `${candidate.name} is now marked "${nextStatus}".`
          );
          await onRefresh();
          await loadDossier();
        } catch (err: any) {
          onNotify(
            'error',
            'Status Update Failed',
            err?.message || 'Could not update candidate recruitment status.'
          );
        }
      },
    });
  };

  const handlePreviewDocument = async (docItem: CandidateDocumentRecord) => {
    setLoadingDocId(docItem.id);
    try {
      const result = await fetchAuthorizedCandidateDocumentBlob({
        uid: candidateUid,
        docId: docItem.id,
        disposition: 'inline',
      });
      if (previewDoc?.objectUrl) {
        URL.revokeObjectURL(previewDoc.objectUrl);
      }
      setPreviewDoc({
        doc: docItem,
        objectUrl: result.objectUrl,
        mimeType: result.mimeType,
      });
    } catch (err: any) {
      onNotify('error', 'Document Preview Unavailable', err?.message || 'Could not load document.');
    } finally {
      setLoadingDocId(null);
    }
  };

  const handleDownloadDocument = async (docItem: CandidateDocumentRecord) => {
    setLoadingDocId(docItem.id);
    try {
      await downloadAuthorizedCandidateDocument({
        uid: candidateUid,
        docId: docItem.id,
        filename: docItem.originalFilename,
      });
      onNotify('success', 'Download Started', `Downloading ${docItem.originalFilename}.`);
    } catch (err: any) {
      onNotify('error', 'Download Failed', err?.message || 'Could not download document.');
    } finally {
      setLoadingDocId(null);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !canManageCandidates) return;
    setSavingNote(true);
    try {
      const saved = await addCandidateInternalNoteAdmin({
        candidateUid,
        candidateCode,
        authorUid: adminSession.uid || '',
        authorEmail: adminSession.email || '',
        authorName: adminSession.displayName || adminSession.email || 'Admin',
        text: noteText,
        category: noteCategory,
      });
      setDossier((prev) => ({
        ...prev,
        internalNotes: [saved, ...prev.internalNotes],
      }));
      setNoteText('');
      onNotify('success', 'Internal Note Saved', 'Private recruitment note added and logged.');
      loadDossier();
    } catch (err: any) {
      onNotify('error', 'Could Not Save Note', err?.message || 'Firestore rejected the note.');
    } finally {
      setSavingNote(false);
    }
  };

  const closePreview = () => {
    if (previewDoc?.objectUrl) {
      URL.revokeObjectURL(previewDoc.objectUrl);
    }
    setPreviewDoc(null);
  };

  const preferredJobTitlesDisplay =
    candidate.preferredJobTitles && candidate.preferredJobTitles.length > 0
      ? candidate.preferredJobTitles.join(', ')
      : candidate.desiredRole || '';
  const preferredLocationsDisplay =
    candidate.preferredLocations && candidate.preferredLocations.length > 0
      ? candidate.preferredLocations.join(', ')
      : candidate.preferredLocation || '';
  const expectedSalaryDisplay = (() => {
    const min = candidate.expectedSalary?.min;
    const max = candidate.expectedSalary?.max;
    const curr = candidate.expectedSalary?.currency || 'INR';
    if (min && max) return `${formatSalaryAmount(min, curr)} – ${formatSalaryAmount(max, curr)}`;
    if (min) return `From ${formatSalaryAmount(min, curr)}`;
    if (max) return `Up to ${formatSalaryAmount(max, curr)}`;
    return '';
  })();
  const currentSalaryDisplay = formatSalaryAmount(
    candidate.currentSalary?.amount,
    candidate.currentSalary?.currency || 'INR'
  );

  const initials = (candidate.name || 'C')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="space-y-5">
      {/* Top Navigation + Candidate Hero Header */}
      <div className="bg-white rounded-xl border border-[#E5EAF0] shadow-[0_1px_2px_rgba(16,43,78,0.03)] p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5EAF0]">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#102B4E] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Candidates</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {latestResumeDoc && (
              <>
                <button
                  type="button"
                  onClick={() => handlePreviewDocument(latestResumeDoc)}
                  disabled={loadingDocId === latestResumeDoc.id}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#102B4E] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {loadingDocId === latestResumeDoc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-[#F47A24]" />
                  )}
                  <span>Preview Resume</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(latestResumeDoc)}
                  disabled={loadingDocId === latestResumeDoc.id}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Resume</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => notesSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#102B4E] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-[#102B4E]" />
              <span>Internal Notes ({dossier.internalNotes.length})</span>
            </button>
          </div>
        </div>

        {/* Identity Row */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#102B4E] text-white font-bold text-base sm:text-lg flex items-center justify-center shrink-0 overflow-hidden">
              {candidate.avatar ? (
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials || 'C'
              )}
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#081D36] tracking-[-0.015em] break-words">
                  {candidate.name || 'Unnamed Candidate'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                    accountStatus === 'suspended'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {accountStatus === 'suspended' ? 'Suspended' : 'Active Account'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#475569] break-words">
                {candidate.headline || 'Professional headline not added yet'}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#475569] pt-0.5">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#102B4E] bg-[#F1F5FA] border border-[#D4DCE6] px-2.5 py-1 rounded-md">
                  <Hash className="w-3.5 h-3.5 text-[#F47A24]" />
                  <span>{CANDIDATE_ID_LABEL}:</span>
                  <span className="font-mono tabular-nums font-bold">
                    {candidateCode || 'Unassigned'}
                  </span>
                </span>
                {!candidateCode && canManageCandidates && (
                  <button
                    type="button"
                    onClick={handleAssignMissingId}
                    disabled={assigningCode}
                    className="min-h-[32px] px-2.5 py-1 rounded-md bg-[#F47A24] hover:bg-[#e06916] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {assigningCode && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Assign Candidate ID</span>
                  </button>
                )}
                {candidate.email && (
                  <span className="inline-flex items-center gap-1 break-all">
                    <Mail className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    <span>{candidate.email}</span>
                  </span>
                )}
                {candidate.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    <span className="font-mono">{candidate.phone}</span>
                  </span>
                )}
                {candidate.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    <span>{candidate.location}</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Internal UID: {candidateUid}
              </div>
            </div>
          </div>

          {/* Permitted Admin Recruitment Status Control */}
          <div className="bg-[#FAFBFD] border border-[#E5EAF0] rounded-xl p-3.5 w-full lg:w-[270px] shrink-0 space-y-2">
            <label
              htmlFor="admin-candidate-recruitment-status"
              className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]"
            >
              Recruitment Status
            </label>
            {canManageCandidates ? (
              <select
                id="admin-candidate-recruitment-status"
                value={currentRecruitmentStatus}
                onChange={(e) => handleStatusChange(e.target.value as CandidateRecruitmentStatus)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#D4DCE6] bg-white text-xs sm:text-sm font-semibold text-[#081D36] focus:outline-none focus:border-[#102B4E]"
              >
                {RECRUITMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm font-semibold text-[#102B4E]">{currentRecruitmentStatus}</div>
            )}
            <p className="text-[11px] text-[#64748B] leading-snug flex items-start gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#64748B] shrink-0 mt-0.5" />
              <span>Candidate profile fields are read-only for data integrity.</span>
            </p>
          </div>
        </div>

        {/* Profile Status Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-[#E5EAF0]">
          <div className="rounded-lg border border-[#E5EAF0] bg-[#FAFBFD] p-3">
            <div className="text-[11px] font-semibold text-[#64748B]">Profile Completion</div>
            <div className="mt-1 flex items-baseline justify-between gap-1">
              <span className="text-lg font-bold font-mono tabular-nums text-[#081D36]">
                {completionReport.percentage}%
              </span>
              <span className="text-[11px] font-semibold text-[#102B4E]">
                {completionReport.percentage >= 80 ? 'Completed' : 'Incomplete'}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  completionReport.percentage >= 80
                    ? 'bg-emerald-600'
                    : completionReport.percentage >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${completionReport.percentage}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-[#E5EAF0] bg-[#FAFBFD] p-3">
            <div className="text-[11px] font-semibold text-[#64748B]">Resume Status</div>
            <div
              className={`mt-1 text-sm font-bold ${
                hasResumeUploaded ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {hasResumeUploaded ? 'Resume Uploaded' : 'Not Uploaded'}
            </div>
            <div className="text-[11px] text-[#64748B] truncate mt-0.5">
              {latestResumeDoc
                ? `v${latestResumeDoc.versionNumber} · ${formatFileSize(latestResumeDoc.sizeBytes)}`
                : candidate.resumeName || 'No file on record'}
            </div>
          </div>

          <div className="rounded-lg border border-[#E5EAF0] bg-[#FAFBFD] p-3">
            <div className="text-[11px] font-semibold text-[#64748B]">Registered On</div>
            <div className="mt-1 text-sm font-bold font-mono tabular-nums text-[#081D36]">
              {formatDateTime(userRecord?.createdAt || candidate.createdAt)}
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Account creation</div>
          </div>

          <div className="rounded-lg border border-[#E5EAF0] bg-[#FAFBFD] p-3">
            <div className="text-[11px] font-semibold text-[#64748B]">Last Profile Updated</div>
            <div className="mt-1 text-sm font-bold font-mono tabular-nums text-[#081D36]">
              {formatDateTime(candidate.updatedAt || candidate.lastActive)}
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              {completionReport.completedCount}/{completionReport.totalSections} sections complete
            </div>
          </div>

          <div className="rounded-lg border border-[#E5EAF0] bg-[#FAFBFD] p-3">
            <div className="text-[11px] font-semibold text-[#64748B]">Career Assessment</div>
            <div
              className={`mt-1 text-sm font-bold ${
                assessmentCompleted ? 'text-emerald-700' : 'text-slate-600'
              }`}
            >
              {loadingDossier
                ? 'Checking...'
                : assessmentCompleted
                ? 'Completed'
                : 'Pending'}
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5 truncate">
              {typeof latestAssessment?.readinessScore === 'number'
                ? `Score: ${latestAssessment.readinessScore}%`
                : latestAssessment?.recommendedCategory || 'No completed assessment'}
            </div>
          </div>

          <div className="rounded-lg border border-[#E5EAF0] bg-[#FAFBFD] p-3">
            <div className="text-[11px] font-semibold text-[#64748B]">Learning & Certs</div>
            <div className="mt-1 text-sm font-bold font-mono tabular-nums text-[#081D36]">
              {candidateEnrolments.length} Course{candidateEnrolments.length === 1 ? '' : 's'}
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              {candidateCertificates.length} Certificate{candidateCertificates.length === 1 ? '' : 's'} issued
            </div>
          </div>
        </div>
      </div>

      {/* Section A: Personal & Contact Details */}
      <SectionCard
        id="section-personal"
        code="Section A"
        title="Personal & Contact Details"
        subtitle="Verified identity, contact channels, and residential location details"
        icon={<UserIcon className="w-4 h-4" />}
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FieldRow
            label={CANDIDATE_ID_LABEL}
            value={candidateCode || 'Not yet assigned'}
            mono
          />
          <FieldRow label="Full Name" value={displayText(candidate.name)} />
          <FieldRow label="Email Address" value={displayText(candidate.email)} />
          <FieldRow label="Mobile Number" value={displayText(candidate.phone)} mono />
          <FieldRow label="Alternative Mobile Number" value={displayText(candidate.altPhone)} mono />
          <FieldRow label="Date of Birth" value={displayText(candidate.dob)} mono />
          <FieldRow label="Gender" value={displayText(candidate.gender)} />
          <FieldRow label="Current Location" value={displayText(candidate.location)} />
          <FieldRow label="City" value={displayText(candidate.city)} />
          <FieldRow label="State" value={displayText(candidate.state)} />
          <FieldRow label="Country" value={displayText(candidate.country)} />
          <FieldRow label="PIN Code" value={displayText(candidate.pinCode)} mono />
        </dl>
      </SectionCard>

      {/* Section B: Professional Summary */}
      <SectionCard
        id="section-summary"
        code="Section B"
        title="Professional Summary"
        subtitle="Headline, experience profile, current employment status, and availability"
        icon={<Briefcase className="w-4 h-4" />}
      >
        <div className="space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FieldRow label="Professional Headline" value={displayText(candidate.headline)} />
            <FieldRow
              label="Total Work Experience"
              value={`${candidate.yearsOfExperience || 0} yr${
                (candidate.yearsOfExperience || 0) === 1 ? '' : 's'
              } (${candidate.experienceLevel || 'Fresher'})`}
              mono
            />
            <FieldRow label="Current Employment Status" value={displayText(candidate.workStatus)} />
            <FieldRow label="Current Job Title" value={displayText(candidate.currentRole)} />
            <FieldRow label="Current Company" value={displayText(candidate.currentCompany)} />
            <FieldRow label="Notice Period" value={displayText(candidate.noticePeriod)} />
            <FieldRow label="Availability to Join" value={displayText(candidate.availability)} />
            <FieldRow
              label="Experience Category"
              value={
                candidate.experienceType
                  ? candidate.experienceType === 'experienced'
                    ? 'Experienced'
                    : 'Fresher'
                  : (candidate.yearsOfExperience || 0) > 0
                  ? 'Experienced'
                  : 'Fresher'
              }
            />
          </dl>

          <div className="pt-3 border-t border-[#E5EAF0] grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                Profile Summary / About
              </div>
              <p className="mt-1 text-xs sm:text-[13.5px] text-[#1E293B] leading-relaxed whitespace-pre-line">
                {candidate.about?.trim() || 'No profile summary submitted yet.'}
              </p>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                Career Objective
              </div>
              <p className="mt-1 text-xs sm:text-[13.5px] text-[#1E293B] leading-relaxed whitespace-pre-line">
                {candidate.careerObjective?.trim() || 'Not provided'}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section C: Employment History */}
      <SectionCard
        id="section-employment"
        code="Section C"
        title={`Employment History (${sortedExperiences.length})`}
        subtitle="Work history listed in reverse chronological order"
        icon={<Building2 className="w-4 h-4" />}
      >
        {sortedExperiences.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#64748B]">
            No employment entries submitted by this candidate.
          </p>
        ) : (
          <div className="divide-y divide-[#E5EAF0]">
            {sortedExperiences.map((exp) => (
              <div key={exp.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-[#081D36]">
                        {exp.jobTitle || 'Role not specified'}
                      </h4>
                      {exp.current && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                          Current Role
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-[13px] text-[#475569] mt-0.5">
                      <span className="font-semibold text-[#102B4E]">
                        {exp.company || 'Company not specified'}
                      </span>
                      {exp.employmentType ? ` · ${exp.employmentType}` : ''}
                      {exp.industry ? ` · ${exp.industry}` : ''}
                      {exp.location ? ` · ${exp.location}` : ''}
                    </div>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-[#64748B] shrink-0">
                    {formatDisplayDate(exp.startDate) || 'Start date N/A'} —{' '}
                    {exp.current ? 'Present' : formatDisplayDate(exp.endDate) || 'End date N/A'}
                  </div>
                </div>

                {exp.description && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                      Key Responsibilities
                    </div>
                    <p className="mt-1 text-xs sm:text-[13px] text-[#1E293B] whitespace-pre-line leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                )}

                {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                      Key Achievements
                    </div>
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs sm:text-[13px] text-[#1E293B]">
                      {exp.achievements.map((ach, i) => (
                        <li key={i}>{ach}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(exp.skillsUsed) && exp.skillsUsed.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-[#64748B] mr-1">
                      Skills Used:
                    </span>
                    {exp.skillsUsed.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded bg-[#F1F5FA] border border-[#E5EAF0] text-[11px] font-medium text-[#102B4E]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Section D: Education */}
      <SectionCard
        id="section-education"
        code="Section D"
        title={`Education (${sortedEducation.length})`}
        subtitle="Academic qualifications, institutions, specialisation, and grades"
        icon={<GraduationCap className="w-4 h-4" />}
      >
        {sortedEducation.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#64748B]">
            No education entries submitted by this candidate.
          </p>
        ) : (
          <div className="divide-y divide-[#E5EAF0]">
            {sortedEducation.map((edu) => (
              <div
                key={edu.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-2"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="text-sm font-bold text-[#081D36]">
                    {edu.qualification || 'Qualification not specified'}
                    {edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ''}
                  </div>
                  <div className="text-xs sm:text-[13px] text-[#475569]">
                    {edu.institution || 'Institution not specified'}
                    {edu.location ? ` · ${edu.location}` : ''}
                    {edu.courseType ? ` · ${edu.courseType}` : ''}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] pt-0.5">
                    {edu.grade && (
                      <span>
                        Score / CGPA:{' '}
                        <strong className="text-[#081D36] font-mono">{edu.grade}</strong>
                      </span>
                    )}
                    {edu.status && (
                      <span>
                        Status: <strong className="text-[#081D36]">{edu.status}</strong>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs font-mono tabular-nums text-[#64748B] shrink-0">
                  {edu.startYear || '—'} – {edu.endYear || '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Section E: Skills & Competencies */}
      <SectionCard
        id="section-skills"
        code="Section E"
        title={`Skills & Competencies (${normalizedSkills.length})`}
        subtitle="Primary skills highlighted alongside proficiency ratings and categories"
        icon={<Sparkles className="w-4 h-4" />}
      >
        {normalizedSkills.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#64748B]">
            No skills listed by this candidate yet.
          </p>
        ) : (
          <div className="space-y-4">
            {primarySkills.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] mb-2">
                  Primary Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {primarySkills.map((sk) => (
                    <div
                      key={sk.name}
                      className="px-3 py-1.5 rounded-lg bg-[#102B4E] text-white text-xs font-semibold inline-flex items-center gap-2"
                    >
                      <span>{sk.name}</span>
                      <span className="text-[10px] font-normal text-slate-200 border-l border-white/25 pl-2">
                        {sk.proficiency}
                        {sk.category ? ` · ${sk.category}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {secondarySkills.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] mb-2">
                  Additional Skills & Competencies
                </div>
                <div className="flex flex-wrap gap-2">
                  {secondarySkills.map((sk) => (
                    <div
                      key={sk.name}
                      className="px-3 py-1.5 rounded-lg bg-[#FAFBFD] border border-[#D4DCE6] text-[#081D36] text-xs font-medium inline-flex items-center gap-2"
                    >
                      <span>{sk.name}</span>
                      <span className="text-[10px] text-[#64748B] border-l border-[#D4DCE6] pl-2">
                        {sk.proficiency}
                        {sk.category ? ` · ${sk.category}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Section F: Resume & Documents */}
      <SectionCard
        id="section-resume"
        code="Section F"
        title="Resume & Documents"
        subtitle="Authenticated private resume storage, version history, and structured resumes"
        icon={<FileText className="w-4 h-4" />}
      >
        <div className="space-y-4">
          {loadingDossier ? (
            <div className="flex items-center gap-2 text-xs text-[#64748B] py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading private candidate documents...</span>
            </div>
          ) : latestResumeDoc ? (
            <div className="rounded-xl border border-[#D4DCE6] bg-[#FAFBFD] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[#081D36] break-all">
                    {latestResumeDoc.originalFilename}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono font-semibold">
                    Latest · v{latestResumeDoc.versionNumber}
                  </span>
                </div>
                <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Size: {formatFileSize(latestResumeDoc.sizeBytes)}</span>
                  <span>Uploaded: {formatDateTimeFull(latestResumeDoc.uploadedAt)}</span>
                  <span className="font-mono uppercase">{latestResumeDoc.extension.replace('.', '')}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePreviewDocument(latestResumeDoc)}
                  disabled={loadingDocId === latestResumeDoc.id}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F1F5FA] text-[#102B4E] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {loadingDocId === latestResumeDoc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-[#F47A24]" />
                  )}
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(latestResumeDoc)}
                  disabled={loadingDocId === latestResumeDoc.id}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ) : candidate.resumeName ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-1">
              <div className="font-semibold">
                Resume Metadata Recorded: {candidate.resumeName}
                {candidate.resumeSize ? ` (${candidate.resumeSize})` : ''}
              </div>
              <p className="text-amber-800">
                Last updated: {formatDateTime(candidate.resumeUpdated)}. This resume was parsed before private binary storage was enabled. Once the candidate re-uploads their resume, secure PDF preview and download will appear here automatically.
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[#64748B]">
              No resume has been uploaded by this candidate yet.
            </p>
          )}

          {/* Resume Version History */}
          {resumeDocuments.length > 1 && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                Resume Version History ({resumeDocuments.length} versions)
              </div>
              <div className="overflow-x-auto border border-[#E5EAF0] rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFBFD] border-b border-[#E5EAF0] text-[11px] font-semibold uppercase text-[#64748B]">
                    <tr>
                      <th className="px-3 py-2">Version</th>
                      <th className="px-3 py-2">Filename</th>
                      <th className="px-3 py-2">Size</th>
                      <th className="px-3 py-2">Uploaded</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EAF0]">
                    {resumeDocuments.map((docItem) => (
                      <tr key={docItem.id}>
                        <td className="px-3 py-2 font-mono font-semibold text-[#102B4E]">
                          v{docItem.versionNumber}
                          {docItem.isLatest ? ' (Latest)' : ''}
                        </td>
                        <td className="px-3 py-2 text-[#081D36] break-all">
                          {docItem.originalFilename}
                        </td>
                        <td className="px-3 py-2 font-mono text-[#64748B]">
                          {formatFileSize(docItem.sizeBytes)}
                        </td>
                        <td className="px-3 py-2 font-mono text-[#64748B] whitespace-nowrap">
                          {formatDateTimeFull(docItem.uploadedAt)}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handlePreviewDocument(docItem)}
                            className="text-[#102B4E] hover:underline font-semibold mr-3 cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadDocument(docItem)}
                            className="text-[#F47A24] hover:underline font-semibold cursor-pointer"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Other Uploaded Certificates / Supporting Documents */}
          {otherDocuments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E5EAF0]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                Uploaded Certificates & Supporting Documents ({otherDocuments.length})
              </div>
              <div className="divide-y divide-[#E5EAF0] border border-[#E5EAF0] rounded-lg">
                {otherDocuments.map((docItem) => (
                  <div
                    key={docItem.id}
                    className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#081D36] break-all">
                        {docItem.originalFilename}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {docItem.category} · {formatFileSize(docItem.sizeBytes)} ·{' '}
                        {formatDateTime(docItem.uploadedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePreviewDocument(docItem)}
                        className="px-2.5 py-1 rounded border border-[#D4DCE6] text-[#102B4E] font-semibold hover:bg-[#F6F8FB] cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(docItem)}
                        className="px-2.5 py-1 rounded bg-[#102B4E] text-white font-semibold hover:bg-[#081D36] cursor-pointer"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Structured Resumes built inside ABHI JOBS Resume Builder */}
          {dossier.structuredResumes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E5EAF0]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                Structured Resumes Built in ABHI JOBS ({dossier.structuredResumes.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dossier.structuredResumes.map((sr) => (
                  <div
                    key={sr.id}
                    className="rounded-lg border border-[#E5EAF0] bg-[#FAFBFD] px-3.5 py-2.5 text-xs"
                  >
                    <div className="font-semibold text-[#081D36]">{sr.title}</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      {sr.targetRole ? `Target: ${sr.targetRole} · ` : ''}
                      {sr.template ? `Template: ${sr.template} · ` : ''}
                      Updated {formatDateTime(sr.updatedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Section G & H: Certifications & Projects side-by-side on desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SectionCard
          id="section-certifications"
          code="Section G"
          title={`Certifications & Courses (${(candidate.certifications || []).length})`}
          subtitle="Credentials and external courses submitted by candidate"
          icon={<Award className="w-4 h-4" />}
        >
          {(candidate.certifications || []).length === 0 ? (
            <p className="text-xs sm:text-sm text-[#64748B]">No certifications submitted.</p>
          ) : (
            <div className="divide-y divide-[#E5EAF0]">
              {(candidate.certifications || []).map((cert) => {
                const safeUrl = sanitizeExternalUrl(cert.credentialUrl);
                return (
                  <div key={cert.id} className="py-3 first:pt-0 last:pb-0 space-y-1 text-xs">
                    <div className="font-bold text-[#081D36] text-[13.5px]">{cert.title}</div>
                    <div className="text-[#475569]">
                      {cert.issuer || 'Issuing organization not specified'}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#64748B] font-mono text-[11px]">
                      {cert.issueDate && <span>Issued: {formatDisplayDate(cert.issueDate)}</span>}
                      {cert.expiryDate && <span>Expires: {formatDisplayDate(cert.expiryDate)}</span>}
                      {cert.credentialId && <span>ID: {cert.credentialId}</span>}
                    </div>
                    {safeUrl && (
                      <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#102B4E] font-semibold hover:underline pt-0.5"
                      >
                        <span>Verify Credential</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          id="section-projects"
          code="Section H"
          title={`Projects & Portfolio (${(candidate.projects || []).length})`}
          subtitle="Hands-on projects, roles, and technologies used"
          icon={<FolderGit2 className="w-4 h-4" />}
        >
          {(candidate.projects || []).length === 0 ? (
            <p className="text-xs sm:text-sm text-[#64748B]">No projects submitted.</p>
          ) : (
            <div className="divide-y divide-[#E5EAF0]">
              {(candidate.projects || []).map((proj) => {
                const safeUrl = sanitizeExternalUrl(proj.url);
                return (
                  <div key={proj.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-[#081D36] text-[13.5px]">{proj.title}</div>
                      {(proj.startDate || proj.endDate || proj.ongoing) && (
                        <span className="text-[11px] font-mono text-[#64748B]">
                          {formatDisplayDate(proj.startDate) || '—'} –{' '}
                          {proj.ongoing ? 'Ongoing' : formatDisplayDate(proj.endDate) || '—'}
                        </span>
                      )}
                    </div>
                    {proj.role && <div className="font-medium text-[#102B4E]">Role: {proj.role}</div>}
                    {proj.description && (
                      <p className="text-[#475569] leading-relaxed whitespace-pre-line">
                        {proj.description}
                      </p>
                    )}
                    {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {proj.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 rounded bg-[#F1F5FA] border border-[#E5EAF0] text-[11px] text-[#102B4E] font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {safeUrl && (
                      <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#102B4E] font-semibold hover:underline pt-0.5"
                      >
                        <span>Open Project Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Section I, J, K: Languages, Career Preferences & Professional Links */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SectionCard
          id="section-languages"
          code="Section I"
          title={`Languages (${(candidate.languages || []).length})`}
          subtitle="Spoken, reading, and writing proficiencies"
          icon={<LanguagesIcon className="w-4 h-4" />}
        >
          {(candidate.languages || []).length === 0 ? (
            <p className="text-xs sm:text-sm text-[#64748B]">No languages submitted.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E5EAF0] text-[11px] uppercase text-[#64748B]">
                  <tr>
                    <th className="py-2 pr-3">Language</th>
                    <th className="py-2 px-3">Proficiency</th>
                    <th className="py-2 px-2 text-center">Read</th>
                    <th className="py-2 px-2 text-center">Write</th>
                    <th className="py-2 pl-2 text-center">Speak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAF0]">
                  {(candidate.languages || []).map((lang) => (
                    <tr key={lang.id}>
                      <td className="py-2.5 pr-3 font-semibold text-[#081D36]">{lang.language}</td>
                      <td className="py-2.5 px-3 text-[#475569]">{lang.proficiency}</td>
                      <td className="py-2.5 px-2 text-center">
                        {lang.canRead ? 'Yes' : 'No'}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {lang.canWrite ? 'Yes' : 'No'}
                      </td>
                      <td className="py-2.5 pl-2 text-center">
                        {lang.canSpeak ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          id="section-links"
          code="Section K"
          title="Professional Links"
          subtitle="Verified external career and portfolio links"
          icon={<Globe className="w-4 h-4" />}
        >
          {(() => {
            const linksList: Array<{ label: string; url: string }> = [];
            const pushLink = (label: string, raw?: string) => {
              const safe = sanitizeExternalUrl(raw);
              if (safe) linksList.push({ label, url: safe });
            };
            pushLink('LinkedIn Profile', candidate.linkedinUrl);
            pushLink('Portfolio Website', candidate.portfolioUrl);
            pushLink('GitHub Profile', candidate.githubUrl);
            pushLink('Personal Website', candidate.personalWebsiteUrl);
            (candidate.otherLinks || []).forEach((lnk) => {
              pushLink(lnk.label || 'Other Link', lnk.url);
            });

            if (linksList.length === 0) {
              return (
                <p className="text-xs sm:text-sm text-[#64748B]">
                  No professional links added yet.
                </p>
              );
            }

            return (
              <div className="divide-y divide-[#E5EAF0]">
                {linksList.map((lnk, idx) => (
                  <div
                    key={`${lnk.label}-${idx}`}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#081D36]">{lnk.label}</div>
                      <div className="text-[#64748B] truncate">{lnk.url}</div>
                    </div>
                    <a
                      href={lnk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[#D4DCE6] hover:bg-[#F6F8FB] text-[#102B4E] font-semibold inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            );
          })()}
        </SectionCard>
      </div>

      {/* Section J: Career Preferences */}
      <SectionCard
        id="section-preferences"
        code="Section J"
        title="Career Preferences"
        subtitle="Target roles, locations, work mode, compensation expectations, and visibility"
        icon={<Compass className="w-4 h-4" />}
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FieldRow label="Preferred Job Titles" value={displayText(preferredJobTitlesDisplay)} />
          <FieldRow label="Preferred Industry" value={displayText(candidate.preferredIndustry)} />
          <FieldRow label="Preferred Locations" value={displayText(preferredLocationsDisplay)} />
          <FieldRow
            label="Preferred Employment Types"
            value={
              candidate.preferredEmploymentTypes && candidate.preferredEmploymentTypes.length > 0
                ? candidate.preferredEmploymentTypes.join(', ')
                : 'Not provided'
            }
          />
          <FieldRow label="Work Mode" value={displayText(candidate.workPreference)} />
          <FieldRow label="Expected Salary" value={displayText(expectedSalaryDisplay)} mono />
          <FieldRow label="Current Salary" value={displayText(currentSalaryDisplay)} mono />
          <FieldRow
            label="Willingness to Relocate"
            value={
              typeof candidate.willingToRelocate === 'boolean'
                ? candidate.willingToRelocate
                  ? 'Yes'
                  : 'No'
                : 'Not specified'
            }
          />
          <FieldRow label="Preferred Shift" value={displayText(candidate.preferredShift)} />
          <FieldRow
            label="Job Search Status"
            value={
              candidate.jobSearchStatus ||
              (candidate.availableForOpportunities ? 'Actively Looking' : 'Not Actively Looking')
            }
          />
          <FieldRow
            label="Profile Visibility"
            value={(candidate.profileVisibility || 'employers_only').replace('_', ' ')}
          />
          <FieldRow
            label="Open to Opportunities"
            value={candidate.availableForOpportunities ? 'Yes' : 'No'}
          />
        </dl>
      </SectionCard>

      {/* Application History */}
      <SectionCard
        id="section-applications"
        title={`Application History (${candidateApplications.length})`}
        subtitle="Real job applications and linked interview statuses from Firestore"
        icon={<Layers className="w-4 h-4" />}
        rightSlot={
          <button
            type="button"
            onClick={() => onNavigateModule('recruitment-applications')}
            className="text-xs font-semibold text-[#102B4E] hover:underline cursor-pointer"
          >
            Open Applications Queue →
          </button>
        }
      >
        {candidateApplications.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#64748B]">
            This candidate has not submitted any job applications yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E5EAF0] bg-[#FAFBFD] text-[11px] font-semibold uppercase text-[#64748B]">
                <tr>
                  <th className="px-3 py-2.5">Applied Job</th>
                  <th className="px-3 py-2.5">Company</th>
                  <th className="px-3 py-2.5">Application Date</th>
                  <th className="px-3 py-2.5">Application Status</th>
                  <th className="px-3 py-2.5">Interview Status</th>
                  <th className="px-3 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0]">
                {candidateApplications.map((app) => {
                  const iv = candidateInterviewsByAppId.get(app.id);
                  return (
                    <tr key={app.id} className="hover:bg-[#FAFBFD]">
                      <td className="px-3 py-2.5 font-semibold text-[#081D36]">{app.jobTitle}</td>
                      <td className="px-3 py-2.5 text-[#475569]">{app.companyName}</td>
                      <td className="px-3 py-2.5 font-mono text-[#64748B] whitespace-nowrap">
                        {formatDateTime(app.appliedAt || app.appliedDate)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-[#102B4E]">{app.status}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[#475569]">
                        {iv ? `${iv.status} (${iv.date})` : 'Not scheduled'}
                      </td>
                      <td className="px-3 py-2.5 text-[#64748B]">
                        {app.coverNote ? (
                          <span className="line-clamp-1 max-w-[200px]" title={app.coverNote}>
                            {app.coverNote}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Career Assessments + Learning Progress & Certificates */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SectionCard
          id="section-assessments"
          title={`Career Assessment Results (${dossier.careerAssessments.length})`}
          subtitle="Real assessment records from /users/{uid}/career_assessments"
          icon={<ShieldCheck className="w-4 h-4" />}
        >
          {loadingDossier ? (
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading career assessment records...</span>
            </div>
          ) : dossier.careerAssessments.length === 0 ? (
            <p className="text-xs sm:text-sm text-[#64748B]">
              No career assessments started or completed by this candidate yet.
            </p>
          ) : (
            <div className="divide-y divide-[#E5EAF0]">
              {dossier.careerAssessments.map((asmt) => (
                <div key={asmt.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#081D36] capitalize">
                      {asmt.recommendedCategory || `Assessment #${asmt.id.slice(0, 8)}`}
                    </span>
                    <span className="font-mono font-semibold text-[#102B4E] capitalize">
                      {asmt.status}
                      {typeof asmt.readinessScore === 'number' ? ` · ${asmt.readinessScore}%` : ''}
                    </span>
                  </div>
                  {asmt.recommendedRoles && asmt.recommendedRoles.length > 0 && (
                    <div className="text-[#475569]">
                      Recommended Roles: {asmt.recommendedRoles.join(', ')}
                    </div>
                  )}
                  <div className="text-[11px] font-mono text-[#64748B]">
                    Updated: {formatDateTime(asmt.completedAt || asmt.updatedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          id="section-learning"
          title={`Learning Progress & Certificates (${candidateEnrolments.length})`}
          subtitle="Learn with ABHI course enrolments, quiz attempts, and issued certificates"
          icon={<BookOpen className="w-4 h-4" />}
          rightSlot={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateModule('learning-enrolments')}
                className="text-xs font-semibold text-[#102B4E] hover:underline cursor-pointer"
              >
                Enrolments
              </button>
              <button
                type="button"
                onClick={() => onNavigateModule('learning-certificates')}
                className="text-xs font-semibold text-[#102B4E] hover:underline cursor-pointer"
              >
                Certificates
              </button>
            </div>
          }
        >
          {candidateEnrolments.length === 0 && candidateCertificates.length === 0 ? (
            <p className="text-xs sm:text-sm text-[#64748B]">
              No Learn with ABHI course enrolments or certificates found for this candidate.
            </p>
          ) : (
            <div className="space-y-4">
              {candidateEnrolments.length > 0 && (
                <div className="divide-y divide-[#E5EAF0]">
                  {candidateEnrolments.map((en) => (
                    <div key={en.id} className="py-2.5 first:pt-0 last:pb-0 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#081D36]">
                          {en.courseTitle || en.courseId}
                        </span>
                        <span className="font-mono font-bold text-[#102B4E] tabular-nums">
                          {en.progressPercent}%
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] flex flex-wrap gap-x-3 gap-y-0.5">
                        <span className="capitalize">{en.status.replace('_', ' ')}</span>
                        <span>Lessons: {en.completedLessonsCount}</span>
                        <span>Quizzes Passed: {en.passedQuizzesCount}</span>
                        <span>
                          Final Assessment: {en.finalAssessmentPassed ? 'Passed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {candidateAttempts.length > 0 && (
                <div className="text-xs text-[#64748B] pt-2 border-t border-[#E5EAF0]">
                  Total Quiz / Assessment Attempts Recorded:{' '}
                  <strong className="text-[#081D36] font-mono">{candidateAttempts.length}</strong> (
                  {candidateAttempts.filter((a) => a.passed).length} passed)
                </div>
              )}

              {candidateCertificates.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E5EAF0]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                    Issued Certificates ({candidateCertificates.length})
                  </div>
                  {candidateCertificates.map((cert) => (
                    <div
                      key={cert.certificateId}
                      className="rounded-lg border border-[#E5EAF0] bg-[#FAFBFD] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[#081D36] truncate">
                          {cert.courseTitle}
                        </div>
                        <div className="text-[11px] font-mono text-[#64748B]">
                          {cert.certificateId} · {cert.issueDate || formatDateTime(cert.issuedAt)}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold capitalize shrink-0 ${
                          cert.status === 'valid' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {cert.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Private Internal Recruitment Notes & Admin Audit Trail */}
      <div ref={notesSectionRef} className="grid grid-cols-1 xl:grid-cols-2 gap-5 scroll-mt-24">
        <SectionCard
          title={`Private Internal Recruitment Notes (${dossier.internalNotes.length})`}
          subtitle="Strictly private to authorised ABHI JOBS administrators (candidates denied)"
          icon={<MessageSquarePlus className="w-4 h-4" />}
        >
          <div className="space-y-4">
            {canManageCandidates && (
              <form onSubmit={handleAddInternalNote} className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="candidate-note-category"
                    className="text-xs font-semibold text-[#475569]"
                  >
                    Category
                  </label>
                  <select
                    id="candidate-note-category"
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="min-h-[38px] px-2.5 py-1 rounded-lg border border-[#D4DCE6] bg-white text-xs font-semibold text-[#081D36]"
                  >
                    {NOTE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  rows={3}
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record screening observations, verification notes, or interview coordination details..."
                  className="w-full p-3 rounded-lg border border-[#D4DCE6] bg-white text-xs sm:text-sm text-[#081D36] focus:outline-none focus:border-[#102B4E]"
                />
                <button
                  type="submit"
                  disabled={savingNote || !noteText.trim()}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Private Note</span>
                </button>
              </form>
            )}

            {dossier.internalNotes.length === 0 ? (
              <p className="text-xs text-[#64748B]">No private internal notes recorded yet.</p>
            ) : (
              <div className="divide-y divide-[#E5EAF0] border-t border-[#E5EAF0] pt-2">
                {dossier.internalNotes.map((note) => (
                  <div key={note.id} className="py-3 first:pt-1 last:pb-0 space-y-1 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#081D36]">{note.authorName}</span>
                        <span className="px-2 py-0.5 rounded bg-[#F1F5FA] text-[10px] font-semibold text-[#102B4E]">
                          {note.category || 'General'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#64748B]">
                        {formatDateTimeFull(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-[#1E293B] whitespace-pre-line leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={`Admin Audit Trail (${dossier.auditHistory.length})`}
          subtitle="Recorded profile views, resume accesses, status changes, and note additions"
          icon={<History className="w-4 h-4" />}
        >
          {loadingDossier ? (
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading audit events...</span>
            </div>
          ) : dossier.auditHistory.length === 0 ? (
            <p className="text-xs text-[#64748B]">No audit entries logged for this candidate yet.</p>
          ) : (
            <div className="divide-y divide-[#E5EAF0] max-h-[360px] overflow-y-auto">
              {dossier.auditHistory.map((item) => (
                <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 text-xs space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#081D36]">{item.summary}</span>
                    <span className="text-[10px] font-mono text-[#64748B] shrink-0">
                      {formatDateTimeFull(item.createdAt)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    {item.actorEmail} · <span className="font-mono">{item.actorRole}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Secure Authenticated Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-[#081D36]/65 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${previewDoc.doc.originalFilename}`}
        >
          <div className="bg-white rounded-2xl border border-[#D4DCE6] shadow-2xl w-full max-w-[min(960px,calc(100vw-2rem))] h-[min(86vh,780px)] flex flex-col overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 bg-[#081D36] text-white flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm font-bold truncate">{previewDoc.doc.originalFilename}</h3>
                <p className="text-[11px] text-slate-300 truncate">
                  Version {previewDoc.doc.versionNumber} · {formatFileSize(previewDoc.doc.sizeBytes)} · Authenticated Private Preview
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(previewDoc.doc)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#F47A24] hover:bg-[#e06916] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  aria-label="Close document preview"
                  className="min-w-[40px] min-h-[40px] rounded-lg text-slate-200 hover:bg-white/10 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 overflow-hidden flex items-center justify-center">
              {previewDoc.mimeType.includes('pdf') ? (
                <iframe
                  src={previewDoc.objectUrl}
                  title={previewDoc.doc.originalFilename}
                  className="w-full h-full border-0 bg-white"
                />
              ) : previewDoc.mimeType.startsWith('image/') ? (
                <img
                  src={previewDoc.objectUrl}
                  alt={previewDoc.doc.originalFilename}
                  className="max-w-full max-h-full object-contain p-4"
                />
              ) : (
                <div className="p-8 text-center max-w-md space-y-3">
                  <FileText className="w-10 h-10 text-[#102B4E] mx-auto" />
                  <p className="text-sm font-semibold text-[#081D36]">
                    Inline browser preview is not supported for {previewDoc.doc.extension.toUpperCase()} files.
                  </p>
                  <p className="text-xs text-[#64748B]">
                    Use the Download button above to inspect this verified candidate document securely.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownloadDocument(previewDoc.doc)}
                    className="min-h-[44px] px-4 py-2 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {previewDoc.doc.originalFilename}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
