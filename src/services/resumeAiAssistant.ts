import { ResumeData, flattenSkillCategories } from '../types/resume';

export type SummaryAiAction = 'write' | 'improve' | 'concise' | 'tone_executive' | 'tone_confident';
export type BulletAiAction = 'improve' | 'concise' | 'impact';

export interface QualityCheckIssue {
  id: string;
  severity: 'important' | 'suggestion';
  section: string;
  title: string;
  detail: string;
}

export interface JobMatchAnalysis {
  matchedKeywords: string[];
  missingKeywords: string[];
  matchPercent: number;
}

/**
 * Generates a truthful, fact-preserving professional summary suggestion strictly
 * from the candidate's actual entered details. Never fabricates experience or credentials.
 */
export function generateSummarySuggestion(
  resume: ResumeData,
  action: SummaryAiAction
): { text: string; note: string } {
  const existing = resume.summary.trim();
  const title = resume.professionalTitle.trim() || resume.targetRole?.trim() || 'Professional';
  const skills = flattenSkillCategories(resume.skillCategories, resume.skills).slice(0, 5);
  const recentRoles = resume.experiences
    .filter((e) => e.jobTitle.trim() || e.companyName.trim())
    .slice(0, 2);
  const topEducation = resume.education[0];

  if (action === 'write' || !existing) {
    const sentences: string[] = [];

    if (recentRoles.length > 0) {
      const roleDesc = recentRoles[0].companyName
        ? `${recentRoles[0].jobTitle || title} with experience at ${recentRoles[0].companyName}`
        : `${recentRoles[0].jobTitle || title}`;
      sentences.push(`Results-focused ${roleDesc}.`);
    } else if (topEducation?.degree) {
      sentences.push(
        `Motivated ${title} with academic grounding in ${topEducation.degree}${
          topEducation.fieldOfStudy ? ` (${topEducation.fieldOfStudy})` : ''
        }.`
      );
    } else {
      sentences.push(`Detail-oriented ${title} committed to delivering dependable, high-quality work.`);
    }

    if (skills.length > 0) {
      sentences.push(`Core strengths include ${skills.join(', ')}.`);
    }

    if (resume.targetRole?.trim()) {
      sentences.push(
        `Seeking to contribute practical expertise and disciplined execution in a ${resume.targetRole.trim()} role.`
      );
    } else {
      sentences.push(
        'Focused on collaborating across teams to solve business challenges and drive measurable outcomes.'
      );
    }

    return {
      text: sentences.join(' '),
      note: 'Drafted exclusively from the details currently entered in your resume.',
    };
  }

  if (action === 'concise') {
    const cleaned = existing
      .replace(/\b(in order to|due to the fact that|at this point in time|a variety of|very|really|extremely|responsible for)\b/gi, (m) => {
        const l = m.toLowerCase();
        if (l === 'in order to') return 'to';
        if (l === 'due to the fact that') return 'because';
        if (l === 'responsible for') return 'experienced in';
        return '';
      })
      .replace(/\s{2,}/g, ' ')
      .trim();

    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
    const concise = sentences.slice(0, 2).join(' ').trim();
    return {
      text: concise || cleaned,
      note: 'Trimmed filler words and tightened to a crisp 2-sentence overview without altering your facts.',
    };
  }

  if (action === 'tone_executive') {
    const polished = polishTextClarity(existing)
      .replace(/^I am a /i, '')
      .replace(/^I have /i, 'Brings ')
      .replace(/\bhelped\b/gi, 'supported')
      .replace(/\bworked on\b/gi, 'directed initiatives across')
      .replace(/\bgood at\b/gi, 'proficient in');

    return {
      text: capitalizeSentence(polished),
      note: 'Adjusted into a direct, third-person executive tone while keeping every fact intact.',
    };
  }

  if (action === 'tone_confident') {
    const polished = polishTextClarity(existing)
      .replace(/^I am a /i, '')
      .replace(/\btried to\b/gi, '')
      .replace(/\bassisted with\b/gi, 'contributed to')
      .replace(/\bresponsible for managing\b/gi, 'skilled in managing');

    return {
      text: capitalizeSentence(polished),
      note: 'Refined phrasing to sound clear, active, and confident.',
    };
  }

  // Default: improve wording
  const improved = polishTextClarity(existing);
  return {
    text: capitalizeSentence(improved),
    note: 'Improved clarity, active phrasing, and punctuation without inventing new claims.',
  };
}

