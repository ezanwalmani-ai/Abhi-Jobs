import React, { useEffect, useState } from 'react';
import {
  Shield,
  UserPlus,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  ScrollText,
  Lock,
  Loader2,
} from 'lucide-react';
import {
  ADMIN_PERMISSION_MATRIX,
  ADMIN_ROLES_ORDER,
  listAdminRoles,
  upsertAdminRole,
  listAdminActivityLogs,
  type AdminRole,
  type AdminRoleStatus,
  type AdminRoleRecord,
  type AdminActivityLogRecord,
  type ResolvedAdminSession,
} from '../../services/adminRbacService';

interface AdminRoleManagementPanelProps {
  adminSession: ResolvedAdminSession;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

const MATRIX_CAPABILITY_ROWS: {
  key: keyof Omit<typeof ADMIN_PERMISSION_MATRIX.super_admin, 'label' | 'description'>;
  label: string;
}[] = [
  { key: 'canManageRoles', label: 'Manage Admin Roles (/admin_roles)' },
  { key: 'canViewAuditLogs', label: 'Read Audit Logs (/admin_activity_logs)' },
  { key: 'canExportCsv', label: 'Super Admin CSV Data Export' },
  { key: 'canManageEmployers', label: 'Verify & Manage Employers' },
  { key: 'canManageJobs', label: 'Create, Moderate & Close Jobs' },
  { key: 'canManageApplications', label: 'Applications, Interviews & Internal Notes' },
  { key: 'canManageCandidates', label: 'View Candidate Profiles' },
  { key: 'canSuspendUsers', label: 'Suspend / Reactivate User Accounts' },
  { key: 'canManageCourses', label: 'Manage Learn with ABHI Courses & Lessons' },
  { key: 'canManageAssessments', label: 'Manage Quizzes & Assessments' },
  { key: 'canApproveCertificates', label: 'Approve / Reject Certificate Requests' },
  { key: 'canManageCms', label: 'Edit Website CMS Content (/website_content)' },
  { key: 'canManagePublicSettings', label: 'Edit Public Site Settings (/public_settings)' },
  { key: 'canManageHiringEnquiries', label: 'Manage Hiring Enquiries' },
  { key: 'canManageCourseEnquiries', label: 'Manage Course Enquiries' },
];

export const AdminRoleManagementPanel: React.FC<AdminRoleManagementPanelProps> = ({
  adminSession,
  onNotify,
}) => {
  const [roles, setRoles] = useState<AdminRoleRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminActivityLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state for adding/updating an admin role
  const [targetUid, setTargetUid] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AdminRole>('recruitment_admin');
  const [status, setStatus] = useState<AdminRoleStatus>('active');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [roleRows, logRows] = await Promise.all([
        listAdminRoles(),
        listAdminActivityLogs(40),
      ]);
      setRoles(roleRows);
      setAuditLogs(logRows);
    } catch (err: any) {
      setError(err?.message || 'Unable to load administrator roles from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminSession.permissions?.canManageRoles) {
      loadData();
    }
  }, [adminSession.uid, adminSession.role]);

  const handleEditExisting = (rec: AdminRoleRecord) => {
    setTargetUid(rec.uid);
    setEmail(rec.email);
    setDisplayName(rec.displayName);
    setRole(rec.role);
    setStatus(rec.status);
    setNotes(rec.notes || '');
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await upsertAdminRole({
        actorSession: adminSession,
        targetUid,
        email,
        displayName,
        role,
        status,
        notes,
      });
      onNotify(
        'success',
        'Administrator Role Saved',
        `${email.trim().toLowerCase()} is now ${status} as ${ADMIN_PERMISSION_MATRIX[role].label}.`
      );
      setTargetUid('');
      setEmail('');
      setDisplayName('');
      setRole('recruitment_admin');
      setStatus('active');
      setNotes('');
      await loadData();
    } catch (err: any) {
      const msg = err?.message || 'Could not update administrator role.';
      setError(msg);
      onNotify('error', 'Role Update Blocked', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggleStatus = async (rec: AdminRoleRecord) => {
    const nextStatus: AdminRoleStatus = rec.status === 'active' ? 'revoked' : 'active';
    setError('');
    try {
      await upsertAdminRole({
        actorSession: adminSession,
        targetUid: rec.uid,
        email: rec.email,
        displayName: rec.displayName,
        role: rec.role,
        status: nextStatus,
        notes: rec.notes,
      });
      onNotify(
        'success',
        nextStatus === 'active' ? 'Role Reactivated' : 'Role Revoked',
        `${rec.email} status updated to ${nextStatus}.`
      );
      await loadData();
    } catch (err: any) {
      const msg = err?.message || 'Unable to update role status.';
      setError(msg);
      onNotify('error', 'Action Prevented', msg);
    }
  };

  if (!adminSession.permissions?.canManageRoles) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 text-center space-y-2">
        <Lock className="w-8 h-8 text-[#778397] mx-auto" />
        <h3 className="text-base font-bold text-[#102B4E]">Super Admin Access Required</h3>
        <p className="text-xs sm:text-sm text-[#778397]">
          Role management and immutable audit logs are restricted to active Super Admins.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Refresh */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#102B4E] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#F47A24]" />
            <span>Administrator Roles &amp; Governance (/admin_roles)</span>
          </h2>
          <p className="text-xs text-[#778397] mt-0.5">
            Assign or revoke least-privilege Firebase RBAC roles. Self-revocation and removing the last active Super Admin are blocked.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#E5EAF0] hover:bg-[#F6F8FB] text-[#102B4E] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Firestore Roles</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Assign / Update Form */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#F47A24]" />
          <h3 className="text-sm font-bold text-[#102B4E]">Assign or Update Administrator Role</h3>
        </div>
        <form onSubmit={handleSaveRole} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#102B4E] mb-1">
              Firebase Auth UID *
            </label>
            <input
              type="text"
              required
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              placeholder="e.g. XyZ123abc456..."
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:border-[#102B4E]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#102B4E] mb-1">
              Verified Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@abhijobs.careers"
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:border-[#102B4E]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#102B4E] mb-1">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full Name"
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:border-[#102B4E]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#102B4E] mb-1">Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm bg-white text-[#253449] focus:outline-none focus:border-[#102B4E]"
            >
              {ADMIN_ROLES_ORDER.map((r) => (
                <option key={r} value={r}>
                  {ADMIN_PERMISSION_MATRIX[r].label} ({r})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#102B4E] mb-1">Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdminRoleStatus)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm bg-white text-[#253449] focus:outline-none focus:border-[#102B4E]"
            >
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#102B4E] mb-1">Internal Note</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional governance note"
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:border-[#102B4E]"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center justify-end gap-2 pt-1">
            {targetUid && (
              <button
                type="button"
                onClick={() => {
                  setTargetUid('');
                  setEmail('');
                  setDisplayName('');
                  setNotes('');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E5EAF0] text-xs sm:text-sm font-semibold text-[#778397] cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Role Assignment</span>
            </button>
          </div>
        </form>
      </div>

      {/* Existing Roles Table */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5EAF0] bg-[#F6F8FB] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#102B4E]">
            Active &amp; Revoked Administrators ({roles.length})
          </h3>
          <span className="text-[11px] text-[#778397]">
            Current session: {adminSession.email} ({adminSession.role})
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E5EAF0] text-[11px] font-semibold uppercase tracking-wider text-[#778397] bg-white">
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Firebase UID</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {roles.map((rec) => {
                const isSelf = rec.uid === adminSession.uid;
                return (
                  <tr key={rec.uid} className="hover:bg-[#F6F8FB]/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#102B4E]">
                        {rec.displayName}{' '}
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-[#102B4E] border border-blue-200 ml-1">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#778397]">{rec.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#566479]">{rec.uid}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-lg bg-[#F6F8FB] border border-[#E5EAF0] text-xs font-semibold text-[#102B4E]">
                        {ADMIN_PERMISSION_MATRIX[rec.role]?.label || rec.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${
                          rec.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditExisting(rec)}
                          className="min-h-[36px] px-3 py-1 rounded-lg border border-[#E5EAF0] hover:bg-[#F6F8FB] text-xs font-semibold text-[#102B4E] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isSelf && rec.status === 'active'}
                          onClick={() => handleQuickToggleStatus(rec)}
                          className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            rec.status === 'active'
                              ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {rec.status === 'active' ? 'Revoke' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs text-[#778397]">
                    No explicit /admin_roles documents found yet. Bootstrap Super Admin access is active for ezanwalmani@gmail.com; create the explicit document above to lock in durable role records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5-Role Permission Matrix */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5EAF0] bg-[#F6F8FB]">
          <h3 className="text-sm font-bold text-[#102B4E]">
            Five-Role Least-Privilege Permission Matrix
          </h3>
          <p className="text-xs text-[#778397] mt-0.5">
            Enforced both in the Admin Control Center UI and authoritatively in Firestore Security Rules.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5EAF0] bg-white text-[#566479]">
                <th className="px-4 py-3 font-semibold min-w-[210px]">Capability</th>
                {ADMIN_ROLES_ORDER.map((r) => (
                  <th key={r} className="px-3 py-3 text-center font-semibold min-w-[110px]">
                    {ADMIN_PERMISSION_MATRIX[r].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {MATRIX_CAPABILITY_ROWS.map((row) => (
                <tr key={row.key} className="hover:bg-[#F6F8FB]/60">
                  <td className="px-4 py-2.5 font-medium text-[#253449]">{row.label}</td>
                  {ADMIN_ROLES_ORDER.map((r) => {
                    const allowed = ADMIN_PERMISSION_MATRIX[r][row.key];
                    return (
                      <td key={r} className="px-3 py-2.5 text-center">
                        {allowed ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Admin Activity Logs Viewer */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5EAF0] bg-[#F6F8FB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-[#F47A24]" />
            <h3 className="text-sm font-bold text-[#102B4E]">
              Admin Activity Audit Logs (/admin_activity_logs — Read-Only)
            </h3>
          </div>
          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
            Client writes denied by rules &middot; Automated writes activate on Blaze Cloud Functions
          </span>
        </div>
        <div className="divide-y divide-[#E5EAF0]">
          {auditLogs.map((log) => (
            <div key={log.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-[#102B4E]">
                  {log.action} <span className="text-[#778397] font-normal">on {log.targetCollection}/{log.targetId}</span>
                </p>
                <p className="text-[#253449]">{log.summary}</p>
                <p className="text-[11px] text-[#778397]">
                  Actor: {log.actorEmail} ({log.actorRole})
                </p>
              </div>
              <span className="text-[11px] text-[#778397] shrink-0">{log.timestamp}</span>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="p-5 text-center text-xs text-[#778397] leading-relaxed">
              No server-written audit entries recorded yet. For security integrity, client browsers cannot write directly to <code className="font-mono">/admin_activity_logs</code>; automated server-side audit logging is ready in the Blaze Cloud Functions blueprint.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
