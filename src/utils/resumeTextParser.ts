import {
  ResumeData,
  ResumeEmploymentType,
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

export interface ParsedResumeResult {
  extracted: Partial<ResumeData>;
  detectedSections: string[];
  unassignedLines: string[];
  rawText: string;
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
    regex: /^(personal\s+information|contact\s+information|contact\s+details|personal\s+details|contact)$/i,
  },
  {
    section: 'summary',
    regex: /^(professional\s+summary|executive\s+summary|career\s+summary|profile\s+summary|summary|profile|about\s+me|career\s+objective|professional\s+profile|objective)$/i,
  },
  {
    section: 'experience',
    regex: /^(work\s+experience|professional\s+experience|employment\s+history|employment\s+details|experience|career\s+history|work\s+history|relevant\s+experience|industry\s+experience)$/i,
  },
  {
    section: 'education',
    regex: /^(education|academic\s+background|academic\s+qualifications|educational\s+qualifications|education\s*&\s*qualifications|academic\s+details|qualifications)$/i,
  },
  {
    section: 'skills',
    regex: /^(skills|core\s+skills|technical\s+skills|key\s+skills|core\s+competencies|skills\s*&\s*technologies|skills\s*&\s*tools|competencies|tools\s*&\s*technologies|areas\s+of\s+expertise|expertise|software\s*&\s*tools)$/i,
  },
  {
    section: 'certifications',
    regex: /^(certifications|licenses\s*&\s*certifications|certificates|professional\s+certifications|licenses|certifications\s*&\s*licenses)$/i,
  },
  {
    section: 'projects',
    regex: /^(projects|key\s+projects|selected\s+projects|academic\s+projects|personal\s+projects|notable\s+projects)$/i,
  },
  {
    section: 'languages',
    regex: /^(languages|languages\s+known|known\s+languages|spoken\s+languages|language\s+proficiency|language\s+skills|languages\s+spoken|languages\s*&\s*interests)$/i,
  },
  {
    section: 'achievements',
    regex: /^(achievements|key\s+achievements|accomplishments|highlights|career\s+highlights)$/i,
  },
  {
    section: 'awards',
    regex: /^(awards|awards\s*&\s*honors|honors\s*&\s*awards|honors|recognition|awards\s*&\s*recognition)$/i,
  },
  {
    section: 'training',
    regex: /^(training|workshops|training\s*&\s*workshops|courses|professional\s+development|courses\s*&\s*training)$/i,
  },
  {
    section: 'volunteer',
    regex: /^(volunteer\s+experience|volunteering|community\s+involvement|extracurricular|extracurricular\s+activities)$/i,
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
    regex: /^(additional\s+information|additional\s+details|additional\s+sections|other\s+information|interests|hobbies\s*&\s*interests|declaration)$/i,
  },
];

// Comprehensive bullet regex covering standard ASCII, Unicode, and Microsoft Word Symbol-font PDF bullets
const BULLET_PREFIX_REGEX =
  /^\s*(?:[•●▪◦‣⁃▸▹►▻➢➣➤❖✓✔✦★☆\-–—*\u2022\u2023\u25cf\u25aa\u25e6\uf0b7\uf0a7\uf0d8\uf0fc]|\d+[.)])\s+/;

const DATE_RANGE_REGEX =
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\b(?:19|20)\d{2}\b)\s*(?:[-–—]|to)\s*(Present|Current|Now|Ongoing|Till\s*Date|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\b(?:19|20)\d{2}\b)/i;

const EDUCATION_ENTRY_START_REGEX =
  /^(Bachelor(?:'s)?(?:\s+of)?|Master(?:'s)?(?:\s+of)?|Doctor(?:ate)?|Ph\.?D|M\.?B\.?A|B\.?B\.?A|B\.?Tech|M\.?Tech|B\.?E\.?\b|M\.?E\.?\b|B\.?Sc|M\.?Sc|B\.?Com|M\.?Com|B\.?C\.?A|M\.?C\.?A|B\.?A\.?\b|M\.?A\.?\b|LL\.?B|LL\.?M|C\.?A\.?\b|Diploma|Post\s*Graduate|PGDM|Senior\s+Secondary|Higher\s+Secondary|Secondary\s+Education|Secondary\s+School|High\s+School|Class\s*(?:XII|XI|X|12|10)\b|12th|10th|HSC|SSC|SSLC|PUC|Intermediate|Pre[-\s]?University)\b/i;