/**
 * Improves a single responsibility or achievement statement without inventing metrics or facts.
 */
export function improveExperienceBullet(
  bullet: string,
  action: BulletAiAction
): { text: string; note: string } {
  const trimmed = bullet.trim();
  if (!trimmed) {
    return {
      text: '',
      note: 'Enter a brief draft of what you actually did so we can refine the wording.',
    };
  }

  let updated = polishTextClarity(trimmed)
    .replace(/^was responsible for\s+/i, 'Managed ')
    .replace(/^responsible for\s+/i, 'Managed ')
    .replace(/^helped\s+with\s+/i, 'Supported ')
    .replace(/^helped\s+to\s+/i, 'Assisted in ')
    .replace(/^worked\s+on\s+/i, 'Delivered ')
    .replace(/^duties\s+included\s+/i, 'Executed ')
    .replace(/^tasked\s+with\s+/i, 'Handled ')
    .replace(/^i\s+/i, '');

  if (action === 'concise') {
    updated = updated
      .replace(/\b(in order to)\b/gi, 'to')
      .replace(/\b(on a daily basis)\b/gi, 'daily')
      .replace(/\b(effectively and efficiently|successfully|various|multiple different)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return {
      text: ensureTrailingPeriod(capitalizeSentence(updated)),
      note: 'Shortened for quick recruiter scanning while preserving your original meaning.',
    };
  }

  if (action === 'impact') {
    const hasMetric = /\d+%|\$\d+|₹\d+|\b\d+\+?\b/.test(updated);
    return {
      text: ensureTrailingPeriod(capitalizeSentence(updated)),
      note: hasMetric
        ? 'Sharpened action verb and phrasing around your stated results.'
        : 'Sharpened with an action verb. Tip: if you have a real outcome or volume (e.g., team size or time saved), you can add it manually.',
    };
  }

  return {
    text: ensureTrailingPeriod(capitalizeSentence(updated)),
    note: 'Polished into clear, action-oriented resume phrasing without changing your facts.',
  };
}

function polishTextClarity(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\brecieve\b/gi, 'receive')
    .replace(/\bmanagment\b/gi, 'management')
    .replace(/\bexperiance\b/gi, 'experience')
    .replace(/\bresponsbilities\b/gi, 'responsibilities')
    .replace(/\bcommuncation\b/gi, 'communication')
    .replace(/\bdevelopement\b/gi, 'development')
    .replace(/\bteh\b/gi, 'the')
    .trim();
}

