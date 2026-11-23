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

/**
 * Exact IDs of the previously seeded Learn with ABHI courses removed during the course reset.
 * Retained strictly as a read-only reference list so cleanup utilities and Firestore rules can
 * safely target ONLY legacy course records without touching accounts, jobs, resumes, or
 * Career Readiness Assessment data.
 */
export const RESET_LEGACY_COURSE_IDS: readonly string[] = [
  'course_excel_job_seekers',
  'course_ai_presentations',
  'course_chatgpt_job_seekers',
  'course_claude_ai_job_seekers',
  'course_chatgpt_customer_service',
  'course_build_websites_ai',
  'course_improve_your_english',
  'course_interview_preparation',
  'course_change_career_domain',
  'course_professional_workplace_skills',
] as const;

/**
 * Active Learn with ABHI course catalogue.
 * Module 1 ("Excel Fundamentals") is implemented under "Excel for Job Seekers"
 * as the first module of the 12-module curriculum. Quiz answer keys and grading
 * live strictly on the backend (`server/excelCurriculumSeed.ts`).
 */
export const LEARNING_CATALOGUE_COURSES: LearningCourseItem[] = [
  {
    id: 'excel_for_job_seekers',
    slug: 'excel-for-job-seekers',
    categoryId: 'excel-digital-skills',
    categoryName: 'Excel and Digital Skills',
    title: 'Excel for Job Seekers',
    shortDescription:
      'Build job-ready Microsoft Excel skills step by step — starting with Module 01: Excel Fundamentals.',
    fullDescription:
      'A practical, career-focused 12-module Microsoft Excel curriculum designed for job seekers and working professionals. Begin with Module 01: Excel Fundamentals to master workbooks, worksheets, rows, columns, cells, the Excel interface, and everyday workplace uses across HR, procurement, accounts, sales, and operations.',
    level: 'Beginner',
    estimatedDuration: 'Module 01 · ~25 mins',
    isFree: true,
    sequentialUnlock: true,
    passPercentage: 70,
    certificateTemplateId: 'default_abhi_certificate',
    status: 'published',
    courseIntroduction: {
      headline: 'Master Microsoft Excel for Real Workplace Roles',
      overview:
        'Watch the guided video lesson inside Learn with ABHI, review the concise study guide and workplace spreadsheet examples, try the practical activity, and pass the Module 01 Quiz with 70% or higher to unlock Module 02.',
      studyGuidance: [
        'Watch at least 90% of the embedded Module 01 video to unlock the 10-question Module 01 Quiz.',
        'Review the concise study guide, Employee Spreadsheet, and Supplier List examples below the video.',
        'Complete the practical activity in Excel or Google Sheets to reinforce cell references and columns.',
        'Score 70% or higher (7/10) on the Module 01 Quiz to pass Module 01 and unlock Module 02.',
      ],
      prerequisites: 'No prior Excel experience required. Suitable for complete beginners and job seekers.',
    },
    whatYouWillLearn: [
      'Understand what Microsoft Excel is and why companies rely on it daily',
      'Identify workbooks, worksheets, rows, columns, cells, and cell references (such as A1 and B5)',
      'Recognize core Excel interface elements: Ribbon, Formula Bar, and Name Box',
      'See how Excel organizes real workplace data across HR, procurement, accounts, sales, and operations',
    ],
    skillsDeveloped: [
      'Excel Fundamentals',
      'Workbook & Worksheet Navigation',
      'Cell Referencing',
      'Workplace Data Organization',
    ],
    modules: [
      {
        id: 'excel_m01_fundamentals',
        order: 1,
        title: 'Excel Fundamentals',
        level: 'Beginner',
        summary:
          'Understand Microsoft Excel, its interface, workbooks, worksheets, rows, columns and cells. Learn how Excel is used in real workplaces.',
        learningObjectives: [
          'Understand what Microsoft Excel is.',
          'Understand why companies use Excel.',
          'Identify workbooks and worksheets.',
          'Understand rows, columns, cells and cell references.',
          'Recognize the Excel interface.',
          'Understand how Excel stores and organizes information.',
          'Identify common workplace applications of Excel.',
        ],
        estimatedMinutes: 25,
        quizPlanned: true,
        quizRequired: true,
        passPercentage: 70,
        lessons: [
          {
            id: 'excel_m01_lesson_01',
            courseId: 'excel_for_job_seekers',
            moduleId: 'excel_m01_fundamentals',
            order: 1,
            title: 'Module 01: Excel Fundamentals',
            description:
              'Understand Microsoft Excel, its interface, workbooks, worksheets, rows, columns and cells. Learn how Excel is used in real workplaces.',
            videoUrl: 'https://www.youtube.com/embed/QiSCaEHQ7Yo',
            videos: [
              {
                id: 'excel_m01_vid_01',
                title: 'Microsoft Excel Basics for Beginners',
                publisher: 'Microsoft Mechanics',
                youtubeVideoId: 'QiSCaEHQ7Yo',
                embedUrl: 'https://www.youtube.com/embed/QiSCaEHQ7Yo',
                description:
                  'Guided walkthrough of Microsoft Excel basics including workbooks, worksheets, cells, interface navigation, and practical workplace organization.',
                durationSeconds: 0,
                durationLabel: 'Video Lesson',
                order: 1,
              },
            ],
            estimatedMinutes: 25,
            writtenContent:
              'Microsoft Excel is a spreadsheet application used by businesses worldwide to organize, calculate, and analyze structured data inside workbooks and worksheets.',
            studyGuide: {
              sections: [
                {
                  heading: '1. What Microsoft Excel Is',
                  body: 'Microsoft Excel is a spreadsheet program designed for organizing, calculating, and analyzing data in a structured grid. Instead of keeping scattered notes, Excel stores information cleanly in tables where numbers and text can be sorted, filtered, and calculated quickly.',
                },
                {
                  heading: '2. Why Businesses Use Excel',
                  body: 'Companies of every size rely on Excel because it is fast, flexible, and widely understood across teams. It helps employees reduce manual errors, summarize large lists, prepare management reports, and make decisions backed by clear numbers.',
                },
                {
                  heading: '3. Workbooks and Worksheets',
                  body: 'An Excel file (saved as .xlsx) is called a Workbook. Inside a single workbook, you can keep one or more tabs at the bottom — each individual spreadsheet tab is called a Worksheet (for example: "Employees", "Attendance", or "Suppliers").',
                },
                {
                  heading: '4. Rows, Columns, and Cells',
                  body: 'Every worksheet is made of vertical Columns identified by letters across the top (A, B, C, ...), horizontal Rows identified by numbers down the left side (1, 2, 3, ...), and Cells — the single rectangular boxes formed where a column and a row intersect.',
                },
                {
                  heading: '5. Cell Addresses (Examples: A1 and B5)',
                  body: 'Every cell has a unique address (also called a cell reference) written with the column letter first and the row number second:',
                  bullets: [
                    'A1 refers to the very first cell in Column A, Row 1 (often used for the first column header).',
                    'B5 refers to the cell located in Column B and Row 5.',
                    'Cell references let formulas point to exact values so results update automatically whenever data changes.',
                  ],
                },
                {
                  heading: '6. Basic Excel Interface: Ribbon, Formula Bar & Name Box',
                  body: 'Knowing three core interface areas makes navigating Excel effortless:',
                  bullets: [
                    'Ribbon: The top command bar organized into tabs (Home, Insert, Page Layout, Formulas, Data) containing formatting, chart, and data tools.',
                    'Name Box: Located to the left of the Formula Bar — displays the active cell reference (such as A1 or B5) so you always know where your cursor is.',
                    'Formula Bar: Located directly above the column letters — displays and lets you edit the text, number, or formula inside the selected cell.',
                  ],
                },
                {
                  heading: '7. Common Workplace Uses Across Departments',
                  body: 'Excel is an everyday skill across virtually every office role:',
                  bullets: [
                    'HR: Employee directories, attendance logs, leave trackers, and onboarding checklists.',
                    'Procurement: Supplier lists, quotation comparisons, purchase order trackers, and delivery timelines.',
                    'Accounts & Finance: Expense registers, invoice tracking, monthly budgets, and payment reconciliations.',
                    'Sales: Lead pipelines, monthly sales targets, commission sheets, and customer follow-up trackers.',
                    'Operations: Inventory counts, dispatch schedules, shift rosters, and daily KPI dashboards.',
                  ],
                },
              ],
              examples: [
                {
                  title: 'Real-World Example 1: Employee Spreadsheet (HR)',
                  subtitle:
                    'Row 1 stores clear column headers (A1:E1). Each subsequent row holds one employee record — for example, cell B5 holds the Name in Column B, Row 5.',
                  columns: ['A · Employee ID', 'B · Name', 'C · Department', 'D · Joining Date', 'E · Work Location'],
                  rows: [
                    ['EMP-101', 'Aarav Nair', 'Operations', '2024-02-12', 'Dubai'],
                    ['EMP-102', 'Meera Menon', 'Human Resources', '2024-04-01', 'Abu Dhabi'],
                    ['EMP-103', 'Rohan Kapoor', 'Procurement', '2024-06-18', 'Sharjah'],
                    ['EMP-104', 'Fatima Al-Mansoor', 'Accounts', '2024-09-05', 'Dubai'],
                  ],
                },
                {
                  title: 'Real-World Example 2: Supplier List (Procurement)',
                  subtitle:
                    'Procurement teams organize supplier quotations in columns so unit prices and delivery times can be compared accurately side by side.',
                  columns: ['A · Supplier ID', 'B · Supplier Name', 'C · Category', 'D · Quoted Price (AED)', 'E · Delivery Lead Time'],
                  rows: [
                    ['SUP-01', 'Gulf Office Supplies LLC', 'Stationery', '4,250', '2 Days'],
                    ['SUP-02', 'Emirates Tech Trading', 'IT Hardware', '18,900', '4 Days'],
                    ['SUP-03', 'Al Noor Packaging Co.', 'Packaging', '6,400', '3 Days'],
                  ],
                },
              ],
            },
            exercise: {
              title: 'Practical Activity: Build Your First Employee Information Table',
              instructions:
                'Open Microsoft Excel (or a blank spreadsheet) and create a new workbook. Rename the first worksheet to "Employees". In Row 1, enter the four headers in cells A1 to D1: Employee ID (A1), Name (B1), Department (C1), and Joining Date (D1). Then add at least 5 sample employee rows in Rows 2 to 6, check the Name Box as you click cell B5, and save your workbook.',
              deliverable:
                'A clean worksheet containing columns for Employee ID, Name, Department, and Joining Date with 5 sample employee rows.',
            },
            attachments: [],
          },
        ],
      },
      {
        id: 'excel_m02_upcoming',
        order: 2,
        title: 'Module 02: Next Module in Curriculum',
        level: 'Beginner',
        summary:
          'Locked until you watch the Module 01 video and pass the Module 01 Quiz with 70% or higher.',
        lessons: [],
        quizPlanned: true,
        quizRequired: false,
        passPercentage: 70,
        isUpcomingPlaceholder: true,
      },
    ],
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
