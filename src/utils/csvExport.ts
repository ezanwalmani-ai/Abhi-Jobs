import type {
  Application,
  CandidateProfile,
  EmployerProfile,
  HiringEnquiry,
  Job,
} from '../types';

export type AdminCsvDataset =
  | 'jobs'
  | 'applications'
  | 'candidates'
  | 'employers'
  | 'hiring_enquiries'
  | 'student_progress';

export interface StudentProgressExportRow {
  userId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  recordType: 'enrolment' | 'module_quiz' | 'final_assessment';
  moduleId?: string;
  assessmentTitle?: string;
  attemptNumber?: number;
  scorePercent?: number | null;
  passPercentage?: number | null;
  passed?: boolean | null;
  progressPercent?: number | null;
  unlockedModuleOrder?: number | null;
  status?: string;
  timestamp: string;
}

export interface AdminCsvDatasetDefinition {
  id: AdminCsvDataset;
  label: string;
  shortLabel: string;
  description: string;
  columns: string[];
}

export const ADMIN_CSV_DATASETS: Record<AdminCsvDataset, AdminCsvDatasetDefinition> = {
  jobs: {
    id: 'jobs',
    label: 'Job Listings',
    shortLabel: 'Jobs',
    description: 'Published, draft, paused, and closed job mandates with compensation and applicant counts.',
    columns: [
      'Job ID',
      'Title',
      'Company',
      'Department',
      'Industry',
      'Location',
      'Work Mode',
      'Employment Type',
      'Experience Level',
      'Min Experience (Yrs)',
      'Salary Min',
      'Salary Max',
      'Currency',
      'Status',
      'Deadline',
      'Applicants',
      'Views',
      'Posted Date',
    ],
  },
  applications: {
    id: 'applications',
    label: 'Job Applications',
    shortLabel: 'Applications',
    description: 'Candidate applications, pipeline stages, match scores, and screening metadata.',
    columns: [
      'Application ID',
      'Job ID',
      'Job Title',
      'Company',
      'Candidate Name',
      'Candidate Email',
      'Candidate Phone',
      'Location',
      'Experience (Yrs)',
      'Stage',
      'Match Score (%)',
      'Applied Date',
      'Internal Notes Count',
    ],
  },
  student_progress: {
    id: 'student_progress',
    label: 'Student Progress & Assessments',
    shortLabel: 'Student Progress',
    description: 'Learn with ABHI course enrolments, module quiz scores, unlock progress, and final assessments.',
    columns: [
      'User ID',
      'Student Name',
      'Student Email',
      'Course ID',
      'Course Title',
      'Record Type',
      'Module ID',
      'Assessment Title',
      'Attempt #',
      'Score (%)',
      'Pass Mark (%)',
      'Result',
      'Course Progress (%)',
      'Unlocked Module',
      'Status',
      'Recorded At',
    ],
  },
  candidates: {
    id: 'candidates',
    label: 'Candidate Profiles',
    shortLabel: 'Candidates',
    description: 'Registered candidate directory including skills, experience level, and availability.',
    columns: [
      'Candidate ID',
      'Full Name',
      'Email',
      'Phone',
      'Location',
      'Headline',
      'Experience Level',
      'Experience (Yrs)',
      'Work Status',
      'Availability',
      'Profile Completion (%)',
      'Key Skills',
      'Visibility',
    ],
  },
  employers: {
    id: 'employers',
    label: 'Employers & Companies',
    shortLabel: 'Employers',
    description: 'Verified and pending client companies, recruiter contacts, and active openings.',
    columns: [
      'Employer ID',
      'Company Name',
      'Industry',
      'Company Size',
      'Location',
      'Website',
      'Recruiter Name',
      'Recruiter Email',
      'Verification Status',
      'Active Jobs',
    ],
  },
  hiring_enquiries: {
    id: 'hiring_enquiries',
    label: 'Employer Hiring Enquiries',
    shortLabel: 'Hiring Enquiries',
    description: 'Inbound employer staffing requests, vacancy counts, assigned recruiters, and status.',
    columns: [
      'Enquiry ID',
      'Company Name',
      'Contact Person',
      'Business Email',
      'Phone Number',
      'Job Title',
      'Vacancies',
      'Job Location',
      'Status',
      'Assigned Recruiter',
      'Submitted At',
    ],
  },
};

const FORMULA_TRIGGER_REGEX = /^[\s]*[=+\-@\t\r]/;