function capitalizeSentence(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ensureTrailingPeriod(text: string): string {
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/**
 * Generates a personalized, fact-grounded prompt for candidates to copy into ChatGPT.
 */
export function buildPersonalizedChatGptPrompt(input: {
  fullName: string;
  targetRole: string;
  location: string;
  email: string;
  phone: string;
  experienceSummary: string;
  educationSummary: string;
  skillsList: string;
  additionalNotes: string;
}): string {
  const lines: string[] = [
    'You are an expert corporate resume writer helping me prepare a clear, honest, recruiter-ready resume.',
    '',
    'STRICT RULES:',
    '1. Use ONLY the actual information I provide below.',
    '2. Do NOT invent achievements, metrics, qualifications, job titles, companies, dates, or skills.',
    '3. Improve wording for clarity, professionalism, and impact without changing any facts.',
    '4. Tailor tone and emphasis for my target role.',
    '5. Format the output using these exact plain-text section headings so I can import it cleanly:',
    '   - PERSONAL INFORMATION',
    '   - PROFESSIONAL SUMMARY',
    '   - WORK EXPERIENCE',
    '   - EDUCATION',
    '   - SKILLS',
    '   - CERTIFICATIONS (only if provided)',
    '   - PROJECTS (only if provided)',
    '   - LANGUAGES (only if provided)',
    '   - ACHIEVEMENTS (only if provided)',
    '6. Under WORK EXPERIENCE, format each role as: Job Title | Company Name | Location | Start Year - End Year, followed by concise bullet points starting with "- ".',
    '',
    'MY ACTUAL INFORMATION:',
  ];

  if (input.fullName.trim()) lines.push(`Full Name: ${input.fullName.trim()}`);
  if (input.targetRole.trim()) lines.push(`Target Role: ${input.targetRole.trim()}`);
  if (input.location.trim()) lines.push(`Location: ${input.location.trim()}`);
  if (input.email.trim()) lines.push(`Email: ${input.email.trim()}`);
  if (input.phone.trim()) lines.push(`Phone: ${input.phone.trim()}`);

  lines.push('');
  lines.push('Work Experience / Career Background:');
  lines.push(
    input.experienceSummary.trim() ||
      '[Describe your roles, companies, dates, and main responsibilities here]'
  );

  lines.push('');
  lines.push('Education:');
  lines.push(
    input.educationSummary.trim() || '[List your degrees, institutions, and graduation years here]'
  );

  lines.push('');
  lines.push('Skills:');
  lines.push(input.skillsList.trim() || '[List your real technical, professional, and tool skills here]');

  if (input.additionalNotes.trim()) {
    lines.push('');
    lines.push('Projects, Certifications, Languages, or Achievements:');
    lines.push(input.additionalNotes.trim());
  }

  lines.push('');
  lines.push(
    'Please return only the structured resume content with clear headings so I can review and import it into ABHI JOBS.'
  );

  return lines.join('\n');
}

const COMMON_TYPOS: Array<[RegExp, string]> = [
  [/\brecieve\b/i, '"recieve" → "receive"'],
  [/\bmanagment\b/i, '"managment" → "management"'],
  [/\bexperiance\b/i, '"experiance" → "experience"'],
  [/\bresponsbilities\b/i, '"responsbilities" → "responsibilities"'],
  [/\bdevelopement\b/i, '"developement" → "development"'],
  [/\bcommuncation\b/i, '"communcation" → "communication"'],
  [/\bacheived\b/i, '"acheived" → "achieved"'],
  [/\bteh\b/i, '"teh" → "the"'],
  [/\b(\w+)\s+\1\b/i, 'Repeated consecutive word detected'],
];

/**
 * Runs non-destructive quality checks across the entire resume and returns
 * clear, actionable suggestions without modifying user data automatically.
 */
export function runResumeQualityChecks(resume: ResumeData): QualityCheckIssue[] {
  const issues: QualityCheckIssue[] = [];

  // 1. Missing contact details
  if (!resume.fullName.trim()) {
    issues.push({
      id: 'missing-name',
      severity: 'important',
      section: 'Personal Information',
      title: 'Full name is missing',
      detail: 'Add your full name so recruiters immediately know whose resume they are reading.',
    });
  }
  if (!resume.email.trim() || !resume.email.includes('@')) {
    issues.push({
      id: 'missing-email',
      severity: 'important',
      section: 'Personal Information',
      title: 'Valid email address missing',
      detail: 'Include a professional email address so hiring teams can contact you.',
    });
  }
  if (!resume.phone.trim()) {
    issues.push({
      id: 'missing-phone',
      severity: 'suggestion',
      section: 'Personal Information',
      title: 'Phone number not added',
      detail: 'Adding a reachable phone number speeds up recruiter screening calls.',
    });
  }
  if (!resume.city.trim() && !resume.state.trim()) {
    issues.push({
      id: 'missing-location',
      severity: 'suggestion',
      section: 'Personal Information',
      title: 'Location not specified',
      detail: 'Add your city and state so recruiters can match you with nearby or hybrid roles.',
    });
  }

  // 2. Professional Summary
  const summaryWords = resume.summary.trim().split(/\s+/).filter(Boolean).length;
  if (!resume.summary.trim()) {
    issues.push({
      id: 'missing-summary',
      severity: 'important',
      section: 'Professional Summary',
      title: 'Missing professional summary',
      detail: 'Add 2–4 concise sentences highlighting your core strengths and target direction.',
    });
  } else if (summaryWords > 95) {
    issues.push({
      id: 'long-summary',
      severity: 'suggestion',
      section: 'Professional Summary',
      title: 'Professional summary is quite long',
      detail: `Currently ${summaryWords} words. Aim for 40–75 words for crisp readability.`,
    });
  }

  // 3. Work Experience checks (dates, empty items, long bullets, duplicates)
  const seenBullets = new Set<string>();
  resume.experiences.forEach((exp, idx) => {
    const label = exp.jobTitle || exp.companyName || `Role #${idx + 1}`;
    if (!exp.jobTitle.trim() || !exp.companyName.trim()) {
      issues.push({
        id: `exp-incomplete-${exp.id}`,
        severity: 'important',
        section: 'Work Experience',
        title: `Incomplete role details (${label})`,
        detail: 'Make sure both Job Title and Company Name are filled in.',
      });
    }
    if (!exp.startYear.trim() || (!exp.currentlyWorking && !exp.endYear.trim())) {
      issues.push({
        id: `exp-dates-${exp.id}`,
        severity: 'important',
        section: 'Work Experience',
        title: `Missing work dates in "${label}"`,
        detail: 'Add start and end years (or mark "Currently Working Here") for timeline clarity.',
      });
    }
    const combinedBullets = [...exp.responsibilities, ...(exp.achievements || [])].filter((b) =>
      b.trim()
    );
    if (combinedBullets.length === 0) {
      issues.push({
        id: `exp-bullets-${exp.id}`,
        severity: 'suggestion',
        section: 'Work Experience',
        title: `No responsibilities listed for "${label}"`,
        detail: 'Add 2–4 bullet points describing your key contributions.',
      });
    }

    combinedBullets.forEach((bullet, bIdx) => {
      const normalized = bullet.trim().toLowerCase();
      if (seenBullets.has(normalized)) {
        issues.push({
          id: `dup-bullet-${exp.id}-${bIdx}`,
          severity: 'suggestion',
          section: 'Work Experience',
          title: `Repeated bullet point in "${label}"`,
          detail: 'Remove or differentiate duplicate statements across roles.',
        });
      }
      seenBullets.add(normalized);

      const wordCount = bullet.trim().split(/\s+/).length;
      if (wordCount > 28) {
        issues.push({
          id: `long-bullet-${exp.id}-${bIdx}`,
          severity: 'suggestion',
          section: 'Work Experience',
          title: `Very long bullet point in "${label}" (${wordCount} words)`,
          detail: 'Consider tightening bullets to 12–24 words so recruiters can scan them effortlessly.',
        });
      }
    });
  });

  // 4. Education empty check
  if (resume.education.length === 0) {
    issues.push({
      id: 'missing-edu',
      severity: 'suggestion',
      section: 'Education',
      title: 'No education entries added',
      detail: 'Include your highest degree, diploma, or relevant academic background.',
    });
  } else {
    resume.education.forEach((edu, idx) => {
      if (!edu.degree.trim() && !edu.institution.trim()) {
        issues.push({
          id: `empty-edu-${edu.id}`,
          severity: 'suggestion',
          section: 'Education',
          title: `Empty education entry #${idx + 1}`,
          detail: 'Complete this education record or remove it before exporting.',
        });
      }
    });
  }

  // 5. Skills checks (empty / duplicate case-insensitive)
  const skills = flattenSkillCategories(resume.skillCategories, resume.skills);
  if (skills.length === 0) {
    issues.push({
      id: 'missing-skills',
      severity: 'important',
      section: 'Skills',
      title: 'No skills added yet',
      detail: 'Add relevant technical, industry, or professional skills you actually possess.',
    });
  } else {
    const lowerSet = new Set<string>();
    const dupes: string[] = [];
    skills.forEach((s) => {
      const l = s.toLowerCase();
      if (lowerSet.has(l)) dupes.push(s);
      lowerSet.add(l);
    });
    if (dupes.length > 0) {
      issues.push({
        id: 'dup-skills',
        severity: 'suggestion',
        section: 'Skills',
        title: 'Duplicate skills found',
        detail: `Remove repeated entries: ${dupes.join(', ')}.`,
      });
    }
  }

  // 6. Spelling / repeated-word check across text fields
  const textBlob = [
    resume.summary,
    ...resume.experiences.flatMap((e) => [...e.responsibilities, ...(e.achievements || [])]),
    ...resume.projects.map((p) => p.description),
  ].join(' ');

  for (const [regex, hint] of COMMON_TYPOS) {
    if (regex.test(textBlob)) {
      issues.push({
        id: `typo-${hint}`,
        severity: 'suggestion',
        section: 'Proofreading',
        title: 'Possible spelling or word repetition',
        detail: `Check your wording: ${hint}.`,
      });
    }
  }

  return issues;
}

const JD_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'will', 'have', 'are', 'you',
  'our', 'who', 'can', 'not', 'but', 'all', 'any', 'has', 'was', 'were', 'been', 'being',
  'into', 'over', 'such', 'more', 'most', 'very', 'also', 'well', 'work', 'role', 'team',
  'company', 'experience', 'years', 'year', 'strong', 'ability', 'skills', 'skill', 'required',
  'preferred', 'including', 'across', 'within', 'using', 'based', 'looking', 'candidate',
  'position', 'responsibilities', 'requirements', 'qualifications', 'about', 'join', 'must',
  'should', 'would', 'good', 'great', 'high', 'best', 'new', 'help', 'make', 'their', 'they',
]);

