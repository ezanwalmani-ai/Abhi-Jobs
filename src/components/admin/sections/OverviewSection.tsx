import React, { useMemo, useState } from 'react';
import {
  Users,
  Briefcase,
  FileText,
  GraduationCap,
  Mail,
  Award,
  Download,
  RefreshCw,
  ArrowUpRight,
  Clock,
  Activity,
} from 'lucide-react';
import { AdminTrendChart } from '../AdminTrendChart';
import {
  buildLiveWebsiteActivityFeed,
  computeDateTrends,
  type AdminUserRecord,
  type OverviewKpiMetrics,
  type AdminActivityLogRecord,
  type AdminCourseEnrolmentRecord,
  type AdminAssessmentAttemptRecord,
  type AdminIssuedCertificateRecord,
  type CertificateApprovalRequestRecord,
  type LiveActivityCategory,
  type Application,
  type EmployerProfile,
  type HiringEnquiry,
  type Job,
  type CourseEnquiry,
} from '../../../services/adminPanelService';
import type { AdminModuleId } from '../adminNavConfig';
import type { AdminCsvDataset } from '../../../utils/csvExport';
import type { ResolvedAdminSession } from '../../../services/adminRbacService';

export interface OverviewSectionProps {
  activeModule: AdminModuleId;
  adminSession: ResolvedAdminSession;
  kpis: OverviewKpiMetrics | null;
  users: AdminUserRecord[];
  jobs: Job[];
  employers: EmployerProfile[];
  applications: Application[];
  hiringEnquiries: HiringEnquiry[];
  courseEnquiries: (CourseEnquiry & { status?: string })[];
  enrolments?: AdminCourseEnrolmentRecord[];
  attempts?: AdminAssessmentAttemptRecord[];
  issuedCerts?: AdminIssuedCertificateRecord[];
  certRequests?: CertificateApprovalRequestRecord[];
  activityLogs: AdminActivityLogRecord[];
  localSupportTicketsCount: number;
  loading: boolean;
  onRefresh: () => void;
  onNavigateModule: (moduleId: AdminModuleId) => void;
  onOpenCsvExport: (dataset?: AdminCsvDataset) => void;
  onInspectRecord: (title: string, subtitle: string, record: Record<string, unknown>) => void;
}

type ActivityFilter = 'all' | 'user' | 'recruitment' | 'learning' | 'enquiry';
type TrendSeries = 'users' | 'applications' | 'enrolments';