/**
 * Neutralizes spreadsheet formula injection and applies strict RFC 4180 CSV escaping.
 */
export function escapeCsvCell(rawValue: unknown): string {
  if (rawValue === null || rawValue === undefined) {
    return '';
  }

  let text = String(rawValue)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\0/g, '');

  // Guard against Excel/Sheets formula execution (=, +, -, @, tab, CR)
  if (FORMULA_TRIGGER_REGEX.test(text)) {
    text = `'${text}`;
  }

  const needsQuotes =
    text.includes(',') ||
    text.includes('"') ||
    text.includes('\n') ||
    text.startsWith(' ') ||
    text.endsWith(' ');

  if (needsQuotes) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

/**
 * Builds a UTF-8 BOM RFC 4180 CSV document from headers and cell rows.
 */
export function serializeCsvDocument(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return `\uFEFF${[headerLine, ...bodyLines].join('\r\n')}\r\n`;
}

/**
 * Produces a safe, deterministic CSV filename with UTC ISO date stamp.
 */
export function buildSafeCsvFilename(dataset: AdminCsvDataset): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const safeSlug = dataset.replace(/[^a-z0-9_-]/gi, '-').replace(/_/g, '-');
  return `abhi-jobs-${safeSlug}-${dateStamp}.csv`;
}

export interface TableCsvSubColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

export interface TableCsvColumn<T> {
  key: string;
  header: string;
  csvValue?: (row: T) => unknown;
  csvColumns?: TableCsvSubColumn<T>[];
  excludeFromCsv?: boolean;
}

const SENSITIVE_CSV_FIELD_PATTERN =
  /password|secret|token|api[_-]?key|private[_-]?key|passcode|verificationSignature|signature|credential|internal[_-]?note|hash|salt/i;

function isRestrictedCsvField(keyOrHeader: string): boolean {
  const normalized = keyOrHeader.trim().toLowerCase();
  if (normalized === 'actions' || normalized === 'action' || normalized === 'inspect' || normalized === 'notes') {
    return true;
  }
  return SENSITIVE_CSV_FIELD_PATTERN.test(keyOrHeader);
}

function normalizeTableCellValue(raw: unknown): string | number {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : '';
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
  if (typeof raw === 'string') return raw.trim();
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join('; ');
  }
  return '';
}

/**
 * Produces a safe, deterministic CSV filename for any table export with UTC ISO date stamp.
 */
export function buildSafeTableCsvFilename(prefix: string): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const safeSlug = prefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/_/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `abhi-jobs-${safeSlug || 'export'}-${dateStamp}.csv`;
}

/**
 * Safely serializes ONLY allowlisted, non-sensitive visible table columns into RFC 4180 CSV.
 * Automatically blocks action/note columns, sensitive key patterns, nested objects, and formula injection.
 */
export function buildTableCsvDocument<T>(
  columns: TableCsvColumn<T>[],
  rows: T[]
): { headers: string[]; rows: (string | number)[][]; csvContent: string; rowCount: number } {
  const activeExtractors: TableCsvSubColumn<T>[] = [];

  for (const col of columns) {
    if (col.excludeFromCsv) continue;
    if (isRestrictedCsvField(col.key) || isRestrictedCsvField(col.header)) continue;

    if (Array.isArray(col.csvColumns) && col.csvColumns.length > 0) {
      for (const sub of col.csvColumns) {
        if (!sub.header || isRestrictedCsvField(sub.header)) continue;
        activeExtractors.push(sub);
      }
    } else if (typeof col.csvValue === 'function') {
      activeExtractors.push({ header: col.header, value: col.csvValue });
    }
  }

  const headers = activeExtractors.map((ext) => ext.header);
  const csvRows = rows.map((row) =>
    activeExtractors.map((ext) => {
      try {
        return normalizeTableCellValue(ext.value(row));
      } catch {
        return '';
      }
    })
  );

  const csvContent = headers.length > 0 ? serializeCsvDocument(headers, csvRows) : '';
  return {
    headers,
    rows: csvRows,
    csvContent,
    rowCount: csvRows.length,
  };
}

/**
 * Triggers a clean browser file download using a Blob URL (no window.open or data URI limits).
 */
export function triggerCsvBlobDownload(csvBlobOrContent: Blob | string, filename: string): void {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const blob =
    csvBlobOrContent instanceof Blob
      ? csvBlobOrContent
      : new Blob([csvBlobOrContent], { type: 'text/csv;charset=utf-8;' });

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = safeFilename.endsWith('.csv') ? safeFilename : `${safeFilename}.csv`;
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1500);
}

