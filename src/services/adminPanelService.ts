import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
  serverTimestamp,
  getDocFromServer,
  onSnapshot,
  FIREBASE_PROJECT_ID,
  FIRESTORE_DATABASE_ID,
  OperationType,
  handleFirestoreError,
} from '../lib/firebase';
import {
  listAllEmployersAdminFromFirestore,
  listAllJobsAdminFromFirestore,
  listAllApplicationsAdminFromFirestore,
  listCandidatesAdminFromFirestore,
  listInterviewsAdminFromFirestore,
  listHiringEnquiriesAdminFromFirestore,
  listCourseEnquiriesAdminFromFirestore,
  listCertificateApprovalRequestsAdmin,
  mapCandidateProfileDoc,
  setUserAccountStatusInFirestore,
  sanitizeFirestoreId,
  stripUndefined,
  type CertificateApprovalRequestRecord,
} from './recruitmentFirestoreService';
import { listCandidateDocuments } from './candidateDocumentService';
import {
  listAdminRoles,
  listAdminActivityLogs,
  type AdminPermissionSet,
  type AdminRoleRecord,
  type AdminActivityLogRecord,
} from './adminRbacService';
import type {
  Application,
  CandidateDocumentRecord,
  CandidateInternalNoteRecord,
  CandidateProfile,
  CandidateRecruitmentStatus,
  CourseEnquiry,
  EmployerProfile,
  HiringEnquiry,
  Interview,
  Job,
  User,
} from '../types';

// ============================================================================
// TYPES & SANITIZATION
// ============================================================================

export interface AdminUserRecord {
  id: string;
  candidateCode?: string;
  name: string;
  email: string;
  role: User['role'];
  status: 'active' | 'suspended';
  avatar?: string;
  createdAt: string;
  lastActive: string;
}

export interface AdminCourseEnrolmentRecord {
  id: string;
  userId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  categoryId: string;
  status: 'enrolled' | 'in_progress' | 'completed';
  progressPercent: number;
  completedLessonsCount: number;
  passedQuizzesCount: number;
  unlockedModuleOrder: number;
  finalAssessmentPassed: boolean;
  bestFinalScorePercent?: number;
  enrolledAt: string;
  lastAccessedAt: string;
  completedAt?: string;
}

export interface AdminVideoProgressRecord {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  videoId: string;
  youtubeVideoId: string;
  durationSeconds: number;
  watchedSeconds: number;
  maxPercentWatched: number;
  completedViaPlayer: boolean;
  manualCompleted: boolean;
  updatedAt: string;
}

export interface AdminAssessmentAttemptRecord {
  id: string;
  userId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  assessmentType: 'module_quiz' | 'final_assessment';
  moduleId?: string;
  assessmentTitle: string;
  attemptNumber: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercent: number;
  passPercentage: number;
  passed: boolean;
  submittedAt: string;
}

export interface AdminIssuedCertificateRecord {
  certificateId: string;
  userId?: string;
  candidateName: string;
  courseId: string;
  courseTitle: string;
  issueDate: string;
  status: 'valid' | 'revoked';
  issuanceMethod: 'server_hmac' | 'admin_approved' | 'legacy';
  issuedAt: string;
}

export interface AdminCertificateTemplateRecord {
  id: string;
  name: string;
  organizationName: string;
  certificateTitle: string;
  subtitle: string;
  signatoryName: string;
  signatoryDesignation: string;
  primaryColor: string;
  accentColor: string;
  isDefault: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface AdminNotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'application' | 'interview' | 'system' | 'message' | 'learning';
  read: boolean;
  link?: string;
  createdBy: string;
  createdAt: string;
}

export interface OverviewKpiMetrics {
  totalUsers: number;
  totalCandidates: number;
  totalEmployers: number;
  verifiedEmployers: number;
  totalCompanies: number;
  activeJobs: number;
  pendingJobs: number;
  closedJobs: number;
  totalApplications: number;
  totalInterviews: number;
  newEnquiries: number;
  openSupportTickets: number;
  supportTicketsConfiguredInFirestore: boolean;
  totalCourseEnrolments: number;
  activeLearners: number;
  certificatesIssued: number;
  pendingCertificateRequests: number;
  generatedAt: string;
  warnings: string[];
}

export interface DateTrendPoint {
  dateKey: string;
  label: string;
  count: number;
}

export interface SystemHealthReport {
  firestoreReachable: boolean;
  latencyMs: number;
  projectId: string;
  databaseId: string;
  authUid: string | null;
  authEmail: string | null;
  emailVerified: boolean;
  appCheckConfigured: boolean;
  billingTier: 'Firebase Starter (No Cost)';
  checkedAt: string;
  errorMessage?: string;
}

const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /passcode/i,
  /verificationSignature/i,
  /credential/i,
];

/**
 * Strips any sensitive fields (passwords, tokens, secrets, cryptographic signatures)
 * before displaying or exporting record details in the Admin Panel.
 */
export function sanitizeRecordForAdminDisplay<T extends Record<string, unknown>>(
  record: T
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_FIELD_PATTERNS.some((rx) => rx.test(key))) {
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = sanitizeRecordForAdminDisplay(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function toIsoString(val: unknown): string {
  if (typeof val === 'string' && val.trim()) return val;
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  return '';
}

function isPermissionDeniedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.toLowerCase().includes('permission') ||
    msg.toLowerCase().includes('missing or insufficient')
  );
}

/**
 * Computes real date-bucketed trend points strictly from record timestamps.
 * Never fabricates or interpolates synthetic activity when records are absent.
 */
export function computeDateTrends<T>(
  records: T[],
  getDateString: (item: NoInfer<T>) => string | undefined | null,
  days = 14,
  referenceDate = new Date()
): DateTrendPoint[] {
  const safeDays = Math.max(7, Math.min(90, days));
  const buckets = new Map<string, DateTrendPoint>();

  for (let i = safeDays - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    buckets.set(key, { dateKey: key, label, count: 0 });
  }

  for (const item of records) {
    const raw = getDateString(item);
    if (!raw) continue;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = parsed.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count += 1;
    }
  }

  return Array.from(buckets.values());
}

// ============================================================================
// BOUNDED USERS QUERIES (/users)
// ============================================================================

export async function listUsersAdminFromFirestore(maxItems = 150): Promise<AdminUserRecord[]> {
  try {
    const q = query(collection(db, 'users'), limit(Math.min(300, Math.max(1, maxItems))));
    const snap = await getDocs(q);
    return snap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          id: String(d.id || docSnap.id),
          candidateCode:
            typeof d.candidateCode === 'string' && /^[1-9][0-9]{3}$/.test(d.candidateCode.trim())
              ? d.candidateCode.trim()
              : undefined,
          name: String(d.name || 'Unnamed User'),
          email: String(d.email || ''),
          role: (d.role as User['role']) || 'job_seeker',
          status: d.status === 'suspended' ? ('suspended' as const) : ('active' as const),
          avatar: typeof d.avatar === 'string' ? d.avatar : undefined,
          createdAt: toIsoString(d.createdAt),
          lastActive: String(d.lastActive || ''),
        };
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
    throw err;
  }
}

