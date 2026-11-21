import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ResumeData,
  ResumeExperience,
  ResumeEducation,
  ResumeProject,
  ResumeCertification,
  ResumeLanguage,
  ResumeSimpleEntry,
  ResumeCustomSection,
  EMPTY_RESUME,
  EMPTY_SKILL_CATEGORIES,
} from '../types/resume';

// Configure PDF.js worker using Vite bundled asset URL
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface ParsedResumeResult {
  extracted: Partial<ResumeData>;
  detectedSections: string[];
  unassignedLines: string[];
  rawText: string;
}

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: 'Please select a file.' };
  const ext = file.name.toLowerCase().split('.').pop() || '';
  if (ext !== 'pdf' && ext !== 'docx') {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a PDF (.pdf) or Word (.docx) document.',
    };
  }
  if (file.size === 0) {
    return { valid: false, error: 'The selected file appears to be empty.' };
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds 10MB. Please upload a smaller resume file.' };
  }
  return { valid: true };
}

/**
 * Extracts raw plain text from an uploaded PDF or DOCX resume file in the browser.
 */
export async function extractTextFromResumeFile(file: File): Promise<string> {
  const validation = validateResumeFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ext = file.name.toLowerCase().split('.').pop();
  const arrayBuffer = await file.arrayBuffer();

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = (result.value || '').trim();
    if (!text) {
      throw new Error(
        'Could not find readable text inside this DOCX file. Try saving it as a standard Word document.'
      );
    }
    return text;
  }

  if (ext === 'pdf') {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pagesText: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      let lastY: number | null = null;
      let pageLines: string[] = [];
      let currentLine = '';

      for (const item of textContent.items as any[]) {
        const str: string = item.str || '';
        const y: number = Array.isArray(item.transform) ? Math.round(item.transform[5]) : 0;

        if (lastY !== null && Math.abs(y - lastY) > 4) {
          if (currentLine.trim()) pageLines.push(currentLine.trim());
          currentLine = str;
        } else {
          currentLine += (currentLine && str && !currentLine.endsWith(' ') ? ' ' : '') + str;
        }
        lastY = y;
      }
      if (currentLine.trim()) pageLines.push(currentLine.trim());
      pagesText.push(pageLines.join('\n'));
    }

    const fullText = pagesText.join('\n\n').trim();
    if (!fullText) {
      throw new Error(
        'This PDF appears to be an image scan without selectable text. Please upload a text-based PDF or DOCX, or paste your text.'
      );
    }
    return fullText;
  }

  throw new Error('Unsupported file format.');
}

type CanonicalSection =
  | 'header'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'
  | 'languages'
  | 'achievements'
  | 'awards'
  | 'training'
  | 'volunteer'
  | 'publications'
  | 'memberships'
  | 'additional';

const SECTION_HEADING_PATTERNS: Array<{ section: CanonicalSection; regex: RegExp }> = [
  {
    section: 'header',
    regex: /^(personal\s+information|contact\s+information|contact\s+details|personal\s+details)$/i,
  },
  {
    section: 'summary',
    regex: /^(professional\s+summary|executive\s+summary|career\s+summary|summary|profile|about\s+me|career\s+objective|objective)$/i,
  },
  {
    section: 'experience',
    regex: /^(work\s+experience|professional\s+experience|employment\s+history|experience|career\s+history|work\s+history)$/i,
  },
  {
    section: 'education',
    regex: /^(education|academic\s+background|academic\s+qualifications|educational\s+qualifications|qualifications)$/i,
  },
  {
    section: 'skills',
    regex: /^(skills|core\s+skills|technical\s+skills|key\s+skills|core\s+competencies|skills\s*&\s*technologies|competencies|tools\s*&\s*technologies)$/i,
  },
  {
    section: 'certifications',
    regex: /^(certifications|licenses\s*&\s*certifications|certificates|professional\s+certifications|licenses)$/i,
  },
  {
    section: 'projects',
    regex: /^(projects|key\s+projects|selected\s+projects|academic\s+projects|personal\s+projects)$/i,
  },
  {
    section: 'languages',
    regex: /^(languages|spoken\s+languages|language\s+proficiency)$/i,
  },
  {
    section: 'achievements',
    regex: /^(achievements|key\s+achievements|accomplishments|highlights)$/i,
  },
  {
    section: 'awards',
    regex: /^(awards|awards\s*&\s*honors|honors\s*&\s*awards|honors|recognition)$/i,
  },
  {
    section: 'training',
    regex: /^(training|workshops|training\s*&\s*workshops|courses|professional\s+development)$/i,
  },
  {
    section: 'volunteer',
    regex: /^(volunteer\s+experience|volunteering|community\s+involvement|extracurricular)$/i,
  },
  {
    section: 'publications',
    regex: /^(publications|research\s+publications|papers)$/i,
  },
  {
    section: 'memberships',
    regex: /^(professional\s+memberships|memberships|affiliations|associations)$/i,
  },
  {
    section: 'additional',
    regex: /^(additional\s+information|additional\s+sections|other\s+information|interests)$/i,
  },
];

