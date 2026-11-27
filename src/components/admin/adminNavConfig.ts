import type { AdminPermissionSet } from '../../services/adminRbacService';

export type AdminSectionGroupId =
  | 'overview'
  | 'people'
  | 'recruitment'
  | 'learning'
  | 'communication'
  | 'platform';

export type AdminModuleId =
  // A. Overview
  | 'overview-dashboard'
  | 'overview-analytics'
  | 'overview-reports'
  // B. People
  | 'people-users'
  | 'people-candidates'
  | 'people-employers'
  | 'people-admins'
  | 'people-user-details'
  | 'people-account-status'
  // C. Recruitment
  | 'recruitment-jobs-all'
  | 'recruitment-jobs-pending'
  | 'recruitment-jobs-published'
  | 'recruitment-jobs-closed'
  | 'recruitment-companies'
  | 'recruitment-applications'
  | 'recruitment-interviews'
  | 'recruitment-saved-jobs'
  | 'recruitment-enquiries'
  // D. Learning — Learn with ABHI
  | 'learning-dashboard'
  | 'learning-courses'
  | 'learning-modules'
  | 'learning-lessons'
  | 'learning-enrolments'
  | 'learning-quizzes'
  | 'learning-attempts'
  | 'learning-video-progress'
  | 'learning-certificates'
  | 'learning-cert-templates'
  | 'learning-cert-verify'
  // E. Communication
  | 'comm-notifications'
  | 'comm-support-tickets'
  | 'comm-contact-enquiries'
  // F. Platform Management
  | 'platform-website-settings'
  | 'platform-admin-roles'
  | 'platform-admin-activity'
  | 'platform-data-management'
  | 'platform-system-health';

export interface AdminNavItem {
  id: AdminModuleId;
  groupId: AdminSectionGroupId;
  label: string;
  shortLabel?: string;
  description: string;
  requiredPermission?: keyof Omit<AdminPermissionSet, 'label' | 'description'>;
  anyOfPermissions?: (keyof Omit<AdminPermissionSet, 'label' | 'description'>)[];
}