export async function updateUserStatusAdmin(
  targetUid: string,
  status: 'active' | 'suspended'
): Promise<void> {
  try {
    await setUserAccountStatusInFirestore(targetUid, status);
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
    }
    throw err;
  }
}

export async function deleteJobAdminFromFirestore(jobId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `jobs/${jobId}`);
    }
    throw err;
  }
}

// ============================================================================
// LEARN WITH ABHI ADMIN QUERIES (BOUNDED COLLECTIONGROUP & COLLECTIONS)
// ============================================================================

export async function listCourseEnrolmentsAdmin(
  maxItems = 150
): Promise<AdminCourseEnrolmentRecord[]> {
  try {
    const q = query(
      collectionGroup(db, 'course_enrolments'),
      limit(Math.min(300, Math.max(1, maxItems)))
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          id: `${d.userId || 'user'}_${docSnap.id}`,
          userId: String(d.userId || ''),
          courseId: String(d.courseId || docSnap.id),
          courseSlug: String(d.courseSlug || ''),
          courseTitle: String(d.courseTitle || ''),
          categoryId: String(d.categoryId || ''),
          status: (d.status as AdminCourseEnrolmentRecord['status']) || 'enrolled',
          progressPercent: typeof d.progressPercent === 'number' ? d.progressPercent : 0,
          completedLessonsCount: Array.isArray(d.completedLessonIds) ? d.completedLessonIds.length : 0,
          passedQuizzesCount: Array.isArray(d.passedModuleQuizIds) ? d.passedModuleQuizIds.length : 0,
          unlockedModuleOrder: typeof d.unlockedModuleOrder === 'number' ? d.unlockedModuleOrder : 1,
          finalAssessmentPassed: Boolean(d.finalAssessmentPassed),
          bestFinalScorePercent:
            typeof d.bestFinalScorePercent === 'number' ? d.bestFinalScorePercent : undefined,
          enrolledAt: toIsoString(d.enrolledAt),
          lastAccessedAt: toIsoString(d.lastAccessedAt),
          completedAt: toIsoString(d.completedAt) || undefined,
        };
      })
      .sort((a, b) => (b.lastAccessedAt || '').localeCompare(a.lastAccessedAt || ''));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'collectionGroup/course_enrolments');
    }
    throw err;
  }
}

export async function listVideoProgressAdmin(
  maxItems = 150
): Promise<AdminVideoProgressRecord[]> {
  try {
    const q = query(
      collectionGroup(db, 'video_progress'),
      limit(Math.min(300, Math.max(1, maxItems)))
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          id: String(d.id || docSnap.id),
          userId: String(d.userId || ''),
          courseId: String(d.courseId || ''),
          lessonId: String(d.lessonId || ''),
          videoId: String(d.videoId || ''),
          youtubeVideoId: String(d.youtubeVideoId || ''),
          durationSeconds: typeof d.durationSeconds === 'number' ? d.durationSeconds : 0,
          watchedSeconds: typeof d.watchedSeconds === 'number' ? d.watchedSeconds : 0,
          maxPercentWatched: typeof d.maxPercentWatched === 'number' ? d.maxPercentWatched : 0,
          completedViaPlayer: Boolean(d.completedViaPlayer),
          manualCompleted: Boolean(d.manualCompleted),
          updatedAt: toIsoString(d.updatedAt),
        };
      })
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'collectionGroup/video_progress');
    }
    throw err;
  }
}

export async function listAssessmentAttemptsAdmin(
  maxItems = 150
): Promise<AdminAssessmentAttemptRecord[]> {
  try {
    const q = query(
      collectionGroup(db, 'assessment_attempts'),
      limit(Math.min(300, Math.max(1, maxItems)))
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          id: String(d.id || docSnap.id),
          userId: String(d.userId || ''),
          courseId: String(d.courseId || ''),
          courseSlug: String(d.courseSlug || ''),
          courseTitle: String(d.courseTitle || ''),
          assessmentType:
            d.assessmentType === 'final_assessment'
              ? ('final_assessment' as const)
              : ('module_quiz' as const),
          moduleId: typeof d.moduleId === 'string' ? d.moduleId : undefined,
          assessmentTitle: String(d.assessmentTitle || ''),
          attemptNumber: typeof d.attemptNumber === 'number' ? d.attemptNumber : 1,
          totalQuestions: typeof d.totalQuestions === 'number' ? d.totalQuestions : 0,
          correctAnswers: typeof d.correctAnswers === 'number' ? d.correctAnswers : 0,
          incorrectAnswers: typeof d.incorrectAnswers === 'number' ? d.incorrectAnswers : 0,
          scorePercent: typeof d.scorePercent === 'number' ? d.scorePercent : 0,
          passPercentage: typeof d.passPercentage === 'number' ? d.passPercentage : 70,
          passed: Boolean(d.passed),
          submittedAt: toIsoString(d.submittedAt),
        };
      })
      .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'collectionGroup/assessment_attempts');
    }
    throw err;
  }
}

export async function listPublicCertificatesAdmin(
  maxItems = 150
): Promise<AdminIssuedCertificateRecord[]> {
  try {
    const q = query(
      collection(db, 'public_certificates'),
      limit(Math.min(300, Math.max(1, maxItems)))
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          certificateId: String(d.certificateId || docSnap.id),
          candidateName: String(d.candidateName || ''),
          courseId: String(d.courseId || ''),
          courseTitle: String(d.courseTitle || ''),
          issueDate: String(d.issueDate || ''),
          status: d.status === 'revoked' ? ('revoked' as const) : ('valid' as const),
          issuanceMethod:
            d.issuanceMethod === 'admin_approved'
              ? ('admin_approved' as const)
              : d.issuanceMethod === 'server_hmac'
              ? ('server_hmac' as const)
              : ('legacy' as const),
          issuedAt: toIsoString(d.issuedAt),
        };
      })
      .sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'public_certificates');
    }
    throw err;
  }
}

export async function setPublicCertificateStatusAdmin(
  certificateId: string,
  status: 'valid' | 'revoked'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'public_certificates', certificateId), { status });
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `public_certificates/${certificateId}`);
    }
    throw err;
  }
}

