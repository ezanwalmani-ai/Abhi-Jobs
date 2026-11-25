import { collectionGroup, getDocs } from 'firebase/firestore';
import { auth as firebaseAuth, db } from '../lib/firebase';
import {
  checkAdminAssessmentAuthStatus,
  getAdminAuthHeaders,
} from './assessmentService';
import type {
  Application,
  CandidateProfile,
  EmployerProfile,
  HiringEnquiry,
  Job,
} from '../types';
import {
  ADMIN_CSV_DATASETS,
  AdminCsvDataset,
  StudentProgressExportRow,
  buildSafeCsvFilename,
  mapDatasetToCsvRows,
  serializeCsvDocument,
  triggerCsvBlobDownload,
} from '../utils/csvExport';
import { resolveFirebaseAdminSession } from './adminRbacService';

export interface SuperAdminExportAuthStatus {
  authorized: boolean;
  method: 'firebase' | 'passcode' | null;
  passcodeMode: 'env' | 'claimed' | 'needs_setup';
  actorEmail?: string | null;
}

export interface AdminExportDataSources {
  jobs: Job[];
  applications: Application[];
  candidates: CandidateProfile[];
  employers: EmployerProfile[];
  hiringEnquiries: HiringEnquiry[];
}

export interface AdminCsvExportResult {
  filename: string;
  rowCount: number;
  dataset: AdminCsvDataset;
  serverVerified: boolean;
}

/**
 * Verifies Super Admin authorization via Firebase /admin_roles RBAC and (when available) the dev backend.
 */
export async function checkSuperAdminExportAuth(): Promise<SuperAdminExportAuthStatus> {
  const rbacSession = await resolveFirebaseAdminSession(firebaseAuth.currentUser);
  if (rbacSession.authorized && rbacSession.permissions?.canExportCsv) {
    return {
      authorized: true,
      method: 'firebase',
      passcodeMode: 'env',
      actorEmail: rbacSession.email,
    };
  }

  try {
    const status = await checkAdminAssessmentAuthStatus();
    return {
      authorized: Boolean(status.authenticated),
      method: status.method,
      passcodeMode: status.passcodeMode,
      actorEmail: firebaseAuth.currentUser?.email || null,
    };
  } catch {
    return {
      authorized: false,
      method: null,
      passcodeMode: 'env',
      actorEmail: firebaseAuth.currentUser?.email || null,
    };
  }
}

/**
 * Reads Learn with ABHI course enrolments from Firestore when the caller is signed in
 * as an authorized Firebase Super Admin. Returns [] gracefully if unavailable.
 */
async function collectAuthorizedFirestoreEnrolments(): Promise<StudentProgressExportRow[]> {
  const fbUser = firebaseAuth.currentUser;
  if (!fbUser || !fbUser.emailVerified) {
    return [];
  }

  try {
    const snap = await getDocs(collectionGroup(db, 'course_enrolments'));
    const rows: StudentProgressExportRow[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, any>;
      const userId = String(data.userId || docSnap.ref.parent.parent?.id || '').slice(0, 128);
      const courseId = String(data.courseId || docSnap.id || '').slice(0, 128);
      if (!userId || !courseId) return;

      const updatedRaw = data.updatedAt?.toDate
        ? data.updatedAt.toDate().toISOString()
        : typeof data.updatedAt === 'string'
        ? data.updatedAt
        : typeof data.enrolledAt === 'string'
        ? data.enrolledAt
        : new Date().toISOString();

      rows.push({
        userId,
        studentName: String(data.studentName || data.candidateName || '').slice(0, 120),
        studentEmail: String(data.studentEmail || data.candidateEmail || '').slice(0, 150),
        courseId,
        courseTitle: String(data.courseTitle || courseId).slice(0, 160),
        recordType: 'enrolment',
        moduleId: typeof data.currentModuleId === 'string' ? data.currentModuleId : '',
        assessmentTitle: '',
        attemptNumber: undefined,
        scorePercent:
          typeof data.bestFinalScorePercent === 'number' ? data.bestFinalScorePercent : null,
        passPercentage: 70,
        passed: typeof data.finalAssessmentPassed === 'boolean' ? data.finalAssessmentPassed : null,
        progressPercent: typeof data.progressPercent === 'number' ? data.progressPercent : 0,
        unlockedModuleOrder:
          typeof data.unlockedModuleOrder === 'number' ? data.unlockedModuleOrder : 1,
        status: String(data.status || 'enrolled'),
        timestamp: updatedRaw,
      });
    });

    return rows;
  } catch {
    return [];
  }
}

