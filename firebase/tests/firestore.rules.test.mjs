import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  collectionGroup,
  query,
  where,
  writeBatch,
  serverTimestamp,
  terminate,
} from 'firebase/firestore';

const ROOT = process.cwd();
const appletConfig = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'firebase-applet-config.json'), 'utf8')
);

// Strictly offline demo project ID (NEVER connects to production geometric-centaur-c6pck)
const PROJECT_ID = 'demo-abhi-jobs';
const NAMED_DB_ID = appletConfig.firestoreDatabaseId;
const [EMULATOR_HOST, EMULATOR_PORT_STR] = (
  process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085'
).split(':');
const EMULATOR_PORT = Number(EMULATOR_PORT_STR || 8085);
const RULES_SOURCE = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');

const activeApps = [];
let appCounter = 0;

function createDb(tokenOptions = null) {
  const appName = `test-app-${++appCounter}`;
  const app = initializeApp({ projectId: PROJECT_ID }, appName);
  const db = getFirestore(app, NAMED_DB_ID);
  if (tokenOptions) {
    connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORT, {
      mockUserToken: tokenOptions,
    });
  } else {
    connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORT);
  }
  activeApps.push({ app, db });
  return db;
}

function unauthDb() {
  return createDb(null);
}

function authDb(uid, { email = `${uid}@example.com`, email_verified = true } = {}) {
  return createDb({
    user_id: uid,
    sub: uid,
    email,
    email_verified,
  });
}

// Emulator owner bypass (ONLY for local test fixture seeding against demo-abhi-jobs)
function adminSeedDb() {
  return createDb('owner');
}

async function clearNamedDatabase() {
  const url = `http://${EMULATOR_HOST}:${EMULATOR_PORT}/emulator/v1/projects/${PROJECT_ID}/databases/${encodeURIComponent(NAMED_DB_ID)}/documents`;
  const resp = await fetch(url, { method: 'DELETE' });
  if (!resp.ok) {
    throw new Error(`Failed to clear named database ${NAMED_DB_ID}: ${await resp.text()}`);
  }
}

async function loadRulesIntoNamedDatabase() {
  // Explicitly compile & deploy rules into the local emulator so any syntax or
  // compilation issue fails immediately and deterministically.
  const url = `http://${EMULATOR_HOST}:${EMULATOR_PORT}/emulator/v1/projects/${PROJECT_ID}:securityRules`;
  const resp = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rules: {
        files: [{ name: 'firestore.rules', content: RULES_SOURCE }],
      },
    }),
  });
  const body = await resp.text();
  if (!resp.ok) {
    throw new Error(
      `Firestore rules failed to compile in emulator for DB ${NAMED_DB_ID} (HTTP ${resp.status}):\n${body}`
    );
  }
  if (body) {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed.issues) && parsed.issues.length > 0) {
      const errors = parsed.issues.filter((i) => i.severity === 'ERROR');
      if (errors.length > 0) {
        throw new Error(
          `Firestore rules compilation errors:\n${JSON.stringify(errors, null, 2)}`
        );
      }
    }
  }
}

// Test actor UIDs
const UID_SUPER_ADMIN = 'uid_super_admin';
const UID_RECRUIT_ADMIN = 'uid_recruit_admin';
const UID_COURSE_ADMIN = 'uid_course_admin';
const UID_CONTENT_ADMIN = 'uid_content_admin';
const UID_SUPPORT_ADMIN = 'uid_support_admin';
const UID_REVOKED_ADMIN = 'uid_revoked_admin';
const UID_LEGACY_ADMIN = 'uid_legacy_admin';
const UID_CAND_1 = 'uid_cand_1';
const UID_CAND_2 = 'uid_cand_2';
const UID_SUSPENDED_USER = 'uid_suspended_user';
const UID_EMP_VERIFIED = 'uid_emp_verified';
const UID_EMP_PENDING = 'uid_emp_pending';
const UID_EMP_SUSPENDED = 'uid_emp_suspended';