export async function verifyPublicCertificateById(
  certificateId: string
): Promise<AdminIssuedCertificateRecord | null> {
  const cleanId = certificateId.trim().toUpperCase();
  if (!/^[A-Z0-9-]{8,64}$/.test(cleanId)) {
    throw new Error('Certificate ID must be 8–64 uppercase letters, numbers, or hyphens.');
  }
  try {
    const snap = await getDoc(doc(db, 'public_certificates', cleanId));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      certificateId: String(d.certificateId || snap.id),
      candidateName: String(d.candidateName || ''),
      courseId: String(d.courseId || ''),
      courseTitle: String(d.courseTitle || ''),
      issueDate: String(d.issueDate || ''),
      status: d.status === 'revoked' ? 'revoked' : 'valid',
      issuanceMethod:
        d.issuanceMethod === 'admin_approved'
          ? 'admin_approved'
          : d.issuanceMethod === 'server_hmac'
          ? 'server_hmac'
          : 'legacy',
      issuedAt: toIsoString(d.issuedAt),
    };
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.GET, `public_certificates/${cleanId}`);
    }
    throw err;
  }
}

// ============================================================================
// CERTIFICATE TEMPLATES (/certificate_templates)
// ============================================================================

export async function listCertificateTemplatesAdmin(): Promise<AdminCertificateTemplateRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'certificate_templates'));
    return snap.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: String(d.id || docSnap.id),
        name: String(d.name || ''),
        organizationName: String(d.organizationName || 'ABHI JOBS'),
        certificateTitle: String(d.certificateTitle || 'Certificate of Completion'),
        subtitle: String(d.subtitle || ''),
        signatoryName: String(d.signatoryName || ''),
        signatoryDesignation: String(d.signatoryDesignation || ''),
        primaryColor: String(d.primaryColor || '#102B4E'),
        accentColor: String(d.accentColor || '#F47A24'),
        isDefault: Boolean(d.isDefault),
        updatedBy: String(d.updatedBy || ''),
        updatedAt: toIsoString(d.updatedAt),
      };
    });
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, 'certificate_templates');
    }
    throw err;
  }
}

export async function upsertCertificateTemplateAdmin(
  record: Omit<AdminCertificateTemplateRecord, 'updatedAt'>
): Promise<void> {
  const id = sanitizeFirestoreId(record.id, 'tpl');
  const hexRx = /^#[0-9A-Fa-f]{6}$/;
  const payload = {
    id,
    name: record.name.trim().slice(0, 120),
    organizationName: record.organizationName.trim().slice(0, 120),
    certificateTitle: record.certificateTitle.trim().slice(0, 120),
    subtitle: record.subtitle.trim().slice(0, 240),
    signatoryName: record.signatoryName.trim().slice(0, 100),
    signatoryDesignation: record.signatoryDesignation.trim().slice(0, 120),
    primaryColor: hexRx.test(record.primaryColor) ? record.primaryColor : '#102B4E',
    accentColor: hexRx.test(record.accentColor) ? record.accentColor : '#F47A24',
    isDefault: Boolean(record.isDefault),
    updatedBy: record.updatedBy,
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'certificate_templates', id), payload);
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.WRITE, `certificate_templates/${id}`);
    }
    throw err;
  }
}

export async function deleteCertificateTemplateAdmin(templateId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'certificate_templates', templateId));
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `certificate_templates/${templateId}`);
    }
    throw err;
  }
}

// ============================================================================
// PER-USER NOTIFICATIONS (/users/{uid}/notifications/{id})
// ============================================================================