function formatShortTimestamp(iso?: string): string {
  if (!iso) return 'Just now';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 60_000 && diffMs >= 0) return 'Just now';
  if (diffMs < 3_600_000 && diffMs >= 0) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000 && diffMs >= 0) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  if (diffMs < 604_800_000 && diffMs >= 0) return `${Math.floor(diffMs / 86_400_000)}d ago`;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getCategoryIcon(category: LiveActivityCategory) {
  switch (category) {
    case 'user':
      return Users;
    case 'application':
      return FileText;
    case 'job':
      return Briefcase;
    case 'learning':
      return GraduationCap;
    case 'enquiry':
      return Mail;
    case 'certificate':
      return Award;
  }
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  activeModule,
  adminSession,
  kpis,
  users,
  jobs,
  employers,
  applications,
  hiringEnquiries,
  courseEnquiries,
  enrolments = [],
  attempts = [],
  issuedCerts = [],
  certRequests = [],
  loading,
  onRefresh,
  onNavigateModule,
  onOpenCsvExport,
  onInspectRecord,
}) => {
  const [trendWindowDays, setTrendWindowDays] = useState<14 | 30>(14);
  const [trendSeries, setTrendSeries] = useState<TrendSeries>('users');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

  const userTrends = useMemo(
    () => computeDateTrends<AdminUserRecord>(users, (u) => u.createdAt, trendWindowDays),
    [users, trendWindowDays]
  );

  const jobTrends = useMemo(
    () => computeDateTrends<Job>(jobs, (j) => j.postedDate, trendWindowDays),
    [jobs, trendWindowDays]
  );

  const applicationTrends = useMemo(
    () =>
      computeDateTrends<Application>(
        applications,
        (a) => a.appliedAt || a.appliedDate,
        trendWindowDays
      ),
    [applications, trendWindowDays]
  );

  const enrolmentTrends = useMemo(
    () =>
      computeDateTrends<AdminCourseEnrolmentRecord>(
        enrolments,
        (e) => e.enrolledAt || e.lastAccessedAt,
        trendWindowDays
      ),
    [enrolments, trendWindowDays]
  );

  // Live merged activity stream across every website action
  const liveFeed = useMemo(
    () =>
      buildLiveWebsiteActivityFeed({
        users,
        jobs,
        applications,
        enrolments,
        attempts,
        hiringEnquiries,
        courseEnquiries,
        issuedCerts,
        certRequests,
      }),
    [
      users,
      jobs,
      applications,
      enrolments,
      attempts,
      hiringEnquiries,
      courseEnquiries,
      issuedCerts,
      certRequests,
    ]
  );

  const filteredFeed = useMemo(() => {
    if (activityFilter === 'all') return liveFeed;
    if (activityFilter === 'user') return liveFeed.filter((i) => i.category === 'user');
    if (activityFilter === 'recruitment') {
      return liveFeed.filter((i) => i.category === 'application' || i.category === 'job');
    }
    if (activityFilter === 'learning') {
      return liveFeed.filter((i) => i.category === 'learning' || i.category === 'certificate');
    }
    return liveFeed.filter((i) => i.category === 'enquiry');
  }, [liveFeed, activityFilter]);

  // Real live counts preferring direct onSnapshot data (and server count when larger)
  const totalUsersCount = Math.max(users.length, kpis?.totalUsers ?? 0);
  const candidatesCount = Math.max(
    users.filter((u) => u.role === 'job_seeker').length,
    kpis?.totalCandidates ?? 0
  );
  const employersCount = Math.max(employers.length, kpis?.totalEmployers ?? 0);
  const activeJobsCount = Math.max(
    jobs.filter((j) => j.status === 'published').length,
    kpis?.activeJobs ?? 0
  );
  const pendingJobsCount = Math.max(
    jobs.filter((j) => j.status === 'draft').length,
    kpis?.pendingJobs ?? 0
  );
  const totalApplicationsCount = Math.max(applications.length, kpis?.totalApplications ?? 0);
  const totalEnrolmentsCount = Math.max(enrolments.length, kpis?.totalCourseEnrolments ?? 0);
  const validCertificatesCount = Math.max(
    issuedCerts.filter((c) => c.status === 'valid').length,
    kpis?.certificatesIssued ?? 0
  );

  // Actionable pending items (only displayed when > 0)
  const pendingEmployersCount = employers.filter((e) => e.verificationStatus === 'pending').length;
  const newEnquiriesCount =
    hiringEnquiries.filter((e) => e.status === 'New').length +
    courseEnquiries.filter((e) => (e.status || 'New') === 'New').length;
  const pendingCertRequestsCount = certRequests.filter((c) => c.status === 'pending').length;

  const actionItems = useMemo(() => {
    const items: { label: string; count: number; target: AdminModuleId }[] = [];
    if (pendingEmployersCount > 0) {
      items.push({
        label: 'Employers awaiting verification',
        count: pendingEmployersCount,
        target: 'people-employers',
      });
    }
    if (pendingJobsCount > 0) {
      items.push({
        label: 'Draft jobs pending review',
        count: pendingJobsCount,
        target: 'recruitment-jobs-pending',
      });
    }
    if (newEnquiriesCount > 0) {
      items.push({
        label: 'New enquiries',
        count: newEnquiriesCount,
        target: 'comm-contact-enquiries',
      });
    }
    if (pendingCertRequestsCount > 0) {
      items.push({
        label: 'Certificate requests',
        count: pendingCertRequestsCount,
        target: 'learning-certificates',
      });
    }
    return items;
  }, [pendingEmployersCount, pendingJobsCount, newEnquiriesCount, pendingCertRequestsCount]);

  // Reports sub-tab
  if (activeModule === 'overview-reports') {
    const reportCards: { dataset: AdminCsvDataset; title: string; count: number; desc: string }[] = [
      {
        dataset: 'jobs',
        title: 'Job Listings',
        count: jobs.length,
        desc: 'Export active, draft, paused, and closed job listings.',
      },
      {
        dataset: 'applications',
        title: 'Applications',
        count: applications.length,
        desc: 'Export candidate applications, stages, and submission dates.',
      },
      {
        dataset: 'candidates',
        title: 'Candidates',
        count: candidatesCount,
        desc: 'Export registered candidate profiles and skills.',
      },
      {
        dataset: 'employers',
        title: 'Employers',
        count: employers.length,
        desc: 'Export registered companies and verification status.',
      },
      {
        dataset: 'hiring_enquiries',
        title: 'Hiring Enquiries',
        count: hiringEnquiries.length,
        desc: 'Export inbound corporate recruitment enquiries.',
      },
      {
        dataset: 'student_progress',
        title: 'Learner Progress',
        count: totalEnrolmentsCount,
        desc: 'Export Learn with ABHI enrolments and completion status.',
      },
    ];

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#081D36]">CSV Reports</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Export live Firestore records as clean UTF-8 CSV files.
            </p>
          </div>
          {adminSession.permissions?.canExportCsv ? (
            <button
              type="button"
              onClick={() => onOpenCsvExport('jobs')}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export Center</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500">Super Admin role required for CSV exports</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reportCards.map((card) => (
            <div
              key={card.dataset}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#081D36]">{card.title}</h3>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {card.count}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{card.desc}</p>
              </div>
              <button
                type="button"
                disabled={!adminSession.permissions?.canExportCsv}
                onClick={() => onOpenCsvExport(card.dataset)}
                className="w-full min-h-[38px] px-3 py-2 rounded-lg border border-slate-200 hover:border-[#102B4E] hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-[#081D36] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Analytics sub-tab
  if (activeModule === 'overview-analytics') {
    const verifiedEmployersCount = Math.max(
      employers.filter((e) => e.verificationStatus === 'verified').length,
      kpis?.verifiedEmployers ?? 0
    );
    const employerVerifiedRate =
      employersCount > 0 ? Math.round((verifiedEmployersCount / employersCount) * 100) : 0;
    const appsPerJob =
      activeJobsCount > 0 ? (totalApplicationsCount / activeJobsCount).toFixed(1) : '0.0';
    const certRate =
      totalEnrolmentsCount > 0
        ? Math.round((validCertificatesCount / totalEnrolmentsCount) * 100)
        : 0;

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#081D36]">Analytics</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated directly from live Firestore records.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTrendWindowDays(14)}
                className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                  trendWindowDays === 14 ? 'bg-[#102B4E] text-white' : 'text-slate-600'
                }`}
              >
                14 Days
              </button>
              <button
                type="button"
                onClick={() => setTrendWindowDays(30)}
                className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                  trendWindowDays === 30 ? 'bg-[#102B4E] text-white' : 'text-slate-600'
                }`}
              >
                30 Days
              </button>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-[#081D36] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-xs text-slate-500">Verified Employers</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#081D36] mt-1">
              {employerVerifiedRate}%
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
              {verifiedEmployersCount} of {employersCount} employers
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-xs text-slate-500">Applications per Active Job</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#081D36] mt-1">
              {appsPerJob}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
              {totalApplicationsCount} applications · {activeJobsCount} jobs
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-xs text-slate-500">Course Completion Certificates</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#081D36] mt-1">
              {certRate}%
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
              {validCertificatesCount} issued · {totalEnrolmentsCount} enrolments
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AdminTrendChart
            title="New Users"
            subtitle={`Last ${trendWindowDays} days`}
            points={userTrends}
            accentColor="#102B4E"
          />
          <AdminTrendChart
            title="Job Postings"
            subtitle={`Last ${trendWindowDays} days`}
            points={jobTrends}
            accentColor="#F47A24"
          />
          <AdminTrendChart
            title="Applications"
            subtitle={`Last ${trendWindowDays} days`}
            points={applicationTrends}
            accentColor="#2563EB"
          />
        </div>
      </div>
    );
  }

  // Primary Minimal Overview Dashboard
  const activeTrendConfig =
    trendSeries === 'users'
      ? {
          title: 'User Signups',
          subtitle: `New accounts over the last ${trendWindowDays} days`,
          points: userTrends,
          color: '#102B4E',
        }
      : trendSeries === 'applications'
      ? {
          title: 'Job Applications',
          subtitle: `Submitted applications over the last ${trendWindowDays} days`,
          points: applicationTrends,
          color: '#F47A24',
        }
      : {
          title: 'Course Enrolments',
          subtitle: `Learn with ABHI enrolments over the last ${trendWindowDays} days`,
          points: enrolmentTrends,
          color: '#2563EB',
        };

  return (
    <div className="space-y-6">
      {/* 4 Clean Primary KPI Cards */}
      <section aria-label="Key metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateModule('people-users')}
          className="text-left bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 shadow-[0_1px_2px_rgba(16,43,78,0.03)] p-5 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#64748B]">Users</span>
            <span className="w-8 h-8 rounded-lg bg-[#F1F5FA] text-[#102B4E] flex items-center justify-center group-hover:bg-[#102B4E] group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-[28px] font-bold font-mono tabular-nums text-[#102B4E] mt-2 leading-tight">
            {totalUsersCount.toLocaleString()}
          </div>
          <div className="text-xs text-[#64748B] mt-1.5">
            {candidatesCount} candidates · {employersCount} employers
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateModule('recruitment-jobs-all')}
          className="text-left bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 shadow-[0_1px_2px_rgba(16,43,78,0.03)] p-5 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#64748B]">Active Jobs</span>
            <span className="w-8 h-8 rounded-lg bg-[#FFF4EC] text-[#F47A24] flex items-center justify-center group-hover:bg-[#F47A24] group-hover:text-white transition-colors">
              <Briefcase className="w-4 h-4" />
            </span>
          </div>
          <div className="text-[28px] font-bold font-mono tabular-nums text-[#102B4E] mt-2 leading-tight">
            {activeJobsCount.toLocaleString()}
          </div>
          <div className="text-xs text-[#64748B] mt-1.5">
            {jobs.length} total · {pendingJobsCount} pending
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateModule('recruitment-applications')}
          className="text-left bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 shadow-[0_1px_2px_rgba(16,43,78,0.03)] p-5 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#64748B]">Applications</span>
            <span className="w-8 h-8 rounded-lg bg-[#F1F5FA] text-[#102B4E] flex items-center justify-center group-hover:bg-[#102B4E] group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-[28px] font-bold font-mono tabular-nums text-[#102B4E] mt-2 leading-tight">
            {totalApplicationsCount.toLocaleString()}
          </div>
          <div className="text-xs text-[#64748B] mt-1.5">
            {kpis?.totalInterviews ?? 0} interviews · {newEnquiriesCount} new enquiries
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateModule('learning-enrolments')}
          className="text-left bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 shadow-[0_1px_2px_rgba(16,43,78,0.03)] p-5 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#64748B]">Course Enrolments</span>
            <span className="w-8 h-8 rounded-lg bg-[#FFF4EC] text-[#F47A24] flex items-center justify-center group-hover:bg-[#F47A24] group-hover:text-white transition-colors">
              <GraduationCap className="w-4 h-4" />
            </span>
          </div>
          <div className="text-[28px] font-bold font-mono tabular-nums text-[#102B4E] mt-2 leading-tight">
            {totalEnrolmentsCount.toLocaleString()}
          </div>
          <div className="text-xs text-[#64748B] mt-1.5">
            {validCertificatesCount} certificates · {attempts.length} quiz attempts
          </div>
        </button>
      </section>

      {/* Conditional Action Needed Bar */}
      {actionItems.length > 0 && (
        <section
          aria-label="Needs attention"
          className="bg-white rounded-xl border border-[#E5EAF0] px-5 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-2"
        >
          <span className="text-xs font-semibold text-[#102B4E] flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#F47A24]" />
            <span>Needs review</span>
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {actionItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigateModule(item.target)}
                className="text-xs text-[#475569] hover:text-[#102B4E] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="font-mono font-semibold tabular-nums text-[#102B4E]">
                  {item.count}
                </span>
                <span>{item.label}</span>
                <ArrowUpRight className="w-3 h-3 text-[#64748B]" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Main 2-Column Workspace: Live Activity Stream + Trend & Recent Users */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Live Website Activity */}
        <section
          aria-label="Live website activity"
          className="xl:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#081D36] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#102B4E]" />
                <span>Live Website Activity</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Signups, applications, jobs, course enrolments, quizzes, and enquiries in real time.
              </p>
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs overflow-x-auto max-w-full">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'user', label: 'Users' },
                  { id: 'recruitment', label: 'Jobs & Apps' },
                  { id: 'learning', label: 'Learning' },
                  { id: 'enquiry', label: 'Enquiries' },
                ] as { id: ActivityFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivityFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    activityFilter === tab.id
                      ? 'bg-white text-[#081D36] shadow-xs'
                      : 'text-slate-600 hover:text-[#081D36]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
            {filteredFeed.slice(0, 25).map((item) => {
              const Icon = getCategoryIcon(item.category);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onInspectRecord(item.title, item.subtitle, item.record)}
                  className="w-full px-5 py-3.5 hover:bg-slate-50/80 flex items-start justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#102B4E] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#081D36] truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                        {item.statusLabel ? ` · ${item.statusLabel}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0 pt-0.5">
                    {formatShortTimestamp(item.timestamp)}
                  </span>
                </button>
              );
            })}

            {filteredFeed.length === 0 && (
              <div className="px-6 py-12 text-center space-y-1.5">
                <p className="text-sm font-medium text-[#081D36]">No activity recorded yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When someone signs up, applies for a job, enrols in a course, or submits an enquiry on ABHI JOBS, it will appear here automatically.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right: Single Toggleable Trend Chart + Recent Users */}
        <div className="xl:col-span-5 space-y-6">
          <section aria-label="Activity trend" className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                {(
                  [
                    { id: 'users', label: 'Signups' },
                    { id: 'applications', label: 'Applications' },
                    { id: 'enrolments', label: 'Enrolments' },
                  ] as { id: TrendSeries; label: string }[]
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTrendSeries(s.id)}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                      trendSeries === s.id
                        ? 'bg-[#102B4E] text-white'
                        : 'text-slate-600 hover:text-[#081D36]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTrendWindowDays(14)}
                  className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                    trendWindowDays === 14 ? 'bg-slate-100 text-[#081D36]' : 'text-slate-500'
                  }`}
                >
                  14d
                </button>
                <button
                  type="button"
                  onClick={() => setTrendWindowDays(30)}
                  className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                    trendWindowDays === 30 ? 'bg-slate-100 text-[#081D36]' : 'text-slate-500'
                  }`}
                >
                  30d
                </button>
              </div>
            </div>

            <AdminTrendChart
              title={activeTrendConfig.title}
              subtitle={activeTrendConfig.subtitle}
              points={activeTrendConfig.points}
              accentColor={activeTrendConfig.color}
            />
          </section>

          {/* Recent Users */}
          <section
            aria-label="Recent users"
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#081D36]">Recent Users</h3>
              <button
                type="button"
                onClick={() => onNavigateModule('people-users')}
                className="text-xs font-medium text-[#102B4E] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {users.slice(0, 5).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() =>
                    onInspectRecord(
                      u.name,
                      `${u.email} · ${u.role}`,
                      u as unknown as Record<string, unknown>
                    )
                  }
                  className="w-full px-5 py-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-[#102B4E] text-xs font-semibold flex items-center justify-center shrink-0">
                      {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#081D36] truncate">{u.name || u.email || u.id}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {u.email || u.id} · {(u.role || 'job_seeker').replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                    {formatShortTimestamp(u.createdAt)}
                  </span>
                </button>
              ))}

              {users.length === 0 && (
                <div className="px-5 py-8 text-center text-xs text-slate-500">
                  No users found in Firestore yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
