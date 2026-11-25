import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type FirebaseUser,
} from '../lib/firebase';

export type AdminRole =
  | 'super_admin'
  | 'recruitment_admin'
  | 'course_admin'
  | 'content_admin'
  | 'support_admin';

export type AdminRoleStatus = 'active' | 'revoked';

export interface AdminRoleRecord {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  status: AdminRoleStatus;
  assignedBy: string;
  notes?: string;
  assignedAt: string;
  updatedAt: string;
}

export interface AdminActivityLogRecord {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: AdminRole | string;
  action: string;
  targetCollection: string;
  targetId: string;
  summary: string;
  timestamp: string;
}

export interface AdminPermissionSet {
  label: string;
  description: string;
  canViewOverview: boolean;
  canManageRoles: boolean;
  canViewAuditLogs: boolean;
  canExportCsv: boolean;
  canManageEmployers: boolean;
  canManageJobs: boolean;
  canManageApplications: boolean;
  canManageCandidates: boolean;
  canSuspendUsers: boolean;
  canManageCourses: boolean;
  canManageAssessments: boolean;
  canApproveCertificates: boolean;
  canManageCms: boolean;
  canManagePublicSettings: boolean;
  canManageHiringEnquiries: boolean;
  canManageCourseEnquiries: boolean;
}

export const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'ezanwalmani@gmail.com';

export const ADMIN_ROLES_ORDER: AdminRole[] = [
  'super_admin',
  'recruitment_admin',
  'course_admin',
  'content_admin',
  'support_admin',
];

export const ADMIN_PERMISSION_MATRIX: Record<AdminRole, AdminPermissionSet> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Full platform governance, RBAC assignment, security exports, and all modules.',
    canViewOverview: true,
    canManageRoles: true,
    canViewAuditLogs: true,
    canExportCsv: true,
    canManageEmployers: true,
    canManageJobs: true,
    canManageApplications: true,
    canManageCandidates: true,
    canSuspendUsers: true,
    canManageCourses: true,
    canManageAssessments: true,
    canApproveCertificates: true,
    canManageCms: true,
    canManagePublicSettings: true,
    canManageHiringEnquiries: true,
    canManageCourseEnquiries: true,
  },
  recruitment_admin: {
    label: 'Recruitment Admin',
    description: 'Employer verification, job moderation, applications, interviews, and hiring enquiries.',
    canViewOverview: true,
    canManageRoles: false,
    canViewAuditLogs: false,
    canExportCsv: false,
    canManageEmployers: true,
    canManageJobs: true,
    canManageApplications: true,
    canManageCandidates: true,
    canSuspendUsers: false,
    canManageCourses: false,
    canManageAssessments: false,
    canApproveCertificates: false,
    canManageCms: false,
    canManagePublicSettings: false,
    canManageHiringEnquiries: true,
    canManageCourseEnquiries: false,
  },
  course_admin: {
    label: 'Course Admin',
    description: 'Learn with ABHI courses, modules, quizzes, course enquiries, and certificate approvals.',
    canViewOverview: true,
    canManageRoles: false,
    canViewAuditLogs: false,
    canExportCsv: false,
    canManageEmployers: false,
    canManageJobs: false,
    canManageApplications: false,
    canManageCandidates: false,
    canSuspendUsers: false,
    canManageCourses: true,
    canManageAssessments: true,
    canApproveCertificates: true,
    canManageCms: false,
    canManagePublicSettings: false,
    canManageHiringEnquiries: false,
    canManageCourseEnquiries: true,
  },
  content_admin: {
    label: 'Content Admin',
    description: 'Website CMS blocks, announcements, career guides, FAQs, and public site settings.',
    canViewOverview: true,
    canManageRoles: false,
    canViewAuditLogs: false,
    canExportCsv: false,
    canManageEmployers: false,
    canManageJobs: false,
    canManageApplications: false,
    canManageCandidates: false,
    canSuspendUsers: false,
    canManageCourses: false,
    canManageAssessments: false,
    canApproveCertificates: false,
    canManageCms: true,
    canManagePublicSettings: true,
    canManageHiringEnquiries: false,
    canManageCourseEnquiries: false,
  },
  support_admin: {
    label: 'Support Admin',
    description: 'User account support, suspension/reactivation, and enquiry triage.',
    canViewOverview: true,
    canManageRoles: false,
    canViewAuditLogs: false,
    canExportCsv: false,
    canManageEmployers: false,
    canManageJobs: false,
    canManageApplications: false,
    canManageCandidates: true,
    canSuspendUsers: true,
    canManageCourses: false,
    canManageAssessments: false,
    canApproveCertificates: false,
    canManageCms: false,
    canManagePublicSettings: false,
    canManageHiringEnquiries: true,
    canManageCourseEnquiries: true,
  },
};

export interface ResolvedAdminSession {
  authorized: boolean;
  uid: string | null;
  email: string | null;
  displayName: string | null;
  role: AdminRole | null;
  permissions: AdminPermissionSet | null;
  source: 'admin_roles_doc' | 'bootstrap_super_admin' | 'none';
  denialReason?:
    | 'unauthenticated'
    | 'email_unverified'
    | 'account_suspended'
    | 'role_missing_or_revoked';
}

