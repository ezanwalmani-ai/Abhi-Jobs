import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CANDIDATE_ID_CAPACITY,
  CandidateIdStore,
  isValidFourDigitCandidateId,
} from '../../server/candidateIdStore';
import { CandidateDocumentStore } from '../../server/candidateDocumentStore';
import { mapCandidateProfileDoc } from '../../src/services/recruitmentFirestoreService';
import { PeopleSection } from '../../src/components/admin/sections/PeopleSection';
import { AdminCandidateDetailView } from '../../src/components/admin/AdminCandidateDetailView';
import { Footer } from '../../src/components/Footer';
import { ContactPage } from '../../src/pages/ContactPage';
import { AppProvider } from '../../src/context/AppContext';
import { ADMIN_PERMISSION_MATRIX, type ResolvedAdminSession } from '../../src/services/adminRbacService';
import type { Application, CandidateProfile } from '../../src/types';
import type { AdminUserRecord } from '../../src/services/adminPanelService';

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

const SAMPLE_ADMIN_SESSION: ResolvedAdminSession = {
  authorized: true,
  uid: 'admin_test_uid',
  email: 'ezanwalmani@gmail.com',
  displayName: 'Super Admin',
  role: 'super_admin',
  source: 'bootstrap_super_admin',
  permissions: ADMIN_PERMISSION_MATRIX.super_admin,
};

const SAMPLE_CANDIDATE: CandidateProfile = {
  id: 'cand_uid_101',
  userId: 'cand_uid_101',
  candidateCode: '4829',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@example.com',
  phone: '+91 9876543210',
  altPhone: '+91 9123456789',
  location: 'Bengaluru, Karnataka',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  pinCode: '560001',
  headline: 'Senior Procurement Specialist | SAP MM, Strategic Sourcing',
  about: 'Detail-oriented procurement specialist with 5 years of enterprise vendor management experience.',
  careerObjective: 'Lead global procurement operations for high-growth manufacturing enterprises.',
  currentRole: 'Senior Procurement Executive',
  currentCompany: 'Apex Industrial Systems',
  desiredRole: 'Procurement Manager',
  noticePeriod: '30 Days',
  experienceLevel: 'Mid',
  experienceType: 'experienced',
  workStatus: 'Working',
  yearsOfExperience: 5,
  preferredLocation: 'Bengaluru',
  preferredLocations: ['Bengaluru', 'Pune', 'Hyderabad'],
  preferredJobTitles: ['Procurement Manager', 'Supply Chain Lead'],
  preferredEmploymentTypes: ['Full-time'],
  preferredShift: 'Day Shift',
  jobSearchStatus: 'Actively Looking',
  workPreference: 'Hybrid',
  preferredIndustry: 'Supply Chain & Procurement',
  currentSalary: { amount: 1100000, currency: 'INR' },
  expectedSalary: { min: 1400000, max: 1800000, currency: 'INR' },
  willingToRelocate: true,
  gender: 'Male',
  dob: '1996-05-14',
  availability: '30 Days',
  profileVisibility: 'employers_only',
  availableForOpportunities: true,
  skills: ['SAP MM', 'Vendor Management', 'Excel'],
  detailedSkills: [
    { name: 'SAP MM', proficiency: 'Expert', isPrimary: true, category: 'ERP' },
    { name: 'Vendor Management', proficiency: 'Advanced', isPrimary: true, category: 'Operations' },
    { name: 'Excel', proficiency: 'Advanced', isPrimary: false, category: 'Analytics' },
  ],
  education: [
    {
      id: 'edu_1',
      qualification: 'BBA',
      institution: 'Manipal University Jaipur',
      fieldOfStudy: 'Supply Chain Management',
      courseType: 'Full-time',
      startYear: '2016',
      endYear: '2019',
      grade: '8.4 CGPA',
      status: 'Completed',
    },
  ],
  experiences: [
    {
      id: 'exp_1',
      company: 'Apex Industrial Systems',
      jobTitle: 'Senior Procurement Executive',
      employmentType: 'Full-time',
      industry: 'Manufacturing',
      location: 'Bengaluru',
      startDate: '2022-04',
      endDate: '',
      current: true,
      description: 'Managed RFQ cycles and international IT procurement across 40+ suppliers.',
      achievements: ['Reduced annual procurement spend by 14%'],
      skillsUsed: ['SAP MM', 'Negotiation'],
    },
  ],
  certifications: [
    {
      id: 'cert_1',
      title: 'Certified Supply Chain Professional',
      issuer: 'APICS',
      issueDate: '2023-08',
      credentialId: 'CSCP-99210',
      credentialUrl: 'https://example.com/verify/CSCP-99210',
    },
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'ERP Vendor Scorecard Automation',
      role: 'Lead Analyst',
      startDate: '2023-01',
      endDate: '2023-06',
      description: 'Automated quarterly supplier SLA tracking dashboards.',
      technologies: ['SAP MM', 'Excel'],
      url: 'https://example.com/projects/vendor-scorecard',
    },
  ],
  languages: [
    {
      id: 'lang_1',
      language: 'English',
      proficiency: 'Fluent',
      canRead: true,
      canWrite: true,
      canSpeak: true,
    },
    {
      id: 'lang_2',
      language: 'Hindi',
      proficiency: 'Native',
      canRead: true,
      canWrite: true,
      canSpeak: true,
    },
  ],
  linkedinUrl: 'https://linkedin.com/in/aarav-sharma',
  githubUrl: 'https://github.com/aarav-sharma',
  portfolioUrl: 'https://aaravsharma.example.com',
  personalWebsiteUrl: 'https://notes.aaravsharma.example.com',
  resumeDocId: 'doc_resume_1',
  resumeName: 'Aarav_Sharma_Resume.pdf',
  resumeSize: '210 KB',
  resumeUpdated: '2026-11-20T10:00:00.000Z',
  recruitmentStatus: 'Shortlisted',
  completionPercentage: 95,
  recommendations: [],
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-11-25T12:00:00.000Z',
};

