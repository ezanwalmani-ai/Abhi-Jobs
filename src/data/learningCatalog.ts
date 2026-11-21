import {
  CourseLesson,
  CourseModule,
  LearningAssessmentDomain,
  LearningCategory,
  LearningCourseItem,
} from '../types/learning';

export const LEARNING_CATEGORIES: LearningCategory[] = [
  {
    id: 'excel-digital-skills',
    name: 'Excel and Digital Skills',
    shortDescription: 'Spreadsheets, workplace software, and practical digital fluency.',
  },
  {
    id: 'ai-productivity',
    name: 'AI and Productivity',
    shortDescription: 'Practical AI tools, prompting workflows, and modern workplace productivity.',
  },
  {
    id: 'communication-english',
    name: 'Communication and English',
    shortDescription: 'Clear business writing, spoken clarity, and professional communication.',
  },
  {
    id: 'interview-preparation',
    name: 'Interview Preparation',
    shortDescription: 'Structured interview responses, preparation habits, and confidence.',
  },
  {
    id: 'career-development',
    name: 'Career Development',
    shortDescription: 'Career transitions, positioning, and long-term growth planning.',
  },
  {
    id: 'workplace-skills',
    name: 'Workplace Skills',
    shortDescription: 'Collaboration, prioritization, and dependable professional habits.',
  },
];

interface SeedLessonSpec {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  writtenContent: string;
  exerciseTitle: string;
  exerciseInstructions: string;
  exerciseDeliverable: string;
  resourceTitle: string;
  resourceType: 'PDF' | 'Checklist' | 'Template' | 'Workbook';
  worksheetContent: string;
}

interface SeedModuleSpec {
  id: string;
  title: string;
  summary: string;
  lessons: SeedLessonSpec[];
}

function buildModules(courseId: string, specs: SeedModuleSpec[]): CourseModule[] {
  return specs.map((mod, modIdx) => ({
    id: mod.id,
    order: modIdx + 1,
    title: mod.title,
    summary: mod.summary,
    quizPlanned: true,
    lessons: mod.lessons.map((l, lIdx): CourseLesson => ({
      id: l.id,
      courseId,
      moduleId: mod.id,
      order: lIdx + 1,
      title: l.title,
      description: l.description,
      videoUrl: '',
      estimatedMinutes: l.estimatedMinutes,
      writtenContent: l.writtenContent,
      exercise: {
        title: l.exerciseTitle,
        instructions: l.exerciseInstructions,
        deliverable: l.exerciseDeliverable,
      },
      attachments: [
        {
          id: `att_${l.id}`,
          title: l.resourceTitle,
          url: '',
          fileType: l.resourceType,
          sizeLabel: 'PDF Study Sheet',
          worksheetContent: l.worksheetContent,
        },
      ],
    })),
  }));
}

/**
 * Structured curriculum for all 10 Learn with ABHI catalogue courses.
 * Video URLs are intentionally left blank until administrators attach real video links.
 * Written learning material, exercises, and downloadable study sheets are ready for immediate self-paced study.
 */
