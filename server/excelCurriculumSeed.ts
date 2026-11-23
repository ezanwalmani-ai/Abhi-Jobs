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

export const EXCEL_M02_ID = 'excel_m02_data_entry_formatting';
export const EXCEL_M02_LESSON_ID = 'excel_m02_lesson_01';

export const EXCEL_M03_ID = 'excel_m03_formulas_references';
export const EXCEL_M03_LESSON_ID = 'excel_m03_lesson_01';

export const EXCEL_M04_ID = 'excel_m04_upcoming';

export const EXCEL_COURSE_DEFINITION: Omit<PersistedCourseDefinition, 'updatedAt'> = {
  courseId: EXCEL_COURSE_ID,
  courseSlug: EXCEL_COURSE_SLUG,
  courseTitle: EXCEL_COURSE_TITLE,
  orderedModuleIds: [EXCEL_M01_ID, EXCEL_M02_ID, EXCEL_M03_ID, EXCEL_M04_ID],
  requiredLessonIds: [EXCEL_M01_LESSON_ID, EXCEL_M02_LESSON_ID, EXCEL_M03_LESSON_ID],
  passPercentage: 70,
  certificateTemplateId: 'default_abhi_certificate',
};

/**
 * Required lessons that must be completed (via video completion tracking or verified fallback)
 * before a student is permitted to start the corresponding module quiz.
 */
