import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
  ShieldCheck,
  Search,
  UserCheck,
  Building2,
  Hash,
  Loader2,
  AlertTriangle,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { AdminDataTable, type AdminColumn } from '../AdminDataTable';
import { AdminRoleManagementPanel } from '../AdminRoleManagementPanel';
import { AdminCandidateDetailView } from '../AdminCandidateDetailView';
import {
  recordAdminAuditAction,
  updateUserStatusAdmin,
  type AdminAssessmentAttemptRecord,
  type AdminCourseEnrolmentRecord,
  type AdminIssuedCertificateRecord,
  type AdminUserRecord,
  type Application,
  type CandidateProfile,
  type EmployerProfile,
  type Interview,
} from '../../../services/adminPanelService';
import { updateEmployerVerificationInFirestore } from '../../../services/recruitmentFirestoreService';
import {
  CANDIDATE_ID_LABEL,
  backfillMissingCandidateCodesAdmin,
  fetchCandidateIdCapacityAdmin,
  isValidCandidateCode,
  type CandidateIdCapacityStats,
} from '../../../services/candidateIdService';
import { calculateProfileCompletion } from '../../../utils/profileCompletion';
import type { AdminModuleId } from '../adminNavConfig';
import type { ResolvedAdminSession } from '../../../services/adminRbacService';
import type { AdminConfirmDialogProps } from '../AdminConfirmDialog';