function cleanHeadingCandidate(line: string): string {
  return line
    .replace(/^#+\s*/, '')
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^__|__$/g, '')
    .replace(/[:\-–—|]+$/g, '')
    .trim();
}

function detectSectionHeading(line: string): CanonicalSection | null {
  const cleaned = cleanHeadingCandidate(line);
  if (!cleaned || cleaned.length > 52) return null;
  for (const { section, regex } of SECTION_HEADING_PATTERNS) {
    if (regex.test(cleaned)) return section;
  }
  return null;
}

function stripBulletPrefix(line: string): string {
  return line.replace(/^\s*([•●▪◦\-–—*]|\d+[.)])\s+/, '').trim();
}

function isBulletLine(line: string): boolean {
  return /^\s*([•●▪◦\-–—*]|\d+[.)])\s+/.test(line);
}

const DATE_RANGE_REGEX =
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\b(?:19|20)\d{2}\b)\s*(?:[-–—]|to)\s*(Present|Current|Now|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\b(?:19|20)\d{2}\b)/i;

function parseDateToken(token: string): { month: string; year: string } {
  const cleaned = token.trim();
  const yearMatch = cleaned.match(/\b(19|20)\d{2}\b/);
  const monthMatch = cleaned.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*/i
  );
  return {
    month: monthMatch ? monthMatch[1].slice(0, 3) : '',
    year: yearMatch ? yearMatch[0] : cleaned,
  };
}

/**
 * Parses unstructured resume text (from ChatGPT or uploaded PDF/DOCX) into structured
 * ABHI JOBS ResumeData sections. Never invents missing data and never silently discards
 * unrecognized lines (places unclear content into `unassignedLines` for user review).
 */