/**
 * Generates a formula-safe CSV export strictly for verified Super Admins.
 * Uses /api/admin/export-csv when available and safely falls back to verified Firebase Super Admin
 * client serialization on static Netlify hosting (Starter tier).
 */
export async function downloadAuthorizedAdminCsv(
  dataset: AdminCsvDataset,
  sources: AdminExportDataSources
): Promise<AdminCsvExportResult> {
  if (!ADMIN_CSV_DATASETS[dataset]) {
    throw new Error('Unsupported export dataset selected.');
  }

  const rbacSession = await resolveFirebaseAdminSession(firebaseAuth.currentUser);
  const isFirebaseSuperAdmin = Boolean(rbacSession.authorized && rbacSession.permissions?.canExportCsv);
  const headers = await getAdminAuthHeaders();

  if (!isFirebaseSuperAdmin && !headers.Authorization) {
    throw new Error(
      'Super Admin verification is required before exporting system data. Please verify your Super Admin account first.'
    );
  }

  let bodyPayload: Record<string, unknown> = { dataset };
  let enrolmentRows: StudentProgressExportRow[] = [];

  if (dataset === 'student_progress') {
    enrolmentRows = await collectAuthorizedFirestoreEnrolments();
    bodyPayload = {
      dataset,
      enrolments: enrolmentRows,
    };
  } else {
    const mapped = mapDatasetToCsvRows(dataset, {
      jobs: sources.jobs,
      applications: sources.applications,
      candidates: sources.candidates,
      employers: sources.employers,
      hiringEnquiries: sources.hiringEnquiries,
    });
    bodyPayload = {
      dataset,
      headers: mapped.headers,
      rows: mapped.rows,
    };
  }

  // Attempt server-verified endpoint first (dev Express server / future Cloud Function)
  if (headers.Authorization) {
    try {
      const res = await fetch('/api/admin/export-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(bodyPayload),
      });

      if (res.ok) {
        const blob = await res.blob();
        const rowCountHeader = Number(res.headers.get('X-Export-Row-Count') || '0');
        const disposition = res.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="([^"]+)"/i);
        const filename = match?.[1] || buildSafeCsvFilename(dataset);

        triggerCsvBlobDownload(blob, filename);

        return {
          filename,
          rowCount: Number.isFinite(rowCountHeader) ? rowCountHeader : 0,
          dataset,
          serverVerified: true,
        };
      }

      if (res.status !== 404 && !isFirebaseSuperAdmin) {
        let errorMessage = `Export failed (${res.status}).`;
        try {
          const errJson = await res.json();
          if (errJson?.error) errorMessage = String(errJson.error);
        } catch {
          // ignore
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      if (!isFirebaseSuperAdmin) {
        throw err;
      }
    }
  }

  // Verified Firebase Super Admin Starter-tier fallback (formula-safe RFC 4180 CSV)
  if (!isFirebaseSuperAdmin) {
    throw new Error('Super Admin authorization could not be confirmed.');
  }

  const mapped = mapDatasetToCsvRows(dataset, {
    jobs: sources.jobs,
    applications: sources.applications,
    candidates: sources.candidates,
    employers: sources.employers,
    hiringEnquiries: sources.hiringEnquiries,
    studentProgress: enrolmentRows,
  });

  const csvContent = serializeCsvDocument(mapped.headers, mapped.rows);
  const filename = buildSafeCsvFilename(dataset);
  triggerCsvBlobDownload(csvContent, filename);

  return {
    filename,
    rowCount: mapped.rows.length,
    dataset,
    serverVerified: false,
  };
}