export const LEARNING_CATALOGUE_COURSES: LearningCourseItem[] = [
  // 1. Excel for Job Seekers
  {
    id: 'course_excel_job_seekers',
    slug: 'excel-for-job-seekers',
    categoryId: 'excel-digital-skills',
    categoryName: 'Excel and Digital Skills',
    title: 'Excel for Job Seekers',
    shortDescription:
      'Build practical spreadsheet confidence for everyday office reporting, formulas, data cleanup, and entry-level Excel assessments.',
    fullDescription:
      'A structured, practical course designed to help job seekers handle everyday workplace Excel tasks clearly — from formatting structured tables to applying core lookup and summary formulas accurately.',
    level: 'Beginner',
    estimatedDuration: 'Est. 3–4 hours',
    isFree: true,
    sequentialUnlock: true,
    courseIntroduction: {
      headline: 'Master the spreadsheet habits employers test in real hiring rounds',
      overview:
        'Whether you are applying for operations, finance, HR, sales coordination, or analyst roles, managers rely on clean spreadsheets. This course walks step-by-step through table hygiene, core functions, cross-sheet lookups, and clear summary reports.',
      studyGuidance: [
        'Complete lessons in order so each concept builds naturally on the previous one.',
        'Open Microsoft Excel or Google Sheets alongside each lesson to try every practical exercise.',
        'Download the PDF reference sheet in each lesson so you can revise before assessments.',
      ],
      prerequisites: 'No prior Excel experience required. Basic familiarity with typing and navigating files on a computer is enough.',
    },
    whatYouWillLearn: [
      'Organize raw workplace tables cleanly using sorting, filtering, and consistent number formatting.',
      'Write reliable core formulas including SUM, AVERAGE, IF, COUNTIF, and absolute cell references.',
      'Match records across two worksheets accurately with XLOOKUP and VLOOKUP.',
      'Summarize datasets quickly with clean PivotTables and clear charts for team reviews.',
    ],
    skillsDeveloped: [
      'Microsoft Excel',
      'Spreadsheet Formulas',
      'Data Organization',
      'Workplace Reporting',
    ],
    modules: buildModules('course_excel_job_seekers', [
      {
        id: 'mod_excel_1',
        title: 'Spreadsheet Structure & Clean Formatting',
        summary: 'Establish tidy rows, clear headers, data types, and readable table layouts.',
        lessons: [
          {
            id: 'les_excel_1_1',
            title: 'Organizing Raw Data into Clean Tables',
            description: 'Learn why clean headers, one-value-per-cell discipline, and Excel Tables prevent downstream formula errors.',
            estimatedMinutes: 15,
            writtenContent: `In workplace spreadsheets, most formula problems start with messy table layouts rather than complex math. Before writing a single formula, ensure every dataset follows three foundational rules:\n\n1. Use a single, descriptive header row with no merged cells.\n2. Keep one type of information per column — dates formatted as dates, currency as numbers, and names in dedicated columns.\n3. Avoid blank separator rows inside a dataset, because blank rows break sorting, filtering, and PivotTable ranges.\n\nConverting a clean data range into a structured Excel Table (Ctrl + T) automatically applies filter arrows, keeps headers visible while scrolling, and expands formulas dynamically when new rows are added.`,
            exerciseTitle: 'Clean Up a Messy Candidate Tracker',
            exerciseInstructions:
              'Create a 10-row sheet with columns: Candidate Name, City, Application Date, Expected CTC, and Status. Convert it into an Excel Table, apply currency formatting to Expected CTC, standardize dates to DD-MMM-YYYY, and sort the sheet by Application Date (newest first).',
            exerciseDeliverable: 'A cleanly formatted 10-row Excel Table with consistent date and number formats.',
            resourceTitle: 'Spreadsheet Hygiene Checklist',
            resourceType: 'Checklist',
            worksheetContent:
              'EXCEL TABLE HYGIENE CHECKLIST\n\n[ ] Single header row without merged cells\n[ ] Consistent date format across the entire date column\n[ ] Numeric columns stored as numbers (no currency symbols typed manually)\n[ ] No blank rows or subtotals mixed inside raw data\n[ ] Freeze top row enabled for smooth scrolling\n[ ] Converted range into an Excel Table (Ctrl + T)',
          },
          {
            id: 'les_excel_1_2',
            title: 'Sorting, Filtering & Removing Duplicates Safely',
            description: 'Narrow large operational sheets down to exact records without corrupting row alignment.',
            estimatedMinutes: 15,
            writtenContent: `Hiring tests frequently ask candidates to isolate specific regions, date ranges, or status groups from hundreds of rows. Always apply Multi-Level Sorting (for example, sorting first by City A–Z and then by Revenue highest-to-lowest) instead of sorting one isolated column.\n\nBefore using Remove Duplicates, always keep an untouched copy of the raw data tab. Decide explicitly which columns define a unique record — for instance, Email Address rather than First Name, so two different people sharing a name are not accidentally deleted.`,
            exerciseTitle: 'Multi-Level Filter & Duplicate Audit',
            exerciseInstructions:
              'Duplicate your tracker tab to preserve raw data. Add 2 duplicate rows with the same email address. Use Conditional Formatting -> Highlight Duplicate Values to inspect them first, then remove duplicates based only on the Email column and filter to show only "Shortlisted" candidates.',
            exerciseDeliverable: 'A de-duplicated sheet filtered by status with the original raw data preserved on Tab 1.',
            resourceTitle: 'Sorting & Filtering Quick Guide',
            resourceType: 'PDF',
            worksheetContent:
              'SORTING, FILTERING & DE-DUPLICATION GUIDE\n\n1. Always keep Tab 1 as "Raw_Data" (read-only).\n2. Perform cleanup on a duplicate tab named "Working_Data".\n3. Highlight duplicates visually before deleting.\n4. Use Multi-Level Sort when ranking within categories.\n5. Check the bottom-left status bar to verify filtered row counts.',
          },
        ],
      },
      {
        id: 'mod_excel_2',
        title: 'Everyday Formulas & Logical Functions',
        summary: 'Master SUM, AVERAGE, IF, COUNTIF, and locked references for dependable calculations.',
        lessons: [
          {
            id: 'les_excel_2_1',
            title: 'Core Aggregations & Absolute Cell References ($)',
            description: 'Understand relative vs. locked cell references so copied formulas never drift.',
            estimatedMinutes: 20,
            writtenContent: `Every Excel formula starts with an equals sign (=). Functions like SUM, AVERAGE, MIN, and MAX quickly summarize numeric columns. However, the single most common beginner error in Excel tests happens when dragging a formula down a column while referencing a fixed rate or target cell.\n\nRelative references (like B2) shift automatically when copied down or across. Adding dollar signs ($E$1) locks both the column and row — called an Absolute Reference. Pressing F4 while editing a cell reference cycles cleanly through $E$1, E$1, $E1, and E1.`,
            exerciseTitle: 'Calculate Commission & % of Total',
            exerciseInstructions:
              'Create a 6-row sales table with Representative Name and Monthly Sales. Place a single commission rate (e.g., 8%) in cell E1. Write one formula using $E$1 to calculate Commission for all 6 rows, plus a "% of Total Sales" column referencing the locked grand total cell.',
            exerciseDeliverable: 'A sales commission sheet where formulas drag cleanly across all rows with zero #REF! or zero-value errors.',
            resourceTitle: 'Essential Excel Formulas Reference Sheet',
            resourceType: 'PDF',
            worksheetContent:
              'ESSENTIAL WORKPLACE FORMULAS\n\n=SUM(B2:B20)          Total of a numeric range\n=AVERAGE(B2:B20)      Mean value\n=B2*$E$1              Multiply row value by locked rate in E1\n=B2/$B$21             Share of grand total\nShortcut: Press F4 to toggle absolute references ($).',
          },
          {
            id: 'les_excel_2_2',
            title: 'Conditional Logic with IF, COUNTIF & SUMIF',
            description: 'Automate status labels and targeted summaries without manual counting.',
            estimatedMinutes: 20,
            writtenContent: `Managers rarely ask for just a grand total — they ask how many orders are delayed, or what total revenue came from a specific city. Conditional functions answer those questions automatically:\n\n• =IF(C2>=75, "Qualified", "Needs Review") evaluates a condition and returns clear text or numbers.\n• =COUNTIF(D2:D50, "Shortlisted") counts exact matches.\n• =SUMIF(B2:B50, "Bengaluru", C2:C50) adds numbers only for rows matching the criterion.\n\nPair these functions with clean text spellings (no trailing spaces!) so every matching row is counted accurately.`,
            exerciseTitle: 'Automated Status & Region Summary',
            exerciseInstructions:
              'Add a Score column (0–100) to a 10-row sheet. Use =IF() to mark scores >= 70 as "Pass" and others as "Retake". Underneath, build a 3-row summary box using COUNTIF to count Pass vs. Retake and SUMIF to total sales by region.',
            exerciseDeliverable: 'Dynamic status column and automated KPI summary block.',
            resourceTitle: 'IF, COUNTIF & SUMIF Practice Workbook Notes',
            resourceType: 'Workbook',
            worksheetContent:
              'CONDITIONAL LOGIC PATTERNS\n\n1. Pass/Fail Check:\n   =IF(Score>=70, "Pass", "Review")\n\n2. Count by Category:\n   =COUNTIF(StatusRange, "Shortlisted")\n\n3. Sum by Category:\n   =SUMIF(CityRange, "Mumbai", AmountRange)\n\nTip: Avoid hardcoding text inside formulas when you can point to a label cell.',
          },
        ],
      },
      {
        id: 'mod_excel_3',
        title: 'Lookups & Multi-Sheet Matching',
        summary: 'Connect data reliably across two tables using VLOOKUP and XLOOKUP.',
        lessons: [
          {
            id: 'les_excel_3_1',
            title: 'Matching Records with VLOOKUP & XLOOKUP',
            description: 'Pull employee departments, product prices, or candidate cities from a reference sheet accurately.',
            estimatedMinutes: 25,
            writtenContent: `In real offices, information lives in separate tables — for example, an Orders sheet contains Customer IDs while a Master Customers sheet stores City and Account Manager. Lookup functions connect them automatically.\n\nWith VLOOKUP:\n=VLOOKUP(A2, Master!$A$2:$D$100, 3, FALSE)\nAlways pass FALSE (or 0) as the final argument so Excel performs an exact match rather than an approximate guess.\n\nWith modern XLOOKUP:\n=XLOOKUP(A2, Master!$A$2:$A$100, Master!$C$2:$C$100, "Not Found")\nXLOOKUP searches in any direction and includes a built-in fallback message when an ID is missing.`,
            exerciseTitle: 'Two-Sheet Employee Lookup',
            exerciseInstructions:
              'Create Tab 1 ("Attendance") with Employee ID and Days Present. Create Tab 2 ("Directory") with Employee ID, Full Name, and Department. Write a lookup formula in Tab 1 to pull Full Name and Department cleanly, handling one intentionally missing ID with "Not Found".',
            exerciseDeliverable: 'Working cross-sheet lookup using exact match and graceful missing-value handling.',
            resourceTitle: 'VLOOKUP vs XLOOKUP Comparison Sheet',
            resourceType: 'PDF',
            worksheetContent:
              'LOOKUP SYNTAX QUICK CARD\n\nVLOOKUP:\n=VLOOKUP(lookup_value, table_array, col_index_num, FALSE)\n- Lookup column must be the leftmost column of table_array.\n- Always lock table_array with $ signs.\n\nXLOOKUP:\n=XLOOKUP(lookup_value, lookup_array, return_array, "Not Found")\n- Works left-to-right or right-to-left.\n- Built-in error fallback without needing IFERROR.',
          },
        ],
      },
      {
        id: 'mod_excel_4',
        title: 'PivotTables & Summary Reporting',
        summary: 'Turn raw operational tables into concise executive summaries in minutes.',
        lessons: [
          {
            id: 'les_excel_4_1',
            title: 'Building a Clean PivotTable Summary',
            description: 'Group hundreds of rows by category, month, or owner without writing complex array formulas.',
            estimatedMinutes: 20,
            writtenContent: `A PivotTable lets you slice and summarize large datasets interactively. Click anywhere inside a clean Excel Table, select Insert -> PivotTable, and place it on a new worksheet.\n\nDrag your primary grouping field (such as Department or Region) into Rows, your metric (such as Sales or Applications) into Values, and optional time periods into Columns. Format numbers immediately inside Value Field Settings -> Number Format so totals remain readable even after refreshing.`,
            exerciseTitle: 'Create a 1-Page Weekly Summary Report',
            exerciseInstructions:
              'Using a 15-row dataset with Date, Region, Category, and Revenue, insert a PivotTable showing total Revenue by Region (rows) and Category (columns). Add a clean horizontal bar chart below the table with clear title and data labels.',
            exerciseDeliverable: 'A formatted PivotTable paired with a clutter-free summary chart.',
            resourceTitle: 'Executive Summary Report Checklist',
            resourceType: 'Template',
            worksheetContent:
              'PIVOTTABLE REPORTING CHECKLIST\n\n[ ] Source data has no blank headers or merged cells\n[ ] Numbers formatted with commas and consistent decimals\n[ ] Grand totals checked against raw data sum\n[ ] Meaningful chart title stating the key insight\n[ ] Remember to click Data -> Refresh All when raw rows change',
          },
        ],
      },
    ]),
  },

  // 2. AI-Powered Presentations
  {
    id: 'course_ai_presentations',
    slug: 'ai-powered-presentations',
    categoryId: 'ai-productivity',
    categoryName: 'AI and Productivity',
    title: 'AI-Powered Presentations',
    shortDescription:
      'Learn how to structure clear business decks faster using AI outlining workflows while keeping content accurate and readable.',
    fullDescription:
      'A structured practical course focused on turning rough meeting notes or reports into crisp, executive-ready presentations with AI assistance and disciplined human editing.',
    level: 'Beginner',
    estimatedDuration: 'Est. 2–3 hours',
    isFree: true,
    sequentialUnlock: true,
    courseIntroduction: {
      headline: 'Turn rough ideas into persuasive, uncluttered slides faster',
      overview:
        'Strong business presentations start with logical structure, not decorative templates. Learn how to collaborate with AI tools to outline storylines, compress long notes into sharp takeaways, verify facts, and deliver with confidence.',
      studyGuidance: [
        'Practice each lesson with a real presentation topic from your studies, work, or target job role.',
        'Treat AI output as a structured first draft — always verify claims and trim unnecessary words.',
      ],
      prerequisites: 'Basic familiarity with PowerPoint, Google Slides, or Canva.',
    },
    whatYouWillLearn: [
      'Break a complex topic into a concise slide-by-slide narrative before designing slides.',
      'Use AI assistants to tighten verbose paragraphs into scannable slide takeaways.',
      'Maintain clean visual hierarchy, consistent typography, and accurate supporting figures.',
      'Prepare concise speaker notes for interviews, case studies, and client updates.',
    ],
    skillsDeveloped: [
      'Presentation Structuring',
      'AI Outlining Workflows',
      'Executive Communication',
      'Slide Clarity',
    ],
    modules: buildModules('course_ai_presentations', [
      {
        id: 'mod_aipres_1',
        title: 'Structuring a Clear Storyline First',
        summary: 'Define audience, core objective, and slide sequence before touching slide design.',
        lessons: [
          {
            id: 'les_aipres_1_1',
            title: 'Audience-First Slide Architecture',
            description: 'Map a logical 5-slide storyline using Situation, Problem, Recommendation, Evidence, and Next Steps.',
            estimatedMinutes: 15,
            writtenContent: `Before opening any slide tool or AI assistant, answer three questions in one sentence each: Who is in the room? What decision or understanding should they leave with? What is the single most important takeaway?\n\nHigh-impact corporate decks follow action titles — instead of titling a slide "Q3 Sales Overview", write "Q3 Revenue Grew 14% Driven by Repeat Accounts". A reader scanning only your slide titles should understand the entire argument.`,
            exerciseTitle: 'Draft a 5-Slide Action-Title Outline',
            exerciseInstructions:
              'Pick a topic you could present in an interview (e.g., a college project or process improvement idea). Write 5 slide titles where every title states a concrete conclusion rather than a vague label.',
            exerciseDeliverable: 'A 5-line action-title storyline ready for slide drafting.',
            resourceTitle: '5-Slide Business Storyline Template',
            resourceType: 'Template',
            worksheetContent:
              '5-SLIDE EXECUTIVE STORYLINE\n\nSlide 1 — Context & Objective (Why we are here)\nSlide 2 — Core Challenge or Opportunity (What the data shows)\nSlide 3 — Recommended Approach (What we should do)\nSlide 4 — Supporting Evidence & Impact (Why it works)\nSlide 5 — Timeline & Immediate Next Steps (Who does what next)',
          },
        ],
      },
      {
        id: 'mod_aipres_2',
        title: 'Drafting Slide Outlines with AI Prompts',
        summary: 'Use structured prompts to convert raw notes into crisp, scannable slide content.',
        lessons: [
          {
            id: 'les_aipres_2_1',
            title: 'Turning Raw Notes into Crisp Slide Bullets',
            description: 'Give AI strict word-count limits and audience constraints to avoid walls of text.',
            estimatedMinutes: 20,
            writtenContent: `When asked vaguely to "make a presentation about X", AI tools produce long, repetitive paragraphs that nobody reads on screen. Instead, feed your real notes with strict structural instructions:\n\n• Specify audience level (e.g., "hiring manager with 5 minutes").\n• Restrict each slide to 1 action title + maximum 3 bullets of 12 words each.\n• Ask the tool to suggest one concrete visual (comparison table, simple bar chart, or process flow) per slide.`,
            exerciseTitle: 'Compress a 300-Word Note into 3 Slides',
            exerciseInstructions:
              'Take a 2–3 paragraph project write-up of your own. Rewrite or prompt an AI assistant to condense it into 3 slides with max 3 short bullets per slide, keeping all original facts intact.',
            exerciseDeliverable: 'Three crisp slide drafts containing under 40 words per slide.',
            resourceTitle: 'Presentation Prompting Framework',
            resourceType: 'PDF',
            worksheetContent:
              'PRESENTATION PROMPT STRUCTURE\n\nRole: Act as an executive communications editor.\nAudience: [Hiring Manager / Client / Team Lead]\nInput Notes: [Paste your factual notes]\nConstraints:\n- Create exactly [5] slides.\n- Use conclusion-driven titles.\n- Max 3 bullets per slide, under 12 words each.\n- Do not invent statistics or metrics.',
          },
        ],
      },
      {
        id: 'mod_aipres_3',
        title: 'Visual Restraint & Fact Verification',
        summary: 'Edit out clutter, check every number, and keep layouts readable on any screen.',
        lessons: [
          {
            id: 'les_aipres_3_1',
            title: 'The 60-Second Slide Polish & Fact Check',
            description: 'Verify every claim, align spacing cleanly, and keep contrast legible from the back row.',
            estimatedMinutes: 15,
            writtenContent: `AI tools can accidentally round numbers inaccurately or introduce generic claims you did not provide. Before sharing any deck, verify every figure against your original source.\n\nVisually, leave at least 30% open whitespace on each slide, stick to two fonts at most, use consistent alignment, and keep body text at least 16pt so slides remain effortless to read on laptops and projectors alike.`,
            exerciseTitle: 'Audit & Declutter One Sample Slide',
            exerciseInstructions:
              'Review one slide you built previously. Remove any decorative borders or duplicate text, increase font readability, verify every number, and cut the total word count by at least 30%.',
            exerciseDeliverable: 'A cleaned, verified slide with clear hierarchy and generous whitespace.',
            resourceTitle: 'Pre-Presentation Verification Checklist',
            resourceType: 'Checklist',
            worksheetContent:
              'SLIDE QUALITY & FACT-CHECK LIST\n\n[ ] Every figure and date verified against source data\n[ ] Minimum 16pt body text size\n[ ] At least 30% open whitespace per slide\n[ ] Consistent margins, alignment, and palette\n[ ] Zero typos or placeholder text remaining',
          },
        ],
      },
      {
        id: 'mod_aipres_4',
        title: 'Speaker Notes & Confident Delivery',
        summary: 'Separate what appears on the slide from what you say aloud.',
        lessons: [
          {
            id: 'les_aipres_4_1',
            title: 'Writing Conversational Speaker Notes',
            description: 'Speak naturally using short cue points rather than reading verbatim off the screen.',
            estimatedMinutes: 15,
            writtenContent: `Your slides should serve as visual anchors while your voice provides the story. Write 2–3 brief bullet cues in your speaker notes per slide — including a natural transition sentence into the next slide (e.g., "Now that we have seen the customer bottleneck, let us look at how we reduced response time").\n\nTime yourself aloud once: aiming for 45–60 seconds per slide keeps 5-minute interview case presentations crisp and respectful of panel time.`,
            exerciseTitle: 'Rehearse a 3-Minute Walkthrough',
            exerciseInstructions:
              'Draft concise speaker cues for your 3–5 slide outline, set a timer for 3 minutes, and present aloud once without reading slide bullets word-for-word.',
            exerciseDeliverable: 'Timed speaker notes with smooth slide-to-slide transitions.',
            resourceTitle: 'Speaker Delivery Cue Card',
            resourceType: 'PDF',
            worksheetContent:
              'DELIVERY CUE CARD\n\n1. Pause 2 seconds after changing a slide so listeners read the title.\n2. Highlight one key takeaway per slide.\n3. Use transition phrases between slides.\n4. End with a clear summary and invite questions.',
          },
        ],
      },
    ]),
  },

  // 3. ChatGPT for Job Seekers
  {
    id: 'course_chatgpt_job_seekers',
    slug: 'chatgpt-for-job-seekers',
    categoryId: 'ai-productivity',
    categoryName: 'AI and Productivity',
    title: 'ChatGPT for Job Seekers',
    shortDescription:
      'Use ChatGPT responsibly to analyze job descriptions, refine your resume wording truthfully, and rehearse interview questions.',
    fullDescription:
      'A focused practical course showing candidates how to pair ChatGPT with their own real experience to research companies, organize job applications, and practice clear answers without fabricating details.',
    level: 'Beginner',
    estimatedDuration: 'Est. 2–3 hours',
    isFree: true,
    sequentialUnlock: true,
    courseIntroduction: {
      headline: 'Use AI as a smart career assistant while staying 100% authentic',
      overview:
        'Recruiters quickly spot generic, copy-pasted AI applications. This course teaches you how to write structured prompts that clarify job requirements, sharpen your real accomplishments truthfully, and help you practice tough interview questions.',
      studyGuidance: [
        'Never paste sensitive personal details like government IDs, bank details, or private employer data into public AI chats.',
        'Always review and edit every draft in your own natural voice before submitting an application.',
      ],
      prerequisites: 'No technical background required.',
    },
    whatYouWillLearn: [
      'Write clear, structured prompts that give relevant career guidance instead of generic output.',
      'Analyze job descriptions to identify real skill gaps and key role responsibilities.',
      'Polish resume bullets and cover notes while keeping every fact 100% truthful.',
      'Simulate structured mock interview questions and review your own answers critically.',
    ],
    skillsDeveloped: [
      'ChatGPT Prompting',
      'Job Search Productivity',
      'Role Research',
      'Responsible AI Use',
    ],
    modules: buildModules('course_chatgpt_job_seekers', [
      {
        id: 'mod_cgpt_js_1',
        title: 'Prompting Fundamentals for Career Tasks',
        summary: 'Frame clear role, context, task, and constraints for helpful career outputs.',
        lessons: [
          {
            id: 'les_cgpt_js_1_1',
            title: 'The 4-Part Career Prompt Formula',
            description: 'Replace vague one-line prompts with Context, Goal, Constraints, and Output Format.',
            estimatedMinutes: 15,
            writtenContent: `Generic prompts create generic advice. Compare:\n\nWeak prompt: "Help me prepare for a marketing job."\nStructured prompt: "I am a B.Com fresher applying for an entry-level Digital Marketing Coordinator role in Pune. Based on the job description below, list the top 5 practical skills the employer prioritizes and suggest 3 ways I can demonstrate them using my college event project. Keep the output concise and practical."\n\nAlways specify your background level, target role, factual constraints ("do not invent skills"), and desired format.`,
            exerciseTitle: 'Rewrite 2 Vague Prompts into Structured Prompts',
            exerciseInstructions:
              'Take two career questions you currently have (such as resume wording or role research) and rewrite each using Context + Goal + Truthfulness Constraint + Format.',
            exerciseDeliverable: 'Two reusable, structured career prompts saved in your job-search notes.',
            resourceTitle: 'Career Prompt Formula Reference',
            resourceType: 'PDF',
            worksheetContent:
              'THE 4-PART CAREER PROMPT FORMULA\n\n1. Context: Your actual background & target role\n2. Input: Job description or your factual project notes\n3. Constraints: "Use only facts provided; keep tone concise and natural"\n4. Format: Bullet list, comparison table, or Q&A checklist',
          },
        ],
      },
      {
        id: 'mod_cgpt_js_2',
        title: 'Analyzing Job Descriptions & Skill Alignment',
        summary: 'Decode job postings to separate core must-have skills from nice-to-have extras.',
        lessons: [
          {
            id: 'les_cgpt_js_2_1',
            title: 'Mapping Your Real Experience to a Job Description',
            description: 'Identify honest matches, phrasing gaps, and skills to brush up on before applying.',
            estimatedMinutes: 20,
            writtenContent: `Instead of guessing why an application did not get shortlisted, paste a real job description alongside a summary of your own experience (with phone/address removed) and ask for a structured gap analysis:\n\n1. Requirements you already meet clearly.\n2. Experience you have that needs clearer wording on your resume.\n3. Genuine skill gaps you should study or prepare to discuss honestly.\n\nThis focuses your preparation time on what actually matters for that specific role.`,
            exerciseTitle: 'Run a Truthful JD Alignment Audit',
            exerciseInstructions:
              'Select one open job on ABHI JOBS that interests you. List 5 key responsibilities from the posting and write one concrete example from your own past work, internship, or academic project beside each match — flagging any real gap honestly.',
            exerciseDeliverable: 'A 3-column alignment table (Requirement | My Real Evidence | Gap to Address).',
            resourceTitle: 'Job Description Audit Worksheet',
            resourceType: 'Workbook',
            worksheetContent:
              'JOB DESCRIPTION AUDIT WORKSHEET\n\nTarget Role:\nKey Responsibilities (Top 5):\n1.\n2.\n3.\n4.\n5.\n\nDirect Evidence from My Real Experience:\nSkills to Brush Up Before Interview:',
          },
        ],
      },
      {
        id: 'mod_cgpt_js_3',
        title: 'Fact-Safe Resume & Application Drafting',
        summary: 'Tighten clarity and action verbs without exaggerating titles or achievements.',
        lessons: [
          {
            id: 'les_cgpt_js_3_1',
            title: 'Improving Resume Bullet Clarity Honestly',
            description: 'Turn passive duty lists into crisp, verifiable impact statements.',
            estimatedMinutes: 20,
            writtenContent: `A strong resume bullet explains what you did, how you did it, and why it mattered — without inventing fake metrics. When asking ChatGPT to refine your bullet points, add the rule: "Do not invent percentages, revenue numbers, or tools I did not mention. Ask me clarifying questions if helpful."\n\nRead every revised line aloud. If it sounds overly inflated ("spearheaded synergistic paradigm shifts"), simplify it into plain, confident English you can defend comfortably in an interview.`,
            exerciseTitle: 'Refine 3 Real Resume Bullets',
            exerciseInstructions:
              'Choose 3 bullets from your current resume (or a college/internship project). Rewrite each with a clear action verb, scope, and factual outcome — keeping every line under 20 words and 100% accurate.',
            exerciseDeliverable: 'Three polished, interview-defensible resume bullet points.',
            resourceTitle: 'Fact-Safe Resume Editing Checklist',
            resourceType: 'Checklist',
            worksheetContent:
              'FACT-SAFE RESUME CHECKLIST\n\n[ ] Every tool, title, and date is 100% accurate\n[ ] Zero fabricated numbers or inflated claims\n[ ] Plain, direct action verbs (Coordinated, Analyzed, Built, Resolved)\n[ ] You can explain every single line comfortably in a live interview',
          },
        ],
      },
      {
        id: 'mod_cgpt_js_4',
        title: 'Practice Interviews & Privacy Safeguards',
        summary: 'Run focused mock interviews and protect confidential information.',
        lessons: [
          {
            id: 'les_cgpt_js_4_1',
            title: 'Interactive Mock Interview Practice & Data Safety',
            description: 'Simulate one question at a time and ask for structured feedback on clarity and relevance.',
            estimatedMinutes: 15,
            writtenContent: `Rather than asking for a list of 20 answers to memorize, ask ChatGPT to act as an interviewer asking one question at a time based on the job description. Type or speak your genuine answer, then ask for feedback on:\n\n• Did I answer the actual question directly?\n• Was my example structured and concise?\n• What follow-up question might an interviewer ask next?\n\nPrivacy Rule: Never include your full address, Aadhaar/PAN, phone number, or confidential client data from previous employers in any prompt.`,
            exerciseTitle: 'Complete a 3-Question Practice Round',
            exerciseInstructions:
              'Practice answering three role-relevant questions in writing: (1) Tell me about yourself, (2) A challenge you solved, (3) Why this role. Review each response for length (under 90 seconds spoken) and clarity.',
            exerciseDeliverable: 'Three refined, natural interview talking points.',
            resourceTitle: 'AI Privacy & Mock Interview Guide',
            resourceType: 'PDF',
            worksheetContent:
              'MOCK INTERVIEW & PRIVACY RULES\n\nDO:\n- Practice one question at a time\n- Ask for feedback on clarity, structure, and brevity\n- Keep answers grounded in your real stories\n\nDO NOT:\n- Paste phone numbers, IDs, or private company data\n- Memorize robotic scripts word-for-word',
          },
        ],
      },
    ]),
  },

  // 4. Claude AI for Job Seekers
  {
    id: 'course_claude_ai_job_seekers',
    slug: 'claude-ai-for-job-seekers',
    categoryId: 'ai-productivity',
    categoryName: 'AI and Productivity',
    title: 'Claude AI for Job Seekers',
    shortDescription:
      'Apply Claude AI to long-document review, structured writing, case study preparation, and thoughtful career analysis.',
    fullDescription:
      'An intermediate course exploring how job seekers can use Claude AI for deep document synthesis, natural professional writing, and structured problem-solving exercises.',
    level: 'Intermediate',
    estimatedDuration: 'Est. 2–3 hours',
    isFree: true,
    sequentialUnlock: true,
    courseIntroduction: {
      headline: 'Use Claude AI for deep research, natural writing, and case study clarity',
      overview:
        'Claude excels at working with longer reading materials, structured critique, and nuanced, natural business writing. This course teaches practical workflows for company research, portfolio case studies, and iterative editing.',
      studyGuidance: [
        'Use clear structured sections or tags when providing long reference material.',
        'Ask Claude to critique and tighten your own drafts instead of replacing your voice.',
      ],
      prerequisites: 'Basic comfort using conversational AI tools.',
    },
    whatYouWillLearn: [
      'Use Claude to review long industry reports, job specifications, and role briefs clearly.',
      'Collaborate iteratively on structured documents without losing your authentic professional voice.',
      'Organize take-home case studies and interview portfolios systematically.',
      'Apply data privacy habits and verification checklists before sharing AI-assisted work.',
    ],
    skillsDeveloped: [
      'Claude AI Workflows',
      'Document Synthesis',
      'Structured Writing',
      'Case Study Preparation',
    ],
    modules: buildModules('course_claude_ai_job_seekers', [
      {
        id: 'mod_claude_1',
        title: 'Working Effectively with Claude AI',
        summary: 'Structure inputs, provide writing samples, and iterate constructively.',
        lessons: [
          {
            id: 'les_claude_1_1',
            title: 'Structured Prompts & Voice Preservation',
            description: 'Separate background context, reference material, and task instructions cleanly.',
            estimatedMinutes: 15,
            writtenContent: `When working on career documents with Claude, clearly separating your source text from your instructions prevents mixed-up output. For example, label sections with headings like "My Background", "Target Role", and "Task".\n\nInclude one short paragraph you wrote yourself and instruct: "Match this plain, direct tone. Avoid buzzwords and keep sentences concise." This ensures cover emails and follow-up messages genuinely sound like you.`,
            exerciseTitle: 'Build a Personal Tone Guide Prompt',
            exerciseInstructions:
              'Write a 4-line personal writing style preference (preferred tone, sentence length, words to avoid) paired with one short sample email you wrote yourself.',
            exerciseDeliverable: 'A reusable tone-preservation brief for future career correspondence.',
            resourceTitle: 'Structured Prompting Template for Claude',
            resourceType: 'Template',
            worksheetContent:
              'STRUCTURED INPUT TEMPLATE\n\n<context>Your role level & objective</context>\n<source_material>Paste public brief or your draft</source_material>\n<style_rules>Plain English, short paragraphs, zero fluff, keep all facts exact</style_rules>\n<task>Review for clarity and list 3 specific improvements</task>',
          },
        ],
      },
      {
        id: 'mod_claude_2',
        title: 'Synthesizing Company & Industry Research',
        summary: 'Turn public annual reports, company pages, and news into concise interview briefs.',
        lessons: [
          {
            id: 'les_claude_2_1',
            title: 'Creating a 1-Page Pre-Interview Company Brief',
            description: 'Extract products, customer segments, recent priorities, and thoughtful questions to ask interviewers.',
            estimatedMinutes: 20,
            writtenContent: `Walking into an interview with thoughtful context about the employer immediately differentiates prepared candidates. Gather publicly available text from the company's About page, product overview, and recent press releases.\n\nAsk Claude to synthesize that material into a 1-page study sheet: (1) What the company sells and to whom, (2) Current priorities mentioned in the text, and (3) Three grounded questions you can ask the hiring manager.`,
            exerciseTitle: 'Assemble a 1-Page Company Study Brief',
            exerciseInstructions:
              'Choose one real employer in your target industry. Review their public website and draft a 1-page summary covering their core offering, target customers, and 3 intelligent questions for an interviewer.',
            exerciseDeliverable: 'A concise 1-page pre-interview research sheet.',
            resourceTitle: 'Company Research Brief Template',
            resourceType: 'Template',
            worksheetContent:
              '1-PAGE COMPANY INTERVIEW BRIEF\n\n1. Company & Core Offering:\n2. Primary Customers / Market:\n3. Key Priorities Mentioned Publicly:\n4. How My Role Supports These Priorities:\n5. Three Thoughtful Questions to Ask the Panel:',
          },
        ],
      },
      {
        id: 'mod_claude_3',
        title: 'Structured Case Studies & Writing Polish',
        summary: 'Break down take-home assignments logically and pressure-test your assumptions.',
        lessons: [
          {
            id: 'les_claude_3_1',
            title: 'Structuring Take-Home Case Studies Clearly',
            description: 'Use Claude as a critical reviewer to spot gaps in logic before you submit.',
            estimatedMinutes: 20,
            writtenContent: `Many mid-level and graduate hiring processes include a take-home assignment or case study. First draft your own hypothesis, assumptions, and proposed steps.\n\nThen ask Claude to act as a skeptical hiring panelist: "Review my proposed approach below. Identify 3 potential weaknesses, unclear assumptions, or missing edge cases." Answering those critiques yourself strengthens both your submission and your live defense.`,
            exerciseTitle: 'Pressure-Test a Project Explanation',
            exerciseInstructions:
              'Write a half-page overview of a problem you solved in work or college (Problem -> Options Considered -> Solution -> Result). List 3 critical questions a panelist might challenge you on and prepare calm responses.',
            exerciseDeliverable: 'A structured project case study with anticipated Q&A notes.',
            resourceTitle: 'Case Study Self-Review Rubric',
            resourceType: 'Checklist',
            worksheetContent:
              'CASE STUDY REVIEW RUBRIC\n\n[ ] Problem defined clearly in 2–3 sentences\n[ ] Assumptions stated transparently\n[ ] Trade-offs acknowledged honestly\n[ ] Actionable next steps prioritized\n[ ] Submission follows all employer rules on AI usage',
          },
        ],
      },
      {
        id: 'mod_claude_4',
        title: 'Verification, Tone & Ethical Guidelines',
        summary: 'Respect employer assessment policies and double-check every claim.',
        lessons: [
          {
            id: 'les_claude_4_1',
            title: 'Responsible AI Boundaries in Hiring Processes',
            description: 'Know when AI assistance is appropriate and when independent work is required.',
            estimatedMinutes: 15,
            writtenContent: `Ethical AI use builds long-term career credibility. Always follow the employer's stated guidelines during assessments — never use AI tools during proctored or closed-book tests, and never submit unverified work you do not understand.\n\nVerify every fact, quote, and technical claim independently before putting your name on a document.`,
            exerciseTitle: 'Define Your Personal AI Verification Habit',
            exerciseInstructions:
              'Write down a 4-step personal check you will follow before sending any AI-assisted email, document, or portfolio piece.',
            exerciseDeliverable: 'A concise personal verification checklist.',
            resourceTitle: 'Responsible Career AI Checklist',
            resourceType: 'Checklist',
            worksheetContent:
              'RESPONSIBLE AI CHECKLIST\n\n[ ] Checked employer rules on AI use for this task\n[ ] Removed confidential or personally sensitive data\n[ ] Verified all facts, links, and numbers manually\n[ ] Edited output into my own natural, authentic phrasing',
          },
        ],
      },
    ]),
  },

  // 5. ChatGPT for Customer Service
  {
    id: 'course_chatgpt_customer_service',
    slug: 'chatgpt-for-customer-service',
    categoryId: 'ai-productivity',
    categoryName: 'AI and Productivity',
    title: 'ChatGPT for Customer Service',
    shortDescription:
      'Draft empathetic, accurate customer responses, summarize support tickets, and build clear FAQ playbooks with AI support.',
    fullDescription:
      'An intermediate course for support, operations, and client-facing candidates who want to combine human empathy with AI-assisted ticket triage and consistent communication.',
    level: 'Intermediate',
    estimatedDuration: 'Est. 3 hours',
    isFree: true,
    sequentialUnlock: true,
    courseIntroduction: {
      headline: 'Pair human empathy with faster, policy-accurate customer support workflows',
      overview:
        'Modern customer experience teams value agents who resolve issues calmly, accurately, and efficiently. Learn how to protect customer privacy, de-escalate tense messages, summarize complex threads, and write clear help articles.',
      studyGuidance: [
        'Always replace real names, order IDs, emails, and phone numbers with placeholders like [Customer] or [Order_ID] before drafting.',
        'Never promise a refund or policy exception unless confirmed by company policy.',
      ],
      prerequisites: 'Basic written English fluency and familiarity with customer email or chat support.',
    },
    whatYouWillLearn: [
      'Summarize multi-message customer threads accurately before escalating or replying.',
      'Draft calm, empathetic responses for delayed orders, billing queries, and service issues.',
      'Organize reusable knowledge-base notes and FAQ templates without exposing private data.',
      'Review AI-drafted replies for policy accuracy, tone, and clarity before sending.',
    ],
    skillsDeveloped: [
      'Customer Communication',
      'Ticket Summarization',
      'AI Support Workflows',
      'De-escalation Writing',
    ],
    modules: buildModules('course_chatgpt_customer_service', [
      {
        id: 'mod_cgpt_cs_1',
        title: 'Privacy-First Customer Support Prompting',
        summary: 'Anonymize customer PII before using external AI assistants.',
        lessons: [
          {
            id: 'les_cgpt_cs_1_1',
            title: 'Redacting Customer Details Safely',
            description: 'Learn what counts as sensitive customer data and how to use placeholders reliably.',
            estimatedMinutes: 15,
            writtenContent: `In customer support roles, protecting customer privacy is non-negotiable. Never paste customer names, phone numbers, email addresses, payment details, account passwords, or home addresses into external AI tools.\n\nInstead, replace details with neutral tokens: [Customer Name], [Order #], [Delivery Date]. Once your reply structure is polished, fill in the exact verified details inside your company's secure ticketing system.`,
            exerciseTitle: 'Sanitize a Sample Support Ticket',
            exerciseInstructions:
              'Take a fictional 4-sentence customer complaint containing a name, phone number, order number, and street address. Rewrite it using clean placeholders while preserving the full context of the issue.',
            exerciseDeliverable: 'A properly redacted support ticket ready for safe drafting.',
            resourceTitle: 'Customer Privacy & Redaction Guide',
            resourceType: 'Checklist',
            worksheetContent:
              'SUPPORT DATA PRIVACY CHECKLIST\n\nReplace before drafting externally:\n- Full names -> [Customer]\n- Email / Phone -> [Contact]\n- Order / Invoice ID -> [Order_ID]\n- Address / Card Info -> NEVER copy out of CRM',
          },
        ],
      },
      {
        id: 'mod_cgpt_cs_2',
        title: 'Tone & Empathy in Challenging Tickets',
        summary: 'De-escalate frustrated messages with calm accountability and concrete next steps.',
        lessons: [
          {
            id: 'les_cgpt_cs_2_1',
            title: 'The Acknowledge -> Explain -> Solve Framework',
            description: 'Draft calm, non-defensive replies for delays, billing issues, and service disruptions.',
            estimatedMinutes: 20,
            writtenContent: `Frustrated customers want three things quickly: confirmation that you understood the problem, clear ownership without excuses, and a specific next step with a realistic timeline.\n\nStructure replies in three short blocks:\n1. Acknowledge genuinely ("Thank you for reaching out — I understand how frustrating this delay has been.").\n2. State the verified fact or action taken clearly.\n3. Confirm the next step and exact timeframe ("We have dispatched a replacement; tracking will update within 24 hours.").`,
            exerciseTitle: 'Draft a Calm De-escalation Reply',
            exerciseInstructions:
              'Write a 4–6 sentence reply to a customer whose urgent delivery arrived 3 days late and damaged, applying Acknowledge -> Explain -> Solve without making unauthorized compensation promises.',
            exerciseDeliverable: 'An empathetic, policy-safe customer email response.',
            resourceTitle: 'De-escalation Response Framework',
            resourceType: 'Template',
            worksheetContent:
              'DE-ESCALATION REPLY STRUCTURE\n\n1. Greeting + Direct Acknowledgement of Impact\n2. Clear Status / Action Already Taken\n3. Concrete Next Step + Realistic Timeline\n4. Polite Closing + Single Point of Follow-Up',
          },
        ],
      },
      {
        id: 'mod_cgpt_cs_3',
        title: 'Summarizing Threads & Escalation Handoffs',
        summary: 'Create clean internal notes so Tier-2 specialists resolve tickets faster.',
        lessons: [
          {
            id: 'les_cgpt_cs_3_1',
            title: 'Writing Crisp Internal Escalation Notes',
            description: 'Distill a long back-and-forth thread into Issue, Steps Tried, Evidence, and Needed Action.',
            estimatedMinutes: 20,
            writtenContent: `Long, messy escalations waste specialist time and force customers to repeat themselves. A disciplined handoff note always includes four labeled lines:\n\n• Customer Issue (1 sentence)\n• Verified Details (plan, product, dates)\n• Troubleshooting Already Completed\n• Specific Action Needed from Specialist Team`,
            exerciseTitle: 'Summarize a Multi-Message Escalation',
            exerciseInstructions:
              'Take a complex 3-part customer scenario (e.g., duplicate charge + failed login) and write a 4-bullet internal handoff summary under 100 words.',
            exerciseDeliverable: 'A crisp 4-part internal escalation note.',
            resourceTitle: 'Escalation Handoff Note Template',
            resourceType: 'Template',
            worksheetContent:
              'INTERNAL ESCALATION TEMPLATE\n\nIssue Summary:\nAccount / Order Context:\nSteps Already Completed:\nRequested Team Action:\nCustomer Priority / Deadline:',
          },
        ],
      },
      {
        id: 'mod_cgpt_cs_4',
        title: 'Building Reusable FAQ & Help Documentation',
        summary: 'Convert recurring ticket answers into clear self-service articles.',
        lessons: [
          {
            id: 'les_cgpt_cs_4_1',
            title: 'Turning Repeated Tickets into Clear FAQs',
            description: 'Write step-by-step customer help articles using plain language and numbered actions.',
            estimatedMinutes: 15,
            writtenContent: `Whenever a team answers the same question five times in a week, it belongs in the Help Center. Good FAQ articles use the exact phrasing customers search for in the title (e.g., "How to download your GST invoice"), open with a 1-sentence answer, and list numbered steps with one action per line.`,
            exerciseTitle: 'Write One Self-Service FAQ Article',
            exerciseInstructions:
              'Draft a concise FAQ article (title, 1-line summary, 4 numbered steps, and "Still need help?" note) for a common customer question such as resetting a password or updating a shipping address.',
            exerciseDeliverable: 'A clear, scannable customer FAQ draft.',
            resourceTitle: 'Help Article Writing Checklist',
            resourceType: 'Checklist',
            worksheetContent:
              'FAQ WRITING CHECKLIST\n\n[ ] Title phrased like a real customer question\n[ ] Direct answer in the first two lines\n[ ] Numbered steps (one action per step)\n[ ] Zero internal company jargon',
          },
        ],
      },
    ]),
  },

  // 6. Build Websites with AI
  {
    id: 'course_build_websites_ai',
    slug: 'build-websites-with-ai',
    categoryId: 'ai-productivity',
    categoryName: 'AI and Productivity',
    title: 'Build Websites with AI',
    shortDescription:
      'Plan, structure, and publish clean personal portfolios or small project websites using modern AI-assisted workflows.',
    fullDescription:
      'An intermediate course introducing non-developers and early-career professionals to planning web layouts, refining copy, checking mobile responsiveness, and publishing a clean portfolio site.',
    level: 'Intermediate',
    estimatedDuration: 'Est. 4–5 hours',
    isFree: true,
    sequentialUnlock: true,
    courseIntroduction: {
      headline: 'Plan, build, and launch a clean personal portfolio website step by step',
      overview:
        'A focused personal website gives recruiters immediate proof of your work. This course teaches you how to design a simple site map, write clear product specifications for AI site builders, verify mobile responsiveness, and publish cleanly.',
      studyGuidance: [
        'Start small — a crisp 1-page personal portfolio beats a cluttered 8-page site with half-empty sections.',
        'Always inspect your finished site on a mobile screen size before sharing the link on your resume.',
      ],
      prerequisites: 'Basic computer literacy; no prior coding experience required.',
    },
    whatYouWillLearn: [
      'Define page structure, clear navigation, and honest portfolio content before building.',
      'Translate plain-English specifications into clean, responsive page sections with AI tools.',
      'Review accessibility, mobile layout behavior, and broken links systematically.',
      'Prepare a focused personal portfolio website to share alongside your resume.',
    ],
    skillsDeveloped: [
      'Web Layout Planning',
      'AI-Assisted Site Building',
      'Portfolio Design',
      'Responsive Testing',
    ],
    modules: buildModules('course_build_websites_ai', [
      {
        id: 'mod_web_ai_1',
        title: 'Planning Your Site Structure & Content',
        summary: 'Draft your real sections and honest copy before generating any layout.',
        lessons: [
          {
            id: 'les_web_ai_1_1',
            title: 'Mapping a Focused Personal Portfolio',
            description: 'Select the 4 essential sections every job-seeker portfolio needs.',
            estimatedMinutes: 20,
            writtenContent: `The best candidate portfolios are easy to scan in 60 seconds. Focus on four purposeful sections:\n\n1. Introduction: Your name, target role, city, and a concise 2-sentence summary.\n2. Selected Work (2–4 real projects): Problem, what you built/did, tools used, and outcome.\n3. Skills & Education: Grouped cleanly without inflated percentage bars.\n4. Contact: Professional email, LinkedIn, and resume link.\n\nWrite your real copy in a plain document first so AI tools build around genuine content instead of filler text.`,
            exerciseTitle: 'Draft Your 4-Section Portfolio Content Doc',
            exerciseInstructions:
              'Write the real headline, 2-sentence bio, and short descriptions of 2 real projects (work, academic, or personal practice) that you want featured on your site.',
            exerciseDeliverable: 'A complete plain-text portfolio content blueprint.',
            resourceTitle: 'Portfolio Site Blueprint Template',
            resourceType: 'Template',
            worksheetContent:
              'PORTFOLIO CONTENT BLUEPRINT\n\nHero Headline:\n2-Sentence Summary:\nProject 1 (Title / Problem / My Role / Result):\nProject 2 (Title / Problem / My Role / Result):\nCore Skills:\nContact Links:',
          },
        ],
      },
      {
        id: 'mod_web_ai_2',
        title: 'Prompting Clean Layouts & Components',
        summary: 'Describe visual hierarchy, color restraint, and typography clearly.',
        lessons: [
          {
            id: 'les_web_ai_2_1',
            title: 'Writing Clear UI Specifications for AI Builders',
            description: 'Guide spacing, palette restraint, and navigation simplicity in plain English.',
            estimatedMinutes: 25,
            writtenContent: `To avoid cluttered, flashy layouts, give your AI website builder clear design guardrails:\n\n• Specify a calm color palette (1 neutral background, 1 primary dark text color, 1 subtle accent).\n• Request a single clean top navigation bar with 3–4 links.\n• Ask for generous whitespace and clear readable fonts rather than heavy animations.\n• Iterate one section at a time (e.g., refine the Projects grid first, then the Contact section).`,
            exerciseTitle: 'Write a 1-Page Website Specification',
            exerciseInstructions:
              'Combine your portfolio content blueprint with 4 clear design rules (palette, section order, typography feel, and single primary button action).',
            exerciseDeliverable: 'A ready-to-use website specification prompt.',
            resourceTitle: 'Website Specification Prompt Guide',
            resourceType: 'PDF',
            worksheetContent:
              'CLEAN WEBSITE SPEC CHECKLIST\n\n- Define exact sections in top-to-bottom order\n- Provide your real text (no placeholder Latin)\n- Limit palette to 1 neutral canvas + 1 primary + 1 accent\n- Request mobile-responsive stacking on small screens',
          },
        ],
      },
      {
        id: 'mod_web_ai_3',
        title: 'Mobile Responsiveness & Usability Checks',
        summary: 'Verify navigation, readability, and zero horizontal scrolling on phones and laptops.',
        lessons: [
          {
            id: 'les_web_ai_3_1',
            title: 'Testing Across Mobile, Tablet & Desktop',
            description: 'Catch overlapping buttons, unreadable text, and broken links before sharing your URL.',
            estimatedMinutes: 20,
            writtenContent: `Over half of recruiters open portfolio links on a phone or compact laptop screen. Open your site preview and resize the browser window down to mobile width (375px):\n\n• Does any content spill sideways causing a horizontal scrollbar?\n• Are buttons comfortable to tap without crowding?\n• Do all navigation links, email links, and project URLs work properly?\n• Is text contrast easy to read in bright daylight?`,
            exerciseTitle: 'Complete a 6-Point Responsive QA Check',
            exerciseInstructions:
              'Inspect any webpage or personal draft in desktop (1280px) and mobile (375px) view using browser DevTools. List 3 layout or readability issues you spot and note how to fix each.',
            exerciseDeliverable: 'A completed responsive QA review list.',
            resourceTitle: 'Mobile & Usability QA Checklist',
            resourceType: 'Checklist',
            worksheetContent:
              'PRE-LAUNCH RESPONSIVE QA CHECKLIST\n\n[ ] Zero horizontal overflow on 375px mobile viewport\n[ ] All buttons and nav links clickable and clearly labeled\n[ ] Contrast passes comfortable readability\n[ ] Every external link opens the correct destination\n[ ] Page title and browser tab description updated',
          },
        ],
      },
      {
        id: 'mod_web_ai_4',
        title: 'Publishing & Maintaining Your Portfolio',
        summary: 'Keep your live link professional, accurate, and aligned with your resume.',
        lessons: [
          {
            id: 'les_web_ai_4_1',
            title: 'Sharing Your Portfolio Link Professionally',
            description: 'Keep your live site updated alongside your resume and LinkedIn profile.',
            estimatedMinutes: 15,
            writtenContent: `Once published, test your live link in an incognito browser window to confirm visitors do not hit a login wall. Add the clean URL to your resume header and ABHI JOBS profile.\n\nSchedule a quick review once every quarter to add new projects, archive outdated experiments, and confirm your contact email is still current.`,
            exerciseTitle: 'Create Your Portfolio Launch Plan',
            exerciseInstructions:
              'Write down the 3 places you will share your portfolio URL (Resume header, LinkedIn, ABHI JOBS profile) and test opening your link in a private window.',
            exerciseDeliverable: 'Verified launch & quarterly maintenance checklist.',
            resourceTitle: 'Portfolio Launch & Maintenance Guide',
            resourceType: 'PDF',
            worksheetContent:
              'LAUNCH & MAINTENANCE PLAN\n\n1. Open published URL in an incognito window.\n2. Confirm resume PDF / LinkedIn / email links match.\n3. Add short URL to resume contact header.\n4. Review and refresh projects every 3 months.',
          },
        ],
      },
    ]),
  },

  // 7. Improve Your English
  {
    id: 'course_improve_your_english',
    slug: 'improve-your-english',
    categoryId: 'communication-english',
    categoryName: 'Communication and English',
    title: 'Improve Your English',
    shortDescription:
      'Strengthen spoken clarity, professional vocabulary, and everyday workplace writing for interviews and office collaboration.',
    fullDescription:
      'A practical course tailored for job seekers who want to express their thoughts clearly and naturally in workplace emails, team calls, and HR conversations.',
    level: 'Beginner',
    estimatedDuration: 'Est. 4 hours',
    isFree: true,
    sequentialUnlock: true,
    courseIntroduction: {
      headline: 'Speak and write clearly, calmly, and professionally at work',
      overview:
        'Effective workplace English is not about using complicated vocabulary — it is about expressing ideas clearly so colleagues and interviewers understand you effortlessly. Practice concise sentences, polished emails, meeting confidence, and smooth self-introductions.',
      studyGuidance: [
        'Read examples aloud during every lesson to build natural spoken rhythm.',
        'Practice rewriting real daily messages using shorter, clearer sentences.',
      ],
      prerequisites: 'Basic reading comprehension in English.',
    },
    whatYouWillLearn: [
      'Communicate ideas clearly using concise, natural sentences instead of overly complex phrasing.',
      'Write polished workplace emails, follow-ups, and meeting recaps with confidence.',
      'Practice speaking clearly during introductions, phone screenings, and team discussions.',
      'Avoid common workplace grammar and tone pitfalls in written and spoken English.',
    ],
    skillsDeveloped: [
      'Business English',
      'Professional Writing',
      'Spoken Clarity',
      'Workplace Tone',
    ],
    modules: buildModules('course_improve_your_english', [
      {
        id: 'mod_eng_1',
        title: 'Clarity First: Simple, Confident Sentences',
        summary: 'Replace long, tangled phrasing with direct, natural workplace English.',
        lessons: [
          {
            id: 'les_eng_1_1',
            title: 'Short Sentences Beat Complicated Words',
            description: 'Learn how plain, direct sentences sound more senior and confident in corporate teams.',
            estimatedMinutes: 15,
            writtenContent: `Many job seekers worry that simple English sounds less professional. In reality, senior leaders prefer direct, uncluttered communication.\n\nCompare:\n• Cluttered: "Kindly be informed that I am hereby writing to revert back regarding the needful update."\n• Clear: "Thank you for checking in. Here is the latest status on the report."\n\nKeep most workplace sentences between 10 and 18 words, put one main idea in each sentence, and choose everyday verbs like send, confirm, share, and update.`,
            exerciseTitle: 'Simplify 4 Overly Formal Workplace Sentences',
            exerciseInstructions:
              'Rewrite these phrases into clear modern English: (1) "Please do the needful", (2) "Revert back at the earliest", (3) "I am having 2 years experience", (4) "Kindly find attached herewith my resume".',
            exerciseDeliverable: 'Four clean, natural workplace sentences you can use immediately.',
            resourceTitle: 'Modern Workplace Phrasing Guide',
            resourceType: 'PDF',
            worksheetContent:
              'CLEAR WORKPLACE ENGLISH SWAPS\n\nInstead of "Do the needful" -> "Please review and approve this by Friday."\nInstead of "Revert back" -> "Please reply" or "Let me know."\nInstead of "Myself Rohan" -> "Hello, I am Rohan."\nInstead of "Attached herewith" -> "I have attached my resume."',
          },
        ],
      },
      {
        id: 'mod_eng_2',
        title: 'Everyday Workplace Emails & Messages',
        summary: 'Write clear subject lines, polite requests, and concise follow-ups.',
        lessons: [
          {
            id: 'les_eng_2_1',
            title: 'The 4-Line Professional Email Structure',
            description: 'Make emails effortless to read and easy to reply to.',
            estimatedMinutes: 20,
            writtenContent: `Busy recruiters and managers scan emails on their phones. Structure every workplace email with four clean parts:\n\n1. Specific Subject Line: "Application for Operations Executive — Priya Sharma" or "Follow-Up: Interview on 14 May".\n2. Polite Opening + Purpose in Line 1: State why you are writing immediately.\n3. Key Details in 2–3 short lines or bullets.\n4. Clear Closing Action: "Please let me know a convenient time for a brief call."`,
            exerciseTitle: 'Write a Recruiter Follow-Up Email',
            exerciseInstructions:
              'Draft a concise email (under 100 words) following up politely 5 days after an interview, thanking the interviewer and reiterating your interest in the role.',
            exerciseDeliverable: 'A polished, reusable post-interview follow-up email.',
            resourceTitle: 'Workplace Email Templates',
            resourceType: 'Template',
            worksheetContent:
              'POST-INTERVIEW FOLLOW-UP TEMPLATE\n\nSubject: Thank you — [Role Title] Interview\n\nDear [Name],\nThank you for speaking with me about the [Role Title] opportunity on [Day]. I enjoyed learning about [specific detail discussed].\nPlease let me know if I can share any additional details. I look forward to hearing from you.\n\nBest regards,\n[Your Name]',
          },
        ],
      },
      {
        id: 'mod_eng_3',
        title: 'Spoken Confidence in Calls & Meetings',
        summary: 'Slow your pace, pause naturally, and ask for clarification politely.',
        lessons: [
          {
            id: 'les_eng_3_1',
            title: 'Pacing, Pauses & Polite Clarification Phrases',
            description: 'Handle fast speakers or unfamiliar questions calmly without losing composure.',
            estimatedMinutes: 20,
            writtenContent: `Speaking quickly when nervous makes pronunciation harder to follow. Slowing your pace by just 15% and pausing briefly between ideas makes your speech immediately clearer and more assured.\n\nUseful polite phrases when you need a moment or missed a detail:\n• "Could you please repeat the last part of the question?"\n• "That is a good question — let me take a moment to organize my thoughts."\n• "Just to make sure I understood correctly, are you asking about...?"`,
            exerciseTitle: '2-Minute Spoken Clarity Practice',
            exerciseInstructions:
              'Record a 60-second voice note on your phone explaining a task you handled well recently. Play it back and notice your speaking speed, filler words ("um", "actually"), and clarity, then record one calmer second take.',
            exerciseDeliverable: 'A noticeably steadier, clearer 60-second spoken recording.',
            resourceTitle: 'Spoken Call & Meeting Phrases Sheet',
            resourceType: 'PDF',
            worksheetContent:
              'USEFUL WORKPLACE CALL PHRASES\n\nAsking to clarify: "Could you share a bit more context on that?"\nBuying thinking time: "Let me think through the best example for a second."\nSummarizing: "So our next step is X by Thursday — does that sound right?"',
          },
        ],
      },
      {
        id: 'mod_eng_4',
        title: 'Self-Introductions & Career Storytelling',
        summary: 'Present your background smoothly in 60–90 seconds.',
        lessons: [
          {
            id: 'les_eng_4_1',
            title: 'Present -> Past -> Future Self-Introduction',
            description: 'Deliver a crisp, natural introduction for HR screenings and networking calls.',
            estimatedMinutes: 15,
            writtenContent: `Avoid reciting your entire resume chronologically or starting with personal family details. Use the Present -> Past -> Future formula:\n\n1. Present: Who you are right now and your core focus.\n2. Past: 1–2 relevant academic projects, internships, or workplace achievements.\n3. Future: Why you are excited about this specific role and team.`,
            exerciseTitle: 'Draft & Speak Your 60-Second Introduction',
            exerciseInstructions:
              'Write a 5–6 sentence Present -> Past -> Future introduction tailored to your target job, then practice saying it aloud naturally three times without reading verbatim.',
            exerciseDeliverable: 'A natural, confident 60-second self-introduction.',
            resourceTitle: 'Self-Introduction Builder Worksheet',
            resourceType: 'Workbook',
            worksheetContent:
              'PRESENT -> PAST -> FUTURE BUILDER\n\nPresent (1–2 sentences): Current qualification/role and core strength.\nPast (2 sentences): Relevant achievement or hands-on project.\nFuture (1–2 sentences): Why this role fits your career direction.',
          },
        ],
      },
    ]),
  },

  // 8. Interview Preparation: Any Domain
  {
    id: 'course_interview_preparation',
    slug: 'interview-preparation-any-domain',
    categoryId: 'interview-preparation',
    categoryName: 'Interview Preparation',
    title: 'Interview Preparation: Any Domain',
    shortDescription:
      'Prepare structured, honest answers for HR screenings, behavioral questions, and role interviews across any industry.',
    fullDescription:
      'A comprehensive practical course designed to help freshers and experienced candidates prepare calmly, explain their work with clear structure, and handle unexpected questions professionally.',
    level: 'Beginner',
    estimatedDuration: 'Est. 3–4 hours',
    isFree: true,
    sequentialUnlock: true,
    courseIntroduction: {
      headline: 'Walk into every HR and hiring manager interview structured and calm',
      overview:
        'Great interview performance comes from thoughtful preparation, not memorized scripts. Across four structured modules, you will map your background to job briefs, master STAR storytelling, handle tough questions honestly, and polish interview etiquette.',
      studyGuidance: [
        'Build a personal Story Bank of 4–5 real experiences you can adapt to almost any behavioral question.',
        'Practice answering aloud rather than only reading notes silently.',
      ],
      prerequisites: 'Open to both freshers and experienced job seekers across all domains.',
    },
    whatYouWillLearn: [
      'Research a company and role thoroughly so every answer connects to actual team needs.',
      'Structure past projects and workplace scenarios using clear situation-action-outcome framing.',
      'Handle tough questions — including career gaps, mistakes, or unfamiliar tools — honestly.',
      'Ask thoughtful questions at the end of an interview and send concise follow-up notes.',
    ],
    skillsDeveloped: [
      'Behavioral Interviewing',
      'Structured Storytelling',
      'Role Research',
      'Interview Composure',
    ],
    modules: buildModules('course_interview_preparation', [
      {
        id: 'mod_int_1',
        title: 'Pre-Interview Research & Role Mapping',
        summary: 'Decode what the hiring manager truly needs before the conversation starts.',
        lessons: [
          {
            id: 'les_int_1_1',
            title: 'The 30-Minute Pre-Interview Prep Routine',
            description: 'Review the job brief, company context, and your own resume so nothing catches you off guard.',
            estimatedMinutes: 15,
            writtenContent: `Before any interview, spend 30 focused minutes reviewing three items:\n\n1. The Job Description: Highlight the 3 recurring problems this role exists to solve.\n2. Your Own Resume: Be ready to explain every single line, project, date, and skill you listed.\n3. The Company: Understand their core service/product, industry, and customer base.\n\nKeep a clean 1-page note with 3 bullet reminders beside you during virtual calls (never a full script to read off).`,
            exerciseTitle: 'Complete a Pre-Interview Role Map',
            exerciseInstructions:
              'Pick a target role and list (a) its top 3 priorities, (b) 3 matching facts from your resume, and (c) 2 thoughtful questions to ask the interviewer.',
            exerciseDeliverable: 'A 1-page pre-interview preparation sheet.',
            resourceTitle: '30-Minute Interview Prep Checklist',
            resourceType: 'Checklist',
            worksheetContent:
              'PRE-INTERVIEW PREP CHECKLIST\n\n[ ] Reviewed JD and identified top 3 role priorities\n[ ] Prepared clear explanation for every line on resume\n[ ] Researched company products, clients, and recent news\n[ ] Prepared 2–3 genuine questions for the panel',
          },
        ],
      },
      {
        id: 'mod_int_2',
        title: 'Structuring "Tell Me About Yourself" & Key Examples',
        summary: 'Use the STAR framework to explain real accomplishments clearly.',
        lessons: [
          {
            id: 'les_int_2_1',
            title: 'Mastering STAR Storytelling Without Rambling',
            description: 'Keep behavioral answers crisp by spending 60% of your time on your specific Actions and Result.',
            estimatedMinutes: 20,
            writtenContent: `When interviewers ask "Tell me about a time you handled a tight deadline" or "Describe a challenge you solved", use STAR:\n\n• Situation (15%): Brief context — where and what was happening.\n• Task (15%): What responsibility was yours.\n• Action (50%): The specific steps YOU took (use "I", not only "we").\n• Result (20%): What changed, what was delivered, or what you learned.\n\nAim for 90 seconds to 2 minutes per story.`,
            exerciseTitle: 'Build Your 3-Story Interview Bank',
            exerciseInstructions:
              'Write concise STAR bullet points for three real situations from your work, internship, or college life: (1) Solving a problem, (2) Collaborating in a team, (3) Meeting a tough deadline.',
            exerciseDeliverable: 'Three reusable STAR stories in bullet form.',
            resourceTitle: 'STAR Story Bank Worksheet',
            resourceType: 'Workbook',
            worksheetContent:
              'STAR STORY BANK\n\nStory 1 — Problem Solved:\nS:\nT:\nA (My exact steps):\nR (Outcome / Lesson):\n\nStory 2 — Teamwork / Collaboration:\nS / T / A / R\n\nStory 3 — Handling Pressure / Deadline:\nS / T / A / R',
          },
        ],
      },
      {
        id: 'mod_int_3',
        title: 'Navigating Challenging & Situational Questions',
        summary: 'Respond honestly to gaps, weaknesses, salary expectations, and unfamiliar topics.',
        lessons: [
          {
            id: 'les_int_3_1',
            title: 'Answering Tough Questions with Honesty & Poise',
            description: 'Frame weaknesses, career gaps, and "I do not know" moments constructively.',
            estimatedMinutes: 20,
            writtenContent: `Interviewers test self-awareness and honesty just as much as technical skill:\n\n• Real Weakness: Share a genuine, non-fatal skill you actively improved (e.g., delegating or speaking concisely) and explain the concrete habit you built.\n• Career Gap: State the reason briefly and neutrally (health, family, exams, upskilling), then highlight what you learned or how ready you are now.\n• Unknown Tool/Topic: Never bluff. Say honestly: "I have not used Tool X directly yet, though I have used similar Tool Y and here is how I would get up to speed quickly."`,
            exerciseTitle: 'Prepare Calm Answers for 2 Tough Questions',
            exerciseInstructions:
              'Draft honest 3-sentence answers for (1) "What is an area you are actively improving?" and (2) "What if you are asked about a skill listed in the JD that you have not used yet?".',
            exerciseDeliverable: 'Two calm, transparent responses for challenging interview prompts.',
            resourceTitle: 'Challenging Questions Playbook',
            resourceType: 'PDF',
            worksheetContent:
              'TOUGH QUESTIONS RESPONSE GUIDE\n\n1. Weakness = Honest area + concrete improvement habit.\n2. Gap = Brief neutral explanation + current readiness.\n3. Unknown topic = Honest admission + related skill + learning approach.',
          },
        ],
      },
      {
        id: 'mod_int_4',
        title: 'Virtual & In-Person Etiquette & Follow-Up',
        summary: 'Handle logistics smoothly and close every interview professionally.',
        lessons: [
          {
            id: 'les_int_4_1',
            title: 'Interview Day Checklist & Thoughtful Closing Questions',
            description: 'Finish strong by asking sharp questions about success in the first 90 days.',
            estimatedMinutes: 15,
            writtenContent: `Small operational habits signal dependability before you even start the job. For virtual calls, test camera, microphone, lighting, and internet 15 minutes early and join 2–3 minutes ahead. For in-person interviews, arrive 10–15 minutes early with two clean copies of your resume.\n\nWhen invited to ask questions, avoid saying "No questions". Ask thoughtful, role-focused questions such as:\n• "What would strong performance look like in the first 90 days of this role?"\n• "What are the biggest priorities for the team this quarter?"`,
            exerciseTitle: 'Final Interview-Day Readiness Check',
            exerciseInstructions:
              'Select 3 closing questions you feel comfortable asking in your next interview and verify your video/audio setup in a quick test call.',
            exerciseDeliverable: 'Your personalized interview-day checklist and closing questions.',
            resourceTitle: 'Interview Day & Follow-Up Checklist',
            resourceType: 'Checklist',
            worksheetContent:
              'INTERVIEW DAY CHECKLIST\n\n[ ] Camera, mic, battery, and quiet background tested 15 min early\n[ ] Notepad, pen, and resume copy beside you\n[ ] 2–3 thoughtful closing questions ready\n[ ] Brief thank-you email sent within 24 hours',
          },
        ],
      },
    ]),
  },

  // 9. How to Change Your Career Domain
  {
    id: 'course_change_career_domain',
    slug: 'how-to-change-your-career-domain',
    categoryId: 'career-development',
    categoryName: 'Career Development',
    title: 'How to Change Your Career Domain',
    shortDescription:
      'Map transferable skills, close critical role gaps, and present a credible transition plan when switching industries or functions.',
    fullDescription:
      'An intermediate course for professionals exploring a thoughtful move into a new domain — focusing on realistic skill bridging, portfolio proof, and clear recruiter communication.',
    level: 'Intermediate',
    estimatedDuration: 'Est. 3 hours',
    isFree: true,
    sequentialUnlock: true,
    courseIntroduction: {
      headline: 'Make a credible, structured career pivot without starting from zero',
      overview:
        'Switching industries or functions works best when you bridge what you already do well into a realistic adjacent role. This course guides you through transferable skill audits, focused 90-day skill bridging, truthful resume repositioning, and persuasive career-switcher interviews.',
      studyGuidance: [
        'Be realistic about stepping-stone roles — moving one dimension at a time (same function in a new industry, or new function in your current industry) often succeeds faster.',
        'Build tangible proof of your new skills rather than relying solely on enthusiasm.',
      ],
      prerequisites: 'Best suited for graduates or working professionals considering a role or industry transition.',
    },
    whatYouWillLearn: [
      'Audit which of your current skills transfer directly into your target role and industry.',
      'Identify the 2–3 core skills or proof projects needed to make your transition credible.',
      'Reposition your resume summary and experience bullets without distorting your history.',
      'Explain your reason for changing domains clearly and positively in recruiter conversations.',
    ],
    skillsDeveloped: [
      'Career Transition Planning',
      'Transferable Skill Mapping',
      'Profile Repositioning',
      'Targeted Job Search',
    ],
    modules: buildModules('course_change_career_domain', [
      {
        id: 'mod_chg_1',
        title: 'Evaluating Target Roles & Transferable Strengths',
        summary: 'Spot where your existing strengths already match your target domain.',
        lessons: [
          {
            id: 'les_chg_1_1',
            title: 'The Transferable Skill Overlap Map',
            description: 'Compare real job descriptions against your proven capabilities to pick an achievable target.',
            estimatedMinutes: 20,
            writtenContent: `Successful career switchers rarely discard their past experience — they translate it. For example, a customer support specialist moving into HR coordination already brings stakeholder communication, SLA tracking, documentation, and empathetic problem-solving.\n\nCollect 5 real job postings for your target role. Highlight every skill that appears in at least 3 postings, then group them into (A) Skills you already prove in past work and (B) New domain skills you must actively build.`,
            exerciseTitle: 'Complete Your Transferable Skills Audit',
            exerciseInstructions:
              'Choose your target domain and list 4 skills that carry over directly from your current background plus 3 specific domain skills you need to build.',
            exerciseDeliverable: 'A clear two-column Transferable vs. New Skills matrix.',
            resourceTitle: 'Transferable Skills Mapping Sheet',
            resourceType: 'Workbook',
            worksheetContent:
              'TRANSFERABLE SKILLS AUDIT\n\nCurrent Domain:\nTarget Domain / Role:\n\nSkills That Transfer Immediately (with 1 proof example each):\n1.\n2.\n3.\n\nPriority Skill Gaps to Close in Next 90 Days:\n1.\n2.',
          },
        ],
      },
      {
        id: 'mod_chg_2',
        title: 'Designing a Practical 90-Day Skill Bridge',
        summary: 'Build small, concrete proof-of-work projects that prove capability to recruiters.',
        lessons: [
          {
            id: 'les_chg_2_1',
            title: 'Proof Projects Over Endless Course Collecting',
            description: 'Focus 90 days on 2 core skills and 1–2 tangible work samples recruiters can inspect.',
            estimatedMinutes: 20,
            writtenContent: `Hiring managers hesitate on career switchers mainly because of perceived risk. One small, well-executed work sample — such as a clean Excel dashboard, a sample marketing audit, a customer onboarding playbook, or a small portfolio site — lowers that risk far more than a long list of passive reading.\n\nStructure 90 days into three 30-day blocks: Days 1–30 learn core foundations; Days 31–60 build 1–2 practical sample projects; Days 61–90 refine positioning and begin targeted outreach.`,
            exerciseTitle: 'Design Your 90-Day Transition Plan',
            exerciseInstructions:
              'Define one realistic mini-project you can complete within 30 days to demonstrate capability in your target domain, including the exact output format (spreadsheet, deck, report, or prototype).',
            exerciseDeliverable: 'A focused 90-day milestone plan with one concrete proof project.',
            resourceTitle: '90-Day Career Bridge Planner',
            resourceType: 'Template',
            worksheetContent:
              '90-DAY SKILL BRIDGE PLANNER\n\nDays 1–30 (Foundations): 2 core skills + daily 45-min practice\nDays 31–60 (Proof of Work): Complete 1–2 realistic sample projects\nDays 61–90 (Market Entry): Repositioned resume + targeted applications & recruiter outreach',
          },
        ],
      },
      {
        id: 'mod_chg_3',
        title: 'Updating Your Resume & Career Narrative',
        summary: 'Highlight relevant achievements prominently without distorting your employment history.',
        lessons: [
          {
            id: 'les_chg_3_1',
            title: 'Repositioning Your Resume Summary & Bullets',
            description: 'Lead with relevant transferable outcomes and your new domain proof projects.',
            estimatedMinutes: 20,
            writtenContent: `Never alter past job titles dishonestly. Instead, make the connection obvious at the top of your resume:\n\n1. Use a sharp 2-line Professional Summary naming your proven background + target role + transferable value.\n2. Add a "Relevant Projects" section right below your skills to showcase your new domain work samples.\n3. In previous roles, emphasize bullets that mirror your target role's responsibilities (analysis, coordination, reporting, client communication).`,
            exerciseTitle: 'Draft Your Career-Switcher Resume Summary',
            exerciseInstructions:
              'Write a clear 2–3 sentence resume summary bridging your past experience truthfully into your target domain.',
            exerciseDeliverable: 'A focused, recruiter-friendly transition summary.',
            resourceTitle: 'Career-Switcher Resume Checklist',
            resourceType: 'Checklist',
            worksheetContent:
              'CAREER-SWITCHER RESUME CHECKLIST\n\n[ ] Honest job titles and dates preserved\n[ ] Summary clearly states target role and transferable strengths\n[ ] Relevant transition projects highlighted near the top\n[ ] Past bullets translated into plain language understood in the new domain',
          },
        ],
      },
      {
        id: 'mod_chg_4',
        title: 'Networking & Interviewing as a Career Switcher',
        summary: 'Explain your pivot positively and connect with people already doing the work.',
        lessons: [
          {
            id: 'les_chg_4_1',
            title: 'Explaining "Why Are You Switching Domains?" Positively',
            description: 'Frame your transition around pulling toward a goal, not running away from frustration.',
            estimatedMinutes: 15,
            writtenContent: `Recruiters always ask why you are changing paths. Avoid speaking negatively about previous employers or sounding uncertain. Use a positive 3-part narrative:\n\n1. What you appreciated and mastered in your prior domain.\n2. The specific trigger that drew you toward the new domain.\n3. The concrete steps you have already taken (skills + proof project) to contribute from day one.`,
            exerciseTitle: 'Craft Your 60-Second Pivot Narrative',
            exerciseInstructions:
              'Write and rehearse a confident 4-sentence answer to "Why are you transitioning into this domain?" that focuses on preparation and contribution.',
            exerciseDeliverable: 'A positive, well-rehearsed career transition explanation.',
            resourceTitle: 'Career Pivot Narrative Guide',
            resourceType: 'PDF',
            worksheetContent:
              'POSITIVE PIVOT SCRIPT OUTLINE\n\n1. "In my previous work in [Domain A], I built strong habits in [Transferable Skill]."\n2. "I realized the part I enjoyed most was [Bridge Activity], which led me to explore [Domain B]."\n3. "Over the past few months, I have built [Proof Project / Skills] so I can add value immediately."',
          },
        ],
      },
    ]),
  },

  // 10. Professional Workplace Skills
  {
    id: 'course_professional_workplace_skills',
    slug: 'professional-workplace-skills',
    categoryId: 'workplace-skills',
    categoryName: 'Workplace Skills',
    title: 'Professional Workplace Skills',
    shortDescription:
      'Develop dependable habits in task prioritization, team collaboration, stakeholder updates, and structured problem-solving.',
    fullDescription:
      'A foundational course built around the practical day-to-day workplace habits that help new hires and early-career professionals earn trust quickly on any team.',
    level: 'Beginner',
    estimatedDuration: 'Est. 3 hours',
    isFree: true,
    sequentialUnlock: true,
    courseIntroduction: {
      headline: 'Build the everyday workplace habits that earn manager and team trust fast',
      overview:
        'Technical skills help you get hired; dependable workplace habits help you thrive and grow. Learn practical frameworks for managing competing deadlines, writing crisp status updates, solving everyday operational snags, and showing consistent professionalism.',
      studyGuidance: [
        'Apply these frameworks immediately in college teams, internships, or your current job.',
        'Notice how small habits — flagging risks early and confirming next steps — dramatically boost reliability.',
      ],
      prerequisites: 'Open to all job seekers, freshers, and early-career professionals.',
    },
    whatYouWillLearn: [
      'Prioritize competing deadlines calmly and communicate trade-offs proactively to managers.',
      'Run and participate in crisp workplace meetings with clear action items and ownership.',
      'Break down everyday operational problems systematically before escalating issues.',
      'Build reliable professional etiquette across remote, hybrid, and office teams.',
    ],
    skillsDeveloped: [
      'Time Management',
      'Team Collaboration',
      'Structured Problem-Solving',
      'Professional Ownership',
    ],
    modules: buildModules('course_professional_workplace_skills', [
      {
        id: 'mod_work_1',
        title: 'Managing Priorities & Competing Deadlines',
        summary: 'Sort urgent vs. important tasks and negotiate trade-offs before deadlines slip.',
        lessons: [
          {
            id: 'les_work_1_1',
            title: 'Prioritizing Workdays & Flagging Risks Early',
            description: 'Never miss a deadline silently — communicate trade-offs calmly and early.',
            estimatedMinutes: 15,
            writtenContent: `One of the fastest ways to earn a manager's trust is predictability. Start each workday by picking your top 3 priority outcomes rather than reacting purely to chat notifications.\n\nWhen two urgent requests collide, avoid staying silent and missing one. Send a brief, constructive message early:\n"I am currently completing Report A (due 2 PM). If Task B is higher priority, I can pause Report A and deliver it by 5 PM instead — please confirm which you prefer first."`,
            exerciseTitle: 'Draft a Proactive Priority Trade-Off Message',
            exerciseInstructions:
              'Write a polite 3-sentence message to a manager explaining that two tasks are due at 4 PM today and proposing a clear, realistic order of delivery.',
            exerciseDeliverable: 'A calm, solution-focused priority check-in message.',
            resourceTitle: 'Daily Priority & Trade-Off Checklist',
            resourceType: 'Checklist',
            worksheetContent:
              'DAILY PRIORITY HABITS\n\n[ ] Identify Top 3 outcomes each morning\n[ ] Confirm exact deadline & definition of "done" on new tasks\n[ ] Flag potential delays at least 24 hours early with a proposed option\n[ ] Keep a simple written task tracker (never rely purely on memory)',
          },
        ],
      },
      {
        id: 'mod_work_2',
        title: 'Effective Team & Manager Communication',
        summary: 'Deliver concise status updates and receive feedback constructively.',
        lessons: [
          {
            id: 'les_work_2_1',
            title: 'The Done / Doing / Blocked Status Update',
            description: 'Keep stakeholders informed without lengthy meetings or vague replies.',
            estimatedMinutes: 20,
            writtenContent: `Great workplace updates are short, structured, and easy to scan. Use the three-part update format in Slack, Teams, or weekly emails:\n\n• Completed: What is finished since the last update.\n• In Progress: What you are working on now + expected completion date.\n• Blockers / Input Needed: Any dependency holding you up and who can help.\n\nWhen receiving constructive feedback, listen fully without getting defensive, summarize what you heard, and confirm one concrete adjustment you will make.`,
            exerciseTitle: 'Write a Crisp Weekly Team Update',
            exerciseInstructions:
              'Practice summarizing your past week of job-search, study, or project work in the Done / Doing / Next format in under 120 words.',
            exerciseDeliverable: 'A scannable, professional weekly status update.',
            resourceTitle: 'Status Update & Meeting Recap Template',
            resourceType: 'Template',
            worksheetContent:
              'WEEKLY STATUS UPDATE TEMPLATE\n\nCompleted:\n- [Task 1]\n\nIn Progress (with target date):\n- [Task 2 — ETA Thu 4 PM]\n\nNeeds Input / Blockers:\n- [Decision needed from Name]',
          },
        ],
      },
      {
        id: 'mod_work_3',
        title: 'Everyday Problem-Solving at Work',
        summary: 'Bring clear facts and practical options whenever escalating an issue.',
        lessons: [
          {
            id: 'les_work_3_1',
            title: 'Bringing Options, Not Just Problems',
            description: 'Separate symptoms from root causes and propose 2 sensible ways forward.',
            estimatedMinutes: 20,
            writtenContent: `When something breaks at work — a missing vendor file, a formula error, or a scheduling conflict — resist the urge to forward the problem with "What should I do?".\n\nSpend 10 minutes checking facts first:\n1. What exactly happened (observed facts, not guesses)?\n2. What is the immediate impact?\n3. What are 2 practical options to resolve it, and which one do you recommend?\n\nEven if your manager picks a different path, presenting structured options shows ownership and maturity.`,
            exerciseTitle: 'Structure an Operational Problem Note',
            exerciseInstructions:
              'Imagine a client presentation is scheduled tomorrow morning, and one dataset needed for Slide 4 is delayed. Write a concise 4-line note summarizing the issue, impact, 2 realistic options, and your recommendation.',
            exerciseDeliverable: 'A structured Issue -> Impact -> Options -> Recommendation note.',
            resourceTitle: 'Structured Problem-Solving Worksheet',
            resourceType: 'Workbook',
            worksheetContent:
              'PROBLEM-SOLVING ESCALATION FRAME\n\n1. Verified Fact (What happened):\n2. Impact (Who/what is affected & deadline):\n3. Option A (Pros/Cons):\n4. Option B (Pros/Cons):\n5. Recommended Next Step:',
          },
        ],
      },
      {
        id: 'mod_work_4',
        title: 'Professional Etiquette & Accountability',
        summary: 'Master punctuality, meeting readiness, and dependable follow-through.',
        lessons: [
          {
            id: 'les_work_4_1',
            title: 'Meeting Etiquette & Following Through on Commitments',
            description: 'Close the loop after every discussion with clear owners and dates.',
            estimatedMinutes: 15,
            writtenContent: `Professionalism is built through consistent small behaviors:\n\n• Join meetings on time with a clear agenda or notebook ready.\n• Mute your microphone when not speaking on group calls and stay attentive.\n• After a working discussion, send a quick 3-line recap listing Action Item, Owner, and Due Date so nothing falls between the cracks.\n• If you make a mistake, own it quickly, fix what you can, and share how you will prevent it next time.`,
            exerciseTitle: 'Write a 3-Line Post-Meeting Action Recap',
            exerciseInstructions:
              'Write a short follow-up recap for a 20-minute project check-in listing 3 concrete action items with an owner and due date for each.',
            exerciseDeliverable: 'A clean, accountability-focused meeting recap.',
            resourceTitle: 'Workplace Etiquette & Ownership Guide',
            resourceType: 'PDF',
            worksheetContent:
              'WORKPLACE ACCOUNTABILITY PRINCIPLES\n\n1. Punctuality shows respect for everyone else’s schedule.\n2. Written recaps prevent misunderstandings.\n3. Close the loop: confirm when a requested task is done.\n4. Own mistakes transparently and focus quickly on the fix.',
          },
        ],
      },
    ]),
  },
];