/**
 * Builds and downloads a sanitized CSV file for any admin data table.
 */
export function exportTableToCsv<T>(params: {
  columns: TableCsvColumn<T>[];
  rows: T[];
  filenamePrefix: string;
}): { exported: boolean; rowCount: number; filename: string } {
  const { headers, csvContent, rowCount } = buildTableCsvDocument(params.columns, params.rows);
  if (headers.length === 0) {
    return { exported: false, rowCount: 0, filename: '' };
  }
  const filename = buildSafeTableCsvFilename(params.filenamePrefix);
  triggerCsvBlobDownload(csvContent, filename);
  return { exported: true, rowCount, filename };
}

/**
 * Maps authorized domain records to clean, allowlisted CSV rows (zero credentials or internal tokens).
 */
export function mapDatasetToCsvRows(
  dataset: AdminCsvDataset,
  sources: {
    jobs?: Job[];
    applications?: Application[];
    candidates?: CandidateProfile[];
    employers?: EmployerProfile[];
    hiringEnquiries?: HiringEnquiry[];
    studentProgress?: StudentProgressExportRow[];
  }
): { headers: string[]; rows: unknown[][] } {
  const def = ADMIN_CSV_DATASETS[dataset];

  switch (dataset) {
    case 'jobs':
      return {
        headers: def.columns,
        rows: (sources.jobs || []).map((j) => [
          j.id,
          j.title,
          j.companyName,
          j.department,
          j.industry,
          j.location,
          j.workMode,
          j.employmentType,
          j.experienceLevel,
          j.minExperienceYears,
          j.salary?.min ?? 0,
          j.salary?.max ?? 0,
          j.salary?.currency ?? 'INR',
          j.status,
          j.deadline,
          j.applicantsCount,
          j.viewsCount,
          j.postedDate,
        ]),
      };

    case 'applications':
      return {
        headers: def.columns,
        rows: (sources.applications || []).map((a) => [
          a.id,
          a.jobId,
          a.jobTitle,
          a.companyName,
          a.candidateName,
          a.candidateEmail,
          a.candidatePhone || '',
          a.candidateLocation || '',
          a.candidateExperienceYears ?? 0,
          a.status,
          a.matchScore ?? '',
          a.appliedDate,
          Array.isArray(a.internalNotes) ? a.internalNotes.length : 0,
        ]),
      };

    case 'candidates':
      return {
        headers: def.columns,
        rows: (sources.candidates || []).map((c) => [
          c.id,
          c.name,
          c.email,
          c.phone || '',
          c.location || '',
          c.headline || '',
          c.experienceLevel || '',
          c.yearsOfExperience ?? 0,
          c.workStatus || '',
          c.availability || '',
          c.completionPercentage ?? 0,
          Array.isArray(c.skills) ? c.skills.join('; ') : '',
          c.profileVisibility || 'employers_only',
        ]),
      };

    case 'employers':
      return {
        headers: def.columns,
        rows: (sources.employers || []).map((e) => [
          e.id,
          e.companyName,
          e.industry || '',
          e.companySize || '',
          e.location || '',
          e.website || '',
          e.recruiterName || '',
          e.recruiterEmail || '',
          e.verificationStatus || '',
          e.activeJobsCount ?? 0,
        ]),
      };

    case 'hiring_enquiries':
      return {
        headers: def.columns,
        rows: (sources.hiringEnquiries || []).map((enq) => [
          enq.id,
          enq.companyName,
          enq.contactPerson,
          enq.businessEmail,
          enq.phoneNumber || '',
          enq.jobTitle,
          enq.vacancies,
          enq.jobLocation,
          enq.status,
          enq.assignedRecruiter || '',
          enq.createdAt,
        ]),
      };

    case 'student_progress':
      return {
        headers: def.columns,
        rows: (sources.studentProgress || []).map((s) => [
          s.userId,
          s.studentName,
          s.studentEmail,
          s.courseId,
          s.courseTitle,
          s.recordType,
          s.moduleId || '',
          s.assessmentTitle || '',
          s.attemptNumber ?? '',
          s.scorePercent ?? '',
          s.passPercentage ?? '',
          s.passed === true ? 'Passed' : s.passed === false ? 'Not Passed' : '',
          s.progressPercent ?? '',
          s.unlockedModuleOrder ?? '',
          s.status || '',
          s.timestamp,
        ]),
      };
  }
}