export async function sendUserNotificationAdmin(params: {
  targetUserId: string;
  title: string;
  message: string;
  type: AdminNotificationRecord['type'];
  link?: string;
  createdByUid: string;
}): Promise<AdminNotificationRecord> {
  const userId = sanitizeFirestoreId(params.targetUserId, 'usr');
  const id = sanitizeFirestoreId(`notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 'notif');
  const payload = stripUndefined({
    id,
    userId,
    title: params.title.trim().slice(0, 140),
    message: params.message.trim().slice(0, 1000),
    type: params.type,
    read: false,
    link: params.link?.trim() ? params.link.trim().slice(0, 240) : undefined,
    createdBy: params.createdByUid,
    createdAt: serverTimestamp(),
  });
  try {
    await setDoc(doc(db, 'users', userId, 'notifications', id), payload);
    return {
      id,
      userId,
      title: params.title.trim(),
      message: params.message.trim(),
      type: params.type,
      read: false,
      link: params.link?.trim() || undefined,
      createdBy: params.createdByUid,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.CREATE, `users/${userId}/notifications/${id}`);
    }
    throw err;
  }
}

export async function listNotificationsForUserAdmin(
  targetUserId: string,
  maxItems = 50
): Promise<AdminNotificationRecord[]> {
  try {
    const q = query(
      collection(db, 'users', targetUserId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(Math.min(100, Math.max(1, maxItems)))
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: String(d.id || docSnap.id),
        userId: String(d.userId || targetUserId),
        title: String(d.title || ''),
        message: String(d.message || ''),
        type: (d.type as AdminNotificationRecord['type']) || 'system',
        read: Boolean(d.read),
        link: typeof d.link === 'string' ? d.link : undefined,
        createdBy: String(d.createdBy || ''),
        createdAt: toIsoString(d.createdAt),
      };
    });
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.LIST, `users/${targetUserId}/notifications`);
    }
    throw err;
  }
}

// ============================================================================
// REAL OVERVIEW KPI AGGREGATION (ZERO FAKE NUMBERS)
// ============================================================================

async function safeServerCount(qRef: any, label: string, warnings: string[]): Promise<number> {
  try {
    const snap = await getCountFromServer(qRef);
    return snap.data().count;
  } catch (err: any) {
    const reason = err?.code || (isPermissionDeniedError(err) ? 'permission-restricted' : 'unavailable');
    warnings.push(`${label}: ${reason}`);
    return 0;
  }
}

export async function fetchOverviewKpiMetrics(): Promise<OverviewKpiMetrics> {
  const warnings: string[] = [];

  const [
    totalUsers,
    totalCandidates,
    totalEmployers,
    verifiedEmployers,
    activeJobs,
    pendingJobs,
    closedJobs,
    totalApplications,
    totalInterviews,
    newHiringEnquiries,
    newCourseEnquiries,
    totalCourseEnrolments,
    activeEnrolments,
    certificatesIssued,
    pendingCertificateRequests,
  ] = await Promise.all([
    safeServerCount(collection(db, 'users'), 'users', warnings),
    safeServerCount(collection(db, 'candidates'), 'candidates', warnings),
    safeServerCount(collection(db, 'employers'), 'employers', warnings),
    safeServerCount(
      query(collection(db, 'employers'), where('verificationStatus', '==', 'verified')),
      'verifiedEmployers',
      warnings
    ),
    safeServerCount(
      query(collection(db, 'jobs'), where('status', '==', 'published')),
      'activeJobs',
      warnings
    ),
    safeServerCount(
      query(collection(db, 'jobs'), where('status', '==', 'draft')),
      'pendingJobs',
      warnings
    ),
    safeServerCount(
      query(collection(db, 'jobs'), where('status', '==', 'closed')),
      'closedJobs',
      warnings
    ),
    safeServerCount(collection(db, 'applications'), 'applications', warnings),
    safeServerCount(collection(db, 'interviews'), 'interviews', warnings),
    safeServerCount(
      query(collection(db, 'hiring_enquiries'), where('status', '==', 'New')),
      'newHiringEnquiries',
      warnings
    ),
    safeServerCount(
      query(collection(db, 'course_enquiries'), where('status', '==', 'New')),
      'newCourseEnquiries',
      warnings
    ),
    safeServerCount(collectionGroup(db, 'course_enrolments'), 'courseEnrolments', warnings),
    safeServerCount(
      query(collectionGroup(db, 'course_enrolments'), where('status', '==', 'in_progress')),
      'activeLearners',
      warnings
    ),
    safeServerCount(
      query(collection(db, 'public_certificates'), where('status', '==', 'valid')),
      'certificatesIssued',
      warnings
    ),
    safeServerCount(
      query(collection(db, 'certificate_requests'), where('status', '==', 'pending')),
      'pendingCertificateRequests',
      warnings
    ),
  ]);

  return {
    totalUsers,
    totalCandidates,
    totalEmployers,
    verifiedEmployers,
    totalCompanies: totalEmployers,
    activeJobs,
    pendingJobs,
    closedJobs,
    totalApplications,
    totalInterviews,
    newEnquiries: newHiringEnquiries + newCourseEnquiries,
    openSupportTickets: 0,
    supportTicketsConfiguredInFirestore: false,
    totalCourseEnrolments,
    activeLearners: activeEnrolments,
    certificatesIssued,
    pendingCertificateRequests,
    generatedAt: new Date().toISOString(),
    warnings,
  };
}

// ============================================================================
// SYSTEM HEALTH CHECK (/test/connection)
// ============================================================================

export async function runSystemHealthCheck(): Promise<SystemHealthReport> {
  const started = performance.now();
  let firestoreReachable = false;
  let errorMessage: string | undefined;

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    firestoreReachable = true;
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('the client is offline')) {
      firestoreReachable = false;
      errorMessage = 'Firestore client reported offline.';
    } else {
      // Document may not exist yet; server roundtrip succeeded
      firestoreReachable = true;
      if (isPermissionDeniedError(err)) {
        errorMessage = 'Authenticated Firestore read check returned permission-denied.';
      }
    }
  }

  const latencyMs = Math.max(1, Math.round(performance.now() - started));
  const appCheckConfigured = Boolean(
    typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_FIREBASE_APP_CHECK_SITE_KEY
  );

  return {
    firestoreReachable,
    latencyMs,
    projectId: FIREBASE_PROJECT_ID,
    databaseId: FIRESTORE_DATABASE_ID,
    authUid: auth.currentUser?.uid || null,
    authEmail: auth.currentUser?.email || null,
    emailVerified: Boolean(auth.currentUser?.emailVerified),
    appCheckConfigured,
    billingTier: 'Firebase Starter (No Cost)',
    checkedAt: new Date().toISOString(),
    errorMessage,
  };
}

// ============================================================================
// REAL-TIME LIVE WEBSITE ACTIVITY FEED & ONSNAPSHOT SUBSCRIPTIONS
// ============================================================================

export type LiveActivityCategory =
  | 'user'
  | 'application'
  | 'job'
  | 'learning'
  | 'enquiry'
  | 'certificate';

export interface AdminLiveActivityItem {
  id: string;
  category: LiveActivityCategory;
  title: string;
  subtitle: string;
  timestamp: string;
  statusLabel?: string;
  record: Record<string, unknown>;
}

export function buildLiveWebsiteActivityFeed(sources: {
  users: AdminUserRecord[];
  jobs: Job[];
  applications: Application[];
  enrolments: AdminCourseEnrolmentRecord[];
  attempts: AdminAssessmentAttemptRecord[];
  hiringEnquiries: HiringEnquiry[];
  courseEnquiries: (CourseEnquiry & { status?: string })[];
  issuedCerts: AdminIssuedCertificateRecord[];
  certRequests: CertificateApprovalRequestRecord[];
}): AdminLiveActivityItem[] {
  const items: AdminLiveActivityItem[] = [];

  for (const u of sources.users) {
    items.push({
      id: `user_${u.id}`,
      category: 'user',
      title: `${u.name} joined ABHI JOBS`,
      subtitle: `${u.email || u.id} · ${u.role.replace('_', ' ')}`,
      timestamp: u.createdAt || '',
      statusLabel: u.status,
      record: u as unknown as Record<string, unknown>,
    });
  }

  for (const a of sources.applications) {
    items.push({
      id: `app_${a.id}`,
      category: 'application',
      title: `${a.candidateName} applied for ${a.jobTitle}`,
      subtitle: `${a.companyName} · ${a.candidateEmail}`,
      timestamp: a.appliedAt || a.appliedDate || '',
      statusLabel: a.status,
      record: a as unknown as Record<string, unknown>,
    });
  }

  for (const j of sources.jobs) {
    items.push({
      id: `job_${j.id}`,
      category: 'job',
      title: `Job posted: ${j.title}`,
      subtitle: `${j.companyName} · ${j.location}`,
      timestamp: j.postedDate || '',
      statusLabel: j.status,
      record: j as unknown as Record<string, unknown>,
    });
  }

  for (const e of sources.enrolments) {
    items.push({
      id: `enrol_${e.id}`,
      category: 'learning',
      title: `Enrolled in ${e.courseTitle || e.courseId}`,
      subtitle: `Learner ${e.userId} · ${e.progressPercent}% complete`,
      timestamp: e.lastAccessedAt || e.enrolledAt || '',
      statusLabel: e.status.replace('_', ' '),
      record: e as unknown as Record<string, unknown>,
    });
  }

  for (const att of sources.attempts) {
    items.push({
      id: `att_${att.id}`,
      category: 'learning',
      title: `${att.passed ? 'Passed' : 'Attempted'} ${att.assessmentTitle}`,
      subtitle: `${att.courseTitle} · ${att.scorePercent}% (${att.correctAnswers}/${att.totalQuestions})`,
      timestamp: att.submittedAt || '',
      statusLabel: att.passed ? 'passed' : 'retry',
      record: att as unknown as Record<string, unknown>,
    });
  }

  for (const he of sources.hiringEnquiries) {
    items.push({
      id: `henq_${he.id}`,
      category: 'enquiry',
      title: `Hiring enquiry from ${he.companyName}`,
      subtitle: `${he.jobTitle} (${he.vacancies}) · ${he.contactPerson}`,
      timestamp: he.createdAt || '',
      statusLabel: he.status,
      record: he as unknown as Record<string, unknown>,
    });
  }

  for (const ce of sources.courseEnquiries) {
    items.push({
      id: `cenq_${ce.id}`,
      category: 'enquiry',
      title: `Course enquiry from ${ce.name}`,
      subtitle: `${ce.courseTitle} · ${ce.email}`,
      timestamp: ce.createdAt || '',
      statusLabel: ce.status || 'New',
      record: ce as unknown as Record<string, unknown>,
    });
  }

  for (const req of sources.certRequests) {
    items.push({
      id: `creq_${req.id}`,
      category: 'certificate',
      title: `Certificate requested by ${req.candidateName}`,
      subtitle: `${req.courseTitle}`,
      timestamp: req.requestedAt || req.updatedAt || '',
      statusLabel: req.status,
      record: req as unknown as Record<string, unknown>,
    });
  }

  for (const cert of sources.issuedCerts) {
    items.push({
      id: `cert_${cert.certificateId}`,
      category: 'certificate',
      title: `Certificate issued to ${cert.candidateName}`,
      subtitle: `${cert.courseTitle} · ${cert.certificateId}`,
      timestamp: cert.issuedAt || cert.issueDate || '',
      statusLabel: cert.status,
      record: cert as unknown as Record<string, unknown>,
    });
  }

  return items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 60);
}

export interface AdminLiveSubscriptionCallbacks {
  onUsers?: (rows: AdminUserRecord[]) => void;
  onCandidates?: (rows: CandidateProfile[]) => void;
  onEmployers?: (rows: EmployerProfile[]) => void;
  onJobs?: (rows: Job[]) => void;
  onApplications?: (rows: Application[]) => void;
  onInterviews?: (rows: Interview[]) => void;
  onHiringEnquiries?: (rows: HiringEnquiry[]) => void;
  onCourseEnquiries?: (
    rows: (CourseEnquiry & { status: 'New' | 'Contacted' | 'Enrolled' | 'Closed'; internalNotes?: string })[]
  ) => void;
  onEnrolments?: (rows: AdminCourseEnrolmentRecord[]) => void;
  onAttempts?: (rows: AdminAssessmentAttemptRecord[]) => void;
  onIssuedCerts?: (rows: AdminIssuedCertificateRecord[]) => void;
  onCertRequests?: (rows: CertificateApprovalRequestRecord[]) => void;
  onError?: (source: string, message: string) => void;
  onSyncPulse?: () => void;
}

/**
 * Attaches real-time Firestore onSnapshot listeners strictly matching the admin's
 * verified RBAC permissions so every website movement streams immediately into the console.
 */
export function subscribeAdminLiveData(
  permissions: AdminPermissionSet | null,
  callbacks: AdminLiveSubscriptionCallbacks
): () => void {
  if (!permissions) return () => {};
  const unsubs: Array<() => void> = [];

  const handleErr = (source: string, err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Admin Live Sync] ${source}:`, msg);
    callbacks.onError?.(source, msg);
  };

  if (permissions.canManageCandidates || permissions.canSuspendUsers || permissions.canManageHiringEnquiries) {
    unsubs.push(
      onSnapshot(
        query(collection(db, 'users'), limit(200)),
        (snap) => {
          const rows: AdminUserRecord[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              return {
                id: String(d.id || docSnap.id),
                candidateCode:
                  typeof d.candidateCode === 'string' && /^[1-9][0-9]{3}$/.test(d.candidateCode.trim())
                    ? d.candidateCode.trim()
                    : undefined,
                name: String(d.name || 'Unnamed User'),
                email: String(d.email || ''),
                role: (d.role as User['role']) || 'job_seeker',
                status: d.status === 'suspended' ? ('suspended' as const) : ('active' as const),
                avatar: typeof d.avatar === 'string' ? d.avatar : undefined,
                createdAt: toIsoString(d.createdAt),
                lastActive: String(d.lastActive || ''),
              };
            })
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          callbacks.onUsers?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('users', err)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'candidates'), limit(250)),
        (snap) => {
          const rows: CandidateProfile[] = snap.docs
            .map((docSnap) => mapCandidateProfileDoc(docSnap.id, docSnap.data()))
            .sort((a, b) => (b.lastActive || '').localeCompare(a.lastActive || ''));
          callbacks.onCandidates?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('candidates', err)
      )
    );
  }

  if (permissions.canManageEmployers || permissions.canManageJobs || permissions.canManageApplications) {
    unsubs.push(
      onSnapshot(
        query(collection(db, 'employers'), limit(200)),
        async (snap) => {
          const rows: EmployerProfile[] = await Promise.all(
            snap.docs.map(async (docSnap) => {
              const d = docSnap.data();
              let contact: Record<string, any> | undefined;
              try {
                const cSnap = await getDoc(doc(db, 'employers', docSnap.id, 'private_contacts', 'default'));
                if (cSnap.exists()) contact = cSnap.data();
              } catch {
                // Non-fatal
              }
              const verificationStatus =
                (d.verificationStatus as EmployerProfile['verificationStatus']) || 'pending';
              return {
                id: String(d.id || docSnap.id),
                userId: String(d.ownerUid || ''),
                companyName: String(d.companyName || ''),
                name: String(d.companyName || ''),
                website: String(d.website || ''),
                industry: String(d.industry || 'General'),
                companySize: String(d.companySize || '1-50'),
                size: String(d.companySize || '1-50'),
                location: String(d.location || ''),
                recruiterName: String(contact?.recruiterName || ''),
                recruiterRole: String(contact?.recruiterRole || ''),
                recruiterEmail: String(contact?.recruiterEmail || ''),
                recruiterPhone: String(contact?.recruiterPhone || ''),
                logo: String(d.logo || ''),
                about: String(d.about || ''),
                description: String(d.about || ''),
                benefits: Array.isArray(d.benefits) ? d.benefits.map(String) : [],
                culture: String(d.culture || ''),
                socialLinks: d.socialLinks && typeof d.socialLinks === 'object' ? d.socialLinks : {},
                verificationStatus,
                verified: verificationStatus === 'verified',
                verifiedAt: typeof d.verifiedAt === 'string' ? d.verifiedAt : undefined,
                activeJobsCount: typeof d.activeJobsCount === 'number' ? d.activeJobsCount : 0,
              };
            })
          );
          callbacks.onEmployers?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('employers', err)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'jobs'), limit(200)),
        (snap) => {
          const rows: Job[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              return {
                id: String(d.id || docSnap.id),
                employerId: String(d.employerId || ''),
                employerOwnerUid: String(d.employerOwnerUid || d.employerId || ''),
                companyName: String(d.companyName || ''),
                companyLogo: String(d.companyLogo || ''),
                title: String(d.title || ''),
                department: String(d.department || 'General'),
                industry: String(d.industry || 'General'),
                location: String(d.location || ''),
                employmentType: (d.employmentType as Job['employmentType']) || 'Full-time',
                workMode: (d.workMode as Job['workMode']) || 'On-site',
                experienceLevel: (d.experienceLevel as Job['experienceLevel']) || 'Mid',
                minExperienceYears: typeof d.minExperienceYears === 'number' ? d.minExperienceYears : 0,
                salary:
                  d.salary && typeof d.salary === 'object'
                    ? {
                        min: Number(d.salary.min) || 0,
                        max: Number(d.salary.max) || 0,
                        currency: String(d.salary.currency || 'INR'),
                        period: (d.salary.period as Job['salary']['period']) || 'yearly',
                      }
                    : { min: 0, max: 0, currency: 'INR', period: 'yearly' as const },
                overview: String(d.overview || ''),
                responsibilities: Array.isArray(d.responsibilities) ? d.responsibilities.map(String) : [],
                requirements: Array.isArray(d.requirements) ? d.requirements.map(String) : [],
                preferredSkills: Array.isArray(d.preferredSkills) ? d.preferredSkills.map(String) : [],
                benefits: Array.isArray(d.benefits) ? d.benefits.map(String) : [],
                deadline: String(d.deadline || ''),
                postedDate: toIsoString(d.postedAt || d.createdAt),
                status: (d.status as Job['status']) || 'published',
                applicantsCount: typeof d.applicantsCount === 'number' ? d.applicantsCount : 0,
                viewsCount: typeof d.viewsCount === 'number' ? d.viewsCount : 0,
                isVerifiedCompany: Boolean(d.isVerifiedCompany),
                featured: Boolean(d.featured),
              };
            })
            .sort((a, b) => (b.postedDate || '').localeCompare(a.postedDate || ''));
          callbacks.onJobs?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('jobs', err)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'applications'), limit(200)),
        (snap) => {
          const rows: Application[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              return {
                id: String(d.id || docSnap.id),
                jobId: String(d.jobId || ''),
                jobTitle: String(d.jobTitle || ''),
                companyName: String(d.companyName || ''),
                companyLogo: '',
                candidateId: String(d.candidateId || ''),
                candidateCode:
                  typeof d.candidateCode === 'string' && /^[1-9][0-9]{3}$/.test(d.candidateCode.trim())
                    ? d.candidateCode.trim()
                    : undefined,
                candidateName: String(d.candidateName || ''),
                candidateEmail: String(d.candidateEmail || ''),
                candidatePhone: String(d.candidatePhone || ''),
                candidateHeadline: String(d.candidateHeadline || ''),
                candidateLocation: String(d.candidateLocation || ''),
                candidateExperienceYears:
                  typeof d.candidateExperienceYears === 'number' ? d.candidateExperienceYears : 0,
                candidateSkills: Array.isArray(d.candidateSkills) ? d.candidateSkills.map(String) : [],
                resumeName: String(d.resumeName || 'Structured ABHI Resume'),
                coverNote: typeof d.coverNote === 'string' ? d.coverNote : undefined,
                status: (d.status as Application['status']) || 'Applied',
                appliedDate: toIsoString(d.appliedAt || d.createdAt),
                appliedAt: toIsoString(d.appliedAt || d.createdAt),
                timeline: Array.isArray(d.timeline) ? d.timeline : [],
                interviewId: typeof d.interviewId === 'string' ? d.interviewId : undefined,
                matchScore: typeof d.matchScore === 'number' ? d.matchScore : undefined,
              };
            })
            .sort((a, b) => (b.appliedAt || b.appliedDate || '').localeCompare(a.appliedAt || a.appliedDate || ''));
          callbacks.onApplications?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('applications', err)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'interviews'), limit(150)),
        (snap) => {
          const rows: Interview[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              return {
                id: String(d.id || docSnap.id),
                applicationId: String(d.applicationId || ''),
                jobId: String(d.jobId || ''),
                jobTitle: String(d.jobTitle || ''),
                candidateId: String(d.candidateId || ''),
                candidateName: String(d.candidateName || ''),
                employerId: String(d.employerId || ''),
                companyName: String(d.companyName || ''),
                date: String(d.scheduledDate || ''),
                time: String(d.scheduledTime || ''),
                type: (d.type as Interview['type']) || 'Video',
                meetingLink: typeof d.meetingLink === 'string' ? d.meetingLink : undefined,
                location: typeof d.location === 'string' ? d.location : undefined,
                notes: typeof d.notes === 'string' ? d.notes : undefined,
                status: (d.status as Interview['status']) || 'Scheduled',
              };
            })
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          callbacks.onInterviews?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('interviews', err)
      )
    );
  }

  if (permissions.canManageHiringEnquiries) {
    unsubs.push(
      onSnapshot(
        query(collection(db, 'hiring_enquiries'), limit(150)),
        (snap) => {
          const rows: HiringEnquiry[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              return {
                id: String(d.id || docSnap.id),
                companyName: String(d.companyName || ''),
                contactPerson: String(d.contactPerson || ''),
                businessEmail: String(d.businessEmail || ''),
                phoneNumber: String(d.phoneNumber || ''),
                jobTitle: String(d.jobTitle || ''),
                vacancies: typeof d.vacancies === 'number' ? d.vacancies : 1,
                jobLocation: String(d.jobLocation || ''),
                additionalRequirements: String(d.additionalRequirements || ''),
                status: (d.status as HiringEnquiry['status']) || 'New',
                assignedRecruiter: typeof d.assignedRecruiter === 'string' ? d.assignedRecruiter : undefined,
                internalNotes: typeof d.internalNotes === 'string' ? d.internalNotes : undefined,
                createdAt: toIsoString(d.createdAt),
              };
            })
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          callbacks.onHiringEnquiries?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('hiring_enquiries', err)
      )
    );
  }

  if (permissions.canManageCourseEnquiries) {
    unsubs.push(
      onSnapshot(
        query(collection(db, 'course_enquiries'), limit(150)),
        (snap) => {
          const rows = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              return {
                id: String(d.id || docSnap.id),
                courseId: String(d.courseId || ''),
                courseTitle: String(d.courseTitle || ''),
                name: String(d.name || ''),
                email: String(d.email || ''),
                phone: String(d.phone || ''),
                message: typeof d.message === 'string' ? d.message : undefined,
                status: (d.status as 'New' | 'Contacted' | 'Enrolled' | 'Closed') || 'New',
                internalNotes: typeof d.internalNotes === 'string' ? d.internalNotes : undefined,
                createdAt: toIsoString(d.createdAt),
              };
            })
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          callbacks.onCourseEnquiries?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('course_enquiries', err)
      )
    );
  }

  if (permissions.canManageCourses || permissions.canManageAssessments || permissions.canApproveCertificates) {
    unsubs.push(
      onSnapshot(
        query(collectionGroup(db, 'course_enrolments'), limit(200)),
        (snap) => {
          const rows: AdminCourseEnrolmentRecord[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              return {
                id: `${d.userId || 'user'}_${docSnap.id}`,
                userId: String(d.userId || ''),
                courseId: String(d.courseId || docSnap.id),
                courseSlug: String(d.courseSlug || ''),
                courseTitle: String(d.courseTitle || ''),
                categoryId: String(d.categoryId || ''),
                status: (d.status as AdminCourseEnrolmentRecord['status']) || 'enrolled',
                progressPercent: typeof d.progressPercent === 'number' ? d.progressPercent : 0,
                completedLessonsCount: Array.isArray(d.completedLessonIds) ? d.completedLessonIds.length : 0,
                passedQuizzesCount: Array.isArray(d.passedModuleQuizIds) ? d.passedModuleQuizIds.length : 0,
                unlockedModuleOrder: typeof d.unlockedModuleOrder === 'number' ? d.unlockedModuleOrder : 1,
                finalAssessmentPassed: Boolean(d.finalAssessmentPassed),
                bestFinalScorePercent:
                  typeof d.bestFinalScorePercent === 'number' ? d.bestFinalScorePercent : undefined,
                enrolledAt: toIsoString(d.enrolledAt),
                lastAccessedAt: toIsoString(d.lastAccessedAt),
                completedAt: toIsoString(d.completedAt) || undefined,
              };
            })
            .sort((a, b) => (b.lastAccessedAt || '').localeCompare(a.lastAccessedAt || ''));
          callbacks.onEnrolments?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('course_enrolments', err)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collectionGroup(db, 'assessment_attempts'), limit(150)),
        (snap) => {
          const rows: AdminAssessmentAttemptRecord[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              return {
                id: String(d.id || docSnap.id),
                userId: String(d.userId || ''),
                courseId: String(d.courseId || ''),
                courseSlug: String(d.courseSlug || ''),
                courseTitle: String(d.courseTitle || ''),
                assessmentType:
                  d.assessmentType === 'final_assessment'
                    ? ('final_assessment' as const)
                    : ('module_quiz' as const),
                moduleId: typeof d.moduleId === 'string' ? d.moduleId : undefined,
                assessmentTitle: String(d.assessmentTitle || ''),
                attemptNumber: typeof d.attemptNumber === 'number' ? d.attemptNumber : 1,
                totalQuestions: typeof d.totalQuestions === 'number' ? d.totalQuestions : 0,
                correctAnswers: typeof d.correctAnswers === 'number' ? d.correctAnswers : 0,
                incorrectAnswers: typeof d.incorrectAnswers === 'number' ? d.incorrectAnswers : 0,
                scorePercent: typeof d.scorePercent === 'number' ? d.scorePercent : 0,
                passPercentage: typeof d.passPercentage === 'number' ? d.passPercentage : 70,
                passed: Boolean(d.passed),
                submittedAt: toIsoString(d.submittedAt),
              };
            })
            .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
          callbacks.onAttempts?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('assessment_attempts', err)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'public_certificates'), limit(150)),
        (snap) => {
          const rows: AdminIssuedCertificateRecord[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              return {
                certificateId: String(d.certificateId || docSnap.id),
                candidateName: String(d.candidateName || ''),
                courseId: String(d.courseId || ''),
                courseTitle: String(d.courseTitle || ''),
                issueDate: String(d.issueDate || ''),
                status: d.status === 'revoked' ? ('revoked' as const) : ('valid' as const),
                issuanceMethod:
                  d.issuanceMethod === 'admin_approved'
                    ? ('admin_approved' as const)
                    : d.issuanceMethod === 'server_hmac'
                    ? ('server_hmac' as const)
                    : ('legacy' as const),
                issuedAt: toIsoString(d.issuedAt),
              };
            })
            .sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''));
          callbacks.onIssuedCerts?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('public_certificates', err)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'certificate_requests'), limit(150)),
        (snap) => {
          const rows: CertificateApprovalRequestRecord[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              return {
                id: String(d.id || docSnap.id),
                userId: String(d.userId || ''),
                candidateName: String(d.candidateName || ''),
                courseId: String(d.courseId || ''),
                courseSlug: String(d.courseSlug || ''),
                courseTitle: String(d.courseTitle || ''),
                completedLessonsCount:
                  typeof d.completedLessonsCount === 'number' ? d.completedLessonsCount : 0,
                candidateNote: typeof d.candidateNote === 'string' ? d.candidateNote : undefined,
                status: (d.status as CertificateApprovalRequestRecord['status']) || 'pending',
                reviewedBy: typeof d.reviewedBy === 'string' ? d.reviewedBy : undefined,
                reviewNote: typeof d.reviewNote === 'string' ? d.reviewNote : undefined,
                issuedCertificateId:
                  typeof d.issuedCertificateId === 'string' ? d.issuedCertificateId : undefined,
                requestedAt: toIsoString(d.requestedAt),
                updatedAt: toIsoString(d.updatedAt),
              };
            })
            .sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
          callbacks.onCertRequests?.(rows);
          callbacks.onSyncPulse?.();
        },
        (err) => handleErr('certificate_requests', err)
      )
    );
  }

  return () => {
    for (const unsub of unsubs) {
      try {
        unsub();
      } catch {
        // ignore cleanup error
      }
    }
  };
}