/**
 * Compares a user-pasted Job Description against the candidate's current resume
 * and surfaces matched & relevant keywords for review (never auto-adding or fabricating).
 */
export function analyzeJobDescriptionMatch(
  resume: ResumeData,
  jobDescription: string
): JobMatchAnalysis {
  const jdClean = jobDescription.trim();
  if (!jdClean) {
    return { matchedKeywords: [], missingKeywords: [], matchPercent: 0 };
  }

  // Extract meaningful single & multi-word terms from the JD
  const freq = new Map<string, { display: string; count: number }>();

  // Capture common uppercase acronyms or compound tech/business terms first
  const tokens = jdClean.match(/[A-Za-z][A-Za-z0-9+#./-]{2,26}/g) || [];
  for (const rawToken of tokens) {
    const cleaned = rawToken.replace(/^[./-]+|[.,;:/-]+$/g, '');
    const lower = cleaned.toLowerCase();
    if (lower.length < 3 || JD_STOP_WORDS.has(lower) || /^\d+$/.test(lower)) continue;

    const existing = freq.get(lower);
    if (existing) {
      existing.count += 1;
    } else {
      freq.set(lower, { display: cleaned, count: 1 });
    }
  }

  // Pick top 18 recurring / significant JD keywords
  const ranked = Array.from(freq.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 18)
    .map(([lower, meta]) => ({ lower, display: meta.display }));

  const resumeCorpus = [
    resume.professionalTitle,
    resume.summary,
    ...flattenSkillCategories(resume.skillCategories, resume.skills),
    ...resume.experiences.flatMap((e) => [
      e.jobTitle,
      e.companyName,
      ...e.responsibilities,
      ...(e.achievements || []),
    ]),
    ...resume.projects.flatMap((p) => [p.name, p.technologies, p.description]),
    ...resume.certifications.map((c) => c.name),
  ]
    .join(' ')
    .toLowerCase();

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of ranked) {
    if (resumeCorpus.includes(kw.lower)) {
      matchedKeywords.push(kw.display);
    } else {
      missingKeywords.push(kw.display);
    }
  }

  const total = ranked.length || 1;
  const matchPercent = Math.round((matchedKeywords.length / total) * 100);

  return {
    matchedKeywords,
    missingKeywords,
    matchPercent,
  };
}