const KNOWN_CITIES_AND_MODES = [
  'Remote', 'Hybrid', 'On-site', 'Onsite', 'Work From Home', 'WFH',
  'India', 'Bengaluru', 'Bangalore', 'Chennai', 'Mumbai', 'Delhi', 'New Delhi', 'Delhi NCR', 'NCR',
  'Hyderabad', 'Pune', 'Kolkata', 'Noida', 'Greater Noida', 'Gurugram', 'Gurgaon', 'Faridabad',
  'Ghaziabad', 'Jaipur', 'Ahmedabad', 'Kochi', 'Cochin', 'Ernakulam', 'Coimbatore', 'Madurai',
  'Trichy', 'Tiruchirappalli', 'Salem', 'Chandigarh', 'Mohali', 'Panchkula', 'Indore', 'Bhopal',
  'Lucknow', 'Kanpur', 'Varanasi', 'Surat', 'Vadodara', 'Rajkot', 'Nagpur', 'Nashik', 'Thane',
  'Navi Mumbai', 'Visakhapatnam', 'Vizag', 'Vijayawada', 'Thiruvananthapuram', 'Trivandrum',
  'Kozhikode', 'Calicut', 'Thrissur', 'Mysuru', 'Mysore', 'Mangaluru', 'Mangalore', 'Hubballi',
  'Hubli', 'Belagavi', 'Patna', 'Ranchi', 'Bhubaneswar', 'Cuttack', 'Guwahati', 'Dehradun',
  'Shimla', 'Goa', 'Panaji', 'Puducherry', 'Pondicherry', 'Jodhpur', 'Udaipur', 'Amritsar',
  'Ludhiana', 'Jalandhar', 'Agra', 'Meerut', 'Allahabad', 'Prayagraj', 'Raipur', 'Gwalior',
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Doha', 'Riyadh', 'Singapore', 'London', 'New York',
  'San Francisco', 'Seattle', 'Austin', 'Chicago', 'Toronto', 'Vancouver', 'Sydney', 'Melbourne',
  'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Telangana', 'Kerala', 'Gujarat', 'Rajasthan',
  'Uttar Pradesh', 'West Bengal', 'Andhra Pradesh', 'Punjab', 'Haryana', 'Madhya Pradesh',
  'Bihar', 'Odisha', 'Assam', 'Jharkhand', 'Uttarakhand', 'Chhattisgarh',
];

const KNOWN_LOCATION_ONLY_REGEX = new RegExp(
  `^(?:${KNOWN_CITIES_AND_MODES.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?:\\s*,\\s*[A-Za-z\\s]+)?$`,
  'i'
);

const KNOWN_EMPLOYMENT_TYPES_REGEX =
  /^(Full[-\s]?time|Part[-\s]?time|Contract|Internship|Intern|Freelance|Self[-\s]?Employed|Temporary|Consultant)$/i;

const ACTION_VERB_START_REGEX =
  /^(Managed|Handled|Prepared|Coordinated|Checked|Used|Maintained|Identified|Compared|Followed|Collected|Processed|Connect|Connected|Research|Researched|Support|Supported|Developed|Designed|Built|Created|Implemented|Led|Assisted|Responsible|Collaborated|Negotiated|Evaluated|Analyzed|Analysed|Tracked|Monitored|Ensured|Reduced|Increased|Improved|Streamlined|Executed|Delivered|Oversaw|Supervised|Trained|Resolved|Communicated|Generated|Reviewed|Verified|Scheduled|Organized|Organised|Facilitated|Conducted|Performed|Maintains|Manages|Handles|Prepares|Coordinates|Checks|Supports|Connects|Identifies|Provides|Worked|Working|Helped|Contributed|Spearheaded|Initiated|Achieved|Drove|Established|Administered|Operated|Reviewed|Reconciled|Dispatched|Sourced|Purchased|Procured|Liaised)\b/i;

const KNOWN_LANGUAGES = [
  'English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Marathi', 'Gujarati',
  'Bengali', 'Bangla', 'Punjabi', 'Urdu', 'Odia', 'Oriya', 'Assamese', 'Konkani',
  'Kashmiri', 'Sanskrit', 'Sindhi', 'Manipuri', 'Nepali', 'Tulu', 'Bhojpuri', 'Rajasthani',
  'French', 'German', 'Spanish', 'Arabic', 'Mandarin', 'Chinese', 'Japanese', 'Korean',
  'Italian', 'Portuguese', 'Russian', 'Dutch', 'Turkish', 'Thai', 'Vietnamese', 'Indonesian',
];

const KNOWN_LANGUAGE_SET = new Set(KNOWN_LANGUAGES.map((l) => l.toLowerCase()));

