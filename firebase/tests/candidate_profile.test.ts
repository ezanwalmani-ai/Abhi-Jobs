import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CandidateProfile } from '../../src/types';
import {
  calculateProfileCompletion,
  computeExperienceYearsFromList,
  mapParsedResumeToCandidateDraft,
  mergeParsedDraftIntoProfile,
  sortEducationReverseChronological,
  sortExperiencesReverseChronological,
} from '../../src/utils/profileCompletion';
import { parseStructuredResumeText } from '../../src/utils/resumeTextParser';
import { ProfileSidebar } from '../../src/components/profile/ProfileSidebar';
import { ProfileSections } from '../../src/components/profile/ProfileSections';
import { ResumeParseReviewModal } from '../../src/components/profile/ResumeParseReviewModal';

function createBaseProfile(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: 'cand_1',
    userId: 'cand_1',
    name: '',
    email: 'aarav@example.com',
    phone: '',
    location: 'India',
    headline: '',
    about: '',
    currentRole: '',
    desiredRole: '',
    experienceLevel: 'Mid',
    experienceType: 'experienced',
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
    projects: [],
    languages: [],
    completionPercentage: 0,
    recommendations: [],
    ...overrides,
  };
}

describe('Candidate Profile — Real Completion Calculation', () => {
  it('computes accurate low percentage on empty profile and lists all missing sections', () => {
    const report = calculateProfileCompletion(createBaseProfile());
    assert.equal(report.percentage, 2); // Only email present
    assert.equal(report.totalSections, 11);
    assert.equal(report.completedCount, 0);
    assert.equal(report.strengthTier, 'Needs Attention');
    assert.equal(report.missingSections.length, 11);
    assert.equal(report.recommendedActions.length, 4);
  });

  it('reaches 100% only when all 11 sections contain real saved information', () => {
    const fullProfile = createBaseProfile({
      name: 'Aarav Sharma',
      headline: 'Senior Data Analyst | SQL & Power BI',
      phone: '+91 98765 43210',
      location: 'Bengaluru, Karnataka',
      about:
        'Analytical professional with 5+ years of experience building automated MIS dashboards and operational reporting across logistics and fintech.',
      experiences: [
        {
          id: 'e1',
          company: 'Apex Logistics',
          jobTitle: 'Senior Data Analyst',
          employmentType: 'Full-time',
          startDate: '2022-04',
          endDate: '',
          current: true,
          description: 'Owned weekly executive reporting and SQL data pipelines.',
        },
      ],
      skills: ['SQL', 'Power BI', 'Microsoft Excel'],
      detailedSkills: [
        { name: 'SQL', proficiency: 'Expert', isPrimary: true },
        { name: 'Power BI', proficiency: 'Advanced', isPrimary: true },
        { name: 'Microsoft Excel', proficiency: 'Expert', isPrimary: true },
      ],
      education: [
        {
          id: 'ed1',
          qualification: 'B.Tech',
          fieldOfStudy: 'Information Science',
          institution: 'VTU Bengaluru',
          startYear: '2015',
          endYear: '2019',
        },
      ],
      resumeName: 'Aarav_Sharma_Resume.pdf',
      certifications: [
        { id: 'c1', title: 'Microsoft Power BI Data Analyst', issuer: 'Microsoft', issueDate: '2024' },
      ],
      projects: [
        {
          id: 'p1',
          title: 'Automated Supply Chain SLA Tracker',
          description: 'Reduced reporting latency by 60%.',
          technologies: ['Power BI', 'SQL'],
        },
      ],
      languages: [
        {
          id: 'l1',
          language: 'English',
          proficiency: 'Fluent',
          canRead: true,
          canWrite: true,
          canSpeak: true,
        },
      ],
      desiredRole: 'Lead Business Analyst',
      preferredLocation: 'Bengaluru',
      linkedinUrl: 'https://linkedin.com/in/aarav-sharma',
    });

    const report = calculateProfileCompletion(fullProfile);
    assert.equal(report.percentage, 100);
    assert.equal(report.completedCount, 11);
    assert.equal(report.missingSections.length, 0);
    assert.equal(report.strengthTier, 'Strong Profile');
  });
});