function normalizeIsoTimestamp(val: unknown): string {
  if (typeof val === 'string' && val.trim()) return val;
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

export function getPermissionsForRole(role: AdminRole | null | undefined): AdminPermissionSet | null {
  if (!role || !(role in ADMIN_PERMISSION_MATRIX)) return null;
  return ADMIN_PERMISSION_MATRIX[role];
}

export function canPerformAdminAction(
  role: AdminRole | null | undefined,
  permissionKey: keyof Omit<AdminPermissionSet, 'label' | 'description'>
): boolean {
  const perms = getPermissionsForRole(role);
  return Boolean(perms && perms[permissionKey]);
}

/**
 * Pure validation helper for role mutations: enforces self-lockout and
 * last-active-Super-Admin protection so the platform can never lose its last Super Admin.
 */
export function validateAdminRoleMutation(params: {
  actorUid: string;
  actorRole: AdminRole | null;
  targetUid: string;
  nextRole: AdminRole;
  nextStatus: AdminRoleStatus;
  existingRoles: Pick<AdminRoleRecord, 'uid' | 'role' | 'status'>[];
}): { allowed: boolean; error?: string } {
  if (params.actorRole !== 'super_admin') {
    return {
      allowed: false,
      error: 'Only an active Super Admin can assign, change, or revoke administrator roles.',
    };
  }

  const targetExisting = params.existingRoles.find((r) => r.uid === params.targetUid);
  const activeSuperAdmins = params.existingRoles.filter(
    (r) => r.role === 'super_admin' && r.status === 'active'
  );

  // Prevent Super Admin from revoking or downgrading themselves
  if (
    params.targetUid === params.actorUid &&
    (params.nextStatus !== 'active' || params.nextRole !== 'super_admin')
  ) {
    return {
      allowed: false,
      error: 'You cannot revoke or downgrade your own Super Admin role.',
    };
  }

  // Prevent removing or downgrading the last active Super Admin
  const targetIsCurrentlyActiveSuperAdmin =
    targetExisting?.role === 'super_admin' && targetExisting?.status === 'active';
  const targetWillStopBeingActiveSuperAdmin =
    params.nextRole !== 'super_admin' || params.nextStatus !== 'active';

  if (
    targetIsCurrentlyActiveSuperAdmin &&
    targetWillStopBeingActiveSuperAdmin &&
    activeSuperAdmins.length <= 1
  ) {
    return {
      allowed: false,
      error: 'Cannot remove or downgrade the last active Super Admin. Assign another active Super Admin first.',
    };
  }

  return { allowed: true };
}

/**
 * Verifies real Firebase Authentication + verified email + non-suspended account
 * + active /admin_roles/{uid} document (or verified bootstrap Super Admin email).
 * Never trusts localStorage or client-supplied role toggles.
 */
export async function resolveFirebaseAdminSession(
  fbUser: FirebaseUser | null = auth.currentUser
): Promise<ResolvedAdminSession> {
  if (!fbUser || !fbUser.uid) {
    return {
      authorized: false,
      uid: null,
      email: null,
      displayName: null,
      role: null,
      permissions: null,
      source: 'none',
      denialReason: 'unauthenticated',
    };
  }

  const email = (fbUser.email || '').trim().toLowerCase();
  const displayName = fbUser.displayName || email.split('@')[0] || 'Administrator';

  if (!fbUser.emailVerified) {
    return {
      authorized: false,
      uid: fbUser.uid,
      email,
      displayName,
      role: null,
      permissions: null,
      source: 'none',
      denialReason: 'email_unverified',
    };
  }

  // 1. Check account suspension status on /users/{uid}
  try {
    const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
    if (userSnap.exists() && userSnap.data()?.status === 'suspended') {
      return {
        authorized: false,
        uid: fbUser.uid,
        email,
        displayName,
        role: null,
        permissions: null,
        source: 'none',
        denialReason: 'account_suspended',
      };
    }
  } catch {
    // Non-fatal if /users/{uid} has not been created yet
  }

  // 2. Check authoritative Firestore /admin_roles/{uid} document
  try {
    const roleSnap = await getDoc(doc(db, 'admin_roles', fbUser.uid));
    if (roleSnap.exists()) {
      const data = roleSnap.data();
      const role = data.role as AdminRole;
      const status = data.status as AdminRoleStatus;
      if (status === 'active' && role in ADMIN_PERMISSION_MATRIX) {
        return {
          authorized: true,
          uid: fbUser.uid,
          email,
          displayName: String(data.displayName || displayName),
          role,
          permissions: ADMIN_PERMISSION_MATRIX[role],
          source: 'admin_roles_doc',
        };
      }
      // Explicitly revoked record blocks access (even for bootstrap email if revoked explicitly)
      return {
        authorized: false,
        uid: fbUser.uid,
        email,
        displayName,
        role: null,
        permissions: null,
        source: 'none',
        denialReason: 'role_missing_or_revoked',
      };
    }
  } catch {
    // Permission denied or offline — fall through strictly to verified bootstrap check
  }

  // 3. Verified Bootstrap Super Admin fallback (mirrors firestore.rules bootstrap rule)
  if (email === BOOTSTRAP_SUPER_ADMIN_EMAIL) {
    return {
      authorized: true,
      uid: fbUser.uid,
      email,
      displayName,
      role: 'super_admin',
      permissions: ADMIN_PERMISSION_MATRIX.super_admin,
      source: 'bootstrap_super_admin',
    };
  }

  return {
    authorized: false,
    uid: fbUser.uid,
    email,
    displayName,
    role: null,
    permissions: null,
    source: 'none',
    denialReason: 'role_missing_or_revoked',
  };
}

export async function listAdminRoles(): Promise<AdminRoleRecord[]> {
  const snap = await getDocs(collection(db, 'admin_roles'));
  const items: AdminRoleRecord[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    items.push({
      uid: String(d.uid || docSnap.id),
      email: String(d.email || ''),
      displayName: String(d.displayName || ''),
      role: (d.role as AdminRole) || 'support_admin',
      status: d.status === 'revoked' ? 'revoked' : 'active',
      assignedBy: String(d.assignedBy || ''),
      notes: typeof d.notes === 'string' ? d.notes : undefined,
      assignedAt: normalizeIsoTimestamp(d.assignedAt),
      updatedAt: normalizeIsoTimestamp(d.updatedAt),
    });
  });
  return items.sort((a, b) => a.email.localeCompare(b.email));
}

