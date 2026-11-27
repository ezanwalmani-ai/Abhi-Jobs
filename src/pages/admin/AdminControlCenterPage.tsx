import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Menu,
  RefreshCw,
  Download,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { auth as firebaseAuth, firebaseSignOut } from '../../lib/firebase';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import {
  AdminConfirmDialog,
  type AdminConfirmDialogProps,
} from '../../components/admin/AdminConfirmDialog';
import { AdminDetailDrawer } from '../../components/admin/AdminDetailDrawer';
import { AdminCsvExportModal } from '../../components/admin/AdminCsvExportModal';
import { AdminErrorBoundary } from '../../components/admin/AdminErrorBoundary';
import {
  canAccessAdminModule,
  getNavGroupForModule,
  getNavItemById,
  parseAdminModuleFromPath,
  type AdminModuleId,
} from '../../components/admin/adminNavConfig';
import { OverviewSection } from '../../components/admin/sections/OverviewSection';
import { PeopleSection } from '../../components/admin/sections/PeopleSection';
import { RecruitmentSection } from '../../components/admin/sections/RecruitmentSection';
import { LearningSection } from '../../components/admin/sections/LearningSection';
import { CommunicationSection } from '../../components/admin/sections/CommunicationSection';
import { PlatformSection } from '../../components/admin/sections/PlatformSection';
import {
  fetchOverviewKpiMetrics,
  listUsersAdminFromFirestore,
  listCandidatesAdminFromFirestore,
  listAllEmployersAdminFromFirestore,
  listAllJobsAdminFromFirestore,
  listAllApplicationsAdminFromFirestore,
  listInterviewsAdminFromFirestore,
  listHiringEnquiriesAdminFromFirestore,
  listCourseEnquiriesAdminFromFirestore,
  listAdminActivityLogs,
  subscribeAdminLiveData,
  type AdminUserRecord,
  type OverviewKpiMetrics,
  type AdminActivityLogRecord,
  type AdminCourseEnrolmentRecord,
  type AdminAssessmentAttemptRecord,
  type AdminIssuedCertificateRecord,
  type CertificateApprovalRequestRecord,
} from '../../services/adminPanelService';
import type {
  Application,
  CandidateProfile,
  CourseEnquiry,
  EmployerProfile,
  HiringEnquiry,
  Interview,
  Job,
} from '../../types';
import type { AdminCsvDataset } from '../../utils/csvExport';

export interface AdminControlCenterPageProps {
  currentRoute: string;
  navigate: (path: string) => void;
}

type PrimarySectionKey =
  | 'overview'
  | 'users'
  | 'jobs'
  | 'applications'
  | 'learning'
  | 'enquiries'
  | 'settings';

interface SectionTab {
  id: AdminModuleId;
  label: string;
}

const SECTION_CONFIG: Record<PrimarySectionKey, { title: string; tabs: SectionTab[] }> = {
  overview: {
    title: 'Overview',
    tabs: [
      { id: 'overview-dashboard', label: 'Dashboard' },
      { id: 'overview-analytics', label: 'Analytics' },
      { id: 'overview-reports', label: 'Reports' },
    ],
  },
  users: {
    title: 'Users',
    tabs: [
      { id: 'people-users', label: 'All Users' },
      { id: 'people-candidates', label: 'Candidates' },
      { id: 'people-employers', label: 'Employers' },
      { id: 'people-user-details', label: 'User Inspector' },
      { id: 'people-account-status', label: 'Account Status' },
    ],
  },
  jobs: {
    title: 'Jobs',
    tabs: [
      { id: 'recruitment-jobs-all', label: 'All Jobs' },
      { id: 'recruitment-jobs-published', label: 'Published' },
      { id: 'recruitment-jobs-pending', label: 'Pending' },
      { id: 'recruitment-jobs-closed', label: 'Closed' },
      { id: 'recruitment-companies', label: 'Companies' },
    ],
  },
  applications: {
    title: 'Applications',
    tabs: [
      { id: 'recruitment-applications', label: 'Applications' },
      { id: 'recruitment-interviews', label: 'Interviews' },
    ],
  },
  learning: {
    title: 'Learning',
    tabs: [
      { id: 'learning-enrolments', label: 'Enrolments' },
      { id: 'learning-courses', label: 'Courses' },
      { id: 'learning-quizzes', label: 'Quizzes' },
      { id: 'learning-attempts', label: 'Attempts' },
      { id: 'learning-certificates', label: 'Certificates' },
      { id: 'learning-cert-verify', label: 'Verify' },
    ],
  },
  enquiries: {
    title: 'Enquiries',
    tabs: [
      { id: 'comm-contact-enquiries', label: 'All Enquiries' },
      { id: 'recruitment-enquiries', label: 'Hiring Leads' },
      { id: 'comm-notifications', label: 'Send Notification' },
      { id: 'comm-support-tickets', label: 'Support' },
    ],
  },
  settings: {
    title: 'Settings',
    tabs: [
      { id: 'platform-website-settings', label: 'Website Content' },
      { id: 'platform-admin-roles', label: 'Admin Roles' },
      { id: 'platform-admin-activity', label: 'Activity Logs' },
      { id: 'platform-system-health', label: 'System Health' },
    ],
  },
};