// ============================================================================
// ADMIN CANDIDATE DOSSIER, INTERNAL NOTES, RECRUITMENT STATUS & AUDIT LOGGING
// ============================================================================

export interface AdminCandidateAssessmentSummary {
  id: string;
  status: string;
  readinessScore?: number;
  recommendedCategory?: string;
  recommendedRoles?: string[];
  completedAt?: string;
  updatedAt?: string;
}

export interface AdminCandidateStructuredResumeSummary {
  id: string;
  title: string;
  targetRole?: string;
  template?: string;
  updatedAt?: string;
}

export interface AdminCandidateAuditItem {
  id: string;
  action: string;
  actorEmail: string;
  actorRole: string;
  summary: string;
  createdAt: string;
}

export interface AdminCandidateFullDossier {
  documents: CandidateDocumentRecord[];
  internalNotes: CandidateInternalNoteRecord[];
  careerAssessments: AdminCandidateAssessmentSummary[];
  structuredResumes: AdminCandidateStructuredResumeSummary[];
  auditHistory: AdminCandidateAuditItem[];
}

export async function recordAdminAuditAction(params: {
  action: string;
  targetType: 'candidate' | 'application' | 'document' | 'candidate_id_registry' | 'system';
  targetId: string;
  candidateCode?: string;
  summary: string;
}): Promise<void> {
  try {
    const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    if (!idToken) return;
    await fetch('/api/admin/audit-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(params),
    });
  } catch {
    // Non-fatal audit transport notice
  }
}

