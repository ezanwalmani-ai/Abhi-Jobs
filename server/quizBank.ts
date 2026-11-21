/**
 * SERVER-ONLY Learn with ABHI Quiz & Final Assessment Question Bank.
 *
 * SECURITY BOUNDARY:
 * This file MUST ONLY be imported by server.ts (Node backend).
 * Never import this module into src/ client bundles — correctOptionIndex and
 * explanation fields are strictly withheld by the backend until a candidate
 * submits their answers.
 */

export type AssessmentType = 'module_quiz' | 'final_assessment';

export interface ServerQuizQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctOptionIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface ServerAssessmentConfig {
  id: string;
  courseId: string;
  courseTitle: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  moduleOrder?: number;
  title: string;
  description: string;
  passPercentage: number;
  questionCount: number;
  randomizeOrder: boolean;
  requiredForCompletion: boolean;
  questions: ServerQuizQuestion[];
}

export interface ServerAttemptSummary {
  id: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  courseId: string;
  courseTitle: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  assessmentTitle: string;
  attemptNumber: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercent: number;
  passPercentage: number;
  passed: boolean;
  submittedAt: string;
}

type QSeed = [
  prompt: string,
  optA: string,
  optB: string,
  optC: string,
  optD: string,
  correctIndex: 0 | 1 | 2 | 3,
  explanation: string,
];

interface CourseQuizSeed {
  courseId: string;
  courseTitle: string;
  modules: Array<{
    moduleId: string;
    moduleOrder: number;
    moduleTitle: string;
    questions: QSeed[];
  }>;
  extraFinalQuestions: QSeed[];
}

function buildQuestions(prefix: string, seeds: QSeed[]): ServerQuizQuestion[] {
  return seeds.map((seed, idx) => ({
    id: `${prefix}_q${idx + 1}`,
    prompt: seed[0],
    options: [seed[1], seed[2], seed[3], seed[4]],
    correctOptionIndex: seed[5],
    explanation: seed[6],
  }));
}