// Curated keyword-to-canonical-skill dictionary for extracting real skills mentioned in experience/summary
const DOMAIN_SKILL_PATTERNS: Array<{ skill: string; regex: RegExp }> = [
  { skill: 'SAP MM', regex: /\bSAP\s+MM\b/i },
  { skill: 'SAP MIGO', regex: /\bMIGO\b/ },
  { skill: 'SAP MIRO', regex: /\bMIRO\b/ },
  { skill: 'SAP', regex: /\bSAP\b/ },
  { skill: 'Procurement', regex: /\bprocurement\b/i },
  { skill: 'Supplier Sourcing', regex: /\bsupplier\s+sourcing\b/i },
  { skill: 'Vendor Management', regex: /\bvendor\s+management\b|\bcoordinated\s+with\s+[\d–-]+\s*suppliers\b|\bsupplier\s+quotations\b/i },
  { skill: 'Purchase Orders', regex: /\bpurchase\s+orders?\b/i },
  { skill: 'RFQ & Quotation Comparison', regex: /\bRFQs?\b|\bquotation\s+comparisons?\b/i },
  { skill: 'Invoice Verification', regex: /\binvoice\s+verification\b|\bchecked\s+(?:supplier\s+)?invoices\b/i },
  { skill: 'IT Equipment Procurement', regex: /\bIT\s+equipment\s+procurement\b/i },
  { skill: 'Hospitality Procurement', regex: /\bhousekeeping\s+supplies\b|\bguest\s+amenities\b/i },
  { skill: 'Logistics & Supply Chain', regex: /\blogistics\b|\bsupply\s+chain\b/i },
  { skill: 'Business Development', regex: /\bbusiness\s+development\b/i },
  { skill: 'Client Acquisition', regex: /\bclient\s+acquisition\b/i },
  { skill: 'Microsoft Excel', regex: /\b(?:MS\s+|Microsoft\s+)?Excel\b/i },
  { skill: 'Power BI', regex: /\bPower\s*BI\b/i },
  { skill: 'Tableau', regex: /\bTableau\b/i },
  { skill: 'SQL', regex: /\bSQL\b/ },
  { skill: 'PostgreSQL', regex: /\bPostgreSQL\b/i },
  { skill: 'MySQL', regex: /\bMySQL\b/i },
  { skill: 'MongoDB', regex: /\bMongoDB\b/i },
  { skill: 'Python', regex: /\bPython\b/i },
  { skill: 'JavaScript', regex: /\bJavaScript\b/i },
  { skill: 'TypeScript', regex: /\bTypeScript\b/i },
  { skill: 'React', regex: /\bReact(?:\.js)?\b/i },
  { skill: 'Node.js', regex: /\bNode\.?js\b/i },
  { skill: 'Java', regex: /\bJava\b(?!Script)/ },
  { skill: 'AWS', regex: /\bAWS\b/ },
  { skill: 'Docker', regex: /\bDocker\b/i },
  { skill: 'Git', regex: /\bGit(?:Hub)?\b/ },
  { skill: 'Tally Prime', regex: /\bTally(?:\s+Prime|\s+ERP)?\b/i },
  { skill: 'GST & Taxation', regex: /\bGST\b/ },
  { skill: 'Inventory Management', regex: /\binventory\s+management\b/i },
  { skill: 'Operations Management', regex: /\boperations?\s+(?:management|support)\b/i },
  { skill: 'Project Management', regex: /\bproject\s+management\b/i },
  { skill: 'Agile & Scrum', regex: /\bAgile\b|\bScrum\b/i },
  { skill: 'Digital Marketing', regex: /\bdigital\s+marketing\b/i },
  { skill: 'SEO / SEM', regex: /\bSEO\b|\bSEM\b/ },
  { skill: 'CRM', regex: /\bCRM\b|\bSalesforce\b|\bHubSpot\b/i },
  { skill: 'Talent Acquisition', regex: /\btalent\s+acquisition\b|\brecruiting\b/i },
  { skill: 'Figma', regex: /\bFigma\b/i },
];

function cleanHeadingCandidate(line: string): string {
  return line
    .replace(/^#+\s*/, '')
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^__|__$/g, '')
    .replace(/^[\u2022•▪●\-–—|]+\s*/, '')
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
  return line.replace(BULLET_PREFIX_REGEX, '').trim();
}

function isBulletLine(line: string): boolean {
  return BULLET_PREFIX_REGEX.test(line);
}

function parseDateToken(token: string): { month: string; year: string } {
  const cleaned = token.trim();
  const yearMatch = cleaned.match(/\b(19|20)\d{2}\b/);
  const monthMatch = cleaned.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*/i
  );
  const rawMonth = monthMatch ? monthMatch[1] : '';
  const month = rawMonth
    ? rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1, 3).toLowerCase()
    : '';
  return {
    month,
    year: yearMatch ? yearMatch[0] : cleaned,
  };
}

function formatEducationDateToken(token: string): string {
  const parsed = parseDateToken(token);
  if (parsed.month && parsed.year) return `${parsed.month} ${parsed.year}`;
  return parsed.year || token.trim();
}

function normalizeEmploymentType(raw: string): ResumeEmploymentType {
  const lower = raw.trim().toLowerCase();
  if (lower.includes('part')) return 'Part-time';
  if (lower.includes('contract')) return 'Contract';
  if (lower.includes('intern')) return 'Internship';
  if (lower.includes('temp')) return 'Temporary';
  if (lower.includes('free') || lower.includes('consult') || lower.includes('self')) return 'Freelance';
  return 'Full-time';
}

/**
 * Checks whether a non-bullet line inside Work Experience is clearly a wrapped continuation
 * of the previous bullet/sentence rather than a new bullet or job header.
 */