describe('Candidate Profile — Reverse Chronological Sorting', () => {
  it('places current employment first and orders previous roles descending', () => {
    const sorted = sortExperiencesReverseChronological([
      {
        id: 'old',
        company: 'Old Co',
        jobTitle: 'Junior Analyst',
        startDate: '2018-06',
        endDate: '2020-05',
        current: false,
        description: '',
      },
      {
        id: 'current',
        company: 'Current Co',
        jobTitle: 'Lead Analyst',
        startDate: '2023-01',
        endDate: '',
        current: true,
        description: '',
      },
      {
        id: 'mid',
        company: 'Mid Co',
        jobTitle: 'Analyst',
        startDate: '2020-06',
        endDate: '2022-12',
        current: false,
        description: '',
      },
    ]);

    assert.deepEqual(
      sorted.map((e) => e.id),
      ['current', 'mid', 'old']
    );
  });

  it('orders education entries descending by passing year', () => {
    const sorted = sortEducationReverseChronological([
      { id: 'ug', qualification: 'B.Com', fieldOfStudy: 'Commerce', institution: 'DU', startYear: '2015', endYear: '2018' },
      { id: 'pg', qualification: 'MBA', fieldOfStudy: 'Finance', institution: 'IIM', startYear: '2019', endYear: '2021' },
    ]);
    assert.deepEqual(
      sorted.map((e) => e.id),
      ['pg', 'ug']
    );
  });
});