const COURSE_SEEDS: CourseQuizSeed[] = [
  // 1. Excel for Job Seekers
  {
    courseId: 'course_excel_job_seekers',
    courseTitle: 'Excel for Job Seekers',
    modules: [
      {
        moduleId: 'mod_excel_1',
        moduleOrder: 1,
        moduleTitle: 'Spreadsheet Structure & Clean Formatting',
        questions: [
          [
            'Why should raw workplace datasets avoid merged cells and blank separator rows?',
            'They increase the font size automatically',
            'They break sorting, filtering, and PivotTable range detection',
            'They prevent saving the file as .xlsx',
            'They hide column letters from view',
            1,
            'Merged cells and blank rows interrupt contiguous ranges, causing sorting, filters, and PivotTables to miss rows or throw errors.',
          ],
          [
            'What keyboard shortcut converts a clean data range into a structured Excel Table?',
            'Ctrl + T',
            'Ctrl + Z',
            'Alt + F4',
            'Ctrl + P',
            0,
            'Ctrl + T creates an Excel Table with built-in filter headers and dynamic formula expansion.',
          ],
          [
            'Before running Remove Duplicates on an operational workbook, what is the safest best practice?',
            'Delete the header row first',
            'Keep an untouched copy of the raw data on a separate tab and highlight duplicates before deleting',
            'Sort only the email column independently of other columns',
            'Merge duplicate rows together manually',
            1,
            'Preserving a read-only Raw_Data tab and inspecting duplicates visually prevents accidental permanent data loss.',
          ],
        ],
      },
      {
        moduleId: 'mod_excel_2',
        moduleOrder: 2,
        moduleTitle: 'Everyday Formulas & Logical Functions',
        questions: [
          [
            'When dragging a formula down a column that multiplies each row by a single fixed rate in cell E1, how should E1 be written?',
            'E1',
            '$E$1',
            '#E1',
            'LOCK(E1)',
            1,
            'Adding dollar signs ($E$1) creates an absolute reference so the referenced cell stays locked when copied down.',
          ],
          [
            'Which formula counts how many cells in D2:D50 contain the exact word "Shortlisted"?',
            '=SUM(D2:D50, "Shortlisted")',
            '=COUNTIF(D2:D50, "Shortlisted")',
            '=IFCOUNT(D2:D50, "Shortlisted")',
            '=AVERAGE(D2:D50)',
            1,
            'COUNTIF(range, criteria) counts the exact number of cells matching a given condition.',
          ],
          [
            'What does the formula =IF(C2>=75, "Qualified", "Needs Review") return when C2 equals 72?',
            'Qualified',
            'Needs Review',
            '75',
            '#VALUE!',
            1,
            'Because 72 is less than 75, the condition evaluates to FALSE and returns the third argument ("Needs Review").',
          ],
        ],
      },
      {
        moduleId: 'mod_excel_3',
        moduleOrder: 3,
        moduleTitle: 'Lookups & Multi-Sheet Matching',
        questions: [
          [
            'In VLOOKUP(A2, Master!$A$2:$D$100, 3, FALSE), why is FALSE passed as the fourth argument?',
            'To hide error messages',
            'To require an exact match instead of an approximate match',
            'To sort the Master table descending',
            'To search only row 3',
            1,
            'Passing FALSE (or 0) forces VLOOKUP to perform an exact lookup rather than guessing the closest smaller value.',
          ],
          [
            'Which advantage does XLOOKUP have over classic VLOOKUP?',
            'It requires the lookup column to be on the far left',
            'It can search in any direction and includes a built-in not-found fallback value',
            'It works only on numbers, not text',
            'It removes duplicate rows automatically',
            1,
            'XLOOKUP separates lookup_array and return_array so it works left-to-right or right-to-left and accepts an optional if_not_found value.',
          ],
          [
            'When pulling Department from a Directory tab using Employee ID, what happens if an Employee ID is missing in XLOOKUP(..., "Not Found")?',
            'Excel crashes and closes',
            'The cell cleanly displays "Not Found"',
            'It copies the value from the row above',
            'It deletes the row automatically',
            1,
            'XLOOKUP’s fourth parameter returns a readable custom fallback such as "Not Found" instead of #N/A.',
          ],
        ],
      },
      {
        moduleId: 'mod_excel_4',
        moduleOrder: 4,
        moduleTitle: 'PivotTables & Summary Reporting',
        questions: [
          [
            'After updating raw figures in the source data tab, what must you do so an existing PivotTable reflects the new numbers?',
            'Delete the PivotTable and rebuild it from scratch',
            'Click Refresh / Refresh All in the Data or PivotTable Analyze menu',
            'Re-type the totals directly over the PivotTable cells',
            'Close Excel without saving',
            1,
            'PivotTables cache source data and update immediately when you click Refresh or Refresh All.',
          ],
          [
            'In a PivotTable showing Revenue by Region, where should the Region field and Revenue field be placed?',
            'Region in Values, Revenue in Filters',
            'Region in Rows, Revenue in Values',
            'Both fields in Filters',
            'Both fields in Columns',
            1,
            'Grouping categories (Region) belong in Rows/Columns while numeric metrics to aggregate (Revenue) belong in Values.',
          ],
          [
            'Why should numbers be formatted inside Value Field Settings -> Number Format in a PivotTable?',
            'So the currency and comma formatting persists even after the PivotTable refreshes',
            'Because Excel blocks font changes otherwise',
            'To convert numbers into text strings',
            'To hide Grand Totals permanently',
            0,
            'Formatting through Value Field Settings binds the number format to the field itself rather than temporary cell coordinates.',
          ],
        ],
      },
    ],
    extraFinalQuestions: [
      [
        'Which function adds numeric values in C2:C50 only for rows where B2:B50 equals "Bengaluru"?',
        '=SUMIF(B2:B50, "Bengaluru", C2:C50)',
        '=COUNT(B2:B50, "Bengaluru")',
        '=VLOOKUP("Bengaluru", C2:C50, 1, FALSE)',
        '=AVERAGE(C2:C50)',
        0,
        'SUMIF evaluates the criteria range first, matches "Bengaluru", and sums the corresponding cells in the sum range.',
      ],
      [
        'Why should you avoid typing currency symbols like "Rs." manually inside numeric cells?',
        'Manual text prefixes turn numbers into text strings, breaking SUM and AVERAGE formulas',
        'Excel does not support Indian currency symbols',
        'It makes the file unreadable on Windows',
        'It doubles the numeric value automatically',
        0,
        'Numbers should stay stored as pure numeric values with cell Number Formatting applied so calculations remain accurate.',
      ],
    ],
  },

  // 2. AI-Powered Presentations
  {
    courseId: 'course_ai_presentations',
    courseTitle: 'AI-Powered Presentations',
    modules: [
      {
        moduleId: 'mod_aipres_1',
        moduleOrder: 1,
        moduleTitle: 'Structuring a Clear Storyline First',
        questions: [
          [
            'What makes an "action title" stronger than a generic label like "Q3 Overview"?',
            'It uses all capital letters and decorative icons',
            'It states the key conclusion or takeaway directly so readers grasp the message immediately',
            'It lists every single data point on the slide',
            'It hides the conclusion until the final paragraph',
            1,
            'Conclusion-driven action titles let busy executives understand the entire storyline just by scanning slide headers.',
          ],
          [
            'What should you define BEFORE opening PowerPoint, Slides, or an AI presentation tool?',
            'Slide transition animations',
            'The target audience, core objective, and single most important takeaway',
            'Background gradient colors',
            'How many stock photos to insert',
            1,
            'Clarifying audience and objective first ensures every slide supports a coherent decision or takeaway.',
          ],
          [
            'In a 5-slide executive storyline, what should follow Context and Core Challenge?',
            'A glossary of terms',
            'Recommended Approach, Supporting Evidence, and Immediate Next Steps',
            'Unedited meeting transcripts',
            'Ten slides of decorative dividers',
            1,
            'Logical business decks move cleanly from Context -> Challenge -> Recommendation -> Evidence -> Next Steps.',
          ],
        ],
      },
      {
        moduleId: 'mod_aipres_2',
        moduleOrder: 2,
        moduleTitle: 'Drafting Slide Outlines with AI Prompts',
        questions: [
          [
            'Why do vague prompts like "Make a deck about marketing" produce weak slides?',
            'AI tools cannot generate slide outlines',
            'Without audience context and word-count limits, AI generates bloated, generic paragraphs',
            'Slides require at least 200 words each',
            'Prompts must always be written in code',
            1,
            'Providing real source notes, target audience, and strict bullet length constraints yields crisp, usable slide drafts.',
          ],
          [
            'What is a practical word-count discipline for clean business slides?',
            '1 action title plus up to 3 short bullets (around 12 words each)',
            'Full 4-paragraph essays pasted onto each slide',
            'Zero headings and 15 small footnotes',
            'At least 8 nested bullet levels per slide',
            0,
            'Concise bullets keep slides scannable while allowing the presenter’s voice to deliver supporting detail.',
          ],
          [
            'Which constraint helps prevent AI from fabricating fake statistics when drafting a deck?',
            'Ask it to use more adjectives',
            'Explicitly instruct it to use only facts from your input notes and never invent metrics',
            'Request 30 slides instead of 5',
            'Skip providing any background notes',
            1,
            'Grounding prompts in your actual notes with an explicit no-fabrication constraint protects factual integrity.',
          ],
        ],
      },
      {
        moduleId: 'mod_aipres_3',
        moduleOrder: 3,
        moduleTitle: 'Visual Restraint & Fact Verification',
        questions: [
          [
            'Roughly how much open whitespace should a clean, readable slide preserve?',
            '0% — fill every corner',
            'At least 30% open breathing room',
            'Only around the page number',
            'Whitespace should be removed to fit more charts',
            1,
            'Leaving at least 30% open whitespace improves readability and directs audience focus to the main insight.',
          ],
          [
            'What is the minimum recommended body text size so slides remain legible on laptops and projectors?',
            '8pt',
            '10pt',
            '16pt or larger',
            '4pt',
            2,
            'Keeping body text at 16pt or larger prevents squinting and naturally limits overcrowding.',
          ],
          [
            'Before sending or presenting an AI-assisted deck, what must you always verify?',
            'Every number, date, and factual claim against the original source material',
            'That every slide uses a different font family',
            'That slide transitions take at least 5 seconds',
            'That speaker notes duplicate the slide text word-for-word',
            0,
            'AI assistants can subtly round or distort numbers; human verification against source data is mandatory.',
          ],
        ],
      },
      {
        moduleId: 'mod_aipres_4',
        moduleOrder: 4,
        moduleTitle: 'Speaker Notes & Confident Delivery',
        questions: [
          [
            'How should speaker notes differ from the text displayed on the slide?',
            'They should be identical so you can read the slide verbatim',
            'Speaker notes should hold brief spoken cues and smooth transition lines while slides remain visual anchors',
            'Speaker notes should be left completely empty',
            'Speaker notes should be displayed in 24pt font on the slide itself',
            1,
            'Separating concise visual slides from conversational cues keeps listeners engaged instead of reading ahead.',
          ],
          [
            'What is a helpful habit right after advancing to a new slide?',
            'Speak as quickly as possible',
            'Pause for 2 seconds so listeners can read the slide title before you elaborate',
            'Apologize for the number of slides',
            'Skip explaining any chart shown on screen',
            1,
            'A brief 2-second pause allows the audience to absorb the visual headline cleanly.',
          ],
          [
            'For a 5-minute interview case presentation with 5 slides, approximately how long should you spend per slide?',
            '45 to 60 seconds per slide',
            '3 minutes on Slide 1 and 10 seconds on the rest',
            '5 seconds per slide',
            'Unplanned — keep talking until interrupted',
            0,
            'Pacing 45–60 seconds per slide respects panel time and leaves room for follow-up questions.',
          ],
        ],
      },
    ],
    extraFinalQuestions: [
      [
        'How many font families should a cohesive corporate presentation use at most?',
        'One or two complementary font families',
        'A different font on every slide',
        'Five display fonts mixed together',
        'Only script handwriting fonts',
        0,
        'Sticking to 1–2 fonts maintains clean visual hierarchy and corporate polish.',
      ],
    ],
  },

  // 3. ChatGPT for Job Seekers
  {
    courseId: 'course_chatgpt_job_seekers',
    courseTitle: 'ChatGPT for Job Seekers',
    modules: [
      {
        moduleId: 'mod_cgpt_js_1',
        moduleOrder: 1,
        moduleTitle: 'Prompting Fundamentals for Career Tasks',
        questions: [
          [
            'Which four elements make up the structured career prompt formula?',
            'Emojis, length, hashtags, and buzzwords',
            'Context, Goal/Input, Truthfulness Constraints, and Desired Output Format',
            'Only a job title and city name',
            'Copying a stranger’s resume into the prompt',
            1,
            'Specifying context, input, constraints, and format turns generic answers into tailored career assistance.',
          ],
          [
            'Why is stating your experience level (e.g., B.Com fresher vs. 4-year analyst) important in a career prompt?',
            'It changes the font color of the chat',
            'It calibrates the advice, terminology, and realistic expectations to your actual stage',
            'It unlocks paid features automatically',
            'It hides your city from the model',
            1,
            'Role-stage context ensures suggestions fit entry-level or experienced expectations rather than generic advice.',
          ],
          [
            'What is the main risk of sending a vague one-line prompt like "Write my resume"?',
            'It produces generic, cliché wording and may invent experience you do not have',
            'It permanently deletes your browser history',
            'It submits your resume to employers automatically',
            'It takes over 2 hours to respond',
            0,
            'Without your real facts and constraints, AI fills gaps with generic claims recruiters quickly spot.',
          ],
        ],
      },
      {
        moduleId: 'mod_cgpt_js_2',
        moduleOrder: 2,
        moduleTitle: 'Analyzing Job Descriptions & Skill Alignment',
        questions: [
          [
            'When running a Job Description (JD) alignment audit with ChatGPT, what are the three useful buckets to request?',
            'Salary, office snacks, and commute time',
            'Requirements you already meet, experience needing clearer wording, and genuine skill gaps to study',
            'Fake skills to add, fake titles to try, and random keywords',
            'Only the company’s founding year',
            1,
            'Separating strong matches, phrasing improvements, and real gaps focuses your prep honestly and efficiently.',
          ],
          [
            'What personal information should you remove before pasting your resume summary into a public AI chat?',
            'Your general skill names like Excel or Tally',
            'Phone number, full home address, government IDs, and private employer secrets',
            'Your target job role',
            'The job description responsibilities',
            1,
            'Redacting personal identifiers and confidential company records protects your privacy.',
          ],
          [
            'Why is a JD alignment audit better than blindly sending the same resume to 100 jobs?',
            'It highlights which real projects and skills are most relevant to each specific role',
            'It eliminates the need for interviews',
            'It automatically guarantees an offer',
            'It replaces learning actual job skills',
            0,
            'Tailoring truthful highlights to actual role priorities significantly improves recruiter clarity.',
          ],
        ],
      },
      {
        moduleId: 'mod_cgpt_js_3',
        moduleOrder: 3,
        moduleTitle: 'Fact-Safe Resume & Application Drafting',
        questions: [
          [
            'Which instruction prevents ChatGPT from exaggerating your accomplishments while editing resume bullets?',
            '"Make me sound like a CEO"',
            '"Do not invent percentages, revenue numbers, or tools I did not mention"',
            '"Add at least 5 impressive statistics to every bullet"',
            '"Use as many corporate buzzwords as possible"',
            1,
            'Explicit no-fabrication rules keep your resume 100% factual and defensible during live interviews.',
          ],
          [
            'How can you quickly test whether an AI-edited resume bullet sounds natural and authentic?',
            'Check if it is over 60 words long',
            'Read it aloud and confirm you can explain every word comfortably in a live interview',
            'Make sure it contains words like "synergistic paradigm"',
            'Avoid reading it before submitting',
            1,
            'If a bullet feels stiff or inflated when read aloud, simplify it into plain, honest English.',
          ],
          [
            'What three components make a strong, truthful resume bullet?',
            'Action verb, scope of what you did, and factual outcome or purpose',
            'Only a list of adjectives',
            'A paragraph describing your hobbies',
            'Unverified claims about team revenue',
            0,
            'Clear action + scope + truthful result communicates contribution concisely.',
          ],
        ],
      },
      {
        moduleId: 'mod_cgpt_js_4',
        moduleOrder: 4,
        moduleTitle: 'Practice Interviews & Privacy Safeguards',
        questions: [
          [
            'What is the most effective way to practice interviews using ChatGPT?',
            'Ask it to print 50 answers and memorize them word-for-word',
            'Have it ask one role-relevant question at a time, respond in your own words, and request feedback on clarity and structure',
            'Let it write answers about fictional jobs',
            'Skip practicing aloud entirely',
            1,
            'Iterative one-question-at-a-time practice builds genuine adaptability and natural phrasing.',
          ],
          [
            'Which of the following must NEVER be pasted into a public AI prompt?',
            'A public job posting',
            'Your Aadhaar/PAN number, personal address, or confidential client spreadsheets from a past employer',
            'A general behavioral interview question',
            'A list of Excel functions you want to learn',
            1,
            'Never share sensitive government IDs, private contact info, or confidential employer data with public AI chats.',
          ],
          [
            'After answering a mock interview question, what is a smart follow-up to ask the AI coach?',
            '"Give me a 100% score immediately"',
            '"Did I answer the question directly, and what follow-up question might an interviewer ask next?"',
            '"Rewrite my answer using unfamiliar technical jargon"',
            '"Ignore any gaps in my answer"',
            1,
            'Asking for structural critique and likely follow-up probes prepares you for real interview conversations.',
          ],
        ],
      },
    ],
    extraFinalQuestions: [
      [
        'What is the golden rule of using AI responsibly during a job search?',
        'Use AI to sharpen clarity and preparation while keeping every fact, project, and skill 100% truthful',
        'Copy AI drafts directly without reading them',
        'Use AI during closed-book proctored employer tests',
        'Replace all personal judgment with AI output',
        0,
        'Authentic, verified facts paired with clearer presentation earn lasting recruiter trust.',
      ],
    ],
  },

  // 4. Claude AI for Job Seekers
  {
    courseId: 'course_claude_ai_job_seekers',
    courseTitle: 'Claude AI for Job Seekers',
    modules: [
      {
        moduleId: 'mod_claude_1',
        moduleOrder: 1,
        moduleTitle: 'Working Effectively with Claude AI',
        questions: [
          [
            'Why is separating your source text from your task instructions with clear headings or tags effective when working with Claude?',
            'It prevents instructions and source material from blending together and yields more accurate editing',
            'It makes the response shorter than 5 words',
            'It removes the need to proofread',
            'It automatically submits applications',
            0,
            'Clear structural boundaries help Claude distinguish context, reference material, style preferences, and the exact task.',
          ],
          [
            'How can you preserve your authentic writing voice when collaborating with Claude on emails or cover notes?',
            'Ask it to sound overly academic',
            'Provide a short sample you wrote yourself and ask it to match your plain, direct tone',
            'Avoid giving any style instructions',
            'Ask it to double the word count',
            1,
            'A brief sample of your own writing anchors tone, sentence length, and natural phrasing.',
          ],
          [
            'What makes iterative editing superior to accepting the first draft blindly?',
            'Asking targeted follow-up critiques tightens clarity and ensures every claim remains accurate',
            'It takes longer with no benefit',
            'It adds more filler sentences',
            'It hides formatting issues',
            0,
            'Treating Claude as an editor for targeted revisions produces sharper, more authentic documents.',
          ],
        ],
      },
      {
        moduleId: 'mod_claude_2',
        moduleOrder: 2,
        moduleTitle: 'Synthesizing Company & Industry Research',
        questions: [
          [
            'Which public sources are ideal for creating a 1-page pre-interview company brief?',
            'Unverified rumors from anonymous forums only',
            'The company’s public About page, product overview, and official press releases or annual reports',
            'Private internal memos leaked online',
            'Competitors’ unrelated brochures',
            1,
            'Public company pages and official announcements give accurate grounding for interview conversations.',
          ],
          [
            'What should a practical 1-page pre-interview company brief include?',
            'Core offering, target customers, public priorities, how your role helps, and 3 thoughtful questions to ask',
            'Only the CEO’s birthday and office address',
            'A 15-page verbatim copy of the website',
            'A list of complaints about the industry',
            0,
            'Connecting the company’s priorities to your target role demonstrates genuine preparation.',
          ],
          [
            'How should you use your synthesized company brief during the interview?',
            'Read paragraphs aloud from the paper',
            'Use key insights naturally to connect your examples to the team’s goals and ask informed questions',
            'Quiz the interviewer on trivia from their website',
            'Ignore the brief once the call starts',
            1,
            'Weaving context smoothly into answers and closing questions signals maturity and interest.',
          ],
        ],
      },
      {
        moduleId: 'mod_claude_3',
        moduleOrder: 3,
        moduleTitle: 'Structured Case Studies & Writing Polish',
        questions: [
          [
            'Before asking Claude to critique a take-home case study, what should you do first?',
            'Ask Claude to invent the entire assignment without your input',
            'Draft your own hypothesis, assumptions, and proposed approach first',
            'Skip reading the employer’s prompt instructions',
            'Remove all numbers from the brief',
            1,
            'Forming your own structured thinking first ensures you own the logic and can defend it live.',
          ],
          [
            'How can Claude act as a useful "skeptical hiring panelist" on your case study draft?',
            'By identifying weak assumptions, edge cases, or unclear logic you should strengthen before submitting',
            'By praising every sentence uncritically',
            'By deleting your supporting evidence',
            'By replacing your analysis with generic quotes',
            0,
            'Stress-testing assumptions ahead of time prepares you for both written submission and live panel Q&A.',
          ],
          [
            'What belongs in a strong case-study self-review rubric?',
            'Clear problem definition, transparent assumptions, honest trade-offs, and prioritized next steps',
            'Complex jargon on every line',
            'Hiding all constraints or risks',
            'Ignoring the employer’s AI policy',
            0,
            'Decision-makers value transparent assumptions, realistic trade-offs, and actionable priorities.',
          ],
        ],
      },
      {
        moduleId: 'mod_claude_4',
        moduleOrder: 4,
        moduleTitle: 'Verification, Tone & Ethical Guidelines',
        questions: [
          [
            'When an employer specifies that an assessment must be completed without AI tools, what must you do?',
            'Follow the employer’s policy strictly and complete the assessment independently',
            'Use AI secretly anyway',
            'Ask AI to paraphrase the questions',
            'Submit someone else’s file',
            0,
            'Respecting assessment rules protects your professional integrity and ensures fair evaluation.',
          ],
          [
            'Why must you verify every fact, link, and technical detail in AI-assisted writing before sending it?',
            'AI models can occasionally generate plausible-sounding inaccuracies',
            'Because browsers block AI text automatically',
            'Verification is only needed for financial roles',
            'Spellcheckers cannot read AI text',
            0,
            'You are personally accountable for every word and figure attached to your name.',
          ],
          [
            'What should you check before pasting work samples from a prior employer into Claude?',
            'That no confidential, proprietary, or client-identifiable data is included',
            'That the file is in landscape mode',
            'That all employee phone numbers are visible',
            'Nothing — past work is always public',
            0,
            'Confidential employer and client data must always stay protected.',
          ],
        ],
      },
    ],
    extraFinalQuestions: [
      [
        'Which habit best ensures Claude-assisted applications stand out positively to recruiters?',
        'Verify facts manually, trim fluff, and keep the final wording grounded in your authentic voice and real projects',
        'Send 3-page cover letters full of generic praise',
        'Never edit the model’s output',
        'Use the exact same prompt output for every company',
        0,
        'Crisp, authentic, fact-checked writing always outperforms generic AI prose.',
      ],
    ],
  },

  // 5. ChatGPT for Customer Service
  {
    courseId: 'course_chatgpt_customer_service',
    courseTitle: 'ChatGPT for Customer Service',
    modules: [
      {
        moduleId: 'mod_cgpt_cs_1',
        moduleOrder: 1,
        moduleTitle: 'Privacy-First Customer Support Prompting',
        questions: [
          [
            'Before using an external AI assistant to help draft a customer reply, how should you handle the customer’s name, phone, and order number?',
            'Paste them directly so the AI remembers the customer',
            'Replace them with neutral placeholders like [Customer] and [Order_ID]',
            'Include only the credit card digits',
            'Share the full CRM screenshot',
            1,
            'Redacting all Personally Identifiable Information (PII) protects customer privacy and company compliance.',
          ],
          [
            'Where should the real verified customer name and order tracking details be inserted?',
            'Inside a public chat window',
            'Inside the company’s secure ticketing or CRM platform after drafting',
            'In a personal social media draft',
            'In the email subject line as plain card digits',
            1,
            'Always re-insert verified account details strictly inside the authorized support system.',
          ],
          [
            'Which item is strictly sensitive customer data that should never be copied into external AI tools?',
            'A generic question like "How do returns work?"',
            'Home address, payment details, passwords, phone numbers, and personal email addresses',
            'Public store hours',
            'General product category names',
            1,
            'Personal identifiers, account credentials, and financial details must never leave secure systems.',
          ],
        ],
      },
      {
        moduleId: 'mod_cgpt_cs_2',
        moduleOrder: 2,
        moduleTitle: 'Tone & Empathy in Challenging Tickets',
        questions: [
          [
            'What are the three core steps of the Acknowledge -> Explain -> Solve response framework?',
            'Blame policy -> Close ticket -> Send survey',
            'Acknowledge impact genuinely -> State verified status/action clearly -> Confirm concrete next step & realistic timeline',
            'Ignore frustration -> Offer an unauthorized refund -> End chat',
            'Copy legal terms -> Escalate immediately -> Wait a week',
            1,
            'Customers calm down fastest when they feel heard, get honest status, and know the exact next step and timeline.',
          ],
          [
            'If an AI-drafted reply offers a "50% courtesy refund" that is not allowed by company policy, what should you do?',
            'Send it anyway to keep the customer happy',
            'Remove the unauthorized promise and align the solution strictly with verified company policy',
            'Blame the AI tool in the email',
            'Delete the customer’s ticket',
            1,
            'Agents must review every draft for policy accuracy before sending.',
          ],
          [
            'Which opening line best demonstrates calm empathy for a delayed urgent order?',
            '"Shipping delays happen to everyone, please read our terms."',
            '"Thank you for reaching out — I understand how frustrating this delay has been, and I have checked your shipment status."',
            '"Calm down, your package will arrive eventually."',
            '"You should have ordered earlier."',
            1,
            'Validating frustration calmly without sounding defensive immediately lowers tension.',
          ],
        ],
      },
      {
        moduleId: 'mod_cgpt_cs_3',
        moduleOrder: 3,
        moduleTitle: 'Summarizing Threads & Escalation Handoffs',
        questions: [
          [
            'What four elements belong in a crisp internal escalation handoff note?',
            'Issue summary, verified context, troubleshooting already tried, and exact action needed from the specialist team',
            'Only "Please check ASAP"',
            'Forwarding 25 unedited emails with no summary',
            'Personal guesses about the customer’s mood only',
            0,
            'Structured handoff notes save Tier-2 resolution time and prevent customers from repeating themselves.',
          ],
          [
            'Why is summarizing a long customer thread valuable before replying or escalating?',
            'It ensures no sub-issue (such as both a billing query and a login error) gets missed',
            'It deletes the original messages permanently',
            'It shortens the customer’s warranty',
            'It avoids checking account status',
            0,
            'Multi-message threads often contain two or three distinct requests; summarizing catches every one.',
          ],
          [
            'What makes an escalation note actionable for a specialist?',
            'Stating the specific action required and any customer deadline clearly',
            'Writing vague phrases like "Need help here"',
            'Omitting the troubleshooting steps already completed',
            'Leaving out the product or plan type',
            0,
            'Clear next-action statements prevent back-and-forth internal delays.',
          ],
        ],
      },
      {
        moduleId: 'mod_cgpt_cs_4',
        moduleOrder: 4,
        moduleTitle: 'Building Reusable FAQ & Help Documentation',
        questions: [
          [
            'How should a self-service FAQ article title be phrased?',
            'Using internal engineering code names',
            'Using the natural phrasing customers actually search for (e.g., "How to download your GST invoice")',
            'As a single vague word like "Billing"',
            'In all capital letters with exclamation marks',
            1,
            'Customer-language titles help users find self-service answers immediately.',
          ],
          [
            'What formatting makes step-by-step customer instructions easiest to follow?',
            'One dense 200-word paragraph',
            'A direct 1-sentence opening answer followed by numbered steps with one action per step',
            'Unordered riddles',
            'Internal company acronyms with no definitions',
            1,
            'Numbered single-action steps reduce user errors and repeat support tickets.',
          ],
          [
            'When is the right time to turn a support ticket answer into a reusable Help Center article?',
            'Whenever the team sees customers asking the exact same question repeatedly',
            'Only once every five years',
            'Only for one-off account errors that affect a single user',
            'Never — keep answers private inside individual emails',
            0,
            'Turning recurring questions into clear self-service guides helps customers faster and lowers ticket volume.',
          ],
        ],
      },
    ],
    extraFinalQuestions: [
      [
        'What is the right balance between AI tools and human agents in customer support?',
        'Use AI to draft structure and summarize cleanly, while the human agent ensures privacy, genuine empathy, and strict policy accuracy',
        'Send unreviewed AI drafts automatically on complex complaints',
        'Paste full customer PII into public AI chats to save time',
        'Avoid documenting recurring solutions',
        0,
        'Human judgment, empathy, privacy discipline, and policy verification remain essential.',
      ],
    ],
  },

  // 6. Build Websites with AI
  {
    courseId: 'course_build_websites_ai',
    courseTitle: 'Build Websites with AI',
    modules: [
      {
        moduleId: 'mod_web_ai_1',
        moduleOrder: 1,
        moduleTitle: 'Planning Your Site Structure & Content',
        questions: [
          [
            'Which four core sections make a focused, recruiter-friendly personal portfolio website?',
            'Introduction, Selected Real Projects, Skills & Education, and Contact',
            'Ten empty blog pages, a live weather widget, and placeholder Latin text',
            'Only a giant animated logo with no links',
            'Fifty uncategorized screenshots without descriptions',
            0,
            'Recruiters scan portfolios in under a minute; clear intro, proof projects, skills, and contact info cover everything needed.',
          ],
          [
            'Why should you write your real portfolio text in a plain document BEFORE generating layouts with AI?',
            'So the website layout is designed around genuine, honest content instead of generic filler copy',
            'Because AI tools cannot read plain text',
            'To make the website slower to load',
            'So you can avoid writing project outcomes',
            0,
            'Content-first planning prevents awkward empty sections and fabricated descriptions.',
          ],
          [
            'What details make each project card in a portfolio credible to hiring managers?',
            'Problem addressed, your exact role/work, tools used, and concrete outcome',
            'Only a project title with no explanation',
            'Exaggerated metrics you cannot explain',
            'Copying a template demo project as your own',
            0,
            'Explaining problem, role, tools, and result proves genuine capability.',
          ],
        ],
      },
      {
        moduleId: 'mod_web_ai_2',
        moduleOrder: 2,
        moduleTitle: 'Prompting Clean Layouts & Components',
        questions: [
          [
            'What color-palette guideline prevents an AI-built site from looking cluttered or unprofessional?',
            'Use a calm neutral background, one dark primary text color, and one disciplined accent color',
            'Combine six bright neon colors on every section',
            'Use light grey text on a white background',
            'Change color palettes randomly between sections',
            0,
            'Restrained palettes create visual hierarchy and crisp readability.',
          ],
          [
            'Why is iterating one page section at a time more reliable than asking an AI builder to overhaul everything simultaneously?',
            'Focused edits preserve working sections and make layout issues easier to inspect and fix',
            'AI builders can only generate one paragraph total',
            'It removes mobile responsiveness',
            'It doubles hosting fees',
            0,
            'Incremental refinement maintains consistency across navigation, spacing, and typography.',
          ],
          [
            'How many primary navigation links work best for a clean personal portfolio header?',
            '3 to 5 concise links (e.g., About, Projects, Skills, Contact)',
            '18 multi-line dropdown menus',
            'Zero navigation and zero contact link',
            'Links pointing to unrelated external news sites',
            0,
            'Concise top navigation stays single-line on desktop and collapses cleanly on mobile.',
          ],
        ],
      },
      {
        moduleId: 'mod_web_ai_3',
        moduleOrder: 3,
        moduleTitle: 'Mobile Responsiveness & Usability Checks',
        questions: [
          [
            'What viewport width is a reliable baseline for checking mobile layout behavior in browser DevTools?',
            '375px',
            '2400px',
            '1920px',
            '1440px',
            0,
            'Testing around 360px–375px catches cramped grids, text overflow, and horizontal scrollbars on phones.',
          ],
          [
            'Which issue is a critical mobile usability defect that should be fixed before sharing your portfolio?',
            'Content spilling sideways and creating an unintended horizontal scrollbar',
            'Cards stacking cleanly in a single column',
            'Generous touch spacing on buttons',
            'Readable 16px body text',
            0,
            'Horizontal viewport overflow breaks mobile reading and signals unfinished layout testing.',
          ],
          [
            'Besides layout width, what else should be verified in a pre-launch QA check?',
            'Working links, comfortable tap targets, readable text contrast, and updated browser tab title',
            'Adding auto-playing background music',
            'Hiding your email address inside an unreadable graphic',
            'Leaving "Lorem ipsum" on secondary pages',
            0,
            'Broken links, weak contrast, and placeholder tab titles undermine first impressions.',
          ],
        ],
      },
      {
        moduleId: 'mod_web_ai_4',
        moduleOrder: 4,
        moduleTitle: 'Publishing & Maintaining Your Portfolio',
        questions: [
          [
            'Why should you open your published portfolio URL in an incognito/private browser window?',
            'To verify that recruiters can view the live site without hitting a login wall or broken private link',
            'To permanently delete your website cache',
            'To change the domain name',
            'Incognito mode automatically improves SEO rankings',
            0,
            'Testing logged-out confirms the public URL works seamlessly for external visitors.',
          ],
          [
            'Where should you place your verified portfolio URL to maximize recruiter visibility?',
            'In your resume contact header, LinkedIn profile, and ABHI JOBS candidate profile',
            'Only written on a sticky note on your desk',
            'Hidden at the bottom of a 10-page document',
            'Only sent after receiving an offer letter',
            0,
            'Placing your live link at the top of your resume and profiles lets reviewers inspect proof immediately.',
          ],
          [
            'How often is it good practice to review and refresh your portfolio website?',
            'Quarterly — adding new work, archiving outdated experiments, and checking contact info',
            'Never after initial launch',
            'Only after losing access to your email',
            'Every 10 years',
            0,
            'Periodic reviews keep your portfolio aligned with your current career goals and resume.',
          ],
        ],
      },
    ],
    extraFinalQuestions: [
      [
        'What matters most when presenting a personal website built with AI assistance to an employer?',
        'Honest content, clean mobile-friendly design, working links, and the ability to explain every project showcased',
        'Claiming you hand-coded a framework you have never used',
        'Adding as many complex 3D animations as possible',
        'Including fake client testimonials',
        0,
        'Clarity, truthfulness, and strong usability make a portfolio genuinely persuasive.',
      ],
    ],
  },

  // 7. Improve Your English
  {
    courseId: 'course_improve_your_english',
    courseTitle: 'Improve Your English',
    modules: [
      {
        moduleId: 'mod_eng_1',
        moduleOrder: 1,
        moduleTitle: 'Clarity First: Simple, Confident Sentences',
        questions: [
          [
            'Which sentence is the clearest, most modern workplace phrasing?',
            '"Kindly be informed that I am reverting back regarding the needful."',
            '"Thank you for checking in. Here is the latest status on the report."',
            '"Herewith attached please find the aforementioned documentation."',
            '"Myself writing to inform your good self."',
            1,
            'Modern business English favors direct, natural sentences over outdated filler phrases.',
          ],
          [
            'Which is the correct, natural way to introduce yourself in an interview?',
            '"Myself Rohan from Pune."',
            '"Hello, I am Rohan, and I am based in Pune."',
            '"I am having name Rohan."',
            '"Rohan myself speaking."',
            1,
            '"I am [Name]" or "My name is [Name]" is grammatically correct and professionally confident.',
          ],
          [
            'What is a helpful sentence-length guideline for clear workplace writing?',
            'Aim for 10 to 18 words per sentence with one clear idea per sentence',
            'Combine 5 unrelated topics into a single 80-word sentence',
            'Use only 2-word fragments',
            'Avoid punctuation to save space',
            0,
            'Concise sentences reduce misunderstanding and sound calm and authoritative.',
          ],
        ],
      },
      {
        moduleId: 'mod_eng_2',
        moduleOrder: 2,
        moduleTitle: 'Everyday Workplace Emails & Messages',
        questions: [
          [
            'What makes an email subject line effective for a busy recruiter?',
            '"Hello"',
            '"Application for Operations Executive — Priya Sharma"',
            '"Urgent please open!!!"',
            'Leaving the subject line blank',
            1,
            'A specific subject line stating purpose, role, and your name makes your email easy to locate and prioritize.',
          ],
          [
            'Where should the main purpose of a professional email appear?',
            'Right in the opening line after the greeting',
            'Hidden in the final sentence of paragraph four',
            'Only inside an attached PDF',
            'Nowhere — let the reader guess',
            0,
            'Stating your purpose upfront respects the reader’s time, especially on mobile screens.',
          ],
          [
            'Which phrase is the clearest replacement for "Kindly do the needful"?',
            '"Please do whatever is necessary soonest."',
            '"Please review and confirm the revised schedule by 4 PM Friday."',
            '"Do the needful ASAP."',
            '"Revert back the needful."',
            1,
            'Naming the exact action and deadline removes ambiguity.',
          ],
        ],
      },
      {
        moduleId: 'mod_eng_3',
        moduleOrder: 3,
        moduleTitle: 'Spoken Confidence in Calls & Meetings',
        questions: [
          [
            'What happens when you slow your speaking pace slightly and pause briefly between points during calls?',
            'Listeners think you forgot your answer',
            'Your pronunciation becomes clearer and you sound calmer and more composed',
            'Calls always get disconnected',
            'It sounds less professional than rushing',
            1,
            'Measured pacing and brief pauses improve clarity and project confidence.',
          ],
          [
            'If you did not clearly catch an interviewer’s question on a phone call, what is the most professional response?',
            'Guess what they asked and talk about something unrelated',
            '"Could you please repeat the last part of the question so I answer accurately?"',
            'Stay silent for 30 seconds',
            'Say "What?" abruptly',
            1,
            'Asking politely for repetition shows attentiveness and prevents off-topic answers.',
          ],
          [
            'What is a practical self-practice technique to reduce filler words like "um" or "actually"?',
            'Record a 60-second voice note, listen back calmly, and record a steadier second take',
            'Avoid speaking aloud until the day of the interview',
            'Memorize a dictionary',
            'Speak twice as fast so fillers are shorter',
            0,
            'Listening to short recordings builds self-awareness and steady spoken rhythm quickly.',
          ],
        ],
      },
      {
        moduleId: 'mod_eng_4',
        moduleOrder: 4,
        moduleTitle: 'Self-Introductions & Career Storytelling',
        questions: [
          [
            'What are the three parts of the Present -> Past -> Future self-introduction formula?',
            'Childhood hobbies -> Family tree -> Dream vacation',
            'Current focus/qualification -> 1–2 relevant achievements/projects -> Why this target role excites you',
            'Reading every address you lived at -> Reciting school marks -> Asking for salary immediately',
            'Only listing your age and hometown',
            1,
            'Present -> Past -> Future delivers a focused 60–90 second career narrative tailored to the role.',
          ],
          [
            'Approximately how long should a crisp "Tell me about yourself" introduction last?',
            '60 to 90 seconds',
            '8 to 10 minutes',
            '5 seconds',
            'Until the interviewer interrupts',
            0,
            'A 60–90 second overview gives strong context and invites natural follow-up dialogue.',
          ],
          [
            'Why should you practice your self-introduction aloud instead of memorizing a rigid script?',
            'Natural spoken familiarity sounds conversational rather than robotic if you lose a word',
            'Scripts are forbidden in all companies',
            'Reading off a screen makes eye contact better',
            'It eliminates the need to know your own resume',
            0,
            'Knowing your 3 key bullet points lets you adapt naturally to any interviewer.',
          ],
        ],
      },
    ],
    extraFinalQuestions: [
      [
        'Which closing line is best for a polite post-interview thank-you email?',
        '"Thank you again for your time. Please let me know if I can share any additional details, and I look forward to hearing from you."',
        '"Tell me right now if I got selected."',
        '"Kindly revert back immediately with offer."',
        '"No need to reply unless I am hired."',
        0,
        'Warm, concise, low-pressure closings leave a strong professional impression.',
      ],
    ],
  },

  // 8. Interview Preparation: Any Domain
  {
    courseId: 'course_interview_preparation',
    courseTitle: 'Interview Preparation: Any Domain',
    modules: [
      {
        moduleId: 'mod_int_1',
        moduleOrder: 1,
        moduleTitle: 'Pre-Interview Research & Role Mapping',
        questions: [
          [
            'Which three items form the core 30-minute pre-interview preparation routine?',
            'The job description priorities, every line of your own resume, and the company’s core business',
            'Memorizing unrelated trivia, skipping the JD, and guessing company products',
            'Only checking the office dress code',
            'Writing a 10-page script to read word-for-word',
            0,
            'Aligning the job’s key needs with your own real resume facts and company context anchors every answer.',
          ],
          [
            'Why should you review every single line of your own resume before an interview?',
            'Interviewers can ask you to explain any skill, date, or project you listed',
            'To memorize your own phone number',
            'Because resumes expire after 24 hours',
            'Only freshers need to review their resume',
            0,
            'Hesitating over a tool or project on your own resume quickly weakens credibility.',
          ],
          [
            'What is appropriate to keep beside you during a virtual video interview?',
            'A clean 1-page bullet reminder sheet plus notepad and pen (not a verbatim script)',
            'A full word-for-word script read straight off the monitor',
            'Loud social media tabs open in the background',
            'Nothing — even taking notes is discouraged',
            0,
            'Brief cue bullets help you stay organized while keeping natural eye contact and conversation.',
          ],
        ],
      },
      {
        moduleId: 'mod_int_2',
        moduleOrder: 2,
        moduleTitle: 'Structuring "Tell Me About Yourself" & Key Examples',
        questions: [
          [
            'In the STAR behavioral interview framework, what does STAR stand for?',
            'Speed, Timing, Attitude, Review',
            'Situation, Task, Action, Result',
            'Summary, Title, Audience, Role',
            'Skills, Training, Ambition, Resume',
            1,
            'STAR organizes behavioral examples cleanly into Situation, Task, Action, and Result.',
          ],
          [
            'Which part of a STAR story should receive the largest share of your speaking time (around 50%)?',
            'Long background history of the company',
            'Action — the specific steps YOU personally took to solve the problem',
            'Explaining what everyone else did',
            'Listing every date in the calendar',
            1,
            'Interviewers hire you for how you think and act, so detailing your own concrete steps matters most.',
          ],
          [
            'Why is building a 3–5 story "Story Bank" ahead of time so useful?',
            'A handful of real, well-structured experiences can be adapted naturally to almost any behavioral question',
            'It allows you to repeat the exact same answer five times in one interview',
            'It replaces technical knowledge completely',
            'It makes every answer 10 minutes long',
            0,
            'Prepared real stories prevent blanking out under pressure.',
          ],
        ],
      },
      {
        moduleId: 'mod_int_3',
        moduleOrder: 3,
        moduleTitle: 'Navigating Challenging & Situational Questions',
        questions: [
          [
            'What is the strongest way to answer "What is a weakness or area you are improving?"',
            'Say "I have no weaknesses" or "I work too hard"',
            'Share a genuine, non-fatal skill you actively worked on and explain the concrete habit you built to improve it',
            'List a core job requirement you refuse to learn',
            'Blame past managers for everything',
            1,
            'Honest self-awareness paired with measurable improvement shows maturity and coachability.',
          ],
          [
            'How should you respond if an interviewer asks about a specific tool listed in the JD that you have not used yet?',
            'Bluff and pretend you are an expert',
            'Be honest that you have not used it directly yet, connect any related tool experience, and explain how you would ramp up quickly',
            'Refuse to answer and end the interview',
            'Claim the tool is outdated',
            1,
            'Bluffing gets caught immediately in follow-up probes; transparent problem-solving earns trust.',
          ],
          [
            'What is the best tone when explaining a career gap?',
            'Brief, neutral, and honest about the reason, followed by what you learned and your readiness now',
            'Defensive and apologetic for five minutes',
            'Hiding the gap by altering employment dates',
            'Refusing to discuss it',
            0,
            'Calm, factual explanations reassure interviewers quickly and shift focus back to your current capability.',
          ],
        ],
      },
      {
        moduleId: 'mod_int_4',
        moduleOrder: 4,
        moduleTitle: 'Virtual & In-Person Etiquette & Follow-Up',
        questions: [
          [
            'When an interviewer asks "Do you have any questions for us?", what is the strongest approach?',
            'Say "No, I have no questions"',
            'Ask 2–3 thoughtful questions about first-90-day success, team priorities, or collaboration',
            'Ask only about vacation days in the very first screening',
            'Ask what the company sells',
            1,
            'Thoughtful closing questions demonstrate genuine engagement and help you evaluate role fit.',
          ],
          [
            'When should you test your camera, microphone, and internet before a virtual interview?',
            'At least 15 minutes before the scheduled start time',
            'Two minutes after the call begins',
            'Only if the interviewer complains',
            'Testing is unnecessary on laptops',
            0,
            'Early technical checks prevent avoidable audio/video stress and let you join 2–3 minutes early.',
          ],
          [
            'Within what timeframe should you send a brief, polite thank-you note after an interview?',
            'Within 24 hours',
            'Three weeks later',
            'Every two hours until you receive an offer',
            'Never send a follow-up',
            0,
            'A concise thank-you email within 24 hours reinforces professionalism and interest.',
          ],
        ],
      },
    ],
    extraFinalQuestions: [
      [
        'How long should a well-paced behavioral STAR answer typically take?',
        'Roughly 90 seconds to 2 minutes',
        '10 seconds',
        '8 minutes',
        'Half the interview',
        0,
        'Keeping each behavioral example crisp around 90–120 seconds leaves time for meaningful follow-up.',
      ],
    ],
  },

  // 9. How to Change Your Career Domain
  {
    courseId: 'course_change_career_domain',
    courseTitle: 'How to Change Your Career Domain',
    modules: [
      {
        moduleId: 'mod_chg_1',
        moduleOrder: 1,
        moduleTitle: 'Evaluating Target Roles & Transferable Strengths',
        questions: [
          [
            'What is a practical way to identify which skills truly matter in your target career domain?',
            'Guess based on one social media post',
            'Analyze 5 real job postings, highlight recurring skills, and map them against your proven transferable strengths',
            'Ignore job descriptions and apply randomly',
            'Discard all skills from your previous career',
            1,
            'Comparing real postings against your existing strengths reveals both immediate overlap and specific gaps.',
          ],
          [
            'Why do stepping-stone transitions (changing either function OR industry first) often succeed faster?',
            'They let you leverage proven domain or functional credibility while learning the new dimension',
            'They require zero effort',
            'Employers never hire domain switchers otherwise',
            'They eliminate the need to update your resume',
            0,
            'Bridging one dimension at a time lowers perceived hiring risk.',
          ],
          [
            'Which example shows a strong transferable skill from Customer Support into HR Coordination?',
            'Stakeholder communication, SLA tracking, documentation, and calm problem-solving',
            'Only memorizing product barcode numbers',
            'Having never used email',
            'Refusing to collaborate with teams',
            0,
            'Translating concrete operational habits across domains makes your background immediately relevant.',
          ],
        ],
      },
      {
        moduleId: 'mod_chg_2',
        moduleOrder: 2,
        moduleTitle: 'Designing a Practical 90-Day Skill Bridge',
        questions: [
          [
            'Why does completing 1–2 realistic sample projects carry more weight than passively watching dozens of unrelated videos?',
            'Tangible work samples lower recruiter risk by proving you can apply the new skills practically',
            'Videos never teach anything useful',
            'Projects replace the need for interviews',
            'Employers dislike structured learning',
            0,
            'Concrete proof-of-work artifacts demonstrate real execution in the target domain.',
          ],
          [
            'How is a focused 90-day skill bridge sensibly structured?',
            'Days 1–30 core foundations, Days 31–60 practical proof project(s), Days 61–90 repositioned resume and targeted outreach',
            'Days 1–90 waiting for recruiters to call without building skills',
            'Applying on Day 1 with no preparation and quitting on Day 10',
            'Switching target domains every week',
            0,
            'Phased 30-day blocks keep preparation measurable and realistic.',
          ],
          [
            'How many priority new skills should you focus on during a 90-day bridge?',
            '2 to 3 core skills that repeatedly appear in target job postings',
            '25 unrelated skills at once',
            'Zero new skills',
            'Only obscure skills not mentioned in job descriptions',
            0,
            'Depth in 2–3 high-demand skills beats shallow familiarity with dozens.',
          ],
        ],
      },
      {
        moduleId: 'mod_chg_3',
        moduleOrder: 3,
        moduleTitle: 'Updating Your Resume & Career Narrative',
        questions: [
          [
            'When repositioning your resume for a new domain, what rule about past job titles is non-negotiable?',
            'Keep past job titles and employment dates 100% honest and accurate',
            'Rewrite old job titles to match the new domain even if untrue',
            'Delete all employment dates',
            'Invent a fictional company',
            0,
            'Background checks verify job titles and dates; reposition honestly through your summary, projects, and relevant bullets.',
          ],
          [
            'Where should you place relevant transition projects on a career-switcher resume?',
            'Prominently near the top (below summary/skills) so recruiters see immediate domain evidence',
            'Omit them completely',
            'Buried in tiny font on page four',
            'Only mention them if asked twice',
            0,
            'Highlighting proof projects early signals serious readiness in the first 10 seconds of review.',
          ],
          [
            'What should a crisp career-switcher resume summary communicate?',
            'Your proven background, target role, transferable strengths, and concrete steps taken to transition',
            'Why you disliked your former colleagues',
            'An apology for changing domains',
            'Generic buzzwords with no target role named',
            0,
            'A focused 2–3 line summary connects the dots for recruiters immediately.',
          ],
        ],
      },
      {
        moduleId: 'mod_chg_4',
        moduleOrder: 4,
        moduleTitle: 'Networking & Interviewing as a Career Switcher',
        questions: [
          [
            'What is the strongest way to answer "Why are you switching domains?" in an interview?',
            'Frame it positively around pulling toward the new domain — combining past strengths, genuine interest, and concrete preparation already done',
            'Complain extensively about your previous boss and industry',
            'Say you are just trying random fields to see what sticks',
            'Avoid answering the question',
            0,
            'Positive, intentional transitions backed by real preparation inspire confidence.',
          ],
          [
            'Why is talking to people currently working in your target domain valuable during a career pivot?',
            'It clarifies day-to-day realities, key tools, and realistic entry paths beyond job ads',
            'To demand an immediate job offer in the first message',
            'So they write your resume for you',
            'Networking is only useful for senior executives',
            0,
            'Informational conversations uncover practical hiring expectations and sharpen your positioning.',
          ],
          [
            'How should you close a career-switcher interview explanation?',
            'By connecting your transferable skills + recent proof project directly to how you can add value on day one',
            'By reminding the panel that you have no relevant background',
            'By asking to switch to a different department',
            'By criticizing your own transition plan',
            0,
            'Ending on day-one contribution reframes your transition as an asset.',
          ],
        ],
      },
    ],
    extraFinalQuestions: [
      [
        'What is the biggest factor that convinces a hiring manager to give a career switcher an interview?',
        'Clear transferable overlap combined with visible, honest proof of effort and capability in the new domain',
        'Inflating past job titles',
        'Sending unedited generic resumes to unrelated roles',
        'Waiting five years before applying anywhere',
        0,
        'Transferable evidence plus tangible proof projects bridge the credibility gap.',
      ],
    ],
  },

  // 10. Professional Workplace Skills
  {
    courseId: 'course_professional_workplace_skills',
    courseTitle: 'Professional Workplace Skills',
    modules: [
      {
        moduleId: 'mod_work_1',
        moduleOrder: 1,
        moduleTitle: 'Managing Priorities & Competing Deadlines',
        questions: [
          [
            'When two urgent tasks collide and both cannot be completed by 4 PM, what is the most professional response?',
            'Stay silent and miss one deadline quietly',
            'Flag the trade-off early to your manager and propose a clear, realistic sequence for approval',
            'Rush both tasks and submit work full of errors',
            'Ignore the newer request completely',
            1,
            'Proactive communication gives managers visibility to reprioritize before deadlines slip.',
          ],
          [
            'What simple morning habit helps prevent spending the whole day reacting only to chat notifications?',
            'Identify your top 3 priority outcomes before opening inbox threads',
            'Turn off your computer until afternoon',
            'Accept every request without checking deadlines',
            'Rely purely on memory instead of a task list',
            0,
            'Defining top daily outcomes keeps high-impact work moving steadily.',
          ],
          [
            'When assigned a brand-new task, what two details should you confirm right away?',
            'The exact deadline and what "done" looks like (expected output/format)',
            'Only who will be blamed if it fails',
            'Nothing — guess the format',
            'Wait until the due date to ask questions',
            0,
            'Clarifying scope and deadline upfront prevents rework and missed expectations.',
          ],
        ],
      },
      {
        moduleId: 'mod_work_2',
        moduleOrder: 2,
        moduleTitle: 'Effective Team & Manager Communication',
        questions: [
          [
            'What three sections make up a crisp, scannable workplace status update?',
            'Completed (Done), In Progress (Doing + ETA), and Blockers / Input Needed',
            'Long personal stories, unrelated news, and emojis',
            'Only "Working on it"',
            'A 3-page unformatted essay',
            0,
            'Done / Doing / Blocked gives managers full clarity in under 30 seconds.',
          ],
          [
            'What is the most constructive way to receive critical feedback from a manager?',
            'Interrupt immediately to defend yourself',
            'Listen fully, summarize what you understood, and confirm one concrete adjustment you will apply',
            'Ignore the feedback silently',
            'Blame another teammate right away',
            1,
            'Calm, accountable receptiveness builds trust and accelerates professional growth.',
          ],
          [
            'Why is including a target date alongside "In Progress" items helpful in team updates?',
            'It sets clear expectations and reduces repeated "Any update?" follow-ups',
            'It guarantees no blockers will ever happen',
            'It replaces completing the work',
            'It makes emails longer',
            0,
            'Clear ETAs demonstrate ownership and keep stakeholders aligned.',
          ],
        ],
      },
      {
        moduleId: 'mod_work_3',
        moduleOrder: 3,
        moduleTitle: 'Everyday Problem-Solving at Work',
        questions: [
          [
            'Before escalating an operational snag to your manager, what should you prepare?',
            'Verified facts of what happened, immediate impact, 2 realistic options, and your recommended next step',
            'A single message saying "This is broken, what should I do?"',
            'Rumors without checking the actual file',
            'Waiting a full week to mention it',
            0,
            'Bringing structured facts and practical options shows initiative and problem-solving maturity.',
          ],
          [
            'Why is separating observed facts from guesses essential when diagnosing a workplace issue?',
            'Checking verified facts avoids chasing false causes and speeds up the right fix',
            'Guesses are always faster than checking data',
            'Managers prefer dramatic speculation',
            'Facts are only needed in engineering teams',
            0,
            'Fact-first diagnosis prevents wasted effort and miscommunication.',
          ],
          [
            'Even if your manager chooses a different option than your recommendation, why was proposing options still valuable?',
            'It saves decision time and demonstrates structured ownership',
            'It was a waste of time',
            'It means you failed the task',
            'You should stop proposing options in the future',
            0,
            'Framing clear trade-offs helps leaders decide quickly and signals readiness for bigger responsibilities.',
          ],
        ],
      },
      {
        moduleId: 'mod_work_4',
        moduleOrder: 4,
        moduleTitle: 'Professional Etiquette & Accountability',
        questions: [
          [
            'After a working team discussion, what simple habit prevents action items from being forgotten?',
            'Send a brief 3-line recap listing each Action Item, Owner, and Due Date',
            'Assume everyone remembered the same conclusion',
            'Schedule three more meetings without notes',
            'Wait until next month to check',
            0,
            'Written recaps align owners and due dates transparently across the team.',
          ],
          [
            'If you make a mistake on a deliverable, what builds the most trust with your team?',
            'Hide it and hope nobody notices',
            'Own it quickly, explain the fix underway, and note how you will prevent it next time',
            'Quietly blame a colleague',
            'Ignore follow-up messages',
            1,
            'Fast transparency and focus on resolution preserve long-term credibility.',
          ],
          [
            'Which behavior demonstrates strong remote/hybrid meeting etiquette?',
            'Joining on time, muting when not speaking in group calls, and staying attentive with notes ready',
            'Joining 10 minutes late with loud background noise unmuted',
            'Multitasking and repeatedly asking "Sorry, what did you just say?"',
            'Leaving without letting anyone know',
            0,
            'Punctuality and attentive participation show respect for everyone’s time.',
          ],
        ],
      },
    ],
    extraFinalQuestions: [
      [
        'Which workplace habit most consistently differentiates dependable early-career professionals?',
        'Closing the loop — confirming when tasks are finished, flagging risks early, and following through on commitments',
        'Working silently in isolation until deadlines pass',
        'Saying yes to every impossible deadline without clarifying priorities',
        'Avoiding written recaps',
        0,
        'Predictable follow-through and proactive communication build rapid professional trust.',
      ],
    ],
  },
];

