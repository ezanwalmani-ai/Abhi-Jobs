/**
 * Runtime TypeScript Unit Tests for ABHI JOBS Admin Panel Logic
 * Runs via `npx tsx --test firebase/tests/admin_panel.runtime.test.ts`
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_PERMISSION_MATRIX,
  canPerformAdminAction,
  getPermissionsForRole,
  validateAdminRoleMutation,
} from '../../src/services/adminRbacService.ts';
import {
  computeDateTrends,
  sanitizeRecordForAdminDisplay,
} from '../../src/services/adminPanelService.ts';
import {
  ALL_ADMIN_NAV_ITEMS,
  canAccessAdminModule,
  parseAdminModuleFromPath,
} from '../../src/components/admin/adminNavConfig.ts';

describe('Runtime RBAC Permission Matrix & Escalation Safeguards', () => {
  it('blocks non-Super-Admin from creating, modifying, or revoking any admin role', () => {
    for (const nonSuperRole of [
      'recruitment_admin',
      'course_admin',
      'content_admin',
      'support_admin',
      null,
    ] as const) {
      const result = validateAdminRoleMutation({
        actorUid: 'actor_1',
        actorRole: nonSuperRole,
        targetUid: 'target_1',
        nextRole: 'super_admin',
        nextStatus: 'active',
        existingRoles: [{ uid: 'super_1', role: 'super_admin', status: 'active' }],
      });
      assert.equal(result.allowed, false);
      assert.ok(result.error?.includes('Super Admin'));
    }
  });

  it('blocks Super Admin from self-revoking or self-downgrading', () => {
    const revokeSelf = validateAdminRoleMutation({
      actorUid: 'super_1',
      actorRole: 'super_admin',
      targetUid: 'super_1',
      nextRole: 'super_admin',
      nextStatus: 'revoked',
      existingRoles: [
        { uid: 'super_1', role: 'super_admin', status: 'active' },
        { uid: 'super_2', role: 'super_admin', status: 'active' },
      ],
    });
    assert.equal(revokeSelf.allowed, false);

    const downgradeSelf = validateAdminRoleMutation({
      actorUid: 'super_1',
      actorRole: 'super_admin',
      targetUid: 'super_1',
      nextRole: 'recruitment_admin',
      nextStatus: 'active',
      existingRoles: [
        { uid: 'super_1', role: 'super_admin', status: 'active' },
        { uid: 'super_2', role: 'super_admin', status: 'active' },
      ],
    });
    assert.equal(downgradeSelf.allowed, false);
  });

  it('blocks removing or downgrading the last active Super Admin', () => {
    const res = validateAdminRoleMutation({
      actorUid: 'bootstrap_super',
      actorRole: 'super_admin',
      targetUid: 'only_super',
      nextRole: 'support_admin',
      nextStatus: 'active',
      existingRoles: [{ uid: 'only_super', role: 'super_admin', status: 'active' }],
    });
    assert.equal(res.allowed, false);
    assert.ok(res.error?.includes('last active Super Admin'));
  });

  it('enforces exact module boundaries across all 5 roles and denies unauthorized users', () => {
    assert.equal(getPermissionsForRole(null), null);
    assert.equal(canPerformAdminAction(null, 'canViewOverview'), false);

    // Super Admin can access every single module
    for (const item of ALL_ADMIN_NAV_ITEMS) {
      assert.equal(
        canAccessAdminModule(ADMIN_PERMISSION_MATRIX.super_admin, item),
        true,
        `Super Admin should access ${item.id}`
      );
    }

    // Course Admin cannot manage roles, jobs, or CMS
    const rolesMod = ALL_ADMIN_NAV_ITEMS.find((i) => i.id === 'platform-admin-roles')!;
    const jobsMod = ALL_ADMIN_NAV_ITEMS.find((i) => i.id === 'recruitment-jobs-all')!;
    const coursesMod = ALL_ADMIN_NAV_ITEMS.find((i) => i.id === 'learning-courses')!;
    const cmsMod = ALL_ADMIN_NAV_ITEMS.find((i) => i.id === 'platform-website-settings')!;

    assert.equal(canAccessAdminModule(ADMIN_PERMISSION_MATRIX.course_admin, rolesMod), false);
    assert.equal(canAccessAdminModule(ADMIN_PERMISSION_MATRIX.course_admin, jobsMod), false);
    assert.equal(canAccessAdminModule(ADMIN_PERMISSION_MATRIX.course_admin, coursesMod), true);
    assert.equal(canAccessAdminModule(ADMIN_PERMISSION_MATRIX.content_admin, cmsMod), true);
    assert.equal(canAccessAdminModule(ADMIN_PERMISSION_MATRIX.content_admin, coursesMod), false);
    assert.equal(canAccessAdminModule(ADMIN_PERMISSION_MATRIX.recruitment_admin, jobsMod), true);
    assert.equal(canAccessAdminModule(ADMIN_PERMISSION_MATRIX.recruitment_admin, rolesMod), false);
  });

  it('parses deep-linked admin routes safely and defaults invalid paths to overview-dashboard', () => {
    assert.equal(parseAdminModuleFromPath('/abhi-control-center'), 'overview-dashboard');
    assert.equal(parseAdminModuleFromPath('/admin'), 'overview-dashboard');
    assert.equal(
      parseAdminModuleFromPath('/abhi-control-center/people-employers'),
      'people-employers'
    );
    assert.equal(
      parseAdminModuleFromPath('/abhi-control-center/nonexistent-route'),
      'overview-dashboard'
    );
  });
});

describe('Runtime Real-Data Trends, Empty States & Secret Redaction', () => {
  it('returns strictly zero counts for empty datasets (zero fabricated stats)', () => {
    const emptyPoints = computeDateTrends([], () => '', 14, new Date('2026-11-26T12:00:00Z'));
    assert.equal(emptyPoints.length, 14);
    assert.equal(
      emptyPoints.reduce((acc, p) => acc + p.count, 0),
      0
    );
  });

  it('buckets real timestamped records accurately by UTC date', () => {
    const records = [
      { id: '1', createdAt: '2026-11-26T01:15:00Z' },
      { id: '2', createdAt: '2026-11-26T18:30:00Z' },
      { id: '3', createdAt: '2026-11-24T09:00:00Z' },
      { id: '4', createdAt: 'invalid-date' },
    ];
    const points = computeDateTrends(
      records,
      (r) => r.createdAt,
      14,
      new Date('2026-11-26T20:00:00Z')
    );
    const nov26 = points.find((p) => p.dateKey === '2026-11-26');
    const nov24 = points.find((p) => p.dateKey === '2026-11-24');
    assert.equal(nov26?.count, 2);
    assert.equal(nov24?.count, 1);
    assert.equal(
      points.reduce((acc, p) => acc + p.count, 0),
      3
    );
  });

  it('strips passwords, tokens, secrets, api keys, and verificationSignature recursively', () => {
    const sanitized = sanitizeRecordForAdminDisplay({
      id: 'usr_123',
      name: 'Ada Lovelace',
      passwordHash: 'sha256_secret',
      accessToken: 'jwt_xyz',
      verificationSignature: 'abcdef1234567890abcdef1234567890',
      nested: {
        email: 'ada@example.com',
        clientSecret: 'super_secret',
        apiKey: 'AIzaSyFake',
      },
    });

    assert.equal(sanitized.id, 'usr_123');
    assert.equal(sanitized.name, 'Ada Lovelace');
    assert.equal('passwordHash' in sanitized, false);
    assert.equal('accessToken' in sanitized, false);
    assert.equal('verificationSignature' in sanitized, false);
    const nested = sanitized.nested as Record<string, unknown>;
    assert.equal(nested.email, 'ada@example.com');
    assert.equal('clientSecret' in nested, false);
    assert.equal('apiKey' in nested, false);
  });
});

describe('Runtime Render Smoke Test Across All 37 Admin Console Views', () => {
  it('renders every AdminModuleId section cleanly without throwing or going blank', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { OverviewSection } = await import('../../src/components/admin/sections/OverviewSection.tsx');
    const { PeopleSection } = await import('../../src/components/admin/sections/PeopleSection.tsx');
    const { RecruitmentSection } = await import('../../src/components/admin/sections/RecruitmentSection.tsx');
    const { LearningSection } = await import('../../src/components/admin/sections/LearningSection.tsx');
    const { CommunicationSection } = await import('../../src/components/admin/sections/CommunicationSection.tsx');
    const { PlatformSection } = await import('../../src/components/admin/sections/PlatformSection.tsx');
    const { getNavGroupForModule } = await import('../../src/components/admin/adminNavConfig.ts');

    const superSession = {
      authorized: true,
      uid: 'uid_super_test',
      email: 'ezanwalmani@gmail.com',
      displayName: 'Super Admin',
      emailVerified: true,
      role: 'super_admin' as const,
      source: 'firestore_admin_roles' as const,
      permissions: ADMIN_PERMISSION_MATRIX.super_admin,
      denialReason: null,
    };

    const sampleUsers = [
      {
        id: 'u_cand_1',
        name: 'Aarav Sharma',
        email: 'aarav@example.com',
        role: 'job_seeker' as const,
        accountStatus: 'active' as const,
        createdAt: '2026-11-20T10:00:00Z',
        emailVerified: true,
      },
      {
        id: 'u_emp_1',
        name: 'Priya Nair',
        email: 'priya@acme.in',
        role: 'employer' as const,
        accountStatus: 'active' as const,
        createdAt: '2026-11-21T10:00:00Z',
        emailVerified: true,
      },
    ];

    const sampleCandidates = [
      {
        id: 'u_cand_1',
        userId: 'u_cand_1',
        name: 'Aarav Sharma',
        email: 'aarav@example.com',
        phone: '+91 9876543210',
        location: 'Bengaluru',
        title: 'Data Analyst',
        summary: 'Excel and SQL analyst',
        skills: ['Excel', 'SQL'],
        experienceYears: 2,
        education: [],
        experience: [],
        preferredCategories: ['Analytics'],
        preferredLocations: ['Bengaluru'],
        profileCompletion: 85,
      },
    ];

    const sampleEmployers = [
      {
        id: 'emp_1',
        userId: 'u_emp_1',
        companyName: 'Acme Corp',
        industry: 'Technology',
        location: 'Mumbai',
        website: 'https://acme.in',
        description: 'Hiring partner',
        verificationStatus: 'verified' as const,
        contactEmail: 'priya@acme.in',
      },
    ];

    const sampleJobs = [
      {
        id: 'job_1',
        employerId: 'emp_1',
        title: 'Operations Executive',
        companyName: 'Acme Corp',
        location: 'Mumbai',
        workMode: 'Onsite' as const,
        employmentType: 'Full-time' as const,
        category: 'Operations',
        experienceLevel: '1-3 years',
        salaryMin: 400000,
        salaryMax: 600000,
        salaryCurrency: 'INR',
        description: 'Manage daily ops',
        responsibilities: ['Coordinate'],
        requirements: ['Excel'],
        skills: ['Excel'],
        status: 'published' as const,
        postedDate: '2026-11-22T10:00:00Z',
        featured: false,
        applicantsCount: 1,
      },
    ];

    const sampleApps = [
      {
        id: 'app_1',
        jobId: 'job_1',
        candidateId: 'u_cand_1',
        candidateName: 'Aarav Sharma',
        candidateEmail: 'aarav@example.com',
        jobTitle: 'Operations Executive',
        companyName: 'Acme Corp',
        status: 'applied' as const,
        appliedAt: '2026-11-23T10:00:00Z',
        appliedDate: '2026-11-23',
      },
    ];

    const sampleEnrolments = [
      {
        id: 'u_cand_1_excel',
        userId: 'u_cand_1',
        courseId: 'course-excel-job-seekers',
        courseSlug: 'excel-for-job-seekers',
        courseTitle: 'Excel for Job Seekers',
        status: 'in_progress' as const,
        progressPercent: 45,
        completedLessonsCount: 5,
        passedQuizzesCount: 2,
        enrolledAt: '2026-11-24T10:00:00Z',
        lastAccessedAt: '2026-11-25T10:00:00Z',
      },
    ];

    const noop = () => {};
    const noopAsync = async () => {};

    for (const item of ALL_ADMIN_NAV_ITEMS) {
      const group = getNavGroupForModule(item.id);
      let el: any;
      switch (group.id) {
        case 'overview':
          el = React.createElement(OverviewSection, {
            activeModule: item.id,
            adminSession: superSession,
            kpis: null,
            users: sampleUsers,
            jobs: sampleJobs,
            employers: sampleEmployers,
            applications: sampleApps,
            hiringEnquiries: [],
            courseEnquiries: [],
            enrolments: sampleEnrolments,
            attempts: [],
            issuedCerts: [],
            certRequests: [],
            activityLogs: [],
            localSupportTicketsCount: 0,
            loading: false,
            onRefresh: noop,
            onNavigateModule: noop,
            onOpenCsvExport: noop,
            onInspectRecord: noop,
          });
          break;
        case 'people':
          el = React.createElement(PeopleSection, {
            activeModule: item.id,
            adminSession: superSession,
            users: sampleUsers,
            candidates: sampleCandidates,
            employers: sampleEmployers,
            enrolments: sampleEnrolments,
            loading: false,
            onRefresh: noopAsync,
            onNotify: noop,
            onInspectRecord: noop,
            onRequestConfirm: noop,
          });
          break;
        case 'recruitment':
          el = React.createElement(RecruitmentSection, {
            activeModule: item.id,
            adminSession: superSession,
            jobs: sampleJobs,
            employers: sampleEmployers,
            applications: sampleApps,
            interviews: [],
            hiringEnquiries: [],
            loading: false,
            onRefresh: noopAsync,
            onNotify: noop,
            onInspectRecord: noop,
            onRequestConfirm: noop,
          });
          break;
        case 'learning':
          el = React.createElement(LearningSection, {
            activeModule: item.id,
            adminSession: superSession,
            liveEnrolments: sampleEnrolments,
            liveAttempts: [],
            liveIssuedCerts: [],
            onNotify: noop,
            onNavigatePublic: noop,
            onNavigateModule: noop,
            onInspectRecord: noop,
            onRequestConfirm: noop,
          });
          break;
        case 'communication':
          el = React.createElement(CommunicationSection, {
            activeModule: item.id,
            adminSession: superSession,
            users: sampleUsers,
            hiringEnquiries: [],
            courseEnquiries: [],
            localSupportTickets: [],
            loading: false,
            onRefresh: noopAsync,
            onUpdateLocalTicketStatus: noop,
            onNotify: noop,
            onInspectRecord: noop,
          });
          break;
        case 'platform':
          el = React.createElement(PlatformSection, {
            activeModule: item.id,
            adminSession: superSession,
            activityLogs: [],
            onRefresh: noopAsync,
            onOpenCsvExport: noop,
            onNotify: noop,
          });
          break;
      }

      const html = renderToStaticMarkup(el);
      assert.ok(
        html && html.length > 50,
        `Expected non-empty rendered markup for admin module "${item.id}" (got ${html?.length ?? 0} chars)`
      );
    }
  });

  it('safely exports only visible non-sensitive table fields, blocks secrets, and neutralizes formula injection', async () => {
    const { buildTableCsvDocument, buildSafeTableCsvFilename } = await import(
      '../../src/utils/csvExport.ts'
    );

    const rows = [
      {
        name: '=HYPERLINK("http://evil.example")',
        email: 'aarav,sharma@example.com',
        status: 'active',
        passwordHash: 'sha256_should_never_export',
        apiKey: 'AIzaSyShouldNeverExport',
        internalNotes: [{ text: 'private note' }],
      },
    ];

    const doc = buildTableCsvDocument(
      [
        {
          key: 'user',
          header: 'User',
          csvColumns: [
            { header: 'Name', value: (r) => r.name },
            { header: 'Email', value: (r) => r.email },
            { header: 'Password Hash', value: (r) => r.passwordHash },
          ],
        },
        { key: 'status', header: 'Status', csvValue: (r) => r.status },
        { key: 'apiKey', header: 'API Key', csvValue: (r) => r.apiKey },
        { key: 'notes', header: 'Internal Notes', csvValue: (r) => r.internalNotes },
        { key: 'actions', header: 'Actions', excludeFromCsv: true, csvValue: () => 'Edit' },
      ],
      rows
    );

    assert.deepEqual(doc.headers, ['Name', 'Email', 'Status']);
    assert.equal(doc.rowCount, 1);
    assert.ok(doc.csvContent.startsWith('\uFEFFName,Email,Status\r\n'));
    // Neutralized formula prefix with single quote and RFC 4180 escaped quotes/commas
    assert.ok(doc.csvContent.includes(`"'=HYPERLINK(""http://evil.example"")"`));
    assert.ok(doc.csvContent.includes('"aarav,sharma@example.com"'));
    assert.equal(doc.csvContent.includes('sha256_should_never_export'), false);
    assert.equal(doc.csvContent.includes('AIzaSyShouldNeverExport'), false);
    assert.equal(doc.csvContent.includes('private note'), false);

    const filename = buildSafeTableCsvFilename('Hiring Enquiries / 2026!');
    assert.match(filename, /^abhi-jobs-hiring-enquiries-2026-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('renders Export to CSV button on Users, Jobs, and Enquiries tables for Super Admin and hides for non-export roles', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { PeopleSection } = await import('../../src/components/admin/sections/PeopleSection.tsx');
    const { RecruitmentSection } = await import(
      '../../src/components/admin/sections/RecruitmentSection.tsx'
    );
    const { CommunicationSection } = await import(
      '../../src/components/admin/sections/CommunicationSection.tsx'
    );

    const superSession = {
      authorized: true,
      uid: 'uid_super',
      email: 'ezanwalmani@gmail.com',
      displayName: 'Super Admin',
      role: 'super_admin' as const,
      source: 'admin_roles_doc' as const,
      permissions: ADMIN_PERMISSION_MATRIX.super_admin,
    };

    const recruiterSession = {
      authorized: true,
      uid: 'uid_recruiter',
      email: 'recruiter@abhi.jobs',
      displayName: 'Recruiter Admin',
      role: 'recruitment_admin' as const,
      source: 'admin_roles_doc' as const,
      permissions: ADMIN_PERMISSION_MATRIX.recruitment_admin,
    };

    const noop = () => {};
    const noopAsync = async () => {};

    const usersHtml = renderToStaticMarkup(
      React.createElement(PeopleSection, {
        activeModule: 'people-users',
        adminSession: superSession,
        users: [],
        candidates: [],
        employers: [],
        enrolments: [],
        loading: false,
        onRefresh: noopAsync,
        onNotify: noop,
        onInspectRecord: noop,
        onRequestConfirm: noop,
      })
    );
    assert.ok(usersHtml.includes('Export to CSV'), 'Expected Export to CSV button on Users table');

    const jobsHtml = renderToStaticMarkup(
      React.createElement(RecruitmentSection, {
        activeModule: 'recruitment-jobs-all',
        adminSession: superSession,
        jobs: [],
        employers: [],
        applications: [],
        interviews: [],
        hiringEnquiries: [],
        loading: false,
        onRefresh: noopAsync,
        onNotify: noop,
        onInspectRecord: noop,
        onRequestConfirm: noop,
      })
    );
    assert.ok(jobsHtml.includes('Export to CSV'), 'Expected Export to CSV button on Jobs table');

    const enquiriesHtml = renderToStaticMarkup(
      React.createElement(CommunicationSection, {
        activeModule: 'comm-contact-enquiries',
        adminSession: superSession,
        users: [],
        hiringEnquiries: [],
        courseEnquiries: [],
        localSupportTickets: [],
        loading: false,
        onRefresh: noopAsync,
        onUpdateLocalTicketStatus: noop,
        onNotify: noop,
        onInspectRecord: noop,
      })
    );
    assert.ok(enquiriesHtml.includes('Export to CSV'), 'Expected Export to CSV button on Enquiries table');

    const recruiterJobsHtml = renderToStaticMarkup(
      React.createElement(RecruitmentSection, {
        activeModule: 'recruitment-jobs-all',
        adminSession: recruiterSession,
        jobs: [],
        employers: [],
        applications: [],
        interviews: [],
        hiringEnquiries: [],
        loading: false,
        onRefresh: noopAsync,
        onNotify: noop,
        onInspectRecord: noop,
        onRequestConfirm: noop,
      })
    );
    assert.equal(
      recruiterJobsHtml.includes('Export to CSV'),
      false,
      'Non-export role should not see Export to CSV button'
    );
  });
});