export async function fetchCandidateFullDossierAdmin(
  candidateUid: string
): Promise<AdminCandidateFullDossier> {
  const [documents, internalNotes, careerAssessments, structuredResumes, auditHistory] =
    await Promise.all([
      listCandidateDocuments(candidateUid).catch(() => []),
      (async (): Promise<CandidateInternalNoteRecord[]> => {
        try {
          const snap = await getDocs(
            query(
              collection(db, 'candidates', candidateUid, 'internal_notes'),
              orderBy('createdAt', 'desc'),
              limit(100)
            )
          );
          return snap.docs.map((d) => {
            const raw = d.data();
            return {
              id: String(raw.id || d.id),
              candidateUid: String(raw.candidateUid || candidateUid),
              authorUid: String(raw.authorUid || ''),
              authorEmail: String(raw.authorEmail || ''),
              authorName: String(raw.authorName || 'Admin'),
              text: String(raw.text || ''),
              category: typeof raw.category === 'string' ? raw.category : 'General',
              createdAt: toIsoString(raw.createdAt),
            };
          });
        } catch {
          return [];
        }
      })(),
      (async (): Promise<AdminCandidateAssessmentSummary[]> => {
        try {
          const snap = await getDocs(
            query(collection(db, 'users', candidateUid, 'career_assessments'), limit(20))
          );
          return snap.docs
            .map((d) => {
              const raw = d.data();
              const summary = raw.summary && typeof raw.summary === 'object' ? raw.summary : {};
              return {
                id: d.id,
                status: String(raw.status || 'in_progress'),
                readinessScore:
                  typeof summary.readinessScore === 'number'
                    ? summary.readinessScore
                    : typeof raw.readinessScore === 'number'
                    ? raw.readinessScore
                    : undefined,
                recommendedCategory:
                  typeof summary.primaryCareerTrack === 'string'
                    ? summary.primaryCareerTrack
                    : typeof raw.recommendedCategory === 'string'
                    ? raw.recommendedCategory
                    : undefined,
                recommendedRoles: Array.isArray(summary.recommendedRoles)
                  ? summary.recommendedRoles.map(String)
                  : undefined,
                completedAt: toIsoString(raw.completedAt),
                updatedAt: toIsoString(raw.updatedAt || raw.createdAt),
              };
            })
            .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        } catch {
          return [];
        }
      })(),
      (async (): Promise<AdminCandidateStructuredResumeSummary[]> => {
        try {
          const snap = await getDocs(
            query(collection(db, 'users', candidateUid, 'resumes'), limit(20))
          );
          return snap.docs.map((d) => {
            const raw = d.data();
            return {
              id: d.id,
              title: String(raw.title || 'Structured Resume'),
              targetRole: typeof raw.targetRole === 'string' ? raw.targetRole : undefined,
              template: typeof raw.template === 'string' ? raw.template : undefined,
              updatedAt: toIsoString(raw.updatedAt || raw.createdAt),
            };
          });
        } catch {
          return [];
        }
      })(),
      (async (): Promise<AdminCandidateAuditItem[]> => {
        try {
          const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
          if (!idToken) return [];
          const resp = await fetch(
            `/api/admin/audit-log?targetId=${encodeURIComponent(candidateUid)}&limit=50`,
            { headers: { Authorization: `Bearer ${idToken}` } }
          );
          if (!resp.ok) return [];
          const data: any = await resp.json().catch(() => ({}));
          return Array.isArray(data?.entries) ? data.entries : [];
        } catch {
          return [];
        }
      })(),
    ]);

  return {
    documents,
    internalNotes,
    careerAssessments,
    structuredResumes,
    auditHistory,
  };
}