// Build initial in-memory store keyed by assessment config ID (`quiz_<moduleId>` or `final_<courseId>`)
const assessmentConfigStore = new Map<string, ServerAssessmentConfig>();
const serverAttemptsStore: ServerAttemptSummary[] = [];

function initializeDefaultBank(): void {
  if (assessmentConfigStore.size > 0) return;

  for (const seed of COURSE_SEEDS) {
    const allCourseFinalQuestions: ServerQuizQuestion[] = [];

    for (const mod of seed.modules) {
      const modQuestions = buildQuestions(`mq_${mod.moduleId}`, mod.questions);
      const quizId = `quiz_${mod.moduleId}`;
      assessmentConfigStore.set(quizId, {
        id: quizId,
        courseId: seed.courseId,
        courseTitle: seed.courseTitle,
        assessmentType: 'module_quiz',
        moduleId: mod.moduleId,
        moduleOrder: mod.moduleOrder,
        title: `Module 0${mod.moduleOrder} Quiz: ${mod.moduleTitle}`,
        description: `Check your understanding of ${mod.moduleTitle} with ${modQuestions.length} quick multiple-choice questions.`,
        passPercentage: 70,
        questionCount: modQuestions.length,
        randomizeOrder: true,
        requiredForCompletion: true,
        questions: modQuestions,
      });

      // Contribute module questions to the course's comprehensive final assessment pool
      modQuestions.forEach((q, idx) => {
        allCourseFinalQuestions.push({
          ...q,
          id: `fa_${seed.courseId}_m${mod.moduleOrder}_${idx + 1}`,
        });
      });
    }

    const extraFinal = buildQuestions(`fa_${seed.courseId}_extra`, seed.extraFinalQuestions);
    const fullFinalPool = [...allCourseFinalQuestions, ...extraFinal];
    const finalId = `final_${seed.courseId}`;

    // Final course assessment: 10–20 questions (12 by default from actual course modules + synthesis), 70% pass score
    assessmentConfigStore.set(finalId, {
      id: finalId,
      courseId: seed.courseId,
      courseTitle: seed.courseTitle,
      assessmentType: 'final_assessment',
      title: `${seed.courseTitle} — Final Course Assessment`,
      description: `Comprehensive assessment covering all modules of ${seed.courseTitle}. Score at least 70% to pass and complete the course.`,
      passPercentage: 70,
      questionCount: Math.min(Math.max(10, fullFinalPool.length), 20),
      randomizeOrder: true,
      requiredForCompletion: true,
      questions: fullFinalPool,
    });
  }
}