describe('Candidate Profile — Safe Resume Merge & PDF/DOC/DOCX Support', () => {
  it('supports PDF, DOC, and DOCX resume upload validation in resumeParserService', () => {
    const parserSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/services/resumeParserService.ts'),
      'utf8'
    );
    const textParserSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/utils/resumeTextParser.ts'),
      'utf8'
    );
    assert.ok(parserSrc.includes("ext !== 'pdf' && ext !== 'docx' && ext !== 'doc'"));
    assert.ok(parserSrc.includes('extractTextFromLegacyDoc'));
    assert.ok(textParserSrc.includes('isWrappedContinuationLine'));
    assert.ok(textParserSrc.includes('EDUCATION_ENTRY_START_REGEX'));
  });

  it('parses the exact wrapped-PDF procurement resume layout 100% locally and accurately without any API key', () => {
    const rawPdfText = `
Ezhan Walmani
ezanwalmani@gmail.com | 6363698148

PROFESSIONAL SUMMARY
Results-driven procurement executive with hands-on experience in IT equipment sourcing,
hospitality supply purchasing, vendor management, and SAP MM workflows.

WORK EXPERIENCE
Independent Business Development Consultant — Self-Employed
India | Feb 2026 – Present
• Connect US logistics companies looking for operational support in India with Indian service providers.
• Identify potential Indian companies offering logistics and back-office services.
• Research businesses and service providers to find suitable opportunities.
• Coordinate initial communication between potential clients and service providers.
• Support business development and client acquisition activities.
Purchase Executive — Metromax Group & Newfleet
Bengaluru | Jun 2024 – Feb 2026
• Managed IT equipment procurement, including laptops, desktops, monitors, keyboards, and accessories.
• Handled international purchasing activities as part of the procurement process.
• Managed the procurement process from purchase requisitions and supplier sourcing to RFQs, quotation
comparisons, and purchase orders.
• Processed an average of 10–15 purchase orders per day and coordinated with 30–40 suppliers .
• Collected and evaluated supplier quotations based on pricing, specifications, availability, payment terms, and
delivery timelines.
• Prepared purchase orders, followed approval procedures, and shared approved orders with suppliers.
• Coordinated with suppliers for order confirmations, delivery schedules, and order status updates.
• Checked delivered goods against purchase orders and verified quantities and received items.
• Used SAP MM for purchase order processing, goods receipt through MIGO, and invoice verification through
MIRO.
• Checked supplier invoices against purchase orders and goods receipt records before forwarding them for further
processing.
• Maintained procurement records, supplier details, quotation comparisons, and order trackers using Excel.
Purchase Executive — Ruptub Solutions
Remote | Nov 2023 – Jun 2024
• Handled procurement of housekeeping supplies, guest amenities, cleaning materials, and linen including
toiletries, towels, bedsheets, blankets, and pillow covers.
Junior Purchase Executive — Apex IT Sourcing
Remote | Nov 2022 – Nov 2023
• Identified suppliers for IT equipment and collected quotations based on business requirements.
• Compared supplier quotations to evaluate pricing and product specifications.
• Prepared purchase requisition and purchase order documentation.
• Coordinated with suppliers regarding order confirmations and delivery updates.
• Followed up on pending orders and delivery schedules.
• Checked invoices against purchase orders and received goods documentation.
• Maintained supplier, purchase, and order records using Excel, SAP, and email.

EDUCATION
Bachelor of Business Administration (BBA) — Manipal University Jaipur
2021 – 2024
Senior Secondary Education — Chennai Senior Secondary School
April 2019 – July 2021
Secondary Education — Sarvodaya Vidyalaya
2008 – 2019

LANGUAGES
English (Fluent), Hindi (Native), Kannada (Conversational)
`;

    const parsed = parseStructuredResumeText(rawPdfText);
    const draft = mapParsedResumeToCandidateDraft(parsed, 'Ezhan_Resume.pdf', 95200);

    // 1. Exactly 4 real work experiences — zero fake bullet-fragment or city-name jobs!
    assert.equal(draft.experiences.length, 4);
    assert.equal(draft.experiences[0].company, 'Self-Employed');
    assert.equal(draft.experiences[0].current, true);
    assert.equal(draft.experiences[1].jobTitle, 'Purchase Executive');
    assert.equal(draft.experiences[1].company, 'Metromax Group & Newfleet');
    assert.equal(draft.experiences[1].location, 'Bengaluru');
    assert.equal(draft.experiences[1].startDate, 'Jun 2024');
    assert.equal(draft.experiences[1].endDate, 'Feb 2026');
    assert.ok(draft.experiences[1].description.includes('quotation comparisons, and purchase orders.'));
    assert.ok(draft.experiences[1].description.includes('payment terms, and delivery timelines.'));
    assert.ok(draft.experiences[1].description.includes('invoice verification through MIRO.'));
    assert.ok(draft.experiences[1].description.includes('for further processing.'));

    assert.equal(draft.experiences[2].jobTitle, 'Purchase Executive');
    assert.equal(draft.experiences[2].company, 'Ruptub Solutions');
    assert.equal(draft.experiences[2].location, 'Remote');
    assert.ok(draft.experiences[2].description.includes('toiletries, towels, bedsheets, blankets, and pillow covers.'));

    // 2. Exactly 3 separate Education entries (NOT merged into 1!)
    assert.equal(draft.education.length, 3);
    assert.ok(draft.education.some((e) => e.qualification.includes('BBA') && e.institution.includes('Manipal University Jaipur')));
    assert.ok(draft.education.some((e) => e.qualification.includes('Senior Secondary') && e.institution.includes('Chennai Senior Secondary School')));
    assert.ok(draft.education.some((e) => e.qualification.includes('Secondary Education') && e.institution.includes('Sarvodaya Vidyalaya')));

    // 3. Headline, location, experience years & level populated automatically
    assert.ok(draft.personal.headline.length >= 10);
    assert.ok(draft.personal.location.includes('Bengaluru'));
    assert.ok(draft.personal.yearsOfExperience >= 3.5);
    assert.notEqual(draft.personal.experienceLevel, 'Fresher');
    assert.equal(draft.personal.workStatus, 'Working');

    // 4. Languages extracted completely
    assert.equal(draft.languages.length, 3);
    assert.deepEqual(
      draft.languages.map((l) => l.language),
      ['English', 'Hindi', 'Kannada']
    );

    // 5. Domain skills & career preferences inferred cleanly
    assert.ok(draft.skills.includes('SAP MM'));
    assert.ok(draft.skills.includes('Procurement'));
    assert.ok(draft.skills.includes('Microsoft Excel'));
    assert.equal(draft.careerPreferences.preferredIndustry, 'Procurement & Supply Chain');

    // 6. Safe merge replaces Fresher / India / empty headline placeholders cleanly
    const existingDefault = createBaseProfile({
      name: 'Ezhan walmani',
      email: 'ezanwalmani@gmail.com',
      phone: '6363698148',
      location: 'India',
      headline: '',
      experienceLevel: 'Fresher',
      experienceType: 'fresher',
      yearsOfExperience: 0,
      workStatus: 'Looking for a job',
    });

    const merged = mergeParsedDraftIntoProfile(
      existingDefault,
      draft,
      {
        personal: true,
        summary: true,
        employment: true,
        skills: true,
        education: true,
        certifications: false,
        projects: false,
        languages: true,
        preferences: true,
        links: true,
      },
      false
    );

    assert.ok(merged.headline && merged.headline.length >= 10);
    assert.ok(merged.location && merged.location.includes('Bengaluru'));
    assert.notEqual(merged.experienceLevel, 'Fresher');
    assert.equal(merged.experienceType, 'experienced');
    assert.ok((merged.yearsOfExperience || 0) >= 3.5);
    assert.equal(merged.workStatus, 'Working');
    assert.equal(merged.education?.length, 3);
    assert.equal(merged.languages?.length, 3);
    assert.equal(merged.preferredIndustry, 'Procurement & Supply Chain');
  });

  it('computes non-overlapping total experience years accurately from date spans', () => {
    const years = computeExperienceYearsFromList([
      {
        id: '1',
        company: 'A',
        jobTitle: 'Exec',
        startDate: '2022-01',
        endDate: '2024-01',
        current: false,
        description: '',
      },
      {
        id: '2',
        company: 'B',
        jobTitle: 'Senior Exec',
        startDate: '2023-07',
        endDate: '2025-07',
        current: false,
        description: '',
      },
    ]);
    // Union of [2022-01, 2024-01] and [2023-07, 2025-07] = 42 months = 3.5 years
    assert.equal(years, 3.5);
  });

  it('maps parsed resume data and strictly protects existing profile data unless overwrite is confirmed', () => {
    const draft = mapParsedResumeToCandidateDraft(
      {
        extracted: {
          fullName: 'Priya Nair',
          professionalTitle: 'Senior Operations Specialist',
          email: 'priya.nair@example.com',
          phone: '+91 99887 76655',
          city: 'Pune',
          state: 'Maharashtra',
          linkedIn: 'linkedin.com/in/priyanair',
          portfolio: 'github.com/priyanair',
          summary: 'Operations specialist with 6 years of experience in supply chain planning.',
          experiences: [
            {
              id: 'e_1',
              jobTitle: 'Senior Operations Analyst',
              companyName: 'BlueDart Logistics',
              employmentType: 'Full-time',
              location: 'Pune',
              startMonth: 'Jan',
              startYear: '2022',
              endMonth: '',
              endYear: '',
              currentlyWorking: true,
              responsibilities: ['Managed pan-India hub SLA dashboards.'],
              achievements: ['Cut dispatch exceptions by 28% across 14 hubs.'],
            },
          ],
          education: [
            {
              id: 'ed_1',
              degree: 'MBA in Operations',
              institution: 'Symbiosis Institute',
              location: 'Pune',
              startDate: '2017',
              endDate: '2019',
              grade: '8.5 CGPA',
              description: 'Supply Chain Management',
            },
          ],
          skills: ['Microsoft Excel', 'SQL', 'Power BI'],
          certifications: [
            {
              id: 'c_1',
              name: 'Lean Six Sigma Green Belt',
              issuer: 'KPMG',
              issueDate: '2023',
              expiryDate: '',
              credentialId: '',
              credentialUrl: '',
            },
          ],
          projects: [
            {
              id: 'p_1',
              name: 'Hub Capacity Forecast Model',
              role: 'Lead Analyst',
              technologies: 'Python, Excel',
              description: 'Built weekly capacity planning workbook.',
              url: '',
            },
          ],
          languages: [
            { id: 'l_1', language: 'English', proficiency: 'Fluent' },
            { id: 'l_2', language: 'Hindi', proficiency: 'Native' },
          ],
        },
        detectedSections: ['Personal Information', 'Work Experience (1)', 'Skills (3)'],
        unassignedLines: [],
        rawText: 'https://github.com/priyanair',
      },
      'Priya_Nair_Resume.docx',
      184320
    );

    assert.equal(draft.personal.name, 'Priya Nair');
    assert.equal(draft.links.githubUrl, 'https://github.com/priyanair');
    assert.equal(draft.links.linkedinUrl, 'https://linkedin.com/in/priyanair');
    assert.equal(draft.experiences.length, 1);
    assert.equal(draft.experiences[0].current, true);

    const existing = createBaseProfile({
      name: 'Priya K. Nair',
      about: 'My hand-crafted summary that should not be overwritten.',
      skills: ['SQL', 'Tally Prime'],
    });

    const mergedSafe = mergeParsedDraftIntoProfile(
      existing,
      draft,
      {
        personal: true,
        summary: true,
        employment: true,
        skills: true,
        education: true,
        certifications: true,
        projects: true,
        languages: true,
        preferences: true,
        links: true,
      },
      false
    );

    assert.equal(mergedSafe.name, 'Priya K. Nair');
    assert.equal(mergedSafe.about, undefined);
    assert.equal(mergedSafe.headline, 'Senior Operations Specialist');
    assert.ok(mergedSafe.skills?.includes('Tally Prime'));
    assert.ok(mergedSafe.skills?.includes('Power BI'));
    assert.equal(mergedSafe.skills?.filter((s) => s.toLowerCase() === 'sql').length, 1);
    assert.equal(mergedSafe.resumeName, 'Priya_Nair_Resume.docx');

    const mergedOverwrite = mergeParsedDraftIntoProfile(
      existing,
      draft,
      {
        personal: true,
        summary: true,
        employment: false,
        skills: true,
        education: false,
        certifications: false,
        projects: false,
        languages: false,
        preferences: false,
        links: false,
      },
      true
    );

    assert.equal(mergedOverwrite.name, 'Priya Nair');
    assert.ok(mergedOverwrite.about?.includes('Operations specialist'));
    assert.equal(mergedOverwrite.experiences, undefined);
  });
});