export async function updateCandidateRecruitmentStatusAdmin(params: {
  candidateUid: string;
  candidateCode?: string;
  status: CandidateRecruitmentStatus;
}): Promise<void> {
  const candRef = doc(db, 'candidates', params.candidateUid);
  await updateDoc(candRef, {
    recruitmentStatus: params.status,
    updatedAt: serverTimestamp(),
  });
  await recordAdminAuditAction({
    action: 'candidate_recruitment_status_updated',
    targetType: 'candidate',
    targetId: params.candidateUid,
    candidateCode: params.candidateCode,
    summary: `Updated candidate recruitment status to "${params.status}".`,
  });
}

export async function addCandidateInternalNoteAdmin(params: {
  candidateUid: string;
  candidateCode?: string;
  authorUid: string;
  authorEmail: string;
  authorName: string;
  text: string;
  category?: string;
}): Promise<CandidateInternalNoteRecord> {
  const noteId = sanitizeFirestoreId(`cnote_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 'cnote');
  const trimmedText = params.text.trim().slice(0, 2000);
  const category = (params.category || 'General').slice(0, 40);

  await setDoc(
    doc(db, 'candidates', params.candidateUid, 'internal_notes', noteId),
    stripUndefined({
      id: noteId,
      candidateUid: params.candidateUid,
      authorUid: params.authorUid,
      authorEmail: params.authorEmail.slice(0, 150),
      authorName: params.authorName.slice(0, 120),
      text: trimmedText,
      category,
      createdAt: serverTimestamp(),
    })
  );

  await recordAdminAuditAction({
    action: 'candidate_internal_note_added',
    targetType: 'candidate',
    targetId: params.candidateUid,
    candidateCode: params.candidateCode,
    summary: `Added internal recruitment note (${category}).`,
  });

  return {
    id: noteId,
    candidateUid: params.candidateUid,
    authorUid: params.authorUid,
    authorEmail: params.authorEmail,
    authorName: params.authorName,
    text: trimmedText,
    category,
    createdAt: new Date().toISOString(),
  };
}

// Re-export commonly used admin read/write helpers so section panels import cleanly
export {
  listAllEmployersAdminFromFirestore,
  listAllJobsAdminFromFirestore,
  listAllApplicationsAdminFromFirestore,
  listCandidatesAdminFromFirestore,
  listInterviewsAdminFromFirestore,
  listHiringEnquiriesAdminFromFirestore,
  listCourseEnquiriesAdminFromFirestore,
  listCertificateApprovalRequestsAdmin,
  listAdminRoles,
  listAdminActivityLogs,
};
export type {
  Application,
  CandidateDocumentRecord,
  CandidateInternalNoteRecord,
  CandidateProfile,
  CandidateRecruitmentStatus,
  CourseEnquiry,
  EmployerProfile,
  HiringEnquiry,
  Interview,
  Job,
  CertificateApprovalRequestRecord,
  AdminRoleRecord,
  AdminActivityLogRecord,
};