const SAMPLE_USER: AdminUserRecord = {
  id: 'cand_uid_101',
  candidateCode: '4829',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@example.com',
  role: 'job_seeker',
  status: 'active',
  createdAt: '2026-10-01T08:00:00.000Z',
  lastActive: '2026-11-26T09:00:00.000Z',
};

const SAMPLE_APPLICATION: Application = {
  id: 'app_1',
  jobId: 'job_1',
  jobTitle: 'Procurement Manager',
  companyName: 'Meridian Logistics Ltd',
  companyLogo: '',
  candidateId: 'cand_uid_101',
  candidateCode: '4829',
  candidateName: 'Aarav Sharma',
  candidateEmail: 'aarav.sharma@example.com',
  candidatePhone: '+91 9876543210',
  candidateHeadline: 'Senior Procurement Specialist',
  candidateLocation: 'Bengaluru, Karnataka',
  candidateExperienceYears: 5,
  candidateSkills: ['SAP MM', 'Vendor Management'],
  resumeName: 'Aarav_Sharma_Resume.pdf',
  status: 'Shortlisted',
  appliedDate: '2026-11-22',
  appliedAt: '2026-11-22T11:30:00.000Z',
  timeline: [{ status: 'Applied', date: '2026-11-22' }],
};

test('CandidateIdStore generates strictly unique, immutable, non-sequential 4-digit IDs (1000-9999)', () => {
  const dir = createTempDir('abhi-cand-id-');
  const filePath = path.join(dir, 'registry.json');
  const store = new CandidateIdStore(filePath);

  const assigned = new Set<string>();
  const sequence: number[] = [];

  for (let i = 0; i < 250; i += 1) {
    const uid = `candidate_uid_${i}`;
    const res = store.assignCandidateId(uid);
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(isValidFourDigitCandidateId(res.candidateCode), true);
      const numeric = Number(res.candidateCode);
      assert.ok(numeric >= 1000 && numeric <= 9999, `ID ${numeric} out of 1000-9999 range`);
      assert.equal(assigned.has(res.candidateCode), false, `Duplicate ID ${res.candidateCode}`);
      assigned.add(res.candidateCode);
      sequence.push(numeric);

      // Re-requesting for the same UID must return the exact same immutable ID
      const repeat = store.assignCandidateId(uid);
      assert.equal(repeat.ok, true);
      if (repeat.ok) {
        assert.equal(repeat.candidateCode, res.candidateCode);
        assert.equal(repeat.alreadyAssigned, true);
      }
    }
  }

  // Must not be sequential (1000, 1001, 1002...)
  const monotonicAsc = sequence.every((n, idx) => idx === 0 || n === sequence[idx - 1] + 1);
  assert.equal(monotonicAsc, false, 'Candidate IDs must be randomly generated, not sequential');

  // Verify persistence across restarts
  const reloaded = new CandidateIdStore(filePath);
  assert.equal(reloaded.getCandidateCodeForUid('candidate_uid_0'), String(sequence[0]));
  assert.equal(reloaded.getCapacityStats().usedCount, 250);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('CandidateIdStore enforces capacity exhaustion safely at 9,000 IDs without duplicates or format drift', () => {
  const dir = createTempDir('abhi-cand-cap-');
  const filePath = path.join(dir, 'registry.json');

  // Pre-seed all 9,000 IDs (1000-9999) as already assigned
  const uidToCode: Record<string, string> = {};
  const codeToRecord: Record<string, { candidateCode: string; userUid: string; assignedAt: string }> = {};
  for (let n = 1000; n <= 9999; n += 1) {
    const code = String(n);
    const uid = `seeded_uid_${n}`;
    uidToCode[uid] = code;
    codeToRecord[code] = { candidateCode: code, userUid: uid, assignedAt: '2026-01-01T00:00:00.000Z' };
  }
  fs.writeFileSync(
    filePath,
    JSON.stringify({ uidToCode, codeToRecord, capacityAlerts: [] }),
    'utf8'
  );

  const store = new CandidateIdStore(filePath);
  const statsBefore = store.getCapacityStats();
  assert.equal(statsBefore.usedCount, CANDIDATE_ID_CAPACITY);
  assert.equal(statsBefore.remainingCount, 0);
  assert.equal(statsBefore.exhausted, true);

  // Attempting to assign a 9,001st candidate must fail safely with CANDIDATE_ID_CAPACITY_EXHAUSTED
  const overflow = store.assignCandidateId('brand_new_uid_9001');
  assert.equal(overflow.ok, false);
  if (!overflow.ok) {
    assert.equal(overflow.errorCode, 'CANDIDATE_ID_CAPACITY_EXHAUSTED');
  }
  assert.ok(store.getCapacityStats().capacityAlerts.length >= 1, 'Expected capacity alert recorded');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('CandidateDocumentStore validates file signatures, versions uploads, and blocks path traversal', () => {
  const dir = createTempDir('abhi-cand-docs-');
  const docStore = new CandidateDocumentStore(dir);

  const pdfV1 = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF', 'ascii');
  const pdfV2 = Buffer.from('%PDF-1.7\n%updated resume version 2\n%%EOF', 'ascii');

  const first = docStore.saveDocument({
    candidateUid: 'cand_uid_101',
    uploadedByUid: 'cand_uid_101',
    originalFilename: 'Aarav_Resume_v1.pdf',
    category: 'resume',
    buffer: pdfV1,
  });
  assert.equal(first.versionNumber, 1);
  assert.equal(first.isLatest, true);

  const second = docStore.saveDocument({
    candidateUid: 'cand_uid_101',
    uploadedByUid: 'cand_uid_101',
    originalFilename: 'Aarav_Resume_v2.pdf',
    category: 'resume',
    buffer: pdfV2,
  });
  assert.equal(second.versionNumber, 2);
  assert.equal(second.isLatest, true);

  const list = docStore.listDocuments('cand_uid_101');
  assert.equal(list.length, 2);
  assert.equal(list.find((d) => d.id === second.id)?.isLatest, true);
  assert.equal(list.find((d) => d.id === first.id)?.isLatest, false);

  // Spoofed file signature must be rejected
  assert.throws(
    () =>
      docStore.saveDocument({
        candidateUid: 'cand_uid_101',
        uploadedByUid: 'cand_uid_101',
        originalFilename: 'malicious.pdf',
        category: 'resume',
        buffer: Buffer.from('<script>alert(1)</script>', 'utf8'),
      }),
    /does not match/i
  );

  // Path traversal UID must be rejected
  assert.throws(
    () => docStore.listDocuments('../../etc'),
    /Invalid identifier segment/i
  );

  fs.rmSync(dir, { recursive: true, force: true });
});

test('mapCandidateProfileDoc preserves complete candidate fields A-K and 4-digit Candidate ID', () => {
  const mapped = mapCandidateProfileDoc('cand_uid_101', SAMPLE_CANDIDATE as unknown as Record<string, any>);
  assert.equal(mapped.candidateCode, '4829');
  assert.equal(mapped.altPhone, '+91 9123456789');
  assert.equal(mapped.country, 'India');
  assert.equal(mapped.pinCode, '560001');
  assert.equal(mapped.currentCompany, 'Apex Industrial Systems');
  assert.equal(mapped.noticePeriod, '30 Days');
  assert.equal(mapped.careerObjective, SAMPLE_CANDIDATE.careerObjective);
  assert.deepEqual(mapped.preferredJobTitles, ['Procurement Manager', 'Supply Chain Lead']);
  assert.deepEqual(mapped.preferredLocations, ['Bengaluru', 'Pune', 'Hyderabad']);
  assert.equal(mapped.willingToRelocate, true);
  assert.equal(mapped.personalWebsiteUrl, 'https://notes.aaravsharma.example.com');
  assert.equal(mapped.resumeDocId, 'doc_resume_1');
  assert.equal(mapped.recruitmentStatus, 'Shortlisted');
  assert.equal(mapped.experiences[0].industry, 'Manufacturing');
  assert.equal(mapped.education[0].courseType, 'Full-time');
  assert.equal(mapped.certifications[0].credentialId, 'CSCP-99210');
});

test('PeopleSection Candidate Management renders all 13 columns, filters, and 4-digit Candidate ID', () => {
  const html = renderToStaticMarkup(
    React.createElement(PeopleSection, {
      activeModule: 'people-candidates',
      adminSession: SAMPLE_ADMIN_SESSION,
      users: [SAMPLE_USER],
      candidates: [SAMPLE_CANDIDATE],
      employers: [],
      enrolments: [],
      applications: [SAMPLE_APPLICATION],
      interviews: [],
      attempts: [],
      issuedCerts: [],
      loading: false,
      onRefresh: async () => {},
      onNotify: () => {},
      onInspectRecord: () => {},
      onRequestConfirm: () => {},
      onNavigateModule: () => {},
    })
  );

  for (const heading of [
    'Candidate ID',
    'Full Name',
    'Email Address',
    'Mobile Number',
    'Current Location',
    'Professional Headline',
    'Total Experience',
    'Profile Completion',
    'Resume Status',
    'Registered',
    'Last Updated',
    'Account Status',
    'Actions',
  ]) {
    assert.ok(html.includes(heading), `Missing Candidate Management column: ${heading}`);
  }
  assert.ok(html.includes('4829'), 'Candidate ID 4829 should render in Candidate Management table');
  assert.ok(html.includes('Aarav Sharma'), 'Candidate full name should render');
  assert.ok(html.includes('View Profile'), 'View Profile action button should render');
  assert.ok(html.includes('All Locations'), 'Location filter should render');
  assert.ok(html.includes('All Experience'), 'Experience filter should render');
  assert.ok(html.includes('All Completion'), 'Profile completion filter should render');
});

test('AdminCandidateDetailView renders all sections A-K, Application History, and Admin Controls', () => {
  const html = renderToStaticMarkup(
    React.createElement(AdminCandidateDetailView, {
      candidate: SAMPLE_CANDIDATE,
      userRecord: SAMPLE_USER,
      adminSession: SAMPLE_ADMIN_SESSION,
      applications: [SAMPLE_APPLICATION],
      interviews: [],
      enrolments: [],
      attempts: [],
      issuedCerts: [],
      onBack: () => {},
      onRefresh: async () => {},
      onNotify: () => {},
      onRequestConfirm: () => {},
      onNavigateModule: () => {},
    })
  );

  for (const label of [
    'ABHI JOBS Candidate ID',
    '4829',
    'Personal &amp; Contact Details',
    'Professional Summary',
    'Employment History',
    'Education',
    'Skills &amp; Competencies',
    'Resume &amp; Documents',
    'Certifications &amp; Courses',
    'Projects &amp; Portfolio',
    'Languages',
    'Career Preferences',
    'Professional Links',
    'Application History',
    'Career Assessment Results',
    'Learning Progress &amp; Certificates',
    'Private Internal Recruitment Notes',
    'Meridian Logistics Ltd',
    'Apex Industrial Systems',
    'Manipal University Jaipur',
    '560001',
  ]) {
    assert.ok(html.includes(label), `AdminCandidateDetailView missing expected content: ${label}`);
  }
});

test('Footer and ContactPage include clickable mailto:enquireabhijobs@gmail.com and preserve social links', () => {
  const footerHtml = renderToStaticMarkup(React.createElement(Footer, { navigate: () => {} }));
  assert.ok(footerHtml.includes('mailto:enquireabhijobs@gmail.com'), 'Footer missing mailto link');
  assert.ok(footerHtml.includes('enquireabhijobs@gmail.com'), 'Footer missing email text');
  assert.ok(
    footerHtml.includes('https://www.instagram.com/abhijobsofficial/'),
    'Footer missing Instagram URL'
  );
  assert.ok(
    footerHtml.includes('https://www.linkedin.com/company/abhi-jobs/'),
    'Footer missing LinkedIn URL'
  );

  const contactHtml = renderToStaticMarkup(
    React.createElement(
      AppProvider,
      null,
      React.createElement(ContactPage, { navigate: () => {} })
    )
  );
  assert.ok(contactHtml.includes('mailto:enquireabhijobs@gmail.com'), 'ContactPage missing mailto link');
  assert.ok(contactHtml.includes('enquireabhijobs@gmail.com'), 'ContactPage missing email text');
});