function getPrimarySectionKey(moduleId: AdminModuleId): PrimarySectionKey {
  if (moduleId.startsWith('overview-')) return 'overview';
  if (moduleId === 'people-admins' || moduleId.startsWith('platform-')) return 'settings';
  if (moduleId.startsWith('people-')) return 'users';
  if (
    moduleId.startsWith('recruitment-jobs-') ||
    moduleId === 'recruitment-companies' ||
    moduleId === 'recruitment-saved-jobs'
  ) {
    return 'jobs';
  }
  if (moduleId === 'recruitment-applications' || moduleId === 'recruitment-interviews') {
    return 'applications';
  }
  if (moduleId.startsWith('learning-')) return 'learning';
  return 'enquiries';
}

export const AdminControlCenterPage: React.FC<AdminControlCenterPageProps> = ({
  currentRoute,
  navigate,
}) => {
  const {
    adminSession,
    refreshAdminSession,
    addToast,
    logout,
    supportTickets,
    updateSupportTicketStatus,
  } = useApp();

  const [checkingAuth, setCheckingAuth] = useState<boolean>(adminSession === null);
  const [activeModule, setActiveModule] = useState<AdminModuleId>(() =>
    parseAdminModuleFromPath(currentRoute)
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Live Firestore datasets updated automatically via onSnapshot
  const [loadingData, setLoadingData] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncErrors, setSyncErrors] = useState<Record<string, string>>({});

  const [kpis, setKpis] = useState<OverviewKpiMetrics | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [employers, setEmployers] = useState<EmployerProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [hiringEnquiries, setHiringEnquiries] = useState<HiringEnquiry[]>([]);
  const [courseEnquiries, setCourseEnquiries] = useState<
    (CourseEnquiry & { status: 'New' | 'Contacted' | 'Enrolled' | 'Closed'; internalNotes?: string })[]
  >([]);
  const [enrolments, setEnrolments] = useState<AdminCourseEnrolmentRecord[]>([]);
  const [attempts, setAttempts] = useState<AdminAssessmentAttemptRecord[]>([]);
  const [issuedCerts, setIssuedCerts] = useState<AdminIssuedCertificateRecord[]>([]);
  const [certRequests, setCertRequests] = useState<CertificateApprovalRequestRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLogRecord[]>([]);

  // Shared modals & drawers
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvDataset, setCsvDataset] = useState<AdminCsvDataset>('jobs');
  const [detailDrawer, setDetailDrawer] = useState<{
    open: boolean;
    title: string;
    subtitle?: string;
    record: Record<string, unknown> | null;
  }>({ open: false, title: '', record: null });
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    busy: boolean;
    config: Omit<AdminConfirmDialogProps, 'isOpen' | 'busy' | 'onCancel'> | null;
  }>({ open: false, busy: false, config: null });

  const handleReverifyAuth = useCallback(async () => {
    setCheckingAuth(true);
    try {
      await refreshAdminSession();
    } finally {
      setCheckingAuth(false);
    }
  }, [refreshAdminSession]);

  useEffect(() => {
    handleReverifyAuth();
  }, [handleReverifyAuth]);

  // Sync active module when route changes
  useEffect(() => {
    if (
      currentRoute === '/abhi-control-center/login' ||
      currentRoute === '/admin/login'
    ) {
      return;
    }
    const parsed = parseAdminModuleFromPath(currentRoute);
    setActiveModule(parsed);
  }, [currentRoute]);

  const clearSyncError = useCallback((source: string) => {
    setSyncErrors((prev) => {
      if (!(source in prev)) return prev;
      const next = { ...prev };
      delete next[source];
      return next;
    });
  }, []);

  // Manual full refresh (also refreshes server count aggregates and audit logs)
  const loadAllFirestoreData = useCallback(async () => {
    if (!adminSession?.authorized) return;
    setLoadingData(true);
    try {
      const [
        kpiRes,
        usersRes,
        candidatesRes,
        employersRes,
        jobsRes,
        appsRes,
        interviewsRes,
        hiringRes,
        courseRes,
        logsRes,
      ] = await Promise.allSettled([
        fetchOverviewKpiMetrics(),
        listUsersAdminFromFirestore(200),
        listCandidatesAdminFromFirestore(200),
        listAllEmployersAdminFromFirestore(200),
        listAllJobsAdminFromFirestore(200),
        listAllApplicationsAdminFromFirestore(200),
        listInterviewsAdminFromFirestore(150),
        listHiringEnquiriesAdminFromFirestore(150),
        listCourseEnquiriesAdminFromFirestore(150),
        adminSession.permissions?.canViewAuditLogs
          ? listAdminActivityLogs(50)
          : Promise.resolve([]),
      ]);

      if (kpiRes.status === 'fulfilled') setKpis(kpiRes.value);
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value);
        clearSyncError('users');
      }
      if (candidatesRes.status === 'fulfilled') {
        setCandidates(candidatesRes.value);
        clearSyncError('candidates');
      }
      if (employersRes.status === 'fulfilled') {
        setEmployers(employersRes.value);
        clearSyncError('employers');
      }
      if (jobsRes.status === 'fulfilled') {
        setJobs(jobsRes.value);
        clearSyncError('jobs');
      }
      if (appsRes.status === 'fulfilled') {
        setApplications(appsRes.value);
        clearSyncError('applications');
      }
      if (interviewsRes.status === 'fulfilled') {
        setInterviews(interviewsRes.value);
        clearSyncError('interviews');
      }
      if (hiringRes.status === 'fulfilled') {
        setHiringEnquiries(hiringRes.value);
        clearSyncError('hiring_enquiries');
      }
      if (courseRes.status === 'fulfilled') {
        setCourseEnquiries(courseRes.value);
        clearSyncError('course_enquiries');
      }
      if (logsRes.status === 'fulfilled') setActivityLogs(logsRes.value);
      setLastSyncedAt(new Date().toISOString());
    } finally {
      setLoadingData(false);
    }
  }, [adminSession?.authorized, adminSession?.permissions?.canViewAuditLogs, clearSyncError]);

  // Real-time Firestore onSnapshot subscription for every permitted collection
  useEffect(() => {
    if (!adminSession?.authorized || !adminSession.permissions) return;

    // Fetch server counts + audit logs alongside live streams
    loadAllFirestoreData();

    const unsubscribe = subscribeAdminLiveData(adminSession.permissions, {
      onUsers: (rows) => {
        setUsers(rows);
        clearSyncError('users');
      },
      onCandidates: (rows) => {
        setCandidates(rows);
        clearSyncError('candidates');
      },
      onEmployers: (rows) => {
        setEmployers(rows);
        clearSyncError('employers');
      },
      onJobs: (rows) => {
        setJobs(rows);
        clearSyncError('jobs');
      },
      onApplications: (rows) => {
        setApplications(rows);
        clearSyncError('applications');
      },
      onInterviews: (rows) => {
        setInterviews(rows);
        clearSyncError('interviews');
      },
      onHiringEnquiries: (rows) => {
        setHiringEnquiries(rows);
        clearSyncError('hiring_enquiries');
      },
      onCourseEnquiries: (rows) => {
        setCourseEnquiries(rows);
        clearSyncError('course_enquiries');
      },
      onEnrolments: (rows) => {
        setEnrolments(rows);
        clearSyncError('course_enrolments');
      },
      onAttempts: (rows) => {
        setAttempts(rows);
        clearSyncError('assessment_attempts');
      },
      onIssuedCerts: (rows) => {
        setIssuedCerts(rows);
        clearSyncError('public_certificates');
      },
      onCertRequests: (rows) => {
        setCertRequests(rows);
        clearSyncError('certificate_requests');
      },
      onError: (source, message) => {
        setSyncErrors((prev) => ({ ...prev, [source]: message }));
      },
      onSyncPulse: () => {
        setLiveConnected(true);
        setLastSyncedAt(new Date().toISOString());
      },
    });

    return () => {
      unsubscribe();
      setLiveConnected(false);
    };
  }, [adminSession?.authorized, adminSession?.permissions, loadAllFirestoreData, clearSyncError]);

  const sidebarCounts = useMemo(
    () => ({
      users: Math.max(users.length, kpis?.totalUsers ?? 0),
      jobs: jobs.length,
      applications: Math.max(applications.length, kpis?.totalApplications ?? 0),
      enrolments: Math.max(enrolments.length, kpis?.totalCourseEnrolments ?? 0),
      enquiries: hiringEnquiries.length + courseEnquiries.length,
    }),
    [users.length, kpis, jobs.length, applications.length, enrolments.length, hiringEnquiries.length, courseEnquiries.length]
  );

  // Strict auth gate: zero flash of protected UI before verified Firebase + RBAC authorization
  if (checkingAuth || !adminSession?.authorized) {
    return (
      <AdminLoginPage
        adminSession={adminSession}
        checking={checkingAuth}
        onReverify={handleReverifyAuth}
        onNavigateHome={() => navigate('/')}
      />
    );
  }

  const handleSelectModule = (moduleId: AdminModuleId) => {
    setActiveModule(moduleId);
    const targetPath =
      moduleId === 'overview-dashboard'
        ? '/abhi-control-center'
        : `/abhi-control-center/${moduleId}`;
    try {
      window.history.replaceState({}, '', targetPath);
    } catch {
      // Non-fatal inside restricted frames
    }
  };

  const handleSignOut = async () => {
    await firebaseSignOut(firebaseAuth).catch(() => {});
    logout();
    navigate('/abhi-control-center/login');
  };

  const handleInspectRecord = (
    title: string,
    subtitle: string,
    record: Record<string, unknown>
  ) => {
    setDetailDrawer({ open: true, title, subtitle, record });
  };

  const handleRequestConfirm = (
    config: Omit<AdminConfirmDialogProps, 'isOpen' | 'busy' | 'onCancel'>
  ) => {
    setConfirmState({ open: true, busy: false, config });
  };

  const executeConfirm = async () => {
    if (!confirmState.config) return;
    setConfirmState((prev) => ({ ...prev, busy: true }));
    try {
      await confirmState.config.onConfirm();
    } finally {
      setConfirmState({ open: false, busy: false, config: null });
    }
  };

  const handleOpenCsvExport = (dataset: AdminCsvDataset = 'jobs') => {
    setCsvDataset(dataset);
    setCsvModalOpen(true);
  };

  const currentNavItem = getNavItemById(activeModule);
  const currentGroup = getNavGroupForModule(activeModule);
  const primarySectionKey = getPrimarySectionKey(activeModule);
  const sectionConfig = SECTION_CONFIG[primarySectionKey];
  const visibleSectionTabs = sectionConfig.tabs.filter((tab) =>
    canAccessAdminModule(adminSession.permissions, getNavItemById(tab.id))
  );
  const hasModulePermission = canAccessAdminModule(adminSession.permissions, currentNavItem);
  const syncErrorEntries = Object.entries(syncErrors);

  const renderActiveSection = () => {
    if (!hasModulePermission) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 text-center max-w-lg mx-auto my-8 space-y-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#102B4E] flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-[#081D36]">
            Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Your active role (
            <span className="font-mono font-medium text-[#081D36]">{adminSession.role}</span>) does
            not include permission for {currentNavItem.label}.
          </p>
          <button
            type="button"
            onClick={() => handleSelectModule('overview-dashboard')}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold cursor-pointer"
          >
            Back to Overview
          </button>
        </div>
      );
    }

    switch (currentGroup.id) {
      case 'overview':
        return (
          <OverviewSection
            activeModule={activeModule}
            adminSession={adminSession}
            kpis={kpis}
            users={users}
            jobs={jobs}
            employers={employers}
            applications={applications}
            hiringEnquiries={hiringEnquiries}
            courseEnquiries={courseEnquiries}
            enrolments={enrolments}
            attempts={attempts}
            issuedCerts={issuedCerts}
            certRequests={certRequests}
            activityLogs={activityLogs}
            localSupportTicketsCount={supportTickets.filter((t) => t.status !== 'resolved').length}
            loading={loadingData}
            onRefresh={loadAllFirestoreData}
            onNavigateModule={handleSelectModule}
            onOpenCsvExport={handleOpenCsvExport}
            onInspectRecord={handleInspectRecord}
          />
        );

      case 'people':
        return (
          <PeopleSection
            activeModule={activeModule}
            adminSession={adminSession}
            users={users}
            candidates={candidates}
            employers={employers}
            enrolments={enrolments}
            applications={applications}
            interviews={interviews}
            attempts={attempts}
            issuedCerts={issuedCerts}
            loading={loadingData}
            onRefresh={loadAllFirestoreData}
            onNotify={addToast}
            onInspectRecord={handleInspectRecord}
            onRequestConfirm={handleRequestConfirm}
            onNavigateModule={handleSelectModule}
          />
        );

      case 'recruitment':
        return (
          <RecruitmentSection
            activeModule={activeModule}
            adminSession={adminSession}
            jobs={jobs}
            employers={employers}
            applications={applications}
            interviews={interviews}
            hiringEnquiries={hiringEnquiries}
            candidates={candidates}
            users={users}
            loading={loadingData}
            onRefresh={loadAllFirestoreData}
            onNotify={addToast}
            onInspectRecord={handleInspectRecord}
            onRequestConfirm={handleRequestConfirm}
          />
        );

      case 'learning':
        return (
          <LearningSection
            activeModule={activeModule}
            adminSession={adminSession}
            liveEnrolments={enrolments}
            liveAttempts={attempts}
            liveIssuedCerts={issuedCerts}
            onNotify={addToast}
            onNavigatePublic={navigate}
            onNavigateModule={handleSelectModule}
            onInspectRecord={handleInspectRecord}
            onRequestConfirm={handleRequestConfirm}
          />
        );

      case 'communication':
        return (
          <CommunicationSection
            activeModule={activeModule}
            adminSession={adminSession}
            users={users}
            hiringEnquiries={hiringEnquiries}
            courseEnquiries={courseEnquiries}
            localSupportTickets={supportTickets}
            loading={loadingData}
            onRefresh={loadAllFirestoreData}
            onUpdateLocalTicketStatus={updateSupportTicketStatus}
            onNotify={addToast}
            onInspectRecord={handleInspectRecord}
          />
        );

      case 'platform':
        return (
          <PlatformSection
            activeModule={activeModule}
            adminSession={adminSession}
            activityLogs={activityLogs}
            onRefresh={loadAllFirestoreData}
            onOpenCsvExport={handleOpenCsvExport}
            onNotify={addToast}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F6F8FB] text-[#1E293B] overflow-x-clip">
      {/* Minimal 7-Item Left Sidebar + Mobile Drawer */}
      <AdminSidebar
        activeModule={activeModule}
        adminSession={adminSession}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileDrawerOpen}
        counts={sidebarCounts}
        onSelectModule={handleSelectModule}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onCloseMobile={() => setMobileDrawerOpen(false)}
        onOpenPublicSite={() => navigate('/')}
        onSignOut={handleSignOut}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimal Top Bar */}
        <header className="h-16 bg-white border-b border-[#E5EAF0] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden min-w-[44px] min-h-[44px] -ml-2 rounded-lg text-[#081D36] hover:bg-[#F6F8FB] flex items-center justify-center cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-[17px] sm:text-lg font-bold text-[#102B4E] tracking-[-0.015em] truncate">
                {sectionConfig.title}
              </h1>
              {liveConnected && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Live</span>
                  {lastSyncedAt && (
                    <span className="text-[#64748B] font-mono text-[11px] tabular-nums">
                      · {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadAllFirestoreData}
              disabled={loadingData}
              className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] hover:border-[#102B4E]/35 text-xs font-semibold text-[#102B4E] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {adminSession.permissions?.canExportCsv && (
              <button
                type="button"
                onClick={() => handleOpenCsvExport('jobs')}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </div>
        </header>

        {/* Clean Horizontal Section Tabs */}
        {visibleSectionTabs.length > 1 && (
          <div className="bg-white border-b border-[#E5EAF0] px-4 sm:px-6 overflow-x-auto">
            <div className="flex items-center gap-6 max-w-[1440px] mx-auto" role="tablist">
              {visibleSectionTabs.map((tab) => {
                const isSelected = activeModule === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleSelectModule(tab.id)}
                    className={`py-3 text-xs sm:text-[13px] whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#F47A24] text-[#102B4E] font-semibold'
                        : 'border-transparent text-[#64748B] hover:text-[#102B4E] font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Module Workspace */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto min-w-0 space-y-5">
          {/* Honest Firestore Sync Error Banner (never silently swallow backend errors) */}
          {syncErrorEntries.length > 0 && (
            <div
              role="alert"
              className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-semibold">Firestore sync notice: </span>
                  <span>
                    Could not stream{' '}
                    {syncErrorEntries.map(([source]) => source).join(', ')}. ({syncErrorEntries[0][1]})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={loadAllFirestoreData}
                className="text-xs font-semibold text-amber-900 underline shrink-0 self-start sm:self-center cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          <AdminErrorBoundary
            resetKey={activeModule}
            sectionLabel={currentNavItem.label}
            onReset={loadAllFirestoreData}
          >
            {renderActiveSection()}
          </AdminErrorBoundary>
        </main>
      </div>

      {/* Authorized Super Admin CSV Export Modal */}
      <AdminCsvExportModal
        isOpen={csvModalOpen}
        initialDataset={csvDataset}
        sources={{
          jobs,
          applications,
          candidates,
          employers,
          hiringEnquiries,
        }}
        onClose={() => setCsvModalOpen(false)}
        onNotify={addToast}
      />

      {/* Reusable Confirmation Dialog for Sensitive & Destructive Actions */}
      <AdminConfirmDialog
        isOpen={confirmState.open}
        busy={confirmState.busy}
        title={confirmState.config?.title || ''}
        description={confirmState.config?.description || ''}
        confirmLabel={confirmState.config?.confirmLabel}
        cancelLabel={confirmState.config?.cancelLabel}
        tone={confirmState.config?.tone}
        details={confirmState.config?.details}
        onConfirm={executeConfirm}
        onCancel={() => setConfirmState({ open: false, busy: false, config: null })}
      />

      {/* Reusable Sanitized Record Detail Slide-Over */}
      <AdminDetailDrawer
        isOpen={detailDrawer.open}
        title={detailDrawer.title}
        subtitle={detailDrawer.subtitle}
        record={detailDrawer.record}
        onClose={() => setDetailDrawer({ open: false, title: '', record: null })}
      />
    </div>
  );
};