describe('Candidate Profile — Runtime Component Render Smoke Tests', () => {
  it('renders all 11 sections in exact required order, ProfileSidebar, and ResumeParseReviewModal cleanly', () => {
    const profile = createBaseProfile({
      name: 'Aarav Sharma',
      headline: 'Senior Financial Analyst',
      location: 'Mumbai, Maharashtra',
      skills: ['Financial Modeling', 'Microsoft Excel', 'SQL'],
    });
    const report = calculateProfileCompletion(profile);

    const sectionsHtml = renderToStaticMarkup(
      React.createElement(ProfileSections, {
        profile,
        editingSection: null,
        onStartEdit: () => {},
        onStopEdit: () => {},
        onSaveSection: () => {},
        onTriggerResumeUpload: () => {},
        isParsingResume: false,
        navigate: () => {},
      })
    );

    const expectedOrder = [
      'Personal Details',
      'Profile Summary',
      'Employment Details',
      'Key Skills',
      'Education',
      'Resume',
      'Certifications',
      'Projects',
      'Languages',
      'Career Preferences',
      'Professional Links',
    ];

    let lastIdx = -1;
    for (const heading of expectedOrder) {
      const idx = sectionsHtml.indexOf(`>${heading}<`);
      assert.ok(idx > lastIdx, `Expected section "${heading}" in exact order (prev=${lastIdx}, found=${idx})`);
      lastIdx = idx;
    }

    const sidebarHtml = renderToStaticMarkup(
      React.createElement(ProfileSidebar, {
        profile,
        report,
        activeSectionId: 'personal',
        onJumpToSection: () => {},
        onUpdateVisibility: () => {},
        onToggleOpportunities: () => {},
      })
    );
    assert.ok(sidebarHtml.includes('Profile Completion'));
    assert.ok(sidebarHtml.includes('Profile Checklist'));
    assert.ok(sidebarHtml.includes('Profile Visibility'));

    const modalHtml = renderToStaticMarkup(
      React.createElement(ResumeParseReviewModal, {
        isOpen: true,
        existingProfile: profile,
        initialDraft: mapParsedResumeToCandidateDraft(
          { extracted: { fullName: 'Aarav Sharma', skills: ['SQL'] }, detectedSections: [], unassignedLines: [], rawText: '' },
          'resume.pdf',
          12000
        ),
        onClose: () => {},
        onConfirmSave: () => {},
      })
    );
    assert.ok(modalHtml.includes('Review Extracted Resume Details'));
    assert.ok(modalHtml.includes('Merge Safely (Recommended)'));
    assert.ok(modalHtml.includes('Experience Level'));
    assert.ok(modalHtml.includes('Career Preferences'));
  });
});