export const MODULE_REQUIRED_LESSONS: Record<string, string[]> = {
  [EXCEL_M01_ID]: [EXCEL_M01_LESSON_ID],
  [EXCEL_M02_ID]: [EXCEL_M02_LESSON_ID],
  [EXCEL_M03_ID]: [EXCEL_M03_LESSON_ID],
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

export const EXCEL_M02_QUIZ_CONFIG: PersistedAssessmentConfig = {
  id: `quiz_${EXCEL_M02_ID}`,
  courseId: EXCEL_COURSE_ID,
  courseSlug: EXCEL_COURSE_SLUG,
  courseTitle: EXCEL_COURSE_TITLE,
  assessmentType: 'module_quiz',
  moduleId: EXCEL_M02_ID,
  moduleOrder: 2,
  title: 'Module 02 Quiz: Data Entry, Formatting & Worksheets',
  description:
    'Test your skills in entering and editing data, formatting text, numbers, dates, and cells, adjusting rows and columns, managing worksheets, Freeze Panes, and saving/printing workbooks. Score at least 70% (7 out of 10) to pass Module 2 and unlock Module 3.',
  passPercentage: 70,
  questionCount: 10,
  randomizeOrder: false,
  requiredForCompletion: true,
  questions: [
    {
      id: 'excel_m02_q01',
      prompt: 'Which keyboard shortcut is commonly used to save an Excel workbook?',
      options: ['Ctrl + P', 'Ctrl + S', 'Ctrl + C', 'Ctrl + Z'],
      correctOptionIndex: 1,
      explanation:
        'Ctrl + S (or Cmd + S on Mac) saves the active Excel workbook. Ctrl + P opens Print, Ctrl + C copies, and Ctrl + Z undoes the last action.',
    },
    {
      id: 'excel_m02_q02',
      prompt: 'Which Excel feature allows text to appear on multiple lines inside a cell?',
      options: ['Merge & Center', 'AutoFit', 'Wrap Text', 'Freeze Panes'],
      correctOptionIndex: 2,
      explanation:
        'Wrap Text breaks long text cleanly onto multiple lines within the same cell without spilling into neighboring columns or requiring cell merging.',
    },
    {
      id: 'excel_m02_q03',
      prompt: 'Which number format should be used to display a value as money?',
      options: ['Percentage', 'Currency', 'General', 'Date'],
      correctOptionIndex: 1,
      explanation:
        'Currency format displays numeric values with a currency symbol, thousand separators, and decimal places while keeping the underlying number ready for calculations.',
    },
    {
      id: 'excel_m02_q04',
      prompt: 'What does AutoFit do?',
      options: [
        'Deletes blank cells',
        'Automatically adjusts column width or row height to fit content',
        'Calculates totals',
        'Creates a new worksheet',
      ],
      correctOptionIndex: 1,
      explanation:
        'AutoFit resizes a column width or row height automatically to fit the widest or tallest entry so text is readable and ### errors disappear.',
    },
    {
      id: 'excel_m02_q05',
      prompt: 'Which command allows you to add another worksheet to a workbook?',
      options: ['Insert Worksheet', 'Print Preview', 'Format Painter', 'Find and Replace'],
      correctOptionIndex: 0,
      explanation:
        'Insert Worksheet (or clicking the + icon next to the sheet tabs) adds a fresh worksheet tab inside the current workbook.',
    },
    {
      id: 'excel_m02_q06',
      prompt: 'Why would you use Freeze Panes?',
      options: [
        'To prevent the workbook from opening',
        'To keep selected rows or columns visible while scrolling',
        'To delete unnecessary data',
        'To format currency',
      ],
      correctOptionIndex: 1,
      explanation:
        'Freeze Panes locks heading rows and/or identifier columns in place so they stay visible while you scroll through large workplace tables.',
    },
    {
      id: 'excel_m02_q07',
      prompt: 'Which option changes the background color of a cell?',
      options: ['Font Color', 'Fill Color', 'Number Format', 'Formula Bar'],
      correctOptionIndex: 1,
      explanation:
        'Fill Color (the paint bucket icon on the Home tab) changes the background shading of selected cells, whereas Font Color changes the text color.',
    },
    {
      id: 'excel_m02_q08',
      prompt: 'What happens when you rename a worksheet?',
      options: [
        'The entire workbook is deleted',
        "Only the worksheet's name changes",
        'All data is erased',
        'A new workbook is created',
      ],
      correctOptionIndex: 1,
      explanation:
        "Renaming a worksheet changes only the label on that sheet's tab; all existing data, formatting, and other worksheets stay intact.",
    },
    {
      id: 'excel_m02_q09',
      prompt: 'Which Excel feature helps display a worksheet before printing?',
      options: ['Print Preview', 'AutoSum', 'Sort', 'Wrap Text'],
      correctOptionIndex: 0,
      explanation:
        'Print Preview (File -> Print or Ctrl + P) shows exactly how pages, margins, orientation, and headers will look on paper before you print.',
    },
    {
      id: 'excel_m02_q10',
      prompt: 'Which file format is the standard Excel workbook format?',
      options: ['.mp4', '.jpg', '.xlsx', '.exe'],
      correctOptionIndex: 2,
      explanation:
        '.xlsx is the standard Microsoft Excel workbook format that preserves multiple worksheets, cell formatting, formulas, and print settings.',
    },
  ],
};

export const EXCEL_M03_QUIZ_CONFIG: PersistedAssessmentConfig = {
  id: `quiz_${EXCEL_M03_ID}`,
  courseId: EXCEL_COURSE_ID,
  courseSlug: EXCEL_COURSE_SLUG,
  courseTitle: EXCEL_COURSE_TITLE,
  assessmentType: 'module_quiz',
  moduleId: EXCEL_M03_ID,
  moduleOrder: 3,
  title: 'Module 03 Quiz: Formula Fundamentals & Cell References',
  description:
    'Test your understanding of Excel formulas, mathematical operators, operator precedence, relative, absolute, and mixed cell references, formula copying, and common formula errors. Score at least 70% (7 out of 10) to pass Module 3 and unlock Module 4.',
  passPercentage: 70,
  questionCount: 10,
  randomizeOrder: false,
  requiredForCompletion: true,
  questions: [
    {
      id: 'excel_m03_q01',
      prompt: 'What symbol must normally be used at the beginning of an Excel formula?',
      options: ['#', '=', '@', '%'],
      correctOptionIndex: 1,
      explanation:
        'Every Excel formula begins with an equals sign (=). Without it, Excel treats your entry as plain text instead of calculating a result.',
    },
    {
      id: 'excel_m03_q02',
      prompt: 'Which formula correctly adds cells A1 and B1?',
      options: ['A1+B1', 'ADD(A1,B1)', '=A1+B1', 'A1=B1'],
      correctOptionIndex: 2,
      explanation:
        '=A1+B1 starts with = and uses the + addition operator to add the values stored in cells A1 and B1.',
    },
    {
      id: 'excel_m03_q03',
      prompt: 'Which operator is used for multiplication in Excel?',
      options: ['x', '/', '+', '*'],
      correctOptionIndex: 3,
      explanation:
        'Excel uses the asterisk (*) symbol for multiplication (for example, =B2*C2), not the letter x.',
    },
    {
      id: 'excel_m03_q04',
      prompt: 'What is the result of =10+5*2?',
      options: ['30', '20', '25', '15'],
      correctOptionIndex: 1,
      explanation:
        'By operator precedence, Excel multiplies 5*2 first (10) and then adds 10, producing 20. To get 30, use parentheses: =(10+5)*2.',
    },
    {
      id: 'excel_m03_q05',
      prompt: 'What does =B2*C2 calculate?',
      options: [
        'Adds B2 and C2',
        'Divides B2 by C2',
        'Multiplies the values in B2 and C2',
        'Deletes both cells',
      ],
      correctOptionIndex: 2,
      explanation:
        'The * operator multiplies the numeric value stored in cell B2 by the numeric value stored in cell C2.',
    },
    {
      id: 'excel_m03_q06',
      prompt: 'What is a relative cell reference?',
      options: [
        'A reference that automatically adjusts when a formula is copied',
        'A reference that cannot change',
        'A reference to another worksheet only',
        'A reference that deletes cell contents',
      ],
      correctOptionIndex: 0,
      explanation:
        'A relative reference (like B2) changes automatically relative to its new position when you copy a formula across rows or columns.',
    },
    {
      id: 'excel_m03_q07',
      prompt: 'What does $A$1 represent?',
      options: [
        'A completely relative reference',
        'A reference that locks both the column and row',
        'A reference that locks only the row',
        'A reference that locks only the column',
      ],
      correctOptionIndex: 1,
      explanation:
        'The dollar sign before A locks column A and the dollar sign before 1 locks row 1, making $A$1 a fully absolute reference.',
    },
    {
      id: 'excel_m03_q08',
      prompt: 'What will =B2+C2 normally become when copied one row down?',
      options: ['=B2+C2', '=$B$2+$C$2', '=B3+C3', '=B1+C1'],
      correctOptionIndex: 2,
      explanation:
        'Because both B2 and C2 are relative references, copying the formula one row down increases each row number by 1 to produce =B3+C3.',
    },
    {
      id: 'excel_m03_q09',
      prompt: 'What does the error #DIV/0! generally mean?',
      options: [
        'The worksheet is deleted',
        'Excel cannot find a font',
        'The formula is too long',
        'The formula is dividing by zero',
      ],
      correctOptionIndex: 3,
      explanation:
        '#DIV/0! appears when a formula tries to divide a number by 0 or by an empty cell treated as zero.',
    },
    {
      id: 'excel_m03_q10',
      prompt:
        'Employee Basic Salary is in B2, Allowance in C2, and Deduction in D2. Which formula calculates Net Salary correctly?',
      options: ['=B2+C2-D2', '=B2-C2+D2', '=B2*C2*D2', '=B2/C2+D2'],
      correctOptionIndex: 0,
      explanation:
        'Net Salary equals Basic Salary plus Allowance minus Deduction, written in Excel as =B2+C2-D2.',
    },
  ],
};