initializeDefaultBank();

export function getAssessmentConfigById(id: string): ServerAssessmentConfig | undefined {
  return assessmentConfigStore.get(id);
}

export function getAssessmentConfig(
  courseId: string,
  assessmentType: AssessmentType,
  moduleId?: string
): ServerAssessmentConfig | undefined {
  const key = assessmentType === 'final_assessment' ? `final_${courseId}` : `quiz_${moduleId || ''}`;
  return assessmentConfigStore.get(key);
}

export function getCourseAssessments(courseId: string): {
  moduleQuizzes: ServerAssessmentConfig[];
  finalAssessment: ServerAssessmentConfig | null;
} {
  const moduleQuizzes: ServerAssessmentConfig[] = [];
  let finalAssessment: ServerAssessmentConfig | null = null;

  for (const cfg of assessmentConfigStore.values()) {
    if (cfg.courseId !== courseId) continue;
    if (cfg.assessmentType === 'module_quiz') {
      moduleQuizzes.push(cfg);
    } else if (cfg.assessmentType === 'final_assessment') {
      finalAssessment = cfg;
    }
  }

  moduleQuizzes.sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0));
  return { moduleQuizzes, finalAssessment };
}

export function updateAssessmentConfigSettings(
  configId: string,
  updates: Partial<Pick<ServerAssessmentConfig, 'passPercentage' | 'questionCount' | 'randomizeOrder' | 'requiredForCompletion' | 'title'>>
): ServerAssessmentConfig | null {
  const existing = assessmentConfigStore.get(configId);
  if (!existing) return null;

  const minPass = existing.assessmentType === 'final_assessment' ? 70 : 40;
  const passPercentage =
    typeof updates.passPercentage === 'number'
      ? Math.max(minPass, Math.min(100, Math.round(updates.passPercentage)))
      : existing.passPercentage;

  const maxAvailable = Math.max(1, existing.questions.length);
  const requestedCount =
    typeof updates.questionCount === 'number'
      ? Math.round(updates.questionCount)
      : existing.questionCount;
  const clampedCount = Math.max(1, Math.min(existing.assessmentType === 'final_assessment' ? 20 : 15, Math.min(maxAvailable, requestedCount)));

  const next: ServerAssessmentConfig = {
    ...existing,
    title:
      typeof updates.title === 'string' && updates.title.trim().length > 0
        ? updates.title.trim().slice(0, 180)
        : existing.title,
    passPercentage,
    questionCount: clampedCount,
    randomizeOrder:
      typeof updates.randomizeOrder === 'boolean'
        ? updates.randomizeOrder
        : existing.randomizeOrder,
    requiredForCompletion:
      typeof updates.requiredForCompletion === 'boolean'
        ? updates.requiredForCompletion
        : existing.requiredForCompletion,
  };

  assessmentConfigStore.set(configId, next);
  return next;
}

