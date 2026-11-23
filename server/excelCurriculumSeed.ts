/**
 * SERVER-ONLY Authoritative Curriculum & Quiz Bank Seed for Learn with ABHI.
 *
 * SECURITY BOUNDARY:
 * - MUST ONLY be imported by server.ts / server/* modules.
 * - NEVER import this file into src/ client code — correctOptionIndex and
 *   explanation fields are strictly withheld until server-side grading.
 */

import type {
  PersistedAssessmentConfig,
  PersistedCourseDefinition,
} from './learningStore';

export const EXCEL_COURSE_ID = 'excel_for_job_seekers';
export const EXCEL_COURSE_SLUG = 'excel-for-job-seekers';
export const EXCEL_COURSE_TITLE = 'Excel for Job Seekers';

export const EXCEL_M01_ID = 'excel_m01_fundamentals';
export const EXCEL_M01_LESSON_ID = 'excel_m01_lesson_01';
export const EXCEL_M02_ID = 'excel_m02_upcoming';

export const EXCEL_COURSE_DEFINITION: Omit<PersistedCourseDefinition, 'updatedAt'> = {
  courseId: EXCEL_COURSE_ID,
  courseSlug: EXCEL_COURSE_SLUG,
  courseTitle: EXCEL_COURSE_TITLE,
  orderedModuleIds: [EXCEL_M01_ID, EXCEL_M02_ID],
  requiredLessonIds: [EXCEL_M01_LESSON_ID],
  passPercentage: 70,
  certificateTemplateId: 'default_abhi_certificate',
};

/**
 * Required lessons that must be completed (via video completion tracking or verified fallback)
 * before a student is permitted to start the corresponding module quiz.
 */
export const MODULE_REQUIRED_LESSONS: Record<string, string[]> = {
  [EXCEL_M01_ID]: [EXCEL_M01_LESSON_ID],
};

export const EXCEL_M01_QUIZ_CONFIG: PersistedAssessmentConfig = {
  id: `quiz_${EXCEL_M01_ID}`,
  courseId: EXCEL_COURSE_ID,
  courseSlug: EXCEL_COURSE_SLUG,
  courseTitle: EXCEL_COURSE_TITLE,
  assessmentType: 'module_quiz',
  moduleId: EXCEL_M01_ID,
  moduleOrder: 1,
  title: 'Module 01 Quiz: Excel Fundamentals',
  description:
    'Test your understanding of Microsoft Excel, workbooks, worksheets, rows, columns, cells, the Excel interface, and workplace applications. Score at least 70% (7 out of 10) to pass Module 1 and unlock Module 2.',
  passPercentage: 70,
  questionCount: 10,
  randomizeOrder: false,
  requiredForCompletion: true,
  questions: [
    {
      id: 'excel_m01_q01',
      prompt: 'What is Microsoft Excel primarily used for?',
      options: [
        'Editing videos',
        'Organizing, calculating and analyzing data',
        'Designing websites',
        'Sending emails',
      ],
      correctOptionIndex: 1,
      explanation:
        'Microsoft Excel is a spreadsheet application designed primarily for organizing, calculating, and analyzing structured data.',
    },
    {
      id: 'excel_m01_q02',
      prompt: 'What is an Excel file generally called?',
      options: ['Document', 'Presentation', 'Workbook', 'Database server'],
      correctOptionIndex: 2,
      explanation:
        'An Excel file is called a workbook (typically saved with the .xlsx extension), and it can contain one or more worksheets.',
    },
    {
      id: 'excel_m01_q03',
      prompt: 'What is a worksheet?',
      options: [
        'A single spreadsheet inside a workbook',
        'A computer program',
        'A printed document',
        'A chart only',
      ],
      correctOptionIndex: 0,
      explanation:
        'A worksheet (or sheet) is a single grid-based spreadsheet tab located inside an Excel workbook.',
    },
    {
      id: 'excel_m01_q04',
      prompt: 'How are columns identified in Excel?',
      options: ['Numbers', 'Letters', 'Colors', 'Symbols'],
      correctOptionIndex: 1,
      explanation:
        'Vertical columns in Excel are identified by letters along the top of the worksheet (A, B, C, ..., Z, AA, AB, etc.).',
    },
    {
      id: 'excel_m01_q05',
      prompt: 'How are rows identified in Excel?',
      options: ['Letters', 'Colors', 'Numbers', 'Formulas'],
      correctOptionIndex: 2,
      explanation:
        'Horizontal rows in Excel are identified by numbers running down the left side of the worksheet (1, 2, 3, etc.).',
    },
    {
      id: 'excel_m01_q06',
      prompt: 'What is a cell?',
      options: [
        'The intersection of a row and a column',
        'A complete workbook',
        'A toolbar',
        'A chart',
      ],
      correctOptionIndex: 0,
      explanation:
        'A cell is the single rectangular box formed where a vertical column and a horizontal row intersect, used to enter and store data.',
    },
    {
      id: 'excel_m01_q07',
      prompt: 'What does the cell reference B5 mean?',
      options: [
        'Column 5 and row B',
        'Column B and row 5',
        'Workbook B and worksheet 5',
        'Formula B multiplied by 5',
      ],
      correctOptionIndex: 1,
      explanation:
        'Cell references always list the column letter first followed by the row number, so B5 refers to the cell in Column B and Row 5.',
    },
    {
      id: 'excel_m01_q08',
      prompt: 'What is the Ribbon in Excel?',
      options: [
        'A collection of tabs and commands',
        'A worksheet',
        'A cell address',
        'A type of formula',
      ],
      correctOptionIndex: 0,
      explanation:
        'The Ribbon sits across the top of Excel and organizes tools and commands into tabs such as Home, Insert, Page Layout, Formulas, and Data.',
    },
    {
      id: 'excel_m01_q09',
      prompt: 'Which department can use Excel to compare supplier quotations?',
      options: ['Procurement', 'Security only', 'Reception only', 'None of these'],
      correctOptionIndex: 0,
      explanation:
        'Procurement teams routinely use Excel spreadsheets to compare vendor pricing, delivery terms, and quotation totals side by side.',
    },
    {
      id: 'excel_m01_q10',
      prompt: 'Which of the following is a common business use of Excel?',
      options: [
        'Tracking employee attendance',
        'Repairing computer hardware',
        'Installing operating systems',
        'Making telephone calls',
      ],
      correctOptionIndex: 0,
      explanation:
        'Tracking employee attendance, leave records, payroll summaries, and staff rosters are among the most common everyday business uses of Excel.',
    },
  ],
};