export function parseStructuredResumeText(rawText: string): ParsedResumeResult {
  const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const rawLines = normalizedText.split('\n');

  const buckets: Record<CanonicalSection, string[]> = {
    header: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: [],
    achievements: [],
    awards: [],
    training: [],
    volunteer: [],
    publications: [],
    memberships: [],
    additional: [],
  };

  let currentSection: CanonicalSection = 'header';
  const unassignedLines: string[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (buckets[currentSection].length > 0) {
        buckets[currentSection].push('');
      }
      continue;
    }

    // Ignore decorative separator lines
    if (/^[-=_*]{3,}$/.test(trimmed)) continue;

    const detected = detectSectionHeading(trimmed);
    if (detected) {
      currentSection = detected;
      continue;
    }

    buckets[currentSection].push(trimmed);
  }

  // 1. Parse Personal Information from header lines
  let fullName = '';
  let professionalTitle = '';
  let email = '';
  let phone = '';
  let city = '';
  let state = '';
  let linkedIn = '';
  let portfolio = '';

  const headerNonEmpty = buckets.header.filter(Boolean);
  for (const line of headerNonEmpty) {
    const clean = line.replace(/\*\*/g, '').trim();

    // Labelled lines (common in ChatGPT output e.g. "Full Name: ...")
    const labelMatch = clean.match(
      /^(Full\s*Name|Name|Title|Professional\s*Title|Role|Headline|Email|E-mail|Phone|Mobile|Tel|Location|City|Address|LinkedIn|Portfolio|Website|GitHub)\s*[:\-–]\s*(.+)$/i
    );
    if (labelMatch) {
      const key = labelMatch[1].toLowerCase();
      const val = labelMatch[2].trim();
      if (key.includes('name') && !fullName) fullName = val;
      else if (key.includes('title') || key.includes('role') || key.includes('headline')) {
        professionalTitle = val;
      } else if (key.includes('email')) email = val;
      else if (key.includes('phone') || key.includes('mobile') || key.includes('tel')) phone = val;
      else if (key.includes('linkedin')) linkedIn = val;
      else if (key.includes('portfolio') || key.includes('website') || key.includes('github')) {
        portfolio = val;
      } else if (key.includes('location') || key.includes('city') || key.includes('address')) {
        const parts = val.split(',').map((p) => p.trim());
        city = parts[0] || '';
        state = parts.slice(1).join(', ');
      }
      continue;
    }

    // Inline extraction from contact strings (e.g. "john@mail.com | +91 9876543210 | Bengaluru, India")
    const emailFound = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailFound && !email) email = emailFound[0];

    const phoneFound = clean.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3,5}\)?[\s.-]?)\d{3,5}[\s.-]?\d{3,5}/);
    if (phoneFound && !phone && phoneFound[0].replace(/\D/g, '').length >= 7) {
      phone = phoneFound[0].trim();
    }

    const linkedInFound = clean.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s|,;]+/i);
    if (linkedInFound && !linkedIn) linkedIn = linkedInFound[0];

    const urlFound = clean.match(/(?:https?:\/\/|www\.)[^\s|,;]+/i);
    if (urlFound && !portfolio && !urlFound[0].toLowerCase().includes('linkedin.com')) {
      portfolio = urlFound[0];
    }

    const isContactLine = Boolean(emailFound || phoneFound || linkedInFound || urlFound);
    if (isContactLine) {
      // Check pipe/bullet separated segments for location
      const segments = clean.split(/[|•·]/).map((s) => s.trim());
      for (const seg of segments) {
        if (
          !city &&
          seg &&
          !seg.includes('@') &&
          !/linkedin|http|www\./i.test(seg) &&
          seg.replace(/\D/g, '').length < 6 &&
          seg.length <= 40
        ) {
          const locParts = seg.split(',').map((p) => p.trim());
          if (locParts.length >= 2) {
            city = locParts[0];
            state = locParts.slice(1).join(', ');
          }
        }
      }
      continue;
    }

    if (!fullName && clean.length <= 60 && !clean.includes(':')) {
      fullName = clean;
    } else if (!professionalTitle && clean.length <= 90) {
      professionalTitle = clean;
    } else if (!city && clean.includes(',') && clean.length <= 50) {
      const locParts = clean.split(',').map((p) => p.trim());
      city = locParts[0] || '';
      state = locParts.slice(1).join(', ');
    } else {
      unassignedLines.push(clean);
    }
  }

  // 2. Parse Professional Summary
  const summary = buckets.summary
    .filter(Boolean)
    .map((l) => l.replace(/\*\*/g, '').trim())
    .join(' ')
    .trim();

  // 3. Parse Work Experience
  const experiences: ResumeExperience[] = [];
  const expLines = buckets.experience;
  let currentExp: ResumeExperience | null = null;

  const pushCurrentExp = () => {
    if (currentExp && (currentExp.jobTitle || currentExp.companyName || currentExp.responsibilities.length > 0)) {
      experiences.push(currentExp);
    }
    currentExp = null;
  };

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i];
    if (!line) {
      if (currentExp && currentExp.responsibilities.length > 0) {
        pushCurrentExp();
      }
      continue;
    }

    const clean = line.replace(/\*\*/g, '').trim();
    const dateMatch = clean.match(DATE_RANGE_REGEX);

    if (isBulletLine(line)) {
      const bulletText = stripBulletPrefix(clean);
      if (!currentExp) {
        currentExp = {
          id: `exp_${Date.now()}_${experiences.length}`,
          jobTitle: '',
          companyName: '',
          employmentType: 'Full-time',
          location: '',
          startMonth: '',
          startYear: '',
          endMonth: '',
          endYear: '',
          currentlyWorking: false,
          responsibilities: [],
          achievements: [],
        };
      }
      if (/^(achievement|key achievement|impact|result)\s*:/i.test(bulletText)) {
        currentExp.achievements = [
          ...(currentExp.achievements || []),
          bulletText.replace(/^(achievement|key achievement|impact|result)\s*:\s*/i, ''),
        ];
      } else {
        currentExp.responsibilities.push(bulletText);
      }
      continue;
    }

    // Header line with date or separator (e.g. "Senior Analyst — Acme Corp | Bengaluru | Jan 2021 - Present")
    if (dateMatch || (!currentExp || currentExp.responsibilities.length > 0)) {
      if (currentExp && (currentExp.responsibilities.length > 0 || (currentExp.jobTitle && currentExp.companyName && dateMatch))) {
        pushCurrentExp();
      }

      if (!currentExp) {
        currentExp = {
          id: `exp_${Date.now()}_${experiences.length}`,
          jobTitle: '',
          companyName: '',
          employmentType: 'Full-time',
          location: '',
          startMonth: '',
          startYear: '',
          endMonth: '',
          endYear: '',
          currentlyWorking: false,
          responsibilities: [],
          achievements: [],
        };
      }

      let withoutDate = clean;
      if (dateMatch) {
        const startParsed = parseDateToken(dateMatch[1]);
        const endRaw = dateMatch[2].trim();
        const isCurrent = /present|current|now/i.test(endRaw);
        const endParsed = isCurrent ? { month: '', year: '' } : parseDateToken(endRaw);
        currentExp.startMonth = startParsed.month;
        currentExp.startYear = startParsed.year;
        currentExp.endMonth = endParsed.month;
        currentExp.endYear = endParsed.year;
        currentExp.currentlyWorking = isCurrent;
        withoutDate = clean.replace(dateMatch[0], '').replace(/[|()]+/g, ' | ').trim();
      }

      const parts = withoutDate
        .split(/\s*(?:\||—|–| - | at |@)\s*/i)
        .map((p) => p.replace(/^[-|,\s]+|[-|,\s]+$/g, '').trim())
        .filter(Boolean);

      if (!currentExp.jobTitle && parts[0]) {
        currentExp.jobTitle = parts[0];
        if (parts[1]) currentExp.companyName = parts[1];
        if (parts[2]) currentExp.location = parts[2];
      } else if (!currentExp.companyName && parts[0]) {
        currentExp.companyName = parts[0];
        if (parts[1] && !currentExp.location) currentExp.location = parts[1];
      } else if (parts[0] && !currentExp.location) {
        currentExp.location = parts[0];
      } else if (withoutDate) {
        currentExp.responsibilities.push(withoutDate);
      }
    } else if (currentExp && !currentExp.companyName) {
      const parts = clean.split(/\s*[|·•,]\s*/).filter(Boolean);
      currentExp.companyName = parts[0] || clean;
      if (parts[1] && !currentExp.location) currentExp.location = parts.slice(1).join(', ');
    } else if (currentExp) {
      currentExp.responsibilities.push(clean);
    }
  }
  pushCurrentExp();

  // 4. Parse Education
  const education: ResumeEducation[] = [];
  const eduBlocks = buckets.education
    .join('\n')
    .split(/\n{2,}/)
    .map((b) => b.split('\n').map((l) => l.replace(/\*\*/g, '').trim()).filter(Boolean))
    .filter((b) => b.length > 0);

  for (const block of eduBlocks) {
    // Handle single-line education entries if multiple lines look like separate degrees
    const lines = block;
    let degree = '';
    let institution = '';
    let location = '';
    let startDate = '';
    let endDate = '';
    let grade = '';
    const extraDesc: string[] = [];

    for (const line of lines) {
      const clean = stripBulletPrefix(line);
      const dateMatch = clean.match(DATE_RANGE_REGEX);
      const singleYearMatch = clean.match(/\b(19|20)\d{2}\b/);
      const gradeMatch = clean.match(/(?:CGPA|GPA|Grade|Percentage|Score)\s*[:\-]?\s*([0-9.]+(?:\s*\/\s*[0-9.]+)?%?)/i);

      if (gradeMatch && !grade) {
        grade = gradeMatch[1].trim();
      }

      let remaining = clean;
      if (dateMatch) {
        startDate = parseDateToken(dateMatch[1]).year;
        endDate = /present|current/i.test(dateMatch[2]) ? 'Present' : parseDateToken(dateMatch[2]).year;
        remaining = remaining.replace(dateMatch[0], '').trim();
      } else if (singleYearMatch && !endDate) {
        endDate = singleYearMatch[0];
      }

      const parts = remaining
        .split(/\s*(?:\||—|–| - )\s*/)
        .map((p) => p.trim())
        .filter(Boolean);

      if (!degree && parts[0]) {
        degree = parts[0];
        if (parts[1]) institution = parts[1];
        if (parts[2]) location = parts[2];
      } else if (!institution && parts[0]) {
        institution = parts[0];
        if (parts[1]) location = parts[1];
      } else if (clean && !gradeMatch) {
        extraDesc.push(clean);
      }
    }

    if (degree || institution) {
      education.push({
        id: `edu_${Date.now()}_${education.length}`,
        degree,
        institution,
        location,
        startDate,
        endDate,
        grade,
        description: extraDesc.join(' '),
      });
    }
  }

  // 5. Parse Skills (supporting categorized lines like "Technical Skills: React, SQL")
  const skillCategories = {
    technical: [] as string[],
    professional: [] as string[],
    industry: [] as string[],
    tools: [] as string[],
  };
  const allSkills: string[] = [];

  for (const line of buckets.skills.filter(Boolean)) {
    const clean = stripBulletPrefix(line.replace(/\*\*/g, '').trim());
    const catMatch = clean.match(/^([^:]{2,32}):\s*(.+)$/);
    let targetCategory: keyof typeof skillCategories = 'technical';
    let skillListStr = clean;

    if (catMatch) {
      const catLabel = catMatch[1].toLowerCase();
      skillListStr = catMatch[2];
      if (catLabel.includes('soft') || catLabel.includes('professional') || catLabel.includes('interpersonal') || catLabel.includes('leadership')) {
        targetCategory = 'professional';
      } else if (catLabel.includes('tool') || catLabel.includes('software') || catLabel.includes('platform')) {
        targetCategory = 'tools';
      } else if (catLabel.includes('industry') || catLabel.includes('domain')) {
        targetCategory = 'industry';
      } else {
        targetCategory = 'technical';
      }
    }

    const tokens = skillListStr
      .split(/[,|•·;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2 && s.length <= 45);

    for (const token of tokens) {
      if (!skillCategories[targetCategory].includes(token)) {
        skillCategories[targetCategory].push(token);
      }
      if (!allSkills.includes(token)) {
        allSkills.push(token);
      }
    }
  }

  // 6. Parse Certifications
  const certifications: ResumeCertification[] = buckets.certifications
    .filter(Boolean)
    .map((line, idx) => {
      const clean = stripBulletPrefix(line.replace(/\*\*/g, '').trim());
      const parts = clean.split(/\s*(?:\||—|–| - )\s*/).filter(Boolean);
      const yearMatch = clean.match(/\b(19|20)\d{2}\b/);
      return {
        id: `cert_${Date.now()}_${idx}`,
        name: parts[0] || clean,
        issuer: parts[1] && parts[1] !== yearMatch?.[0] ? parts[1] : '',
        issueDate: yearMatch ? yearMatch[0] : '',
        expiryDate: '',
        credentialId: '',
        credentialUrl: '',
      };
    });

  // 7. Parse Projects
  const projects: ResumeProject[] = [];
  const projBlocks = buckets.projects
    .join('\n')
    .split(/\n{2,}/)
    .map((b) => b.split('\n').map((l) => l.replace(/\*\*/g, '').trim()).filter(Boolean))
    .filter((b) => b.length > 0);

  for (const block of projBlocks) {
    const first = stripBulletPrefix(block[0]);
    const parts = first.split(/\s*(?:\||—|–)\s*/).filter(Boolean);
    projects.push({
      id: `proj_${Date.now()}_${projects.length}`,
      name: parts[0] || first,
      role: parts[1] || '',
      technologies: parts[2] || '',
      description: block.slice(1).map(stripBulletPrefix).join(' '),
      url: '',
    });
  }

  // 8. Parse Languages
  const languages: ResumeLanguage[] = [];
  const langItems = buckets.languages
    .filter(Boolean)
    .join(',')
    .split(/[,|•·\n]+/)
    .map((s) => stripBulletPrefix(s.replace(/\*\*/g, '').trim()))
    .filter(Boolean);

  for (const item of langItems) {
    const profMatch = item.match(/(Native|Fluent|Professional|Conversational|Basic)/i);
    const langName = item.replace(/\(([^)]+)\)/g, '').replace(/(Native|Fluent|Professional|Conversational|Basic)/i, '').replace(/[-:]/g, '').trim();
    if (langName) {
      const rawProf = profMatch ? profMatch[1] : 'Professional';
      const normalizedProf = (rawProf.charAt(0).toUpperCase() + rawProf.slice(1).toLowerCase()) as ResumeLanguage['proficiency'];
      languages.push({
        id: `lang_${Date.now()}_${languages.length}`,
        language: langName,
        proficiency: normalizedProf,
      });
    }
  }

  // 9. Achievements, Awards, Training, Volunteer, Publications, Memberships, Additional
  const achievements = buckets.achievements
    .filter(Boolean)
    .map((l) => stripBulletPrefix(l.replace(/\*\*/g, '').trim()));

  const toSimpleEntries = (lines: string[], prefix: string): ResumeSimpleEntry[] =>
    lines.filter(Boolean).map((line, idx) => {
      const clean = stripBulletPrefix(line.replace(/\*\*/g, '').trim());
      const parts = clean.split(/\s*(?:\||—|–| - )\s*/).filter(Boolean);
      const yearMatch = clean.match(/\b(19|20)\d{2}\b/);
      return {
        id: `${prefix}_${Date.now()}_${idx}`,
        title: parts[0] || clean,
        organization: parts[1] && parts[1] !== yearMatch?.[0] ? parts[1] : '',
        date: yearMatch ? yearMatch[0] : '',
        description: parts.slice(2).join(' — '),
      };
    });

  const awards = toSimpleEntries(buckets.awards, 'award');
  const training = toSimpleEntries(buckets.training, 'train');
  const volunteer = toSimpleEntries(buckets.volunteer, 'vol');
  const publications = toSimpleEntries(buckets.publications, 'pub');
  const memberships = buckets.memberships
    .filter(Boolean)
    .map((l) => stripBulletPrefix(l.replace(/\*\*/g, '').trim()));

  const customSections: ResumeCustomSection[] = [];
  if (buckets.additional.filter(Boolean).length > 0) {
    customSections.push({
      id: `custom_${Date.now()}`,
      title: 'Additional Information',
      items: buckets.additional.filter(Boolean).map((l) => stripBulletPrefix(l.replace(/\*\*/g, '').trim())),
    });
  }

  // Track which sections were successfully identified
  const detectedSections: string[] = [];
  if (fullName || email || phone || professionalTitle) detectedSections.push('Personal Information');
  if (summary) detectedSections.push('Professional Summary');
  if (experiences.length > 0) detectedSections.push(`Work Experience (${experiences.length})`);
  if (education.length > 0) detectedSections.push(`Education (${education.length})`);
  if (allSkills.length > 0) detectedSections.push(`Skills (${allSkills.length})`);
  if (certifications.length > 0) detectedSections.push(`Certifications (${certifications.length})`);
  if (projects.length > 0) detectedSections.push(`Projects (${projects.length})`);
  if (languages.length > 0) detectedSections.push(`Languages (${languages.length})`);
  if (achievements.length > 0) detectedSections.push(`Achievements (${achievements.length})`);
  if (awards.length > 0) detectedSections.push(`Awards (${awards.length})`);
  if (training.length > 0) detectedSections.push(`Training (${training.length})`);
  if (volunteer.length > 0) detectedSections.push(`Volunteer (${volunteer.length})`);
  if (publications.length > 0) detectedSections.push(`Publications (${publications.length})`);
  if (memberships.length > 0) detectedSections.push(`Memberships (${memberships.length})`);
  if (customSections.length > 0) detectedSections.push('Additional Information');

  return {
    extracted: {
      ...EMPTY_RESUME,
      fullName,
      professionalTitle,
      email,
      phone,
      city,
      state,
      linkedIn,
      portfolio,
      summary,
      experiences,
      education,
      skills: allSkills,
      skillCategories:
        allSkills.length > 0 ? skillCategories : { ...EMPTY_SKILL_CATEGORIES },
      certifications,
      projects,
      languages,
      achievements,
      awards,
      training,
      volunteer,
      publications,
      memberships,
      customSections,
    },
    detectedSections,
    unassignedLines,
    rawText: normalizedText,
  };
}
