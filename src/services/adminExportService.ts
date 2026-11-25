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
  triggerCsvBlobDownload,
} from '../utils/csvExport';

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
 * Verifies Super Admin authorization status against the backend server.
 */
export async function checkSuperAdminExportAuth(): Promise<SuperAdminExportAuthStatus> {
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
    // Non-fatal: server-side assessment attempts will still be exported authoritatively
    return [];
  }
}

/**
 * Securely requests a server-verified, sanitized CSV export for Super Admins.
 * Always validates Super Admin authorization on the backend (/api/admin/export-csv).
 */
export async function downloadAuthorizedAdminCsv(
  dataset: AdminCsvDataset,
  sources: AdminExportDataSources
): Promise<AdminCsvExportResult> {
  if (!ADMIN_CSV_DATASETS[dataset]) {
    throw new Error('Unsupported export dataset selected.');
  }

  const headers = await getAdminAuthHeaders();
  if (!headers.Authorization) {
    throw new Error(
      'Super Admin verification is required before exporting system data. Please verify your Super Admin account first.'
    );
  }

  let bodyPayload: Record<string, unknown> = { dataset };

  if (dataset === 'student_progress') {
    const enrolmentRows = await collectAuthorizedFirestoreEnrolments();
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

  const res = await fetch('/api/admin/export-csv', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    let errorMessage = `Export failed (${res.status}).`;
    try {
      const errJson = await res.json();
      if (errJson?.error) errorMessage = String(errJson.error);
    } catch {
      // ignore non-JSON error body
    }
    throw new Error(errorMessage);
  }

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