export interface AdminNavGroup {
  id: AdminSectionGroupId;
  letter: string;
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'overview',
    letter: 'A',
    label: 'Overview',
    items: [
      {
        id: 'overview-dashboard',
        groupId: 'overview',
        label: 'Dashboard',
        description: 'Live platform KPIs, real registration & hiring trends, and recent activity.',
        requiredPermission: 'canViewOverview',
      },
      {
        id: 'overview-analytics',
        groupId: 'overview',
        label: 'Analytics',
        description: 'Firestore collection breakdowns, funnel ratios, and real time-series metrics.',
        requiredPermission: 'canViewOverview',
      },
      {
        id: 'overview-reports',
        groupId: 'overview',
        label: 'Reports',
        description: 'Authorized CSV exports and operational reporting snapshots.',
        requiredPermission: 'canViewOverview',
      },
    ],
  },
  {
    id: 'people',
    letter: 'B',
    label: 'People',
    items: [
      {
        id: 'people-users',
        groupId: 'people',
        label: 'All Users',
        description: 'Registered Firebase accounts stored in /users with role and status filtering.',
        anyOfPermissions: ['canManageCandidates', 'canSuspendUsers'],
      },
      {
        id: 'people-candidates',
        groupId: 'people',
        label: 'Candidates',
        description: 'Job seeker profiles from /candidates with skills, visibility, and completion.',
        anyOfPermissions: ['canManageCandidates', 'canSuspendUsers'],
      },
      {
        id: 'people-employers',
        groupId: 'people',
        label: 'Employers',
        description: 'Employer accounts, verification review, and isolated private recruiter contacts.',
        anyOfPermissions: ['canManageEmployers', 'canSuspendUsers'],
      },
      {
        id: 'people-admins',
        groupId: 'people',
        label: 'Administrators',
        description: 'Active and revoked ABHI JOBS administrators governed by /admin_roles.',
        requiredPermission: 'canManageRoles',
      },
      {
        id: 'people-user-details',
        groupId: 'people',
        label: 'User Details',
        description: 'Search and inspect sanitized account, candidate, and employer records by UID or email.',
        anyOfPermissions: ['canManageCandidates', 'canSuspendUsers'],
      },
      {
        id: 'people-account-status',
        groupId: 'people',
        label: 'Account Status',
        description: 'Suspend or reactivate user accounts with confirmation safeguards.',
        requiredPermission: 'canSuspendUsers',
      },
    ],
  },
  {
    id: 'recruitment',
    letter: 'C',
    label: 'Recruitment',
    items: [
      {
        id: 'recruitment-jobs-all',
        groupId: 'recruitment',
        label: 'All Jobs',
        description: 'Complete Firestore /jobs catalog with create, edit, status moderation, and delete.',
        anyOfPermissions: ['canManageJobs', 'canSuspendUsers'],
      },
      {
        id: 'recruitment-jobs-pending',
        groupId: 'recruitment',
        label: 'Pending Jobs',
        description: 'Draft and pending job listings awaiting Recruitment Admin approval.',
        anyOfPermissions: ['canManageJobs', 'canSuspendUsers'],
      },
      {
        id: 'recruitment-jobs-published',
        groupId: 'recruitment',
        label: 'Published Jobs',
        description: 'Active live job listings publicly visible on ABHI JOBS.',
        anyOfPermissions: ['canManageJobs', 'canSuspendUsers'],
      },
      {
        id: 'recruitment-jobs-closed',
        groupId: 'recruitment',
        label: 'Closed Jobs',
        description: 'Paused and closed job listings archived from public search.',
        anyOfPermissions: ['canManageJobs', 'canSuspendUsers'],
      },
      {
        id: 'recruitment-companies',
        groupId: 'recruitment',
        label: 'Companies',
        description: 'Company profiles, verification state, industry distribution, and active job counts.',
        anyOfPermissions: ['canManageEmployers', 'canSuspendUsers'],
      },
      {
        id: 'recruitment-applications',
        groupId: 'recruitment',
        label: 'Applications',
        description: 'Candidate applications, pipeline status updates, and private recruiter internal notes.',
        anyOfPermissions: ['canManageApplications', 'canSuspendUsers'],
      },
      {
        id: 'recruitment-interviews',
        groupId: 'recruitment',
        label: 'Interviews',
        description: 'Scheduled candidate interviews and new interview scheduling.',
        anyOfPermissions: ['canManageApplications', 'canSuspendUsers'],
      },
      {
        id: 'recruitment-saved-jobs',
        groupId: 'recruitment',
        label: 'Saved Jobs',
        description: 'Privacy-enforced owner-only bookmark boundary and aggregate job interest view.',
        anyOfPermissions: ['canManageJobs', 'canSuspendUsers'],
      },
      {
        id: 'recruitment-enquiries',
        groupId: 'recruitment',
        label: 'Enquiries',
        description: 'Inbound employer hiring enquiries from /hiring_enquiries with triage status.',
        requiredPermission: 'canManageHiringEnquiries',
      },
    ],
  },
  {
    id: 'learning',
    letter: 'D',
    label: 'Learn with ABHI',
    items: [
      {
        id: 'learning-dashboard',
        groupId: 'learning',
        label: 'Learning Dashboard',
        description: 'Live Learn with ABHI enrolments, quiz pass rates, and certificate queue metrics.',
        anyOfPermissions: ['canManageCourses', 'canApproveCertificates', 'canManageCourseEnquiries'],
      },
      {
        id: 'learning-courses',
        groupId: 'learning',
        label: 'Courses',
        description: 'Manage Learn with ABHI course catalog and Firestore curriculum metadata.',
        requiredPermission: 'canManageCourses',
      },
      {
        id: 'learning-modules',
        groupId: 'learning',
        label: 'Course Modules',
        description: 'Inspect and configure course module sequencing and unlock thresholds.',
        requiredPermission: 'canManageCourses',
      },
      {
        id: 'learning-lessons',
        groupId: 'learning',
        label: 'Lessons',
        description: 'Add, edit, and remove YouTube lessons, written content, exercises, and attachments.',
        requiredPermission: 'canManageCourses',
      },
      {
        id: 'learning-enrolments',
        groupId: 'learning',
        label: 'Enrolments',
        description: 'Real learner enrolments queried via bounded collectionGroup(course_enrolments).',
        requiredPermission: 'canManageCourses',
      },
      {
        id: 'learning-quizzes',
        groupId: 'learning',
        label: 'Quiz Management',
        description: 'Protected module quizzes and final assessments (answer keys restricted to admins).',
        requiredPermission: 'canManageAssessments',
      },
      {
        id: 'learning-attempts',
        groupId: 'learning',
        label: 'Assessment Attempts',
        description: 'Historical quiz and final assessment submissions across learners.',
        requiredPermission: 'canManageAssessments',
      },
      {
        id: 'learning-video-progress',
        groupId: 'learning',
        label: 'Video Progress',
        description: 'Per-lesson YouTube playback completion telemetry from learners.',
        requiredPermission: 'canManageCourses',
      },
      {
        id: 'learning-certificates',
        groupId: 'learning',
        label: 'Certificates',
        description: 'Certificate approval queue and issued public certificates registry (valid/revoked).',
        requiredPermission: 'canApproveCertificates',
      },
      {
        id: 'learning-cert-templates',
        groupId: 'learning',
        label: 'Certificate Templates',
        description: 'Manage branded certificate templates in /certificate_templates.',
        requiredPermission: 'canApproveCertificates',
      },
      {
        id: 'learning-cert-verify',
        groupId: 'learning',
        label: 'Public Verification',
        description: 'Verify any certificate ID directly against /public_certificates/{certificateId}.',
        requiredPermission: 'canViewOverview',
      },
    ],
  },
  {
    id: 'communication',
    letter: 'E',
    label: 'Communication',
    items: [
      {
        id: 'comm-notifications',
        groupId: 'communication',
        label: 'Notifications',
        description: 'Dispatch per-user Firestore notifications and inspect user notification inboxes.',
        anyOfPermissions: [
          'canManageRoles',
          'canManageApplications',
          'canManageCourses',
          'canSuspendUsers',
        ],
      },
      {
        id: 'comm-support-tickets',
        groupId: 'communication',
        label: 'Support Tickets',
        description: 'Transparent status of enquiry triage vs. legacy local support tickets.',
        anyOfPermissions: ['canSuspendUsers', 'canManageHiringEnquiries', 'canManageCourseEnquiries'],
      },
      {
        id: 'comm-contact-enquiries',
        groupId: 'communication',
        label: 'Contact Enquiries',
        description: 'Unified triage for Firestore hiring enquiries and course enquiries.',
        anyOfPermissions: ['canManageHiringEnquiries', 'canManageCourseEnquiries'],
      },
    ],
  },
  {
    id: 'platform',
    letter: 'F',
    label: 'Platform',
    items: [
      {
        id: 'platform-website-settings',
        groupId: 'platform',
        label: 'Website Settings',
        description: 'Manage /website_content CMS blocks and /public_settings configuration.',
        requiredPermission: 'canManageCms',
      },
      {
        id: 'platform-admin-roles',
        groupId: 'platform',
        label: 'Admin Roles & RBAC',
        description: 'Super Admin governance for the 5-role Firebase RBAC permission matrix.',
        requiredPermission: 'canManageRoles',
      },
      {
        id: 'platform-admin-activity',
        groupId: 'platform',
        label: 'Admin Activity',
        description: 'Read-only immutable /admin_activity_logs (server-written on Blaze).',
        requiredPermission: 'canViewAuditLogs',
      },
      {
        id: 'platform-data-management',
        groupId: 'platform',
        label: 'Data Management',
        description: 'Firestore data source inventory, CSV exports, and legacy migration status.',
        requiredPermission: 'canViewOverview',
      },
      {
        id: 'platform-system-health',
        groupId: 'platform',
        label: 'System Health',
        description: 'Live authenticated Firestore connectivity check and Starter-tier architecture status.',
        requiredPermission: 'canViewOverview',
      },
    ],
  },
];