export function getCourseBySlug(slug: string): LearningCourseItem | undefined {
  return LEARNING_CATALOGUE_COURSES.find((c) => c.slug === slug);
}

export function getCourseById(courseId: string): LearningCourseItem | undefined {
  return LEARNING_CATALOGUE_COURSES.find((c) => c.id === courseId);
}

export function flattenCourseLessons(course: LearningCourseItem): Array<{
  lesson: CourseLesson;
  module: CourseModule;
  globalIndex: number;
}> {
  const orderedModules = [...course.modules].sort((a, b) => a.order - b.order);
  const result: Array<{ lesson: CourseLesson; module: CourseModule; globalIndex: number }> = [];
  let idx = 0;

  for (const mod of orderedModules) {
    const orderedLessons = [...mod.lessons].sort((a, b) => a.order - b.order);
    for (const lesson of orderedLessons) {
      result.push({ lesson, module: mod, globalIndex: idx });
      idx += 1;
    }
  }

  return result;
}

export const ASSESSMENT_PREVIEW_DOMAINS: LearningAssessmentDomain[] = [
  {
    id: 'core-digital',
    title: 'Digital & Analytical Readiness',
    focus: 'Spreadsheets, productivity software, and modern workflow tools.',
  },
  {
    id: 'communication',
    title: 'Communication & Interview Clarity',
    focus: 'Written professionalism, presentation confidence, and interview readiness.',
  },
  {
    id: 'career-direction',
    title: 'Career Direction & Workplace Habits',
    focus: 'Goal clarity, collaboration, and practical job-readiness priorities.',
  },
];