export interface PeopleSectionProps {
  activeModule: AdminModuleId;
  adminSession: ResolvedAdminSession;
  users: AdminUserRecord[];
  candidates: CandidateProfile[];
  employers: EmployerProfile[];
  enrolments?: AdminCourseEnrolmentRecord[];
  applications?: Application[];
  interviews?: Interview[];
  attempts?: AdminAssessmentAttemptRecord[];
  issuedCerts?: AdminIssuedCertificateRecord[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onInspectRecord: (title: string, subtitle: string, record: Record<string, unknown>) => void;
  onRequestConfirm: (
    config: Omit<AdminConfirmDialogProps, 'isOpen' | 'busy' | 'onCancel'>
  ) => void;
  onNavigateModule?: (moduleId: AdminModuleId) => void;
}

interface MergedCandidateRow {
  uid: string;
  candidateCode?: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  currentLocation: string;
  headline: string;
  yearsOfExperience: number;
  experienceLevel: CandidateProfile['experienceLevel'];
  completionPercentage: number;
  hasResume: boolean;
  resumeLabel: string;
  registeredAt: string;
  lastUpdatedAt: string;
  accountStatus: 'active' | 'suspended';
  skillsText: string;
  profile: CandidateProfile;
  userRecord?: AdminUserRecord;
}

function formatShortDate(iso?: string): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buildFallbackCandidateProfile(user: AdminUserRecord): CandidateProfile {
  return {
    id: user.id,
    userId: user.id,
    candidateCode: user.candidateCode,
    name: user.name || 'Unnamed Candidate',
    email: user.email || '',
    phone: '',
    location: '',
    headline: '',
    about: '',
    currentRole: '',
    desiredRole: '',
    experienceLevel: 'Fresher',
    yearsOfExperience: 0,
    preferredLocation: '',
    workPreference: 'Hybrid',
    availability: 'Immediate',
    profileVisibility: 'employers_only',
    availableForOpportunities: true,
    skills: [],
    education: [],
    experiences: [],
    certifications: [],
    completionPercentage: 0,
    recommendations: [],
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.createdAt,
    lastActive: user.lastActive,
  };
}

export const PeopleSection: React.FC<PeopleSectionProps> = ({
  activeModule,
  adminSession,
  users,
  candidates,
  employers,
  enrolments = [],
  applications = [],
  interviews = [],
  attempts = [],
  issuedCerts = [],
  loading,
  onRefresh,
  onNotify,
  onInspectRecord,
  onRequestConfirm,
  onNavigateModule,
}) => {
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employerFilter, setEmployerFilter] = useState('all');
  const [lookupQuery, setLookupQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Candidate Management state (filters, detail view, backfill & ID capacity)
  const [selectedCandidateUid, setSelectedCandidateUid] = useState<string | null>(null);
  const [candLocationFilter, setCandLocationFilter] = useState('all');
  const [candExperienceFilter, setCandExperienceFilter] = useState('all');
  const [candCompletionFilter, setCandCompletionFilter] = useState('all');
  const [candStatusFilter, setCandStatusFilter] = useState('all');
  const [idCapacity, setIdCapacity] = useState<CandidateIdCapacityStats | null>(null);
  const [backfillingIds, setBackfillingIds] = useState(false);

  const canSuspend = Boolean(adminSession.permissions?.canSuspendUsers);
  const canManageCandidates = Boolean(adminSession.permissions?.canManageCandidates);
  const canVerifyEmployers = Boolean(adminSession.permissions?.canManageEmployers);
  const canExportCsv = Boolean(adminSession.permissions?.canExportCsv);

  // Reset detail selection when switching away from Candidates module
  useEffect(() => {
    if (activeModule !== 'people-candidates') {
      setSelectedCandidateUid(null);
    }
  }, [activeModule]);

  // Fetch 4-digit Candidate ID pool utilization for admins on Candidates view
  useEffect(() => {
    if (activeModule !== 'people-candidates' || !canManageCandidates) return;
    let cancelled = false;
    fetchCandidateIdCapacityAdmin().then((stats) => {
      if (!cancelled && stats) setIdCapacity(stats);
    });
    return () => {
      cancelled = true;
    };
  }, [activeModule, canManageCandidates, candidates.length, users.length]);

  const handleCsvExported = (rowCount: number, filename: string) => {
    onNotify(
      'success',
      'CSV Export Downloaded',
      `Exported ${rowCount} visible ${rowCount === 1 ? 'record' : 'records'} to ${filename}.`
    );
  };

  // All hooks MUST run unconditionally at top-level before any conditional returns
  const userByIdMap = useMemo(() => {
    const map = new Map<string, AdminUserRecord>();
    for (const u of users) {
      map.set(u.id, u);
    }
    return map;
  }, [users]);

  const candidateUidSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidates) {
      if (c.userId) set.add(c.userId);
      if (c.id) set.add(c.id);
    }
    return set;
  }, [candidates]);

  const employerUidSet = useMemo(() => {
    const set = new Set<string>();
    for (const e of employers) {
      if (e.userId) set.add(e.userId);
      if (e.id) set.add(e.id);
    }
    return set;
  }, [employers]);

  const learnerUidSet = useMemo(() => {
    const set = new Set<string>();
    for (const en of enrolments) {
      if (en.userId) set.add(en.userId);
    }
    return set;
  }, [enrolments]);

  const mergedCandidateRows = useMemo<MergedCandidateRow[]>(() => {
    const byUid = new Map<string, MergedCandidateRow>();

    for (const c of candidates) {
      const uid = c.userId || c.id;
      if (!uid) continue;
      const u = userByIdMap.get(uid);
      const code = isValidCandidateCode(c.candidateCode)
        ? c.candidateCode.trim()
        : isValidCandidateCode(u?.candidateCode)
        ? u!.candidateCode!.trim()
        : undefined;
      const mergedProfile: CandidateProfile = {
        ...c,
        candidateCode: code,
        name: c.name || u?.name || 'Unnamed Candidate',
        email: c.email || u?.email || '',
        avatar: c.avatar || u?.avatar,
        createdAt: c.createdAt || u?.createdAt,
      };
      const report = calculateProfileCompletion(mergedProfile);
      const hasResume = Boolean(
        mergedProfile.resumeDocId ||
          (mergedProfile.resumeName && mergedProfile.resumeName.trim()) ||
          (mergedProfile.resumeUrl && mergedProfile.resumeUrl.trim())
      );
      byUid.set(uid, {
        uid,
        candidateCode: code,
        fullName: mergedProfile.name,
        email: mergedProfile.email,
        mobileNumber: mergedProfile.phone || '',
        currentLocation:
          mergedProfile.location ||
          [mergedProfile.city, mergedProfile.state].filter(Boolean).join(', ') ||
          '',
        headline: mergedProfile.headline || '',
        yearsOfExperience: mergedProfile.yearsOfExperience || 0,
        experienceLevel: mergedProfile.experienceLevel || 'Fresher',
        completionPercentage: report.percentage,
        hasResume,
        resumeLabel: hasResume ? 'Uploaded' : 'Not Uploaded',
        registeredAt: u?.createdAt || mergedProfile.createdAt || '',
        lastUpdatedAt: mergedProfile.updatedAt || mergedProfile.lastActive || u?.createdAt || '',
        accountStatus: u?.status === 'suspended' ? 'suspended' : 'active',
        skillsText: (mergedProfile.skills || []).join(' '),
        profile: mergedProfile,
        userRecord: u,
      });
    }

    // Include registered job_seeker / candidate accounts that have not saved /candidates/{uid} yet
    for (const u of users) {
      if ((u.role === 'job_seeker' || u.role === 'candidate') && !byUid.has(u.id)) {
        const fallbackProfile = buildFallbackCandidateProfile(u);
        const report = calculateProfileCompletion(fallbackProfile);
        byUid.set(u.id, {
          uid: u.id,
          candidateCode: isValidCandidateCode(u.candidateCode) ? u.candidateCode.trim() : undefined,
          fullName: u.name || 'Unnamed Candidate',
          email: u.email || '',
          mobileNumber: '',
          currentLocation: '',
          headline: '',
          yearsOfExperience: 0,
          experienceLevel: 'Fresher',
          completionPercentage: report.percentage,
          hasResume: false,
          resumeLabel: 'Not Uploaded',
          registeredAt: u.createdAt || '',
          lastUpdatedAt: u.createdAt || '',
          accountStatus: u.status === 'suspended' ? 'suspended' : 'active',
          skillsText: '',
          profile: fallbackProfile,
          userRecord: u,
        });
      }
    }

    return Array.from(byUid.values()).sort((a, b) =>
      (b.lastUpdatedAt || b.registeredAt || '').localeCompare(a.lastUpdatedAt || a.registeredAt || '')
    );
  }, [candidates, users, userByIdMap]);

  const candidateLocations = useMemo(() => {
    const set = new Set<string>();
    for (const row of mergedCandidateRows) {
      const loc = row.currentLocation.trim();
      if (loc) set.add(loc);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [mergedCandidateRows]);

  const missingCandidateIdCount = useMemo(
    () => mergedCandidateRows.filter((row) => !isValidCandidateCode(row.candidateCode)).length,
    [mergedCandidateRows]
  );

  const filteredCandidateRows = useMemo(() => {
    return mergedCandidateRows.filter((row) => {
      if (candLocationFilter !== 'all' && row.currentLocation.trim() !== candLocationFilter) {
        return false;
      }
      if (candExperienceFilter === 'fresher' && row.yearsOfExperience > 0) return false;
      if (
        candExperienceFilter === '1-3' &&
        (row.yearsOfExperience <= 0 || row.yearsOfExperience > 3)
      ) {
        return false;
      }
      if (
        candExperienceFilter === '3-6' &&
        (row.yearsOfExperience <= 3 || row.yearsOfExperience > 6)
      ) {
        return false;
      }
      if (candExperienceFilter === '6+' && row.yearsOfExperience <= 6) return false;

      if (candCompletionFilter === 'completed' && row.completionPercentage < 80) return false;
      if (
        candCompletionFilter === 'in_progress' &&
        (row.completionPercentage < 40 || row.completionPercentage >= 80)
      ) {
        return false;
      }
      if (candCompletionFilter === 'needs_attention' && row.completionPercentage >= 40) {
        return false;
      }

      if (candStatusFilter !== 'all' && row.accountStatus !== candStatusFilter) return false;
      return true;
    });
  }, [
    mergedCandidateRows,
    candLocationFilter,
    candExperienceFilter,
    candCompletionFilter,
    candStatusFilter,
  ]);

  const getUserCategories = (u: AdminUserRecord): string[] => {
    const tags: string[] = [];
    if (u.role === 'admin') tags.push('Admin');
    if (u.role === 'employer' || employerUidSet.has(u.id)) tags.push('Employer');
    if (u.role === 'job_seeker' || u.role === 'candidate' || candidateUidSet.has(u.id)) {
      tags.push('Candidate');
    }
    if (learnerUidSet.has(u.id)) tags.push('Learner');
    return tags.length > 0 ? tags : ['User'];
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (activeModule === 'people-account-status') {
        if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      } else {
        if (roleFilter === 'learner') {
          return learnerUidSet.has(u.id);
        }
        if (roleFilter === 'employer') {
          return u.role === 'employer' || employerUidSet.has(u.id);
        }
        if (roleFilter === 'job_seeker') {
          return u.role === 'job_seeker' || u.role === 'candidate' || candidateUidSet.has(u.id);
        }
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      }
      return true;
    });
  }, [users, activeModule, roleFilter, statusFilter, learnerUidSet, employerUidSet, candidateUidSet]);

  const filteredEmployers = useMemo(() => {
    return employerFilter === 'all'
      ? employers
      : employers.filter((e) => e.verificationStatus === employerFilter);
  }, [employers, employerFilter]);

  const handleToggleUserStatus = (user: AdminUserRecord) => {
    const nextStatus: 'active' | 'suspended' =
      user.status === 'suspended' ? 'active' : 'suspended';
    onRequestConfirm({
      title: nextStatus === 'suspended' ? 'Suspend User Account?' : 'Reactivate User Account?',
      description:
        nextStatus === 'suspended'
          ? 'Suspending this account sets /users/{uid}.status = "suspended" in Firestore and blocks privileged portal access.'
          : 'Reactivating this account restores active status on /users/{uid} in Firestore.',
      confirmLabel: nextStatus === 'suspended' ? 'Suspend Account' : 'Reactivate Account',
      tone: nextStatus === 'suspended' ? 'danger' : 'primary',
      details: [
        { label: 'User', value: user.name },
        { label: 'Email', value: user.email },
        { label: 'Firebase UID', value: user.id },
        { label: 'Current Status', value: user.status },
      ],
      onConfirm: async () => {
        try {
          await updateUserStatusAdmin(user.id, nextStatus);
          onNotify(
            'success',
            nextStatus === 'suspended' ? 'Account Suspended' : 'Account Reactivated',
            `${user.email} status updated to ${nextStatus}.`
          );
          await onRefresh();
        } catch (err: any) {
          onNotify('error', 'Status Update Failed', err?.message || 'Firestore rejected the update.');
        }
      },
    });
  };

  const handleEmployerVerification = (
    emp: EmployerProfile,
    nextStatus: 'verified' | 'rejected' | 'suspended' | 'pending'
  ) => {
    onRequestConfirm({
      title: `Set Employer Status to "${nextStatus}"?`,
      description:
        nextStatus === 'verified'
          ? 'Verifying this employer allows them to publish live jobs and appear publicly on ABHI JOBS.'
          : `Updating ${emp.companyName} to "${nextStatus}" writes directly to /employers/${emp.id} in Firestore.`,
      confirmLabel: `Mark as ${nextStatus}`,
      tone: nextStatus === 'verified' ? 'primary' : 'danger',
      details: [
        { label: 'Company', value: emp.companyName },
        { label: 'Employer ID', value: emp.id },
        { label: 'Owner UID', value: emp.userId || '—' },
        { label: 'Recruiter Email', value: emp.recruiterEmail || 'Not set' },
      ],
      onConfirm: async () => {
        try {
          await updateEmployerVerificationInFirestore({
            employerId: emp.id,
            verificationStatus: nextStatus,
            adminUid: adminSession.uid || '',
          });
          onNotify(
            'success',
            'Employer Verification Updated',
            `${emp.companyName} is now ${nextStatus}.`
          );
          await onRefresh();
        } catch (err: any) {
          onNotify(
            'error',
            'Verification Failed',
            err?.message || 'Firestore rejected the employer verification update.'
          );
        }
      },
    });
  };

  const handleBackfillCandidateIds = () => {
    if (!canManageCandidates || backfillingIds || missingCandidateIdCount === 0) return;
    onRequestConfirm({
      title: `Assign 4-Digit ${CANDIDATE_ID_LABEL}s?`,
      description: `This will generate and assign unique, cryptographically random 4-digit numeric IDs (1000–9999) to ${missingCandidateIdCount} existing candidate account${
        missingCandidateIdCount === 1 ? '' : 's'
      } without modifying internal Firebase UIDs, applications, or profile data.`,
      confirmLabel: `Assign ${missingCandidateIdCount} Missing ID${
        missingCandidateIdCount === 1 ? '' : 's'
      }`,
      tone: 'primary',
      details: [
        { label: 'Candidates Missing ID', value: String(missingCandidateIdCount) },
        {
          label: 'Pool Remaining',
          value: idCapacity ? `${idCapacity.remainingCount.toLocaleString()} / 9,000` : 'Checking...',
        },
      ],
      onConfirm: async () => {
        setBackfillingIds(true);
        try {
          const result = await backfillMissingCandidateCodesAdmin(users, candidates);
          await recordAdminAuditAction({
            action: 'candidate_id_backfill_executed',
            targetType: 'candidate_id_registry',
            targetId: 'batch_backfill',
            summary: `Backfilled ${CANDIDATE_ID_LABEL}s: ${result.assignedCount} assigned, ${result.skippedCount} skipped, ${result.failedCount} failed.`,
          });
          if (result.capacityExhausted) {
            onNotify(
              'error',
              'Candidate ID Capacity Exhausted',
              `Assigned ${result.assignedCount} IDs before reaching the 9,000 four-digit limit.`
            );
          } else if (result.failedCount > 0) {
            onNotify(
              'warning',
              'Partial ID Assignment',
              `Assigned ${result.assignedCount} IDs (${result.failedCount} failed).`
            );
          } else {
            onNotify(
              'success',
              'Candidate IDs Assigned',
              `Assigned unique 4-digit ${CANDIDATE_ID_LABEL}s to ${result.assignedCount} candidate${
                result.assignedCount === 1 ? '' : 's'
              }.`
            );
          }
          await onRefresh();
          const refreshedCapacity = await fetchCandidateIdCapacityAdmin();
          if (refreshedCapacity) setIdCapacity(refreshedCapacity);
        } finally {
          setBackfillingIds(false);
        }
      },
    });
  };

  // Administrators Module
  if (activeModule === 'people-admins') {
    return <AdminRoleManagementPanel adminSession={adminSession} onNotify={onNotify} />;
  }

  // User Details Deep Inspector Module
  if (activeModule === 'people-user-details') {
    const matches = users.filter((u) => {
      const q = lookupQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q) ||
        (u.candidateCode || '').toLowerCase().includes(q)
      );
    });
    const activeUser = matches.find((u) => u.id === selectedUserId) || matches[0] || null;
    const matchedCandidate = activeUser
      ? mergedCandidateRows.find((r) => r.uid === activeUser.id)
      : undefined;
    const matchedEmployer = activeUser
      ? employers.find((e) => e.userId === activeUser.id || e.id === activeUser.id)
      : undefined;
    const matchedEnrolments = activeUser
      ? enrolments.filter((en) => en.userId === activeUser.id)
      : [];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Search by name, email, Candidate ID, or UID..."
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#102B4E]"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
            {matches.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full px-4 py-3 text-left transition-colors cursor-pointer ${
                  activeUser?.id === u.id ? 'bg-blue-50/70 border-l-2 border-[#102B4E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs sm:text-sm font-semibold text-[#081D36] truncate">
                    {u.name}
                  </div>
                  {u.candidateCode && (
                    <span className="text-[10px] font-mono font-bold text-[#102B4E] bg-[#F1F5FA] px-1.5 py-0.5 rounded shrink-0">
                      #{u.candidateCode}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                  {getUserCategories(u).join(' · ')} · {u.status}
                </div>
              </button>
            ))}
            {matches.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                No matching user accounts found in Firestore /users.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {activeUser ? (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#081D36]">{activeUser.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeUser.email}
                      {activeUser.candidateCode ? (
                        <>
                          {' '}
                          · {CANDIDATE_ID_LABEL}:{' '}
                          <span className="font-mono font-bold text-[#102B4E]">
                            {activeUser.candidateCode}
                          </span>
                        </>
                      ) : null}{' '}
                      · UID: <span className="font-mono">{activeUser.id}</span>
                    </p>
                  </div>
                  {canSuspend && (
                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(activeUser)}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer shrink-0 ${
                        activeUser.status === 'suspended'
                          ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      {activeUser.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <div className="text-slate-400">Profile Type</div>
                    <div className="font-semibold text-[#081D36] mt-0.5">
                      {getUserCategories(activeUser).join(' · ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Account Status</div>
                    <div
                      className={`font-semibold capitalize mt-0.5 ${
                        activeUser.status === 'suspended' ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {activeUser.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Created</div>
                    <div className="font-mono text-[#081D36] mt-0.5">
                      {activeUser.createdAt ? activeUser.createdAt.slice(0, 10) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Last Active</div>
                    <div className="text-[#081D36] mt-0.5">{activeUser.lastActive || '—'}</div>
                  </div>
                </div>
              </div>

              {matchedCandidate && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-[#081D36] flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#102B4E]" />
                      <span>Candidate Profile</span>
                      {matchedCandidate.candidateCode && (
                        <span className="font-mono text-xs text-[#F47A24]">
                          ID: {matchedCandidate.candidateCode}
                        </span>
                      )}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCandidateUid(matchedCandidate.uid);
                        onNavigateModule?.('people-candidates');
                      }}
                      className="text-xs font-semibold text-[#102B4E] hover:underline cursor-pointer"
                    >
                      Open Complete Candidate Profile →
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">
                    {matchedCandidate.headline || 'No headline'} ·{' '}
                    {matchedCandidate.currentLocation || 'Location not set'} ·{' '}
                    {matchedCandidate.experienceLevel} ({matchedCandidate.yearsOfExperience} yrs) ·
                    Completion {matchedCandidate.completionPercentage}%
                  </p>
                  {matchedCandidate.skillsText && (
                    <p className="text-xs text-slate-500">
                      Skills: {matchedCandidate.profile.skills.join(' · ')}
                    </p>
                  )}
                </div>
              )}

              {matchedEmployer && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-[#081D36] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#102B4E]" />
                      <span>Employer Company</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        onInspectRecord(
                          matchedEmployer.companyName,
                          'Employer & Private Recruiter Contact',
                          matchedEmployer as unknown as Record<string, unknown>
                        )
                      }
                      className="text-xs font-semibold text-[#102B4E] hover:underline cursor-pointer"
                    >
                      Inspect All Fields
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">
                    {matchedEmployer.companyName} · {matchedEmployer.industry} ·{' '}
                    {matchedEmployer.location} · Verification:{' '}
                    <span className="font-semibold capitalize">
                      {matchedEmployer.verificationStatus}
                    </span>
                  </p>
                </div>
              )}

              {matchedEnrolments.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
                  <h4 className="text-sm font-bold text-[#081D36]">
                    Learn with ABHI Enrolments ({matchedEnrolments.length})
                  </h4>
                  <div className="divide-y divide-slate-100 text-xs">
                    {matchedEnrolments.map((en) => (
                      <div key={en.id} className="py-2 flex items-center justify-between gap-2">
                        <span className="font-medium text-[#081D36] truncate">
                          {en.courseTitle || en.courseId}
                        </span>
                        <span className="font-mono tabular-nums text-slate-600 shrink-0">
                          {en.progressPercent}% · {(en.status || 'enrolled').replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Select a user account on the left to view complete sanitized profile details.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Candidate Management Module (Complete Table + Full Candidate Detail Page)
  if (activeModule === 'people-candidates') {
    if (selectedCandidateUid) {
      const selectedRow = mergedCandidateRows.find((r) => r.uid === selectedCandidateUid);
      if (selectedRow) {
        return (
          <AdminCandidateDetailView
            candidate={selectedRow.profile}
            userRecord={selectedRow.userRecord}
            adminSession={adminSession}
            applications={applications}
            interviews={interviews}
            enrolments={enrolments}
            attempts={attempts}
            issuedCerts={issuedCerts}
            onBack={() => setSelectedCandidateUid(null)}
            onRefresh={onRefresh}
            onNotify={onNotify}
            onRequestConfirm={onRequestConfirm}
            onNavigateModule={(mod) => {
              setSelectedCandidateUid(null);
              onNavigateModule?.(mod);
            }}
          />
        );
      }
    }

    const hasActiveCandidateFilters =
      candLocationFilter !== 'all' ||
      candExperienceFilter !== 'all' ||
      candCompletionFilter !== 'all' ||
      candStatusFilter !== 'all';

    const candidateCols: AdminColumn<MergedCandidateRow>[] = [
      {
        key: 'candidateCode',
        header: 'Candidate ID',
        sortValue: (c) => (c.candidateCode ? Number(c.candidateCode) : 0),
        csvColumns: [
          { header: CANDIDATE_ID_LABEL, value: (c) => c.candidateCode || 'Unassigned' },
        ],
        render: (c) => (
          <span
            className={`font-mono tabular-nums text-xs font-bold px-2 py-1 rounded-md border ${
              c.candidateCode
                ? 'bg-[#F1F5FA] border-[#D4DCE6] text-[#102B4E]'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            {c.candidateCode || 'Pending'}
          </span>
        ),
      },
      {
        key: 'fullName',
        header: 'Full Name',
        minWidthClass: 'min-w-[160px]',
        sortValue: (c) => c.fullName.toLowerCase(),
        csvValue: (c) => c.fullName,
        render: (c) => (
          <div className="font-semibold text-[#081D36] whitespace-nowrap">{c.fullName}</div>
        ),
      },
      {
        key: 'email',
        header: 'Email Address',
        minWidthClass: 'min-w-[190px]',
        sortValue: (c) => c.email.toLowerCase(),
        csvValue: (c) => c.email,
        render: (c) => (
          <div className="text-xs text-[#475569] break-all max-w-[220px]">
            {c.email || '—'}
          </div>
        ),
      },
      {
        key: 'mobileNumber',
        header: 'Mobile Number',
        sortValue: (c) => c.mobileNumber,
        csvValue: (c) => c.mobileNumber || 'Not provided',
        render: (c) => (
          <span className="font-mono text-xs text-[#081D36] whitespace-nowrap">
            {c.mobileNumber || <span className="text-slate-400 font-sans">—</span>}
          </span>
        ),
      },
      {
        key: 'currentLocation',
        header: 'Current Location',
        sortValue: (c) => c.currentLocation.toLowerCase(),
        csvValue: (c) => c.currentLocation || 'Not provided',
        render: (c) => (
          <span className="text-xs text-[#475569] whitespace-nowrap">
            {c.currentLocation || <span className="text-slate-400">—</span>}
          </span>
        ),
      },
      {
        key: 'headline',
        header: 'Professional Headline',
        minWidthClass: 'min-w-[200px]',
        sortValue: (c) => c.headline.toLowerCase(),
        csvValue: (c) => c.headline || '',
        render: (c) => (
          <div className="text-xs text-[#1E293B] truncate max-w-[220px]" title={c.headline}>
            {c.headline || <span className="text-slate-400">—</span>}
          </div>
        ),
      },
      {
        key: 'experience',
        header: 'Total Experience',
        sortValue: (c) => c.yearsOfExperience,
        csvValue: (c) =>
          c.yearsOfExperience > 0
            ? `${c.yearsOfExperience} yrs (${c.experienceLevel})`
            : 'Fresher (0 yrs)',
        render: (c) => (
          <span className="text-xs text-[#081D36] font-mono tabular-nums whitespace-nowrap">
            {c.yearsOfExperience > 0 ? `${c.yearsOfExperience} yrs` : 'Fresher'}
            <span className="text-[#64748B] font-sans"> · {c.experienceLevel}</span>
          </span>
        ),
      },
      {
        key: 'completion',
        header: 'Profile Completion',
        align: 'right',
        sortValue: (c) => c.completionPercentage,
        csvValue: (c) => `${c.completionPercentage}%`,
        render: (c) => (
          <div className="inline-flex flex-col items-end gap-1 min-w-[74px]">
            <span className="font-mono tabular-nums text-xs font-bold text-[#081D36]">
              {c.completionPercentage}%
            </span>
            <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  c.completionPercentage >= 80
                    ? 'bg-emerald-600'
                    : c.completionPercentage >= 40
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${c.completionPercentage}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'resumeStatus',
        header: 'Resume Status',
        sortValue: (c) => (c.hasResume ? 1 : 0),
        csvValue: (c) => c.resumeLabel,
        render: (c) => (
          <span
            className={`text-xs font-semibold whitespace-nowrap ${
              c.hasResume ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {c.resumeLabel}
          </span>
        ),
      },
      {
        key: 'registeredAt',
        header: 'Registered',
        sortValue: (c) => c.registeredAt || '',
        csvValue: (c) => (c.registeredAt ? c.registeredAt.slice(0, 10) : ''),
        render: (c) => (
          <span className="font-mono tabular-nums text-xs text-[#64748B] whitespace-nowrap">
            {formatShortDate(c.registeredAt)}
          </span>
        ),
      },
      {
        key: 'lastUpdatedAt',
        header: 'Last Updated',
        sortValue: (c) => c.lastUpdatedAt || '',
        csvValue: (c) => (c.lastUpdatedAt ? c.lastUpdatedAt.slice(0, 10) : ''),
        render: (c) => (
          <span className="font-mono tabular-nums text-xs text-[#64748B] whitespace-nowrap">
            {formatShortDate(c.lastUpdatedAt)}
          </span>
        ),
      },
      {
        key: 'accountStatus',
        header: 'Account Status',
        sortValue: (c) => c.accountStatus,
        csvValue: (c) => (c.accountStatus === 'suspended' ? 'Suspended' : 'Active'),
        render: (c) => (
          <span
            className={`text-xs font-semibold capitalize whitespace-nowrap ${
              c.accountStatus === 'suspended' ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {c.accountStatus}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        excludeFromCsv: true,
        render: (c) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCandidateUid(c.uid);
            }}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Profile</span>
          </button>
        ),
      },
    ];

    return (
      <div className="space-y-4">
        {/* Candidate ID Pool Capacity & Backfill Banner */}
        <div className="bg-white rounded-xl border border-[#E5EAF0] px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            <div className="inline-flex items-center gap-1.5 font-semibold text-[#102B4E]">
              <Hash className="w-4 h-4 text-[#F47A24]" />
              <span>{CANDIDATE_ID_LABEL} System (1000–9999)</span>
            </div>
            <span className="text-[#475569] font-mono tabular-nums">
              Total Candidates: <strong className="text-[#081D36]">{mergedCandidateRows.length}</strong>
            </span>
            {idCapacity && (
              <span className="text-[#475569] font-mono tabular-nums">
                ID Pool Used:{' '}
                <strong className="text-[#081D36]">
                  {idCapacity.usedCount.toLocaleString()} / {idCapacity.capacity.toLocaleString()}
                </strong>{' '}
                ({idCapacity.remainingCount.toLocaleString()} remaining)
              </span>
            )}
          </div>

          {canManageCandidates && missingCandidateIdCount > 0 && (
            <button
              type="button"
              onClick={handleBackfillCandidateIds}
              disabled={backfillingIds}
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#F47A24] hover:bg-[#e06916] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
            >
              {backfillingIds ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Hash className="w-3.5 h-3.5" />
              )}
              <span>
                Assign Missing Candidate IDs ({missingCandidateIdCount})
              </span>
            </button>
          )}
        </div>

        {/* Capacity Exhaustion Alert */}
        {idCapacity && (idCapacity.exhausted || idCapacity.utilizationPercent >= 90) && (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-rose-900"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {idCapacity.exhausted
                  ? '4-Digit Candidate ID Capacity Exhausted: '
                  : '4-Digit Candidate ID Pool Nearing Capacity: '}
              </span>
              <span>
                {idCapacity.usedCount.toLocaleString()} of {idCapacity.capacity.toLocaleString()} IDs
                (1000–9999) are permanently assigned. Duplicate or reused IDs are blocked by policy.
              </span>
            </div>
          </div>
        )}

        {/* Multi-Filter Bar: Location, Experience, Profile Completion, Account Status */}
        <div className="bg-white rounded-xl border border-[#E5EAF0] p-3.5 flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102B4E] mr-1">
            <Filter className="w-3.5 h-3.5 text-[#F47A24]" />
            <span>Filters:</span>
          </div>

          <select
            aria-label="Filter by location"
            value={candLocationFilter}
            onChange={(e) => setCandLocationFilter(e.target.value)}
            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white border border-[#D4DCE6] text-xs text-[#081D36] focus:outline-none focus:border-[#102B4E]"
          >
            <option value="all">All Locations</option>
            {candidateLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by experience"
            value={candExperienceFilter}
            onChange={(e) => setCandExperienceFilter(e.target.value)}
            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white border border-[#D4DCE6] text-xs text-[#081D36] focus:outline-none focus:border-[#102B4E]"
          >
            <option value="all">All Experience</option>
            <option value="fresher">Fresher (0 yrs)</option>
            <option value="1-3">1 – 3 yrs</option>
            <option value="3-6">3 – 6 yrs</option>
            <option value="6+">6+ yrs</option>
          </select>

          <select
            aria-label="Filter by profile completion"
            value={candCompletionFilter}
            onChange={(e) => setCandCompletionFilter(e.target.value)}
            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white border border-[#D4DCE6] text-xs text-[#081D36] focus:outline-none focus:border-[#102B4E]"
          >
            <option value="all">All Completion</option>
            <option value="completed">Completed (80%+)</option>
            <option value="in_progress">In Progress (40–79%)</option>
            <option value="needs_attention">Needs Attention (&lt;40%)</option>
          </select>

          <select
            aria-label="Filter by account status"
            value={candStatusFilter}
            onChange={(e) => setCandStatusFilter(e.target.value)}
            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white border border-[#D4DCE6] text-xs text-[#081D36] focus:outline-none focus:border-[#102B4E]"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          {hasActiveCandidateFilters && (
            <button
              type="button"
              onClick={() => {
                setCandLocationFilter('all');
                setCandExperienceFilter('all');
                setCandCompletionFilter('all');
                setCandStatusFilter('all');
              }}
              className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[#D4DCE6] hover:bg-[#F6F8FB] text-xs font-semibold text-[#475569] inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <AdminDataTable<MergedCandidateRow>
          key="table-people-candidates"
          rows={filteredCandidateRows}
          columns={candidateCols}
          rowKey={(c) => c.uid}
          loading={loading}
          csvExportFilename="candidates"
          canExportCsv={canExportCsv}
          onCsvExported={handleCsvExported}
          searchPlaceholder="Search by name, email, mobile number, Candidate ID, or skill..."
          searchText={(c) =>
            `${c.candidateCode || ''} ${c.fullName} ${c.email} ${c.mobileNumber} ${c.currentLocation} ${c.headline} ${c.skillsText}`
          }
          emptyTitle="No matching candidates found"
          emptyDescription="Registered candidates and saved Firestore /candidates profiles will appear here automatically."
          onRowClick={(c) => setSelectedCandidateUid(c.uid)}
        />
      </div>
    );
  }

  // Employers Table (with verification approval/rejection/suspension)
  if (activeModule === 'people-employers') {
    const empCols: AdminColumn<EmployerProfile>[] = [
      {
        key: 'companyName',
        header: 'Company',
        sortValue: (e) => e.companyName || '',
        csvColumns: [
          { header: 'Company', value: (e) => e.companyName || 'Unnamed Company' },
          { header: 'Industry', value: (e) => e.industry || 'General' },
          { header: 'Location', value: (e) => e.location || '' },
        ],
        render: (e) => (
          <div>
            <div className="font-semibold text-[#081D36] flex items-center gap-1.5">
              <span>{e.companyName || 'Unnamed Company'}</span>
              {e.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
            </div>
            <div className="text-[11px] text-slate-500">
              {e.industry || 'General'} · {e.location || '—'}
            </div>
          </div>
        ),
      },
      {
        key: 'contact',
        header: 'Recruiter Contact',
        csvColumns: [
          { header: 'Recruiter Name', value: (e) => e.recruiterName || '' },
          { header: 'Recruiter Email', value: (e) => e.recruiterEmail || '' },
        ],
        render: (e) => (
          <div className="text-xs">
            <div className="text-slate-800 font-medium">{e.recruiterName || '—'}</div>
            <div className="text-[11px] text-slate-500">{e.recruiterEmail || '—'}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Verification',
        sortValue: (e) => e.verificationStatus || 'pending',
        csvValue: (e) => e.verificationStatus || 'pending',
        render: (e) => (
          <span
            className={`text-xs font-semibold capitalize ${
              e.verificationStatus === 'verified'
                ? 'text-emerald-700'
                : e.verificationStatus === 'pending'
                ? 'text-amber-700'
                : 'text-rose-700'
            }`}
          >
            {e.verificationStatus || 'pending'}
          </span>
        ),
      },
      {
        key: 'jobs',
        header: 'Jobs',
        align: 'right',
        sortValue: (e) => e.activeJobsCount || 0,
        csvValue: (e) => e.activeJobsCount || 0,
        render: (e) => (
          <span className="font-mono tabular-nums text-xs text-slate-700">
            {e.activeJobsCount || 0}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        excludeFromCsv: true,
        render: (e) => (
          <div className="flex items-center justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
            <button
              type="button"
              onClick={() =>
                onInspectRecord(
                  e.companyName || 'Employer',
                  `Employer · ${e.verificationStatus}`,
                  e as unknown as Record<string, unknown>
                )
              }
              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              View
            </button>
            {canVerifyEmployers && e.verificationStatus !== 'verified' && (
              <button
                type="button"
                onClick={() => handleEmployerVerification(e, 'verified')}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify</span>
              </button>
            )}
            {canVerifyEmployers && e.verificationStatus === 'pending' && (
              <button
                type="button"
                onClick={() => handleEmployerVerification(e, 'rejected')}
                className="min-h-[34px] px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            )}
            {canVerifyEmployers && e.verificationStatus === 'verified' && (
              <button
                type="button"
                onClick={() => handleEmployerVerification(e, 'suspended')}
                className="min-h-[34px] px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Suspend</span>
              </button>
            )}
          </div>
        ),
      },
    ];

    return (
      <AdminDataTable<EmployerProfile>
        key="table-people-employers"
        rows={filteredEmployers}
        columns={empCols}
        rowKey={(e) => e.id}
        loading={loading}
        csvExportFilename="employers"
        canExportCsv={canExportCsv}
        onCsvExported={handleCsvExported}
        searchPlaceholder="Search company, industry, location, or recruiter..."
        searchText={(e) =>
          `${e.companyName || ''} ${e.industry || ''} ${e.location || ''} ${e.recruiterName || ''} ${e.recruiterEmail || ''}`
        }
        filterLabel="Status"
        filterValue={employerFilter}
        onFilterChange={setEmployerFilter}
        filterOptions={[
          { value: 'all', label: 'All Employers' },
          { value: 'pending', label: 'Pending Review' },
          { value: 'verified', label: 'Verified' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'suspended', label: 'Suspended' },
        ]}
        emptyTitle="No employers registered yet"
        emptyDescription="Employer registrations saved in /employers will appear here for verification review."
        onRowClick={(e) =>
          onInspectRecord(
            e.companyName || 'Employer',
            `Employer · ${e.verificationStatus}`,
            e as unknown as Record<string, unknown>
          )
        }
      />
    );
  }

  // All Users & Account Status Moderation Table
  const userCols: AdminColumn<AdminUserRecord>[] = [
    {
      key: 'name',
      header: 'User',
      sortValue: (u) => u.name || '',
      csvColumns: [
        { header: 'Name', value: (u) => u.name || 'Unnamed User' },
        { header: 'Email', value: (u) => u.email || '' },
        { header: CANDIDATE_ID_LABEL, value: (u) => u.candidateCode || '' },
      ],
      render: (u) => (
        <div>
          <div className="font-semibold text-[#081D36] flex items-center gap-2">
            <span>{u.name || 'Unnamed User'}</span>
            {u.candidateCode && (
              <span className="text-[10px] font-mono font-bold text-[#102B4E] bg-[#F1F5FA] border border-[#D4DCE6] px-1.5 py-0.5 rounded">
                ID: {u.candidateCode}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">{u.email || '—'}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Account Type',
      sortValue: (u) => getUserCategories(u).join(', '),
      csvValue: (u) => getUserCategories(u).join(', '),
      render: (u) => (
        <span className="text-xs font-medium text-[#081D36]">
          {getUserCategories(u).join(' · ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (u) => u.status || 'active',
      csvValue: (u) => u.status || 'active',
      render: (u) => (
        <span
          className={`text-xs font-semibold capitalize ${
            u.status === 'suspended' ? 'text-rose-700' : 'text-emerald-700'
          }`}
        >
          {u.status || 'active'}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Joined',
      sortValue: (u) => u.createdAt || '',
      csvValue: (u) => (u.createdAt ? u.createdAt.slice(0, 10) : ''),
      render: (u) => (
        <span className="font-mono text-xs text-slate-500">
          {u.createdAt ? u.createdAt.slice(0, 10) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      excludeFromCsv: true,
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          <button
            type="button"
            onClick={() =>
              onInspectRecord(
                u.name || 'User',
                `${u.email || u.id} · ${getUserCategories(u).join(' · ')}`,
                {
                  ...u,
                  accountTypes: getUserCategories(u),
                  hasCandidateProfile: candidateUidSet.has(u.id),
                  hasEmployerProfile: employerUidSet.has(u.id),
                  enrolledCoursesCount: enrolments.filter((en) => en.userId === u.id).length,
                }
              )
            }
            className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-[#102B4E] cursor-pointer"
          >
            Inspect
          </button>
          {canSuspend && u.id !== adminSession.uid && (
            <button
              type="button"
              onClick={() => handleToggleUserStatus(u)}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                u.status === 'suspended'
                  ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                  : 'border-rose-200 text-rose-700 hover:bg-rose-50'
              }`}
            >
              {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminDataTable<AdminUserRecord>
      key={`table-${activeModule}`}
      rows={filteredUsers}
      columns={userCols}
      rowKey={(u) => u.id}
      loading={loading}
      csvExportFilename={activeModule === 'people-account-status' ? 'account-status' : 'users'}
      canExportCsv={canExportCsv}
      onCsvExported={handleCsvExported}
      searchPlaceholder="Search by name, email, Candidate ID, or Firebase UID..."
      searchText={(u) =>
        `${u.name || ''} ${u.email || ''} ${u.candidateCode || ''} ${u.id || ''} ${u.role || ''} ${getUserCategories(u).join(' ')}`
      }
      filterLabel={activeModule === 'people-account-status' ? 'Account Status' : 'Type'}
      filterValue={activeModule === 'people-account-status' ? statusFilter : roleFilter}
      onFilterChange={activeModule === 'people-account-status' ? setStatusFilter : setRoleFilter}
      filterOptions={
        activeModule === 'people-account-status'
          ? [
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
            ]
          : [
              { value: 'all', label: 'All Users' },
              { value: 'job_seeker', label: 'Candidates' },
              { value: 'employer', label: 'Employers' },
              { value: 'learner', label: 'Learners' },
              { value: 'admin', label: 'Admins' },
            ]
      }
      onRowClick={(u) =>
        onInspectRecord(
          u.name || 'User',
          `${u.email || u.id} · ${getUserCategories(u).join(' · ')}`,
          {
            ...u,
            accountTypes: getUserCategories(u),
            hasCandidateProfile: candidateUidSet.has(u.id),
            hasEmployerProfile: employerUidSet.has(u.id),
            enrolledCoursesCount: enrolments.filter((en) => en.userId === u.id).length,
          }
        )
      }
      emptyTitle="No registered users found"
      emptyDescription="Firebase accounts synced to Firestore /users will appear here."
    />
  );
};