export const ALL_ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export function getNavItemById(id: AdminModuleId): AdminNavItem {
  return ALL_ADMIN_NAV_ITEMS.find((item) => item.id === id) || ALL_ADMIN_NAV_ITEMS[0];
}

export function getNavGroupForModule(id: AdminModuleId): AdminNavGroup {
  return (
    ADMIN_NAV_GROUPS.find((g) => g.items.some((item) => item.id === id)) || ADMIN_NAV_GROUPS[0]
  );
}

export function canAccessAdminModule(
  permissions: AdminPermissionSet | null | undefined,
  item: AdminNavItem
): boolean {
  if (!permissions) return false;
  if (item.requiredPermission) {
    return Boolean(permissions[item.requiredPermission]);
  }
  if (item.anyOfPermissions && item.anyOfPermissions.length > 0) {
    return item.anyOfPermissions.some((key) => Boolean(permissions[key]));
  }
  return true;
}

export function parseAdminModuleFromPath(pathname: string): AdminModuleId {
  const cleaned = pathname
    .replace(/^\/abhi-control-center\/?/, '')
    .replace(/^\/admin\/?/, '')
    .replace(/\/+$/, '');
  if (!cleaned) return 'overview-dashboard';
  const matched = ALL_ADMIN_NAV_ITEMS.find((item) => item.id === cleaned);
  return matched ? matched.id : 'overview-dashboard';
}