export async function upsertAdminRole(params: {
  actorSession: ResolvedAdminSession;
  targetUid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  status: AdminRoleStatus;
  notes?: string;
}): Promise<AdminRoleRecord> {
  if (!params.actorSession.authorized || !params.actorSession.uid) {
    throw new Error('Verified Super Admin session is required.');
  }

  const targetUid = params.targetUid.trim();
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.displayName.trim();
  if (!/^[a-zA-Z0-9_-]{3,128}$/.test(targetUid)) {
    throw new Error('Target Firebase UID must be 3-128 alphanumeric, underscore, or hyphen characters.');
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('A valid administrator email address is required.');
  }
  if (!cleanName) {
    throw new Error('Administrator display name is required.');
  }

  const existingRoles = await listAdminRoles();
  const check = validateAdminRoleMutation({
    actorUid: params.actorSession.uid,
    actorRole: params.actorSession.role,
    targetUid,
    nextRole: params.role,
    nextStatus: params.status,
    existingRoles,
  });

  if (!check.allowed) {
    throw new Error(check.error || 'Role update not permitted.');
  }

  const ref = doc(db, 'admin_roles', targetUid);
  const existingSnap = await getDoc(ref);
  const nowIso = new Date().toISOString();

  if (existingSnap.exists()) {
    const updatePayload: Record<string, unknown> = {
      displayName: cleanName.slice(0, 120),
      role: params.role,
      status: params.status,
      updatedAt: serverTimestamp(),
    };
    if (params.notes?.trim()) {
      updatePayload.notes = params.notes.trim().slice(0, 500);
    }
    await updateDoc(ref, updatePayload);
  } else {
    const createPayload: Record<string, unknown> = {
      uid: targetUid,
      email: cleanEmail.slice(0, 150),
      displayName: cleanName.slice(0, 120),
      role: params.role,
      status: params.status,
      assignedBy: params.actorSession.uid,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (params.notes?.trim()) {
      createPayload.notes = params.notes.trim().slice(0, 500);
    }
    await setDoc(ref, createPayload);
  }

  return {
    uid: targetUid,
    email: cleanEmail,
    displayName: cleanName,
    role: params.role,
    status: params.status,
    assignedBy: params.actorSession.uid,
    notes: params.notes?.trim() || undefined,
    assignedAt: existingSnap.exists()
      ? normalizeIsoTimestamp(existingSnap.data()?.assignedAt)
      : nowIso,
    updatedAt: nowIso,
  };
}

/**
 * Reads immutable server-written audit logs (Super Admin read-only).
 * On Firebase Starter tier, automated writes to /admin_activity_logs are deferred
 * until Blaze Cloud Functions are enabled; client writes are strictly denied by firestore.rules.
 */
export async function listAdminActivityLogs(maxItems = 50): Promise<AdminActivityLogRecord[]> {
  try {
    const q = query(
      collection(db, 'admin_activity_logs'),
      orderBy('timestamp', 'desc'),
      limit(Math.min(100, Math.max(1, maxItems)))
    );
    const snap = await getDocs(q);
    const logs: AdminActivityLogRecord[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      logs.push({
        id: String(d.id || docSnap.id),
        actorUid: String(d.actorUid || ''),
        actorEmail: String(d.actorEmail || ''),
        actorRole: String(d.actorRole || ''),
        action: String(d.action || ''),
        targetCollection: String(d.targetCollection || ''),
        targetId: String(d.targetId || ''),
        summary: String(d.summary || ''),
        timestamp: normalizeIsoTimestamp(d.timestamp),
      });
    });
    return logs;
  } catch {
    return [];
  }
}