function validJobPayload(overrides = {}) {
  return {
    id: 'job_101',
    employerId: UID_EMP_VERIFIED,
    employerOwnerUid: UID_EMP_VERIFIED,
    companyName: 'Acme Analytics',
    companyLogo: 'https://example.com/logo.png',
    title: 'Data Analyst',
    department: 'Analytics',
    industry: 'Technology',
    location: 'Bengaluru',
    employmentType: 'Full-time',
    workMode: 'Hybrid',
    experienceLevel: 'Junior',
    minExperienceYears: 1,
    salary: { min: 600000, max: 900000, currency: 'INR', period: 'yearly' },
    overview: 'Analyze business datasets using Excel and SQL.',
    responsibilities: ['Build dashboards'],
    requirements: ['Excel proficiency'],
    preferredSkills: ['Excel', 'SQL'],
    benefits: ['Health Insurance'],
    status: 'published',
    applicantsCount: 0,
    viewsCount: 0,
    isVerifiedCompany: true,
    featured: false,
    postedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function validApplicationPayload(overrides = {}) {
  return {
    id: 'job_101__uid_cand_1',
    jobId: 'job_101',
    employerId: UID_EMP_VERIFIED,
    employerOwnerUid: UID_EMP_VERIFIED,
    jobTitle: 'Data Analyst',
    companyName: 'Acme Analytics',
    candidateId: UID_CAND_1,
    candidateName: 'Asha Verma',
    candidateEmail: 'asha@example.com',
    candidatePhone: '+919876543210',
    candidateHeadline: 'Junior Data Analyst',
    candidateLocation: 'Bengaluru',
    candidateExperienceYears: 2,
    candidateSkills: ['Excel', 'SQL'],
    resumeName: 'Asha_Verma_Resume.pdf',
    coverNote: 'Excited to contribute.',
    status: 'Applied',
    timeline: [{ status: 'Applied', date: '2026-11-25' }],
    appliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function validCandidatePayload(uid, overrides = {}) {
  return {
    id: uid,
    userId: uid,
    name: 'Asha Verma',
    email: 'asha@example.com',
    phone: '+919876543210',
    location: 'Bengaluru',
    headline: 'Junior Data Analyst',
    experienceLevel: 'Junior',
    yearsOfExperience: 2,
    workPreference: 'Hybrid',
    availability: 'Immediate',
    profileVisibility: 'employers_only',
    availableForOpportunities: true,
    skills: ['Excel', 'SQL'],
    education: [{ degree: 'B.Com', institution: 'Bangalore University' }],
    experiences: [{ jobTitle: 'MIS Executive', company: 'Beta Corp' }],
    certifications: [],
    completionPercentage: 85,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

async function seedBaseFixtures() {
  const seed = adminSeedDb();

  // 5-role RBAC fixtures + revoked admin + legacy admin
  await setDoc(doc(seed, 'admin_roles', UID_SUPER_ADMIN), {
    uid: UID_SUPER_ADMIN,
    email: 'super@abhijobs.test',
    displayName: 'Super Admin',
    role: 'super_admin',
    status: 'active',
    assignedBy: UID_SUPER_ADMIN,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'admin_roles', UID_RECRUIT_ADMIN), {
    uid: UID_RECRUIT_ADMIN,
    email: 'recruit@abhijobs.test',
    displayName: 'Recruitment Admin',
    role: 'recruitment_admin',
    status: 'active',
    assignedBy: UID_SUPER_ADMIN,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'admin_roles', UID_COURSE_ADMIN), {
    uid: UID_COURSE_ADMIN,
    email: 'course@abhijobs.test',
    displayName: 'Course Admin',
    role: 'course_admin',
    status: 'active',
    assignedBy: UID_SUPER_ADMIN,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'admin_roles', UID_CONTENT_ADMIN), {
    uid: UID_CONTENT_ADMIN,
    email: 'content@abhijobs.test',
    displayName: 'Content Admin',
    role: 'content_admin',
    status: 'active',
    assignedBy: UID_SUPER_ADMIN,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'admin_roles', UID_SUPPORT_ADMIN), {
    uid: UID_SUPPORT_ADMIN,
    email: 'support@abhijobs.test',
    displayName: 'Support Admin',
    role: 'support_admin',
    status: 'active',
    assignedBy: UID_SUPER_ADMIN,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'admin_roles', UID_REVOKED_ADMIN), {
    uid: UID_REVOKED_ADMIN,
    email: 'revoked@abhijobs.test',
    displayName: 'Revoked Admin',
    role: 'super_admin',
    status: 'revoked',
    assignedBy: UID_SUPER_ADMIN,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'admins', UID_LEGACY_ADMIN), {
    uid: UID_LEGACY_ADMIN,
    active: true,
  });

  // Users (including a suspended user)
  await setDoc(doc(seed, 'users', UID_CAND_1), {
    id: UID_CAND_1,
    name: 'Asha Verma',
    email: 'asha@example.com',
    role: 'job_seeker',
    status: 'active',
    createdAt: '2026-11-01T00:00:00Z',
    lastActive: 'Just now',
  });
  await setDoc(doc(seed, 'users', UID_SUSPENDED_USER), {
    id: UID_SUSPENDED_USER,
    name: 'Suspended User',
    email: 'suspended@example.com',
    role: 'job_seeker',
    status: 'suspended',
    createdAt: '2026-11-01T00:00:00Z',
    lastActive: 'Earlier',
  });

  // Candidate 1 private profile + opt-in directory + private resume
  await setDoc(doc(seed, 'candidates', UID_CAND_1), validCandidatePayload(UID_CAND_1));
  await setDoc(doc(seed, 'candidate_directory', UID_CAND_1), {
    uid: UID_CAND_1,
    displayName: 'Asha Verma',
    headline: 'Junior Data Analyst',
    location: 'Bengaluru',
    experienceLevel: 'Junior',
    yearsOfExperience: 2,
    workPreference: 'Hybrid',
    availability: 'Immediate',
    skills: ['Excel', 'SQL'],
    availableForOpportunities: true,
    completionPercentage: 85,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'users', UID_CAND_1, 'resumes', 'res_1'), {
    id: 'res_1',
    userId: UID_CAND_1,
    title: 'Data Analyst Resume',
    fullName: 'Asha Verma',
    email: 'asha@example.com',
    phone: '+919876543210',
    template: 'classic-professional',
    skills: ['Excel', 'SQL'],
    experiences: [],
    education: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Employers (verified, pending, suspended) + private contact
  await setDoc(doc(seed, 'employers', UID_EMP_VERIFIED), {
    id: UID_EMP_VERIFIED,
    ownerUid: UID_EMP_VERIFIED,
    companyName: 'Acme Analytics',
    industry: 'Technology',
    companySize: '50-200',
    location: 'Bengaluru',
    about: 'Analytics consultancy.',
    benefits: ['Health Insurance'],
    verificationStatus: 'verified',
    verified: true,
    verifiedBy: UID_RECRUIT_ADMIN,
    verifiedAt: '2026-11-20T00:00:00Z',
    activeJobsCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(
    doc(seed, 'employers', UID_EMP_VERIFIED, 'private_contacts', 'default'),
    {
      id: 'default',
      employerId: UID_EMP_VERIFIED,
      ownerUid: UID_EMP_VERIFIED,
      recruiterName: 'Rohan HR',
      recruiterRole: 'Lead Recruiter',
      recruiterEmail: 'hr@acme.example.com',
      recruiterPhone: '+919900011223',
      updatedAt: serverTimestamp(),
    }
  );
  await setDoc(doc(seed, 'employers', UID_EMP_PENDING), {
    id: UID_EMP_PENDING,
    ownerUid: UID_EMP_PENDING,
    companyName: 'Pending Labs',
    industry: 'Software',
    companySize: '1-10',
    location: 'Pune',
    about: 'Early-stage startup.',
    benefits: [],
    verificationStatus: 'pending',
    verified: false,
    activeJobsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'employers', UID_EMP_SUSPENDED), {
    id: UID_EMP_SUSPENDED,
    ownerUid: UID_EMP_SUSPENDED,
    companyName: 'Suspended Org',
    industry: 'Retail',
    companySize: '10-50',
    location: 'Delhi',
    about: 'Suspended.',
    benefits: [],
    verificationStatus: 'suspended',
    verified: false,
    activeJobsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Jobs (1 published, 1 draft)
  await setDoc(doc(seed, 'jobs', 'job_101'), validJobPayload());
  await setDoc(
    doc(seed, 'jobs', 'job_draft_1'),
    validJobPayload({
      id: 'job_draft_1',
      employerId: UID_EMP_PENDING,
      employerOwnerUid: UID_EMP_PENDING,
      companyName: 'Pending Labs',
      status: 'draft',
      isVerifiedCompany: false,
    })
  );

  // Existing Application + private recruiter internal note + terminal Selected application
  await setDoc(doc(seed, 'applications', 'app_1'), validApplicationPayload({ id: 'app_1' }));
  await setDoc(
    doc(seed, 'applications', 'app_1', 'internal_notes', 'note_1'),
    {
      id: 'note_1',
      applicationId: 'app_1',
      authorUid: UID_EMP_VERIFIED,
      authorName: 'Rohan HR',
      authorRole: 'employer',
      text: 'Strong Excel portfolio; shortlist for technical round.',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );
  await setDoc(
    doc(seed, 'applications', 'app_selected'),
    validApplicationPayload({ id: 'app_selected', status: 'Selected' })
  );
  await setDoc(
    doc(seed, 'applications', 'app_withdrawn'),
    validApplicationPayload({ id: 'app_withdrawn', status: 'Withdrawn' })
  );

  // CMS & Public settings & Enquiries & Audit log
  await setDoc(doc(seed, 'website_content', 'home_hero'), {
    key: 'home_hero',
    section: 'homepage',
    title: 'Find Verified Jobs',
    body: 'Discover curated opportunities across India.',
    sortOrder: 1,
    status: 'published',
    updatedBy: UID_CONTENT_ADMIN,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'website_content', 'draft_promo'), {
    key: 'draft_promo',
    section: 'announcement',
    title: 'Upcoming Launch',
    body: 'Draft notice.',
    sortOrder: 2,
    status: 'draft',
    updatedBy: UID_CONTENT_ADMIN,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'public_settings', 'social_links'), {
    key: 'social_links',
    label: 'Official Social Links',
    value: { instagram: 'https://instagram.com/abhijobs', linkedin: 'https://linkedin.com/company/abhijobs' },
    updatedBy: UID_CONTENT_ADMIN,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'hiring_enquiries', 'enq_h1'), {
    id: 'enq_h1',
    companyName: 'Delta Corp',
    contactPerson: 'Meera Nair',
    businessEmail: 'meera@delta.example.com',
    phoneNumber: '+919800000001',
    jobTitle: 'Accountant',
    vacancies: 2,
    jobLocation: 'Mumbai',
    additionalRequirements: 'Tally + Excel required',
    status: 'New',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'course_enquiries', 'enq_c1'), {
    id: 'enq_c1',
    courseId: 'excel_for_job_seekers',
    courseTitle: 'Excel for Job Seekers',
    name: 'Kiran Rao',
    email: 'kiran@example.com',
    phone: '+919800000002',
    status: 'New',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'admin_activity_logs', 'log_server_1'), {
    id: 'log_server_1',
    actorUid: UID_SUPER_ADMIN,
    actorEmail: 'super@abhijobs.test',
    actorRole: 'super_admin',
    category: 'system',
    action: 'seed_test',
    targetCollection: 'system',
    targetId: 'init',
    summary: 'Seeded server log fixture',
    createdAt: serverTimestamp(),
  });

  // Learn with ABHI fixtures (Excel for Job Seekers + quiz_configs + existing HMAC cert)
  await setDoc(doc(seed, 'learning_courses', 'excel_for_job_seekers'), {
    id: 'excel_for_job_seekers',
    slug: 'excel-for-job-seekers',
    categoryId: 'office_productivity',
    categoryName: 'Office Productivity',
    title: 'Excel for Job Seekers',
    shortDescription: 'Master practical Excel skills.',
    fullDescription: '12-module job-ready Excel curriculum.',
    level: 'Beginner',
    estimatedDuration: '12 hours',
    isFree: true,
    sequentialUnlock: true,
    passPercentage: 70,
    certificateTemplateId: 'default_abhi_certificate',
    status: 'published',
    moduleCount: 12,
    courseIntroduction: { summary: 'Intro' },
    whatYouWillLearn: ['Formulas', 'PivotTables'],
    skillsDeveloped: ['Excel', 'Reporting'],
    updatedBy: UID_COURSE_ADMIN,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'learning_courses', 'draft_course'), {
    id: 'draft_course',
    slug: 'draft-course',
    categoryId: 'office_productivity',
    categoryName: 'Office Productivity',
    title: 'Unpublished Course',
    shortDescription: 'Draft.',
    fullDescription: 'Draft.',
    level: 'Beginner',
    estimatedDuration: '4 hours',
    isFree: true,
    sequentialUnlock: false,
    passPercentage: 70,
    certificateTemplateId: 'default_abhi_certificate',
    status: 'draft',
    moduleCount: 1,
    courseIntroduction: { summary: 'Draft' },
    whatYouWillLearn: [],
    skillsDeveloped: [],
    updatedBy: UID_COURSE_ADMIN,
    updatedAt: serverTimestamp(),
  });
  await setDoc(
    doc(seed, 'learning_courses', 'excel_for_job_seekers', 'modules', 'excel_m01_fundamentals'),
    {
      id: 'excel_m01_fundamentals',
      courseId: 'excel_for_job_seekers',
      order: 1,
      title: 'Module 1: Fundamentals',
      summary: 'Excel workspace and basics.',
      estimatedMinutes: 45,
      quizRequired: true,
      passPercentage: 70,
      updatedBy: UID_COURSE_ADMIN,
      updatedAt: serverTimestamp(),
    }
  );
  await setDoc(
    doc(seed, 'learning_courses', 'excel_for_job_seekers', 'lessons', 'excel_m01_lesson_01'),
    {
      id: 'excel_m01_lesson_01',
      courseId: 'excel_for_job_seekers',
      moduleId: 'excel_m01_fundamentals',
      title: 'Lesson 1: Navigating Excel',
      description: 'Cells, rows, and columns.',
      writtenContent: 'Full structured lesson text.',
      attachments: [],
      order: 1,
      estimatedMinutes: 15,
      updatedBy: UID_COURSE_ADMIN,
      updatedAt: serverTimestamp(),
    }
  );
  await setDoc(
    doc(seed, 'learning_courses', 'excel_for_job_seekers', 'quiz_configs', 'quiz_m01'),
    {
      id: 'quiz_m01',
      courseId: 'excel_for_job_seekers',
      assessmentType: 'module_quiz',
      moduleId: 'excel_m01_fundamentals',
      title: 'Module 1 Quiz',
      passPercentage: 70,
      questionCount: 5,
      randomizeOrder: true,
      requiredForCompletion: true,
      questions: [{ id: 'q1', prompt: 'What starts a formula?', correctIndex: 0 }],
      updatedBy: UID_COURSE_ADMIN,
      updatedAt: serverTimestamp(),
    }
  );
  await setDoc(doc(seed, 'certificate_templates', 'default_abhi_certificate'), {
    id: 'default_abhi_certificate',
    name: 'ABHI Default',
    organizationName: 'ABHI JOBS',
    certificateTitle: 'Certificate of Completion',
    subtitle: 'Awarded for successfully completing',
    signatoryName: 'Abhi Director',
    signatoryDesignation: 'Program Lead',
    primaryColor: '#102B4E',
    accentColor: '#E89B2D',
    isDefault: true,
    updatedBy: UID_COURSE_ADMIN,
    updatedAt: serverTimestamp(),
  });
  // Existing server_hmac certificate & public verification record
  await setDoc(doc(seed, 'public_certificates', 'ABHI-2026-HMAC0001'), {
    certificateId: 'ABHI-2026-HMAC0001',
    candidateName: 'Asha Verma',
    courseId: 'excel_for_job_seekers',
    courseTitle: 'Excel for Job Seekers',
    issueDate: '2026-10-01',
    status: 'valid',
    issuanceMethod: 'server_hmac',
    issuedAt: serverTimestamp(),
  });
  await setDoc(
    doc(seed, 'users', UID_CAND_1, 'certificates', 'legacy_course_hmac'),
    {
      certificateId: 'ABHI-2026-HMAC0001',
      userId: UID_CAND_1,
      candidateName: 'Asha Verma',
      courseId: 'legacy_course_hmac',
      courseSlug: 'legacy-course',
      courseTitle: 'Excel for Job Seekers',
      completionDate: '2026-10-01',
      finalAssessmentScore: 92,
      finalAttemptId: 'attempt_001',
      templateId: 'default_abhi_certificate',
      status: 'valid',
      verificationSignature: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
      issuedAt: serverTimestamp(),
    }
  );
  await setDoc(doc(seed, 'users', UID_CAND_1, 'assessment_attempts', 'attempt_001'), {
    id: 'attempt_001',
    userId: UID_CAND_1,
    courseId: 'excel_for_job_seekers',
    courseSlug: 'excel-for-job-seekers',
    courseTitle: 'Excel for Job Seekers',
    assessmentType: 'final_assessment',
    assessmentTitle: 'Final Assessment',
    attemptNumber: 1,
    totalQuestions: 10,
    correctAnswers: 9,
    incorrectAnswers: 1,
    scorePercent: 90,
    passPercentage: 70,
    passed: true,
    answers: { q1: 0 },
    questionResults: [{ id: 'q1', correct: true }],
    verificationSignature: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    submittedAt: serverTimestamp(),
  });
  await setDoc(doc(seed, 'test', 'connection'), { ok: true });
}

describe(`ABHI JOBS Phase 2B Firestore Security Rules (Named DB: ${NAMED_DB_ID})`, () => {
  before(async () => {
    await loadRulesIntoNamedDatabase();
    await clearNamedDatabase();
    await seedBaseFixtures();
  });

  after(async () => {
    for (const { app, db } of activeApps) {
      await terminate(db).catch(() => {});
      await deleteApp(app).catch(() => {});
    }
  });

  // ===========================================================================
  // SECTION 1: THE 16 ADVERSARIAL SCENARIOS FROM firebase/SECURITY_SPEC.md
  // ===========================================================================
  describe('Adversarial Scenarios (#1–#16 from SECURITY_SPEC.md)', () => {
    it('#1 Admin Self-Escalation: candidate cannot create /admin_roles/{uid}', async () => {
      const db = authDb(UID_CAND_1);
      await assertFails(
        setDoc(doc(db, 'admin_roles', UID_CAND_1), {
          uid: UID_CAND_1,
          email: 'asha@example.com',
          displayName: 'Asha',
          role: 'super_admin',
          status: 'active',
          assignedBy: UID_CAND_1,
          assignedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('#2 User Profile Role Escalation: candidate cannot create /users/{uid} with role=admin', async () => {
      const db = authDb('uid_new_attacker');
      await assertFails(
        setDoc(doc(db, 'users', 'uid_new_attacker'), {
          id: 'uid_new_attacker',
          name: 'Attacker',
          email: 'attacker@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2026-11-25T00:00:00Z',
        })
      );
    });

    it('#3 Unverified Email Spoofing: unverified ezanwalmani@gmail.com denied admin reads & writes', async () => {
      const spoofDb = authDb('uid_spoof_admin', {
        email: 'ezanwalmani@gmail.com',
        email_verified: false,
      });
      await assertFails(
        getDoc(doc(spoofDb, 'learning_courses', 'excel_for_job_seekers', 'quiz_configs', 'quiz_m01'))
      );
      await assertFails(
        setDoc(doc(spoofDb, 'admin_roles', 'uid_spoof_admin'), {
          uid: 'uid_spoof_admin',
          email: 'ezanwalmani@gmail.com',
          displayName: 'Spoof',
          role: 'super_admin',
          status: 'active',
          assignedBy: 'uid_spoof_admin',
          assignedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('#4 Employer Self-Approval: employer cannot register as verified or self-approve on update', async () => {
      const newEmpDb = authDb('uid_emp_self_approve');
      await assertFails(
        setDoc(doc(newEmpDb, 'employers', 'uid_emp_self_approve'), {
          id: 'uid_emp_self_approve',
          ownerUid: 'uid_emp_self_approve',
          companyName: 'Fake Verified Co',
          industry: 'Tech',
          companySize: '1-10',
          location: 'Mumbai',
          about: 'Attempted self-verify',
          benefits: [],
          verificationStatus: 'verified',
          verified: true,
          activeJobsCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );

      const pendingEmpDb = authDb(UID_EMP_PENDING);
      await assertFails(
        updateDoc(doc(pendingEmpDb, 'employers', UID_EMP_PENDING), {
          verificationStatus: 'verified',
          verified: true,
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('#5 Unverified Employer Publishing Job: pending employer denied published job, allowed draft only', async () => {
      const pendingEmpDb = authDb(UID_EMP_PENDING);
      await assertFails(
        setDoc(
          doc(pendingEmpDb, 'jobs', 'job_unverified_pub'),
          validJobPayload({
            id: 'job_unverified_pub',
            employerId: UID_EMP_PENDING,
            employerOwnerUid: UID_EMP_PENDING,
            companyName: 'Pending Labs',
            status: 'published',
            isVerifiedCompany: true,
          })
        )
      );
      await assertSucceeds(
        setDoc(
          doc(pendingEmpDb, 'jobs', 'job_pending_draft_ok'),
          validJobPayload({
            id: 'job_pending_draft_ok',
            employerId: UID_EMP_PENDING,
            employerOwnerUid: UID_EMP_PENDING,
            companyName: 'Pending Labs',
            status: 'draft',
            isVerifiedCompany: false,
            featured: false,
          })
        )
      );
    });

    it('#6 Job Counter & Featured Tampering: candidate and employer cannot alter applicantsCount/viewsCount/featured', async () => {
      const candDb = authDb(UID_CAND_1);
      await assertFails(
        updateDoc(doc(candDb, 'jobs', 'job_101'), {
          applicantsCount: 999,
          updatedAt: serverTimestamp(),
        })
      );

      const empDb = authDb(UID_EMP_VERIFIED);
      await assertFails(
        updateDoc(doc(empDb, 'jobs', 'job_101'), {
          applicantsCount: 50,
          updatedAt: serverTimestamp(),
        })
      );
      await assertFails(
        updateDoc(doc(empDb, 'jobs', 'job_101'), {
          featured: true,
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('#7 Cross-User Candidate PII & Resume Read: denied to other candidates and employers', async () => {
      const cand2Db = authDb(UID_CAND_2);
      const empDb = authDb(UID_EMP_VERIFIED);

      await assertFails(getDoc(doc(cand2Db, 'candidates', UID_CAND_1)));
      await assertFails(getDoc(doc(cand2Db, 'users', UID_CAND_1, 'resumes', 'res_1')));
      await assertFails(getDoc(doc(empDb, 'candidates', UID_CAND_1)));
      await assertFails(getDoc(doc(empDb, 'users', UID_CAND_1, 'resumes', 'res_1')));
    });

    it('#8 Candidate Reading Recruiter Internal Notes: denied to applicant, allowed to owning employer', async () => {
      const candDb = authDb(UID_CAND_1);
      const empDb = authDb(UID_EMP_VERIFIED);

      await assertFails(getDoc(doc(candDb, 'applications', 'app_1', 'internal_notes', 'note_1')));
      await assertFails(getDocs(collection(candDb, 'applications', 'app_1', 'internal_notes')));
      await assertSucceeds(getDoc(doc(empDb, 'applications', 'app_1', 'internal_notes', 'note_1')));
    });

    it('#9 Application Spoofing Employer Ownership or Initial Status: denied', async () => {
      const candDb = authDb(UID_CAND_1);
      // Forged employerOwnerUid
      await assertFails(
        setDoc(
          doc(candDb, 'applications', 'app_spoof_emp'),
          validApplicationPayload({
            id: 'app_spoof_emp',
            employerOwnerUid: UID_CAND_1,
          })
        )
      );
      // Forged initial status 'Shortlisted'
      await assertFails(
        setDoc(
          doc(candDb, 'applications', 'app_spoof_status'),
          validApplicationPayload({
            id: 'app_spoof_status',
            status: 'Shortlisted',
          })
        )
      );
      // Applying to draft job denied
      await assertFails(
        setDoc(
          doc(candDb, 'applications', 'app_draft_job'),
          validApplicationPayload({
            id: 'app_draft_job',
            jobId: 'job_draft_1',
            employerId: UID_EMP_PENDING,
            employerOwnerUid: UID_EMP_PENDING,
          })
        )
      );
    });

    it('#10 Quiz Answer-Key Protection: quiz_configs denied to public & candidates, allowed to course_admin', async () => {
      const pubDb = unauthDb();
      const candDb = authDb(UID_CAND_1);
      const courseAdminDb = authDb(UID_COURSE_ADMIN);

      await assertFails(
        getDoc(doc(pubDb, 'learning_courses', 'excel_for_job_seekers', 'quiz_configs', 'quiz_m01'))
      );
      await assertFails(
        getDoc(doc(candDb, 'learning_courses', 'excel_for_job_seekers', 'quiz_configs', 'quiz_m01'))
      );
      await assertFails(
        getDocs(
          query(
            collection(candDb, 'learning_courses', 'excel_for_job_seekers', 'quiz_configs'),
            where('courseId', '==', 'excel_for_job_seekers')
          )
        )
      );
      await assertSucceeds(
        getDoc(
          doc(courseAdminDb, 'learning_courses', 'excel_for_job_seekers', 'quiz_configs', 'quiz_m01')
        )
      );
    });

    it('#11 Student Certificate Forgery & Self-Approval: denied on certificates, public_certificates & certificate_requests', async () => {
      const candDb = authDb(UID_CAND_1);
      await assertFails(
        setDoc(doc(candDb, 'users', UID_CAND_1, 'certificates', 'excel_for_job_seekers'), {
          certificateId: 'ABHI-FAKE-0001',
          userId: UID_CAND_1,
          candidateName: 'Asha Verma',
          courseId: 'excel_for_job_seekers',
          courseSlug: 'excel-for-job-seekers',
          courseTitle: 'Excel for Job Seekers',
          completionDate: '2026-11-25',
          templateId: 'default_abhi_certificate',
          status: 'valid',
          issuanceMethod: 'admin_approved',
          approvedBy: UID_CAND_1,
          issuedAt: serverTimestamp(),
        })
      );
      await assertFails(
        setDoc(doc(candDb, 'public_certificates', 'ABHI-FAKE-0001'), {
          certificateId: 'ABHI-FAKE-0001',
          candidateName: 'Asha Verma',
          courseId: 'excel_for_job_seekers',
          courseTitle: 'Excel for Job Seekers',
          issueDate: '2026-11-25',
          status: 'valid',
          issuedAt: serverTimestamp(),
        })
      );
    });

    it('#12 Browser Forged Admin Activity Log: ALL client writes denied (even super_admin); only super_admin can read', async () => {
      const superDb = authDb(UID_SUPER_ADMIN);
      const recruitDb = authDb(UID_RECRUIT_ADMIN);

      await assertFails(
        setDoc(doc(superDb, 'admin_activity_logs', 'log_forged'), {
          id: 'log_forged',
          actorUid: UID_SUPER_ADMIN,
          actorEmail: 'super@abhijobs.test',
          actorRole: 'super_admin',
          category: 'rbac',
          action: 'fake_write',
          targetCollection: 'admin_roles',
          targetId: UID_CAND_1,
          summary: 'Attempted browser log write',
          createdAt: serverTimestamp(),
        })
      );
      await assertFails(deleteDoc(doc(superDb, 'admin_activity_logs', 'log_server_1')));
      await assertSucceeds(getDoc(doc(superDb, 'admin_activity_logs', 'log_server_1')));
      await assertFails(getDoc(doc(recruitDb, 'admin_activity_logs', 'log_server_1')));
    });

    it('#13 Shadow Field Injection ("Ghost Field"): extra unknown field rejected on update', async () => {
      const candDb = authDb(UID_CAND_1);
      await assertFails(
        updateDoc(doc(candDb, 'candidates', UID_CAND_1), {
          headline: 'Senior Analyst',
          isAdmin: true,
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('#14 Resource Poisoning: oversized doc ID (>128 chars) and oversized payload string rejected', async () => {
      const pubDb = unauthDb();
      const hugeId = 'a'.repeat(160);
      await assertFails(
        setDoc(doc(pubDb, 'hiring_enquiries', hugeId), {
          id: hugeId,
          companyName: 'Spam Co',
          contactPerson: 'Bot',
          businessEmail: 'bot@spam.test',
          phoneNumber: '+919999999999',
          jobTitle: 'Spam',
          vacancies: 1,
          jobLocation: 'Remote',
          additionalRequirements: 'Test',
          status: 'New',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
      await assertFails(
        setDoc(doc(pubDb, 'hiring_enquiries', 'enq_huge_text'), {
          id: 'enq_huge_text',
          companyName: 'Spam Co',
          contactPerson: 'Bot',
          businessEmail: 'bot@spam.test',
          phoneNumber: '+919999999999',
          jobTitle: 'Spam',
          vacancies: 1,
          jobLocation: 'Remote',
          additionalRequirements: 'x'.repeat(3500),
          status: 'New',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('#15 Public Scraping of Enquiries: public create allowed with status=New, public/candidate reads denied', async () => {
      const pubDb = unauthDb();
      const candDb = authDb(UID_CAND_1);

      await assertSucceeds(
        setDoc(doc(pubDb, 'hiring_enquiries', 'enq_pub_valid'), {
          id: 'enq_pub_valid',
          companyName: 'Sunrise Logistics',
          contactPerson: 'Vikram Shah',
          businessEmail: 'vikram@sunrise.example.com',
          phoneNumber: '+919876500001',
          jobTitle: 'Operations Coordinator',
          vacancies: 3,
          jobLocation: 'Hyderabad',
          additionalRequirements: 'Immediate joining',
          status: 'New',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
      await assertFails(getDoc(doc(pubDb, 'hiring_enquiries', 'enq_h1')));
      await assertFails(getDocs(collection(pubDb, 'hiring_enquiries')));
      await assertFails(getDoc(doc(candDb, 'course_enquiries', 'enq_c1')));
    });

    it('#16 Cross-Role Admin Privilege Overreach: role boundaries strictly isolated across all 5 roles', async () => {
      const contentDb = authDb(UID_CONTENT_ADMIN);
      const recruitDb = authDb(UID_RECRUIT_ADMIN);
      const courseDb = authDb(UID_COURSE_ADMIN);
      const supportDb = authDb(UID_SUPPORT_ADMIN);

      // content_admin cannot verify employers or manage admin_roles
      await assertFails(
        updateDoc(doc(contentDb, 'employers', UID_EMP_PENDING), {
          verificationStatus: 'verified',
          verified: true,
          updatedAt: serverTimestamp(),
        })
      );
      await assertFails(getDocs(collection(contentDb, 'admin_roles')));

      // recruitment_admin cannot edit website_content or read quiz_configs
      await assertFails(
        updateDoc(doc(recruitDb, 'website_content', 'home_hero'), {
          title: 'Hacked Hero',
          updatedBy: UID_RECRUIT_ADMIN,
          updatedAt: serverTimestamp(),
        })
      );
      await assertFails(
        getDoc(doc(recruitDb, 'learning_courses', 'excel_for_job_seekers', 'quiz_configs', 'quiz_m01'))
      );

      // course_admin cannot verify employers or read hiring_enquiries
      await assertFails(
        updateDoc(doc(courseDb, 'employers', UID_EMP_PENDING), {
          verificationStatus: 'verified',
          verified: true,
          updatedAt: serverTimestamp(),
        })
      );
      await assertFails(getDoc(doc(courseDb, 'hiring_enquiries', 'enq_h1')));

      // support_admin cannot modify platform_metrics or admin_roles or quiz_configs
      await assertFails(getDocs(collection(supportDb, 'admin_roles')));
      await assertFails(
        getDoc(doc(supportDb, 'learning_courses', 'excel_for_job_seekers', 'quiz_configs', 'quiz_m01'))
      );
    });
  });

  // ===========================================================================
  // SECTION 2: UNAUTHENTICATED ACCESS BOUNDARIES
  // ===========================================================================
  describe('Unauthenticated Access Boundaries', () => {
    it('allows reading public published catalog & single-doc public certificate verification', async () => {
      const pubDb = unauthDb();
      await assertSucceeds(getDoc(doc(pubDb, 'jobs', 'job_101')));
      await assertSucceeds(getDoc(doc(pubDb, 'employers', UID_EMP_VERIFIED)));
      await assertSucceeds(getDoc(doc(pubDb, 'website_content', 'home_hero')));
      await assertSucceeds(getDoc(doc(pubDb, 'public_settings', 'social_links')));
      await assertSucceeds(getDoc(doc(pubDb, 'learning_courses', 'excel_for_job_seekers')));
      await assertSucceeds(
        getDoc(doc(pubDb, 'learning_courses', 'excel_for_job_seekers', 'modules', 'excel_m01_fundamentals'))
      );
      await assertSucceeds(
        getDoc(doc(pubDb, 'learning_courses', 'excel_for_job_seekers', 'lessons', 'excel_m01_lesson_01'))
      );
      await assertSucceeds(getDoc(doc(pubDb, 'certificate_templates', 'default_abhi_certificate')));
      await assertSucceeds(getDoc(doc(pubDb, 'public_certificates', 'ABHI-2026-HMAC0001')));
    });

    it('denies unauthenticated access to private, draft, pending, /test/connection, and admin collections', async () => {
      const pubDb = unauthDb();
      const candDb = authDb(UID_CAND_1);
      await assertFails(getDoc(doc(pubDb, 'test', 'connection')));
      await assertSucceeds(getDoc(doc(candDb, 'test', 'connection')));
      await assertFails(getDoc(doc(pubDb, 'jobs', 'job_draft_1')));
      await assertFails(getDoc(doc(pubDb, 'employers', UID_EMP_PENDING)));
      await assertFails(
        getDoc(doc(pubDb, 'employers', UID_EMP_VERIFIED, 'private_contacts', 'default'))
      );
      await assertFails(getDoc(doc(pubDb, 'website_content', 'draft_promo')));
      await assertFails(getDoc(doc(pubDb, 'learning_courses', 'draft_course')));
      await assertFails(getDoc(doc(pubDb, 'candidates', UID_CAND_1)));
      await assertFails(getDoc(doc(pubDb, 'candidate_directory', UID_CAND_1)));
      await assertFails(getDoc(doc(pubDb, 'applications', 'app_1')));
      await assertFails(getDocs(collection(pubDb, 'public_certificates')));
      await assertFails(getDoc(doc(pubDb, 'admin_roles', UID_SUPER_ADMIN)));
      await assertFails(getDoc(doc(pubDb, 'platform_metrics', 'latest')));
    });
  });

  // ===========================================================================
  // SECTION 3: CANDIDATE ISOLATION, SUSPENDED USERS & DIRECTORY SPLIT
  // ===========================================================================
  describe('Candidate Isolation, Opt-In Directory & Suspended Users', () => {
    it('allows verified employer to read opt-in non-PII candidate_directory, denies pending employer', async () => {
      const verifiedEmpDb = authDb(UID_EMP_VERIFIED);
      const pendingEmpDb = authDb(UID_EMP_PENDING);

      await assertSucceeds(getDoc(doc(verifiedEmpDb, 'candidate_directory', UID_CAND_1)));
      await assertFails(getDoc(doc(pendingEmpDb, 'candidate_directory', UID_CAND_1)));
    });

    it('blocks suspended users from self-reactivating or updating profile, allows support_admin moderation', async () => {
      const suspendedDb = authDb(UID_SUSPENDED_USER);
      const supportDb = authDb(UID_SUPPORT_ADMIN);

      await assertFails(
        updateDoc(doc(suspendedDb, 'users', UID_SUSPENDED_USER), {
          status: 'active',
        })
      );
      await assertFails(
        updateDoc(doc(suspendedDb, 'users', UID_SUSPENDED_USER), {
          name: 'Renamed While Suspended',
        })
      );
      await assertSucceeds(
        updateDoc(doc(supportDb, 'users', UID_SUSPENDED_USER), {
          status: 'active',
          lastActive: 'Reinstated',
        })
      );
    });

    it('blocks suspended employers from updating profile or creating jobs', async () => {
      const suspEmpDb = authDb(UID_EMP_SUSPENDED);
      await assertFails(
        updateDoc(doc(suspEmpDb, 'employers', UID_EMP_SUSPENDED), {
          about: 'Trying to edit while suspended',
          updatedAt: serverTimestamp(),
        })
      );
      await assertFails(
        setDoc(
          doc(suspEmpDb, 'jobs', 'job_from_suspended'),
          validJobPayload({
            id: 'job_from_suspended',
            employerId: UID_EMP_SUSPENDED,
            employerOwnerUid: UID_EMP_SUSPENDED,
            status: 'draft',
            isVerifiedCompany: false,
          })
        )
      );
    });
  });

  // ===========================================================================
  // SECTION 4: EMPLOYER VERIFICATION, JOB LIFECYCLE, APPLICATIONS & INTERVIEWS
  // ===========================================================================
  describe('Employer Verification, Jobs, Applications & Interviews Workflows', () => {
    it('supports full employer registration -> admin verification -> job publishing -> application -> interview flow', async () => {
      const newEmpUid = 'uid_emp_lifecycle';
      const newEmpDb = authDb(newEmpUid);
      const recruitDb = authDb(UID_RECRUIT_ADMIN);
      const candDb = authDb(UID_CAND_1);

      // 1. Employer registers as pending
      await assertSucceeds(
        setDoc(doc(newEmpDb, 'employers', newEmpUid), {
          id: newEmpUid,
          ownerUid: newEmpUid,
          companyName: 'Clarity FinTech',
          industry: 'Finance',
          companySize: '50-200',
          location: 'Chennai',
          about: 'Financial data services.',
          benefits: ['WFH Stipend'],
          verificationStatus: 'pending',
          verified: false,
          activeJobsCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );

      // 2. Employer saves private recruiter contact
      await assertSucceeds(
        setDoc(doc(newEmpDb, 'employers', newEmpUid, 'private_contacts', 'default'), {
          id: 'default',
          employerId: newEmpUid,
          ownerUid: newEmpUid,
          recruiterName: 'Ananya Rao',
          recruiterRole: 'HR Manager',
          recruiterEmail: 'hr@clarity.example.com',
          recruiterPhone: '+919876511111',
          updatedAt: serverTimestamp(),
        })
      );

      // 3. Recruitment admin verifies employer
      await assertSucceeds(
        updateDoc(doc(recruitDb, 'employers', newEmpUid), {
          verificationStatus: 'verified',
          verified: true,
          verifiedBy: UID_RECRUIT_ADMIN,
          verifiedAt: '2026-11-25T10:00:00Z',
          updatedAt: serverTimestamp(),
        })
      );

      // 4. Verified employer publishes a job, updates allowed fields, and recruitment_admin features it
      await assertSucceeds(
        setDoc(
          doc(newEmpDb, 'jobs', 'job_clarity_1'),
          validJobPayload({
            id: 'job_clarity_1',
            employerId: newEmpUid,
            employerOwnerUid: newEmpUid,
            companyName: 'Clarity FinTech',
            status: 'published',
            isVerifiedCompany: true,
          })
        )
      );
      await assertSucceeds(
        updateDoc(doc(newEmpDb, 'jobs', 'job_clarity_1'), {
          title: 'Senior Data Analyst',
          location: 'Chennai (Hybrid)',
          updatedAt: serverTimestamp(),
        })
      );
      await assertSucceeds(
        updateDoc(doc(recruitDb, 'jobs', 'job_clarity_1'), {
          featured: true,
          updatedAt: serverTimestamp(),
        })
      );

      // 5. Verified candidate applies to published job
      await assertSucceeds(
        setDoc(
          doc(candDb, 'applications', 'job_clarity_1__uid_cand_1'),
          validApplicationPayload({
            id: 'job_clarity_1__uid_cand_1',
            jobId: 'job_clarity_1',
            employerId: newEmpUid,
            employerOwnerUid: newEmpUid,
            companyName: 'Clarity FinTech',
          })
        )
      );

      // 6. Employer shortlists & schedules interview; candidate can read interview but cannot write
      await assertSucceeds(
        updateDoc(doc(newEmpDb, 'applications', 'job_clarity_1__uid_cand_1'), {
          status: 'Shortlisted',
          timeline: [
            { status: 'Applied', date: '2026-11-25' },
            { status: 'Shortlisted', date: '2026-11-25' },
          ],
          updatedAt: serverTimestamp(),
        })
      );
      await assertSucceeds(
        setDoc(doc(newEmpDb, 'interviews', 'int_clarity_1'), {
          id: 'int_clarity_1',
          applicationId: 'job_clarity_1__uid_cand_1',
          jobId: 'job_clarity_1',
          jobTitle: 'Data Analyst',
          candidateId: UID_CAND_1,
          candidateName: 'Asha Verma',
          employerId: newEmpUid,
          employerOwnerUid: newEmpUid,
          companyName: 'Clarity FinTech',
          scheduledDate: '2026-12-01',
          scheduledTime: '11:00 AM IST',
          type: 'Video',
          meetingLink: 'https://meet.example.com/clarity-1',
          status: 'Scheduled',
          createdBy: newEmpUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
      await assertSucceeds(getDoc(doc(candDb, 'interviews', 'int_clarity_1')));
      await assertFails(
        updateDoc(doc(candDb, 'interviews', 'int_clarity_1'), {
          status: 'Completed',
          updatedAt: serverTimestamp(),
        })
      );

      // 7. Candidate withdraws active application; blocked from withdrawing terminal 'Selected' application
      await assertSucceeds(
        updateDoc(doc(candDb, 'applications', 'job_clarity_1__uid_cand_1'), {
          status: 'Withdrawn',
          timeline: [{ status: 'Withdrawn', date: '2026-11-25' }],
          updatedAt: serverTimestamp(),
        })
      );
      await assertFails(
        updateDoc(doc(candDb, 'applications', 'app_selected'), {
          status: 'Withdrawn',
          updatedAt: serverTimestamp(),
        })
      );

      // 8. Employer cannot schedule interview on a Withdrawn application
      await assertFails(
        setDoc(doc(authDb(UID_EMP_VERIFIED), 'interviews', 'int_on_withdrawn'), {
          id: 'int_on_withdrawn',
          applicationId: 'app_withdrawn',
          jobId: 'job_101',
          jobTitle: 'Data Analyst',
          candidateId: UID_CAND_1,
          candidateName: 'Asha Verma',
          employerId: UID_EMP_VERIFIED,
          employerOwnerUid: UID_EMP_VERIFIED,
          companyName: 'Acme Analytics',
          scheduledDate: '2026-12-02',
          scheduledTime: '10:00 AM IST',
          type: 'Phone',
          status: 'Scheduled',
          createdBy: UID_EMP_VERIFIED,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    });
  });

  // ===========================================================================
  // SECTION 5: 5-ROLE RBAC, BOOTSTRAP SUPER ADMIN & REVOKED ADMIN ENFORCEMENT
  // ===========================================================================
  describe('5-Role RBAC & Super Admin Safeguards', () => {
    it('enforces bootstrap verified ezanwalmani@gmail.com, self-lockout guard, and instant revocation', async () => {
      const bootstrapDb = authDb('uid_bootstrap_ezan', {
        email: 'ezanwalmani@gmail.com',
        email_verified: true,
      });
      const superDb = authDb(UID_SUPER_ADMIN);
      const revokedDb = authDb(UID_REVOKED_ADMIN);

      // Verified bootstrap Super Admin can read/manage admin_roles & platform_metrics
      await assertSucceeds(getDocs(collection(bootstrapDb, 'admin_roles')));
      await assertSucceeds(
        setDoc(doc(bootstrapDb, 'platform_metrics', 'latest'), {
          id: 'latest',
          periodType: 'manual_snapshot',
          totalCandidates: 10,
          totalEmployers: 3,
          verifiedEmployers: 1,
          publishedJobs: 2,
          totalApplications: 5,
          totalEnrolments: 4,
          totalCertificates: 1,
          openHiringEnquiries: 1,
          openCourseEnquiries: 1,
          generatedBy: 'uid_bootstrap_ezan',
          updatedAt: serverTimestamp(),
        })
      );

      // Super Admin cannot accidentally self-revoke their own super_admin role
      await assertFails(
        updateDoc(doc(superDb, 'admin_roles', UID_SUPER_ADMIN), {
          status: 'revoked',
          assignedBy: UID_SUPER_ADMIN,
          updatedAt: serverTimestamp(),
        })
      );

      // Hard deletes are disabled on admin_roles
      await assertFails(deleteDoc(doc(superDb, 'admin_roles', UID_CONTENT_ADMIN)));

      // Revoked admin has zero admin privileges
      await assertFails(getDocs(collection(revokedDb, 'admin_roles')));
      await assertFails(getDoc(doc(revokedDb, 'platform_metrics', 'latest')));
      await assertFails(
        getDoc(doc(revokedDb, 'learning_courses', 'excel_for_job_seekers', 'quiz_configs', 'quiz_m01'))
      );
    });
  });

  // ===========================================================================
  // SECTION 6: PRESERVED LEARN WITH ABHI & ADMIN-APPROVED CERTIFICATE WORKFLOW
  // ===========================================================================
  describe('Preserved Learn with ABHI & Admin-Approved Certificate Issuance', () => {
    it('preserves student career assessment, enrolment bookmarks, video progress, and blocks score/unlock tampering', async () => {
      const candDb = authDb(UID_CAND_1);

      // 1. Career assessment create & submit
      await assertSucceeds(
        setDoc(doc(candDb, 'users', UID_CAND_1, 'career_assessments', 'assess_1'), {
          id: 'assess_1',
          userId: UID_CAND_1,
          status: 'in_progress',
          currentStep: 1,
          basicInfo: { city: 'Bengaluru' },
          education: { degree: 'B.Com' },
          experience: { years: 2 },
          careerPreferences: { role: 'Analyst' },
          skillsEvaluation: { excel: 4 },
          practicalAnswers: { q1: 1 },
          learningRecommendationConsent: true,
          recruitmentConsent: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
      await assertSucceeds(
        updateDoc(doc(candDb, 'users', UID_CAND_1, 'career_assessments', 'assess_1'), {
          status: 'submitted',
          report: { readinessScore: 82 },
          submittedAt: '2026-11-25T10:00:00Z',
          updatedAt: serverTimestamp(),
        })
      );
      // Terminal submitted assessment cannot be edited
      await assertFails(
        updateDoc(doc(candDb, 'users', UID_CAND_1, 'career_assessments', 'assess_1'), {
          currentStep: 2,
          updatedAt: serverTimestamp(),
        })
      );

      // 2. Clean course enrolment creation & bookmark update
      await assertSucceeds(
        setDoc(doc(candDb, 'users', UID_CAND_1, 'course_enrolments', 'excel_for_job_seekers'), {
          courseId: 'excel_for_job_seekers',
          courseSlug: 'excel-for-job-seekers',
          courseTitle: 'Excel for Job Seekers',
          categoryId: 'office_productivity',
          userId: UID_CAND_1,
          status: 'enrolled',
          completedLessonIds: [],
          passedModuleQuizIds: [],
          unlockedModuleOrder: 1,
          finalAssessmentPassed: false,
          progressPercent: 0,
          enrolledAt: serverTimestamp(),
          lastAccessedAt: serverTimestamp(),
        })
      );
      await assertSucceeds(
        updateDoc(doc(candDb, 'users', UID_CAND_1, 'course_enrolments', 'excel_for_job_seekers'), {
          currentModuleId: 'excel_m01_fundamentals',
          currentLessonId: 'excel_m01_lesson_01',
          completedLessonIds: ['excel_m01_lesson_01'],
          status: 'in_progress',
          lastAccessedAt: serverTimestamp(),
        })
      );
      // Student CANNOT unlock next module or self-complete course
      await assertFails(
        updateDoc(doc(candDb, 'users', UID_CAND_1, 'course_enrolments', 'excel_for_job_seekers'), {
          unlockedModuleOrder: 2,
          lastAccessedAt: serverTimestamp(),
        })
      );
      await assertFails(
        updateDoc(doc(candDb, 'users', UID_CAND_1, 'course_enrolments', 'excel_for_job_seekers'), {
          status: 'completed',
          finalAssessmentPassed: true,
          progressPercent: 100,
          lastAccessedAt: serverTimestamp(),
        })
      );

      // 3. Video progress playback validation (80% threshold + hasPlayed required for completedViaPlayer)
      await assertFails(
        setDoc(
          doc(candDb, 'users', UID_CAND_1, 'video_progress', 'excel_m01_v1'),
          {
            id: 'excel_m01_v1',
            userId: UID_CAND_1,
            courseId: 'excel_for_job_seekers',
            lessonId: 'excel_m01_lesson_01',
            videoId: 'v1',
            youtubeVideoId: 'dQw4w9WgXcQ',
            durationSeconds: 300,
            watchedSeconds: 10,
            maxPercentWatched: 10,
            lastPositionSeconds: 10,
            hasPlayed: false,
            completedViaPlayer: true,
            manualCompleted: false,
            updatedAt: serverTimestamp(),
          }
        )
      );
      await assertSucceeds(
        setDoc(
          doc(candDb, 'users', UID_CAND_1, 'video_progress', 'excel_m01_v1'),
          {
            id: 'excel_m01_v1',
            userId: UID_CAND_1,
            courseId: 'excel_for_job_seekers',
            lessonId: 'excel_m01_lesson_01',
            videoId: 'v1',
            youtubeVideoId: 'dQw4w9WgXcQ',
            durationSeconds: 300,
            watchedSeconds: 260,
            maxPercentWatched: 87,
            lastPositionSeconds: 260,
            hasPlayed: true,
            completedViaPlayer: true,
            manualCompleted: false,
            updatedAt: serverTimestamp(),
          }
        )
      );

      // 4. Student can read own assessment attempts and legacy HMAC certificates, cannot write attempts
      await assertSucceeds(getDoc(doc(candDb, 'users', UID_CAND_1, 'assessment_attempts', 'attempt_001')));
      await assertSucceeds(getDoc(doc(candDb, 'users', UID_CAND_1, 'certificates', 'legacy_course_hmac')));
      await assertFails(
        setDoc(doc(candDb, 'users', UID_CAND_1, 'assessment_attempts', 'fake_attempt'), {
          id: 'fake_attempt',
          userId: UID_CAND_1,
          courseId: 'excel_for_job_seekers',
          courseSlug: 'excel-for-job-seekers',
          courseTitle: 'Excel for Job Seekers',
          assessmentType: 'final_assessment',
          assessmentTitle: 'Final',
          attemptNumber: 2,
          totalQuestions: 10,
          correctAnswers: 10,
          incorrectAnswers: 0,
          scorePercent: 100,
          passPercentage: 70,
          passed: true,
          answers: { q1: 0 },
          questionResults: [{ id: 'q1', correct: true }],
          verificationSignature: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          submittedAt: serverTimestamp(),
        })
      );
    });

    it('supports Admin-Approved Certificate Issuance atomically while blocking un-enrolled students & non-course admins', async () => {
      const cand1Db = authDb(UID_CAND_1);
      const cand2Db = authDb(UID_CAND_2);
      const courseAdminDb = authDb(UID_COURSE_ADMIN);
      const recruitAdminDb = authDb(UID_RECRUIT_ADMIN);
      const pubDb = unauthDb();

      // Un-enrolled candidate 2 cannot submit a certificate request
      await assertFails(
        setDoc(doc(cand2Db, 'certificate_requests', 'excel_for_job_seekers__uid_cand_2'), {
          id: 'excel_for_job_seekers__uid_cand_2',
          userId: UID_CAND_2,
          candidateName: 'Unenrolled User',
          courseId: 'excel_for_job_seekers',
          courseSlug: 'excel-for-job-seekers',
          courseTitle: 'Excel for Job Seekers',
          completedLessonsCount: 12,
          status: 'pending',
          requestedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );

      // Enrolled candidate 1 submits pending request
      const reqId = 'excel_for_job_seekers__uid_cand_1';
      await assertSucceeds(
        setDoc(doc(cand1Db, 'certificate_requests', reqId), {
          id: reqId,
          userId: UID_CAND_1,
          candidateName: 'Asha Verma',
          courseId: 'excel_for_job_seekers',
          courseSlug: 'excel-for-job-seekers',
          courseTitle: 'Excel for Job Seekers',
          completedLessonsCount: 12,
          candidateNote: 'Completed all 12 Excel modules.',
          status: 'pending',
          requestedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );

      // Candidate 1 and recruitment_admin cannot approve request
      await assertFails(
        updateDoc(doc(cand1Db, 'certificate_requests', reqId), {
          status: 'approved',
          reviewedBy: UID_CAND_1,
          updatedAt: serverTimestamp(),
        })
      );
      await assertFails(
        updateDoc(doc(recruitAdminDb, 'certificate_requests', reqId), {
          status: 'approved',
          reviewedBy: UID_RECRUIT_ADMIN,
          updatedAt: serverTimestamp(),
        })
      );

      // Course Admin atomically creates public_certificates + user certificate (admin_approved) + approves request
      const certId = 'ABHI-2026-ADMN0001';
      const batch = writeBatch(courseAdminDb);
      batch.set(doc(courseAdminDb, 'public_certificates', certId), {
        certificateId: certId,
        candidateName: 'Asha Verma',
        courseId: 'excel_for_job_seekers',
        courseTitle: 'Excel for Job Seekers',
        issueDate: '2026-11-25',
        status: 'valid',
        issuanceMethod: 'admin_approved',
        issuedAt: serverTimestamp(),
      });
      batch.set(doc(courseAdminDb, 'users', UID_CAND_1, 'certificates', 'excel_for_job_seekers'), {
        certificateId: certId,
        userId: UID_CAND_1,
        candidateName: 'Asha Verma',
        courseId: 'excel_for_job_seekers',
        courseSlug: 'excel-for-job-seekers',
        courseTitle: 'Excel for Job Seekers',
        completionDate: '2026-11-25',
        templateId: 'default_abhi_certificate',
        status: 'valid',
        issuanceMethod: 'admin_approved',
        approvedBy: UID_COURSE_ADMIN,
        approvalNote: 'Verified module completion in Control Center.',
        issuedAt: serverTimestamp(),
      });
      batch.update(doc(courseAdminDb, 'certificate_requests', reqId), {
        status: 'approved',
        reviewedBy: UID_COURSE_ADMIN,
        reviewNote: 'Approved and issued.',
        issuedCertificateId: certId,
        updatedAt: serverTimestamp(),
      });
      await assertSucceeds(batch.commit());

      // Public single-doc verification succeeds for the new admin_approved certificate
      const verifySnap = await assertSucceeds(getDoc(doc(pubDb, 'public_certificates', certId)));
      assert.equal(verifySnap.data()?.issuanceMethod, 'admin_approved');
      assert.equal(verifySnap.data()?.status, 'valid');
    });

    it('preserves legacy /admins/{uid} compatibility and admin collectionGroup audit queries', async () => {
      const legacyAdminDb = authDb(UID_LEGACY_ADMIN);
      const courseAdminDb = authDb(UID_COURSE_ADMIN);

      await assertSucceeds(getDocs(collectionGroup(legacyAdminDb, 'course_enrolments')));
      await assertSucceeds(getDocs(collectionGroup(courseAdminDb, 'video_progress')));
      await assertSucceeds(getDocs(collectionGroup(courseAdminDb, 'assessment_attempts')));
      await assertSucceeds(getDocs(collectionGroup(courseAdminDb, 'certificates')));
    });

    it('enforces strict candidate-to-candidate data isolation across all private learning & recruitment records', async () => {
      const cand2Db = authDb(UID_CAND_2);

      await assertFails(getDoc(doc(cand2Db, 'users', UID_CAND_1)));
      await assertFails(getDoc(doc(cand2Db, 'candidates', UID_CAND_1)));
      await assertFails(getDoc(doc(cand2Db, 'users', UID_CAND_1, 'resumes', 'res_1')));
      await assertFails(getDoc(doc(cand2Db, 'users', UID_CAND_1, 'career_assessments', 'assess_1')));
      await assertFails(getDoc(doc(cand2Db, 'users', UID_CAND_1, 'course_enrolments', 'excel_for_job_seekers')));
      await assertFails(getDoc(doc(cand2Db, 'users', UID_CAND_1, 'video_progress', 'excel_m01_v1')));
      await assertFails(getDoc(doc(cand2Db, 'users', UID_CAND_1, 'assessment_attempts', 'attempt_001')));
      await assertFails(getDoc(doc(cand2Db, 'users', UID_CAND_1, 'certificates', 'legacy_course_hmac')));
      await assertFails(getDoc(doc(cand2Db, 'applications', 'app_1')));
      await assertFails(getDoc(doc(cand2Db, 'interviews', 'int_clarity_1')));
      await assertFails(getDoc(doc(cand2Db, 'certificate_requests', 'excel_for_job_seekers__uid_cand_1')));
    });
  });
});