function isWrappedContinuationLine(line: string, prevText: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (DATE_RANGE_REGEX.test(trimmed)) return false;

  const prevTrimmed = (prevText || '').trim();
  // If previous line clearly did not finish a sentence (no trailing . ! ? ;), join this line!
  if (prevTrimmed && !/[.!?;:]$/.test(prevTrimmed)) {
    return true;
  }
  // Starts with lowercase letter -> definitely a continuation
  if (/^[a-z]/.test(trimmed)) return true;
  // Very short trailing fragment ending with a period (e.g., "MIRO.", "processing.", "delivery timelines.")
  const wordCount = trimmed.split(/\s+/).length;
  if (/\.$/.test(trimmed) && wordCount <= 4 && !ACTION_VERB_START_REGEX.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Determines whether a non-bullet, non-date line inside Work Experience is a new job header
 * (e.g. "Purchase Executive — Metromax Group & Newfleet") using lookahead on the following lines.
 */
function looksLikeExperienceHeader(
  cleanLine: string,
  nextNonEmptyLine: string | undefined,
  secondNextNonEmptyLine: string | undefined
): boolean {
  if (!cleanLine || cleanLine.length > 110) return false;
  // Sentences ending in a period or starting with lowercase/action verbs are NEVER job headers
  if (/\.$/.test(cleanLine)) return false;
  if (/^[a-z]/.test(cleanLine)) return false;
  if (ACTION_VERB_START_REGEX.test(cleanLine)) return false;

  // Strongest signal: the very next non-empty line has a Date Range (2-line header pattern!)
  if (nextNonEmptyLine && !isBulletLine(nextNonEmptyLine) && DATE_RANGE_REGEX.test(nextNonEmptyLine)) {
    return true;
  }

  // 3-line header pattern: Line 1 = Title, Line 2 = Company (short, no period), Line 3 = Location | Date Range
  if (
    nextNonEmptyLine &&
    secondNextNonEmptyLine &&
    !isBulletLine(nextNonEmptyLine) &&
    !isBulletLine(secondNextNonEmptyLine) &&
    nextNonEmptyLine.length <= 75 &&
    !/\.$/.test(nextNonEmptyLine) &&
    !ACTION_VERB_START_REGEX.test(nextNonEmptyLine) &&
    DATE_RANGE_REGEX.test(secondNextNonEmptyLine)
  ) {
    return true;
  }

  // Explicit "Role — Company" or "Role | Company" or "Role at Company" short header
  if (cleanLine.length <= 90 && /\s(?:\||—|–| - | at )\s/i.test(cleanLine)) {
    const parts = cleanLine.split(/\s(?:\||—|–| - | at )\s/i).filter(Boolean);
    if (parts.length >= 2 && parts[0].split(/\s+/).length <= 7) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts languages from a list of text fragments, recognizing standard and regional languages
 * plus optional proficiency qualifiers (Native, Fluent, Professional, Conversational, Basic).
 */
function parseLanguageTokensFromText(
  lines: string[],
  strictKnownOnly = false
): ResumeLanguage[] {
  const results: ResumeLanguage[] = [];
  const seen = new Set<string>();

  const combined = lines
    .filter(Boolean)
    .join(',')
    .split(/[,|•·;\n]+/)
    .map((s) => stripBulletPrefix(s.replace(/\*\*/g, '').trim()))
    .filter(Boolean);

  for (const item of combined) {
    const profMatch = item.match(
      /(Native|Mother\s*Tongue|Fluent|Bilingual|Professional|Working\s*Proficiency|Conversational|Intermediate|Basic|Elementary)/i
    );
    const cleanedName = item
      .replace(/\([^)]*\)/g, '')
      .replace(
        /\b(?:Native|Mother\s*Tongue|Fluent|Bilingual|Professional|Working\s*Proficiency|Conversational|Intermediate|Basic|Elementary|Read|Write|Speak|Spoken|Written|Proficiency)\b/gi,
        ''
      )
      .replace(/[-–—:/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanedName || cleanedName.length < 2 || cleanedName.length > 30) continue;

    // Handle space-separated known languages like "English Hindi Kannada"
    const subTokens =
      !KNOWN_LANGUAGE_SET.has(cleanedName.toLowerCase()) &&
      cleanedName.split(/\s+/).every((w) => KNOWN_LANGUAGE_SET.has(w.toLowerCase()))
        ? cleanedName.split(/\s+/)
        : [cleanedName];

    for (const rawLang of subTokens) {
      const lower = rawLang.toLowerCase();
      if (strictKnownOnly && !KNOWN_LANGUAGE_SET.has(lower)) continue;
      if (seen.has(lower)) continue;
      seen.add(lower);

      const canonicalName =
        KNOWN_LANGUAGES.find((l) => l.toLowerCase() === lower) ||
        rawLang.charAt(0).toUpperCase() + rawLang.slice(1);

      let proficiency: ResumeLanguage['proficiency'] = 'Professional';
      if (profMatch) {
        const p = profMatch[1].toLowerCase();
        if (p.includes('native') || p.includes('mother')) proficiency = 'Native';
        else if (p.includes('fluent') || p.includes('bilingual')) proficiency = 'Fluent';
        else if (p.includes('conversational') || p.includes('intermediate')) proficiency = 'Conversational';
        else if (p.includes('basic') || p.includes('elementary')) proficiency = 'Basic';
        else proficiency = 'Professional';
      }

      results.push({
        id: `lang_${Date.now()}_${results.length}`,
        language: canonicalName,
        proficiency,
      });
    }
  }

  return results;
}

/**
 * Checks whether a standalone line consists purely of known languages (e.g. "English, Hindi, Kannada"
 * or "English (Fluent) | Hindi (Native)") even when placed without a "Languages" heading.
 */
function isStandaloneLanguageLine(line: string): boolean {
  const clean = stripBulletPrefix(line.replace(/\*\*/g, '').trim());
  if (!clean || clean.length > 110) return false;
  const parts = clean
    .split(/[,|•·/;]+/)
    .map((p) =>
      p
        .replace(/\([^)]*\)/g, '')
        .replace(/\b(?:Native|Mother\s*Tongue|Fluent|Bilingual|Professional|Conversational|Intermediate|Basic|Elementary|Read|Write|Speak)\b/gi, '')
        .replace(/[-–—:]+/g, ' ')
        .trim()
    )
    .filter(Boolean);

  if (parts.length === 0) return false;
  const matchedCount = parts.filter((p) => KNOWN_LANGUAGE_SET.has(p.toLowerCase())).length;
  // Require at least 2 known languages on a standalone line (or 1 with explicit proficiency like "English (Fluent)")
  if (matchedCount === parts.length && matchedCount >= 2) return true;
  if (
    matchedCount === 1 &&
    parts.length === 1 &&
    /\b(Native|Fluent|Professional|Conversational|Basic|Mother\s*Tongue)\b/i.test(clean)
  ) {
    return true;
  }
  return false;
}

/**
 * Parses unstructured resume text (from uploaded PDF, DOC, DOCX, or pasted text) into structured
 * ABHI JOBS ResumeData sections. 100% deterministic, private, and free — no external API required.
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
    if (/^[-=_*•·]{3,}$/.test(trimmed)) continue;

    // Catch inline "Languages: English, Hindi, Tamil" anywhere in the document
    const inlineLangMatch = trimmed.match(
      /^(?:Languages(?:\s+Known)?|Known\s+Languages|Spoken\s+Languages|Language\s+Proficiency)\s*[:\-–—]\s*(.+)$/i
    );
    if (inlineLangMatch) {
      buckets.languages.push(inlineLangMatch[1].trim());
      continue;
    }

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

    // Labelled lines (e.g. "Full Name: ...", "Location: Bengaluru, Karnataka")
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
      const segments = clean.split(/[|•·]/).map((s) => s.trim());
      for (const seg of segments) {
        if (
          !city &&
          seg &&
          !seg.includes('@') &&
          !/linkedin|http|www\./i.test(seg) &&
          seg.replace(/\D/g, '').length < 6 &&
          seg.length <= 50
        ) {
          const locParts = seg.split(',').map((p) => p.trim());
          if (locParts.length >= 2) {
            city = locParts[0];
            state = locParts.slice(1).join(', ');
          } else if (KNOWN_LOCATION_ONLY_REGEX.test(seg)) {
            city = seg;
          }
        }
      }
      continue;
    }

    // Also check if a standalone language line was placed inside header/personal details
    if (isStandaloneLanguageLine(clean)) {
      buckets.languages.push(clean);
      continue;
    }

    if (!fullName && clean.length <= 60 && !clean.includes(':') && !KNOWN_LOCATION_ONLY_REGEX.test(clean)) {
      fullName = clean;
    } else if (!city && KNOWN_LOCATION_ONLY_REGEX.test(clean)) {
      const locParts = clean.split(',').map((p) => p.trim());
      city = locParts[0] || '';
      state = locParts.slice(1).join(', ');
    } else if (!professionalTitle && clean.length <= 120) {
      professionalTitle = clean;
    } else if (!city && clean.includes(',') && clean.length <= 55) {
      const locParts = clean.split(',').map((p) => p.trim());
      city = locParts[0] || '';
      state = locParts.slice(1).join(', ');
    } else {
      unassignedLines.push(clean);
    }
  }

  // Fallback global scan for email/phone/LinkedIn if they appeared in footer/bottom
  if (!email) {
    const m = normalizedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (m) email = m[0];
  }
  if (!linkedIn) {
    const m = normalizedText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[a-zA-Z0-9_/%-]+/i);
    if (m) linkedIn = m[0];
  }

  // 2. Parse Professional Summary
  const summary = buckets.summary
    .filter(Boolean)
    .map((l) => l.replace(/\*\*/g, '').trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 3. Parse Work Experience (rejoins wrapped PDF lines, keeps 2-line & 3-line job headers unified,
  //    never turns wrapped fragments or city/Remote lines into fake jobs)
  const experiences: ResumeExperience[] = [];
  const expLines = buckets.experience.filter(Boolean);
  let currentExp: ResumeExperience | null = null;

  const createEmptyExp = (): ResumeExperience => ({
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
  });

  const pushCurrentExp = () => {
    if (
      currentExp &&
      (currentExp.jobTitle || currentExp.companyName || currentExp.responsibilities.length > 0)
    ) {
      if (!currentExp.jobTitle && currentExp.companyName) {
        currentExp.jobTitle =
          /^self[-\s]?employed$/i.test(currentExp.companyName)
            ? 'Independent Consultant'
            : currentExp.companyName;
      }
      experiences.push(currentExp);
    }
    currentExp = null;
  };

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i];
    const clean = line.replace(/\*\*/g, '').trim();
    if (!clean) continue;

    const nextLine = expLines[i + 1]?.replace(/\*\*/g, '').trim();
    const secondNextLine = expLines[i + 2]?.replace(/\*\*/g, '').trim();
    const dateMatch = clean.match(DATE_RANGE_REGEX);

    // Case A: Explicit bullet point line -> always belongs to current experience
    if (isBulletLine(line)) {
      const bulletText = stripBulletPrefix(clean);
      if (!currentExp) currentExp = createEmptyExp();
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

    // Case B: Line contains a Date Range
    if (dateMatch) {
      const startParsed = parseDateToken(dateMatch[1]);
      const endRaw = dateMatch[2].trim();
      const isCurrent = /present|current|now|ongoing|till\s*date/i.test(endRaw);
      const endParsed = isCurrent ? { month: '', year: '' } : parseDateToken(endRaw);
      const withoutDate = clean.replace(dateMatch[0], '').replace(/[()]+/g, ' | ').trim();
      const parts = withoutDate
        .split(/\s*(?:\||—|–|·|•| - | at |@)\s*/i)
        .map((p) => p.replace(/^[-|,\s]+|[-|,\s]+$/g, '').trim())
        .filter(Boolean);

      // Is this line the 2nd (or 3rd) line of the header we JUST started?
      const isContinuationOfHeader =
        Boolean(currentExp) &&
        Boolean(currentExp!.jobTitle || currentExp!.companyName) &&
        !currentExp!.startYear &&
        currentExp!.responsibilities.length === 0;

      if (!isContinuationOfHeader) {
        if (currentExp && (currentExp.responsibilities.length > 0 || currentExp.startYear)) {
          pushCurrentExp();
        }
        if (!currentExp) currentExp = createEmptyExp();
      }

      currentExp!.startMonth = startParsed.month;
      currentExp!.startYear = startParsed.year;
      currentExp!.endMonth = endParsed.month;
      currentExp!.endYear = endParsed.year;
      currentExp!.currentlyWorking = isCurrent;

      // Distribute remaining tokens smartly — NEVER put city/Remote/employmentType into jobTitle!
      for (const part of parts) {
        if (KNOWN_EMPLOYMENT_TYPES_REGEX.test(part)) {
          if (/self[-\s]?employed/i.test(part) && !currentExp!.companyName) {
            currentExp!.companyName = 'Self-Employed';
          } else {
            currentExp!.employmentType = normalizeEmploymentType(part);
          }
        } else if (KNOWN_LOCATION_ONLY_REGEX.test(part)) {
          if (!currentExp!.location) currentExp!.location = part;
        } else if (!currentExp!.jobTitle) {
          currentExp!.jobTitle = part;
        } else if (!currentExp!.companyName) {
          currentExp!.companyName = part;
        } else if (!currentExp!.location) {
          currentExp!.location = part;
        }
      }
      continue;
    }

    // Case C: Non-bullet, non-date line when we already have an active experience with responsibilities
    if (currentExp && currentExp.responsibilities.length > 0) {
      // Check if this is genuinely a NEW job header (via lookahead for date range or Role — Company pattern)
      if (looksLikeExperienceHeader(clean, nextLine, secondNextLine)) {
        pushCurrentExp();
      } else {
        const lastBullet = currentExp.responsibilities[currentExp.responsibilities.length - 1];
        if (isWrappedContinuationLine(clean, lastBullet)) {
          // Rejoin wrapped PDF sentence smoothly onto previous bullet!
          currentExp.responsibilities[currentExp.responsibilities.length - 1] =
            `${lastBullet} ${clean}`.replace(/\s+/g, ' ').trim();
        } else {
          // Separate bullet point whose bullet symbol was stripped by PDF extraction
          currentExp.responsibilities.push(clean);
        }
        continue;
      }
    }

    // Case D: Starting a new experience OR populating remaining header fields (company/location) before bullets start
    if (!currentExp) currentExp = createEmptyExp();

    // Sentences (starting with an action verb, ending with '.', or >75 chars) NEVER belong in jobTitle/companyName!
    const looksLikeSentence =
      ACTION_VERB_START_REGEX.test(clean) || /\.$/.test(clean) || clean.length > 75;
    const hasSomeHeader = Boolean(currentExp.jobTitle || currentExp.companyName || currentExp.startYear);
    if (hasSomeHeader && looksLikeSentence) {
      currentExp.responsibilities.push(clean);
      continue;
    }

    const parts = clean
      .split(/\s*(?:\||—|–|·|•| - | at |@)\s*/i)
      .map((p) => p.replace(/^[-|,\s]+|[-|,\s]+$/g, '').trim())
      .filter(Boolean);

    let assignedToHeader = false;
    for (const part of parts) {
      if (KNOWN_EMPLOYMENT_TYPES_REGEX.test(part)) {
        if (/self[-\s]?employed/i.test(part) && !currentExp.companyName) {
          currentExp.companyName = 'Self-Employed';
        } else {
          currentExp.employmentType = normalizeEmploymentType(part);
        }
        assignedToHeader = true;
      } else if (KNOWN_LOCATION_ONLY_REGEX.test(part)) {
        if (!currentExp.location) {
          currentExp.location = part;
          assignedToHeader = true;
        }
      } else if (!currentExp.jobTitle) {
        currentExp.jobTitle = part;
        assignedToHeader = true;
      } else if (!currentExp.companyName) {
        currentExp.companyName = part;
        assignedToHeader = true;
      } else if (!currentExp.location && part.length <= 40) {
        currentExp.location = part;
        assignedToHeader = true;
      }
    }

    if (!assignedToHeader) {
      currentExp.responsibilities.push(clean);
    }
  }
  pushCurrentExp();

  // 4. Parse Education (splits individual degrees/12th/10th even when PDF has no blank lines)
  const education: ResumeEducation[] = [];
  const eduRawLines = buckets.education.map((l) => l.replace(/\*\*/g, '').trim());

  const eduGroups: string[][] = [];
  let activeEduGroup: string[] = [];

  for (const rawLine of eduRawLines) {
    if (!rawLine) {
      if (activeEduGroup.length > 0) {
        eduGroups.push(activeEduGroup);
        activeEduGroup = [];
      }
      continue;
    }

    const clean = stripBulletPrefix(rawLine);
    const startsNewDegree = EDUCATION_ENTRY_START_REGEX.test(clean);
    const activeHasDegree = activeEduGroup.some((l) => EDUCATION_ENTRY_START_REGEX.test(l));
    const activeHasDates = activeEduGroup.some(
      (l) => DATE_RANGE_REGEX.test(l) || /\b(19|20)\d{2}\b/.test(l)
    );

    if (
      activeEduGroup.length > 0 &&
      ((startsNewDegree && (activeHasDegree || activeHasDates || activeEduGroup.length >= 2)) ||
        (activeHasDates && activeHasDegree && activeEduGroup.length >= 2))
    ) {
      eduGroups.push(activeEduGroup);
      activeEduGroup = [clean];
    } else {
      activeEduGroup.push(clean);
    }
  }
  if (activeEduGroup.length > 0) eduGroups.push(activeEduGroup);

  for (const block of eduGroups) {
    let degree = '';
    let institution = '';
    let location = '';
    let startDate = '';
    let endDate = '';
    let grade = '';
    const extraDesc: string[] = [];

    for (const line of block) {
      const clean = stripBulletPrefix(line);
      const dateMatch = clean.match(DATE_RANGE_REGEX);
      const singleYearMatch = clean.match(/\b(19|20)\d{2}\b/);
      const gradeMatch = clean.match(
        /(?:CGPA|GPA|Grade|Percentage|Score)\s*[:\-]?\s*([0-9.]+(?:\s*\/\s*[0-9.]+)?%?)/i
      );

      if (gradeMatch && !grade) {
        grade = gradeMatch[1].trim();
      }

      let remaining = clean;
      if (dateMatch) {
        startDate = formatEducationDateToken(dateMatch[1]);
        endDate = /present|current|ongoing|pursuing/i.test(dateMatch[2])
          ? 'Present'
          : formatEducationDateToken(dateMatch[2]);
        remaining = remaining.replace(dateMatch[0], '').trim();
      } else if (singleYearMatch && !endDate) {
        endDate = singleYearMatch[0];
        remaining = remaining.replace(singleYearMatch[0], '').trim();
      }

      if (gradeMatch) {
        remaining = remaining.replace(gradeMatch[0], '').trim();
      }

      const parts = remaining
        .split(/\s*(?:\||—|–| - |·)\s*/)
        .map((p) => p.replace(/^[,|\-–—\s]+|[,|\-–—\s]+$/g, '').trim())
        .filter(Boolean);

      for (const part of parts) {
        if (!degree && EDUCATION_ENTRY_START_REGEX.test(part)) {
          degree = part;
        } else if (!degree && !institution && block.length === 1) {
          degree = part;
        } else if (!degree) {
          degree = part;
        } else if (!institution) {
          institution = part;
        } else if (!location && KNOWN_LOCATION_ONLY_REGEX.test(part)) {
          location = part;
        } else {
          extraDesc.push(part);
        }
      }
    }

    // Extract fieldOfStudy hint if degree contains "in <Field>" (e.g. "B.Tech in Computer Science")
    let fieldOfStudy = extraDesc.join(' ').trim();
    if (!fieldOfStudy && degree) {
      const inMatch = degree.match(/\bin\s+([A-Za-z0-9 &/]+)$/i);
      if (inMatch) {
        fieldOfStudy = inMatch[1].trim();
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
        description: fieldOfStudy,
      });
    }
  }

  // 5. Parse Skills (supporting categorized lines + extracting key domain/tool skills from experience)
  const skillCategories = {
    technical: [] as string[],
    professional: [] as string[],
    industry: [] as string[],
    tools: [] as string[],
  };
  const allSkills: string[] = [];
  const seenSkillsLower = new Set<string>();

  const addSkill = (
    rawSkill: string,
    targetCategory: keyof typeof skillCategories = 'technical'
  ) => {
    const clean = rawSkill.trim();
    if (!clean || clean.length < 2 || clean.length > 48) return;
    const key = clean.toLowerCase();
    if (seenSkillsLower.has(key)) return;
    seenSkillsLower.add(key);
    skillCategories[targetCategory].push(clean);
    allSkills.push(clean);
  };

  for (const line of buckets.skills.filter(Boolean)) {
    const clean = stripBulletPrefix(line.replace(/\*\*/g, '').trim());
    // Skip standalone language lines that accidentally landed under Skills
    if (isStandaloneLanguageLine(clean)) {
      buckets.languages.push(clean);
      continue;
    }

    const catMatch = clean.match(/^([^:]{2,36}):\s*(.+)$/);
    let targetCategory: keyof typeof skillCategories = 'technical';
    let skillListStr = clean;

    if (catMatch) {
      const catLabel = catMatch[1].toLowerCase();
      skillListStr = catMatch[2];
      if (catLabel.includes('language')) {
        buckets.languages.push(skillListStr);
        continue;
      }
      if (
        catLabel.includes('soft') ||
        catLabel.includes('professional') ||
        catLabel.includes('interpersonal') ||
        catLabel.includes('leadership')
      ) {
        targetCategory = 'professional';
      } else if (
        catLabel.includes('tool') ||
        catLabel.includes('software') ||
        catLabel.includes('platform') ||
        catLabel.includes('erp')
      ) {
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
      .filter((s) => s.length >= 2 && s.length <= 48);

    for (const token of tokens) {
      addSkill(token, targetCategory);
    }
  }

  // Enrich skills from Summary + Work Experience if few skills were explicitly listed (or domain ERP/tools appear in bullets)
  const expAndSummaryCorpus = [
    summary,
    ...experiences.map((e) => `${e.jobTitle} ${e.responsibilities.join(' ')} ${(e.achievements || []).join(' ')}`),
  ].join('\n');

  for (const { skill, regex } of DOMAIN_SKILL_PATTERNS) {
    if (allSkills.length >= 24) break;
    if (regex.test(expAndSummaryCorpus)) {
      addSkill(skill, 'technical');
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
    .map((b) =>
      b
        .split('\n')
        .map((l) => l.replace(/\*\*/g, '').trim())
        .filter(Boolean)
    )
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

  // 8. Parse Languages (from dedicated bucket, Additional section, OR standalone language lines anywhere!)
  for (const addLine of buckets.additional.filter(Boolean)) {
    if (isStandaloneLanguageLine(addLine)) {
      buckets.languages.push(addLine);
    }
  }
  if (buckets.languages.length === 0) {
    for (const rawLine of rawLines) {
      if (isStandaloneLanguageLine(rawLine)) {
        buckets.languages.push(rawLine.trim());
      }
    }
  }
  const languages: ResumeLanguage[] = parseLanguageTokensFromText(buckets.languages, false);

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
  const remainingAdditional = buckets.additional
    .filter(Boolean)
    .filter((l) => !isStandaloneLanguageLine(l));
  if (remainingAdditional.length > 0) {
    customSections.push({
      id: `custom_${Date.now()}`,
      title: 'Additional Information',
      items: remainingAdditional.map((l) => stripBulletPrefix(l.replace(/\*\*/g, '').trim())),
    });
  }

  // Derive fallback location from first non-remote, non-generic-country work experience if header lacked city
  if (!city || city.toLowerCase() === 'india') {
    const expLoc = experiences.find(
      (e) =>
        e.location &&
        !/^(remote|hybrid|on-site|india)$/i.test(e.location.trim())
    )?.location;
    if (expLoc) {
      const locParts = expLoc.split(',').map((p) => p.trim());
      city = locParts[0] || '';
      state = locParts.slice(1).join(', ') || (city ? 'India' : '');
    }
  }

  // Derive fallback professional headline from most specific recent job title + top skills if header lacked one
  if (!professionalTitle && experiences.length > 0) {
    const primaryRole =
      experiences.find(
        (e) => e.jobTitle && !/^(self[-\s]?employed|freelance)$/i.test(e.jobTitle.trim())
      )?.jobTitle || experiences[0]?.jobTitle;
    if (primaryRole) {
      professionalTitle =
        allSkills.length > 0
          ? `${primaryRole} | ${allSkills.slice(0, 3).join(', ')}`
          : primaryRole;
    }
  }

  // Track which sections were successfully identified
  const detectedSections: string[] = [];
  if (fullName || email || phone || professionalTitle || city) {
    detectedSections.push('Personal Information');
  }
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