export function addOrUpdateQuestion(
  configId: string,
  question: {
    id?: string;
    prompt: string;
    options: [string, string, string, string];
    correctOptionIndex: 0 | 1 | 2 | 3;
    explanation: string;
  }
): { config: ServerAssessmentConfig; question: ServerQuizQuestion } | null {
  const existing = assessmentConfigStore.get(configId);
  if (!existing) return null;

  const qId =
    question.id && question.id.trim().length > 0
      ? question.id.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)
      : `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const sanitized: ServerQuizQuestion = {
    id: qId,
    prompt: question.prompt.trim().slice(0, 500),
    options: [
      question.options[0].trim().slice(0, 260),
      question.options[1].trim().slice(0, 260),
      question.options[2].trim().slice(0, 260),
      question.options[3].trim().slice(0, 260),
    ],
    correctOptionIndex: question.correctOptionIndex,
    explanation: question.explanation.trim().slice(0, 600),
  };

  const idx = existing.questions.findIndex((q) => q.id === qId);
  const nextQuestions =
    idx >= 0
      ? existing.questions.map((q, i) => (i === idx ? sanitized : q))
      : [...existing.questions, sanitized];

  const nextConfig: ServerAssessmentConfig = {
    ...existing,
    questions: nextQuestions.slice(0, 50),
  };

  assessmentConfigStore.set(configId, nextConfig);
  return { config: nextConfig, question: sanitized };
}

export function removeQuestion(configId: string, questionId: string): ServerAssessmentConfig | null {
  const existing = assessmentConfigStore.get(configId);
  if (!existing) return null;

  const nextQuestions = existing.questions.filter((q) => q.id !== questionId);
  if (nextQuestions.length === 0) return null; // Keep at least 1 question

  const nextConfig: ServerAssessmentConfig = {
    ...existing,
    questions: nextQuestions,
    questionCount: Math.min(existing.questionCount, nextQuestions.length),
  };
  assessmentConfigStore.set(configId, nextConfig);
  return nextConfig;
}

export function recordServerAttempt(attempt: ServerAttemptSummary): void {
  serverAttemptsStore.unshift(attempt);
  if (serverAttemptsStore.length > 500) {
    serverAttemptsStore.length = 500;
  }
}

export function getCandidateAttemptCount(
  userId: string,
  courseId: string,
  assessmentType: AssessmentType,
  moduleId?: string
): number {
  return serverAttemptsStore.filter(
    (a) =>
      a.userId === userId &&
      a.courseId === courseId &&
      a.assessmentType === assessmentType &&
      (assessmentType === 'final_assessment' || a.moduleId === moduleId)
  ).length;
}

export function listAllServerAttempts(filters?: {
  courseId?: string;
  assessmentType?: string;
}): ServerAttemptSummary[] {
  return serverAttemptsStore.filter((a) => {
    if (filters?.courseId && filters.courseId !== 'all' && a.courseId !== filters.courseId) {
      return false;
    }
    if (
      filters?.assessmentType &&
      filters.assessmentType !== 'all' &&
      a.assessmentType !== filters.assessmentType
    ) {
      return false;
    }
    return true;
  });
}

export function deleteServerAttemptById(attemptId: string): boolean {
  const idx = serverAttemptsStore.findIndex((a) => a.id === attemptId);
  if (idx === -1) return false;
  serverAttemptsStore.splice(idx, 1);
  return true;
}
