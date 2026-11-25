/**
 * SERVER-ONLY Quiz Bank Seed for Modules 05–12 of Excel for Job Seekers.
 *
 * SECURITY BOUNDARY:
 * - MUST ONLY be imported by server-side modules (e.g., server/excelCurriculumSeed.ts).
 * - NEVER import this file into src/ client code — correctOptionIndex and
 *   explanation fields are strictly withheld until server-side grading.
 */

import type { PersistedAssessmentConfig } from './learningStore';

const COURSE_ID = 'excel_for_job_seekers';
const COURSE_SLUG = 'excel-for-job-seekers';
const COURSE_TITLE = 'Excel for Job Seekers';

export const EXCEL_M05_ID = 'excel_m05_vlookup_xlookup';
export const EXCEL_M05_LESSON_ID = 'excel_m05_lesson_01';

export const EXCEL_M06_ID = 'excel_m06_sorting_filtering_tables';
export const EXCEL_M06_LESSON_ID = 'excel_m06_lesson_01';

export const EXCEL_M07_ID = 'excel_m07_data_cleaning';
export const EXCEL_M07_LESSON_ID = 'excel_m07_lesson_01';

export const EXCEL_M08_ID = 'excel_m08_conditional_formatting';
export const EXCEL_M08_LESSON_ID = 'excel_m08_lesson_01';

export const EXCEL_M09_ID = 'excel_m09_pivottables_analysis';
export const EXCEL_M09_LESSON_ID = 'excel_m09_lesson_01';

export const EXCEL_M10_ID = 'excel_m10_charts_dashboards';
export const EXCEL_M10_LESSON_ID = 'excel_m10_lesson_01';

export const EXCEL_M11_ID = 'excel_m11_real_jobs_workplace';
export const EXCEL_M11_LESSON_ID = 'excel_m11_lesson_01';

export const EXCEL_M12_ID = 'excel_m12_ai_automation_project';
export const EXCEL_M12_LESSON_ID = 'excel_m12_lesson_01';

// ============================================================================
// MODULE 05 QUIZ — VLOOKUP, XLOOKUP & Lookup Skills (10 Questions)
// ============================================================================
export const EXCEL_M05_QUIZ_CONFIG: PersistedAssessmentConfig = {
  id: `quiz_${EXCEL_M05_ID}`,
  courseId: COURSE_ID,
  courseSlug: COURSE_SLUG,
  courseTitle: COURSE_TITLE,
  assessmentType: 'module_quiz',
  moduleId: EXCEL_M05_ID,
  moduleOrder: 5,
  title: 'Module 05 Quiz: VLOOKUP, XLOOKUP & Lookup Skills',
  description:
    'Test your mastery of VLOOKUP, XLOOKUP, exact vs. approximate match, absolute table references, error handling with IFERROR, and lookup compatibility. Score at least 70% (7 out of 10) to pass Module 5 and unlock Module 6.',
  passPercentage: 70,
  questionCount: 10,
  randomizeOrder: false,
  requiredForCompletion: true,
  questions: [
    {
      id: 'm05_q01',
      prompt: 'What does VLOOKUP stand for?',
      options: ['Vertical Lookup', 'Value Location', 'Variable Lookup', 'Visual Lookup'],
      correctOptionIndex: 0,
      explanation:
        'VLOOKUP stands for Vertical Lookup because it searches vertically down the leftmost column of a table range and returns a related value from the same row.',
    },
    {
      id: 'm05_q02',
      prompt: 'Which argument tells VLOOKUP which column to return a result from?',
      options: ['lookup_value', 'table_array', 'col_index_num', 'range_lookup'],
      correctOptionIndex: 2,
      explanation:
        'col_index_num is the column number within table_array (starting at 1 for the leftmost column) from which VLOOKUP returns the matching value.',
    },
    {
      id: 'm05_q03',
      prompt: 'Which argument should normally be used to find an exact supplier ID match?',
      options: ['TRUE', 'FALSE', 'SUM', 'MAX'],
      correctOptionIndex: 1,
      explanation:
        'Using FALSE (or 0) as the fourth VLOOKUP argument forces an exact match, which is essential for unique identifiers such as Supplier IDs, Employee IDs, and PO numbers.',
    },
    {
      id: 'm05_q04',
      prompt: 'What is a major limitation of VLOOKUP?',
      options: [
        'It cannot search for text',
        'It cannot calculate totals',
        'It returns values only from columns to the right of the lookup column',
        'It cannot use cell references',
      ],
      correctOptionIndex: 2,
      explanation:
        'VLOOKUP always searches the first (leftmost) column of table_array and can only retrieve values from columns to the right of it.',
    },
    {
      id: 'm05_q05',
      prompt: 'Which function is a more flexible alternative to VLOOKUP?',
      options: ['SUMIF', 'XLOOKUP', 'COUNTIF', 'AVERAGE'],
      correctOptionIndex: 1,
      explanation:
        'XLOOKUP is a modern replacement for VLOOKUP that defaults to exact match, can look left or right, supports built-in not-found messages, and does not break when columns are inserted.',
    },
    {
      id: 'm05_q06',
      prompt:
        'Which formula correctly searches for F2 in A2:A10 and returns the matching value from B2:B10?',
      options: [
        '=XLOOKUP(F2,A2:A10,B2:B10)',
        '=SUM(F2,A2:A10,B2:B10)',
        '=COUNT(F2,A2:A10,B2:B10)',
        '=AVERAGE(F2,A2:A10,B2:B10)',
      ],
      correctOptionIndex: 0,
      explanation:
        '=XLOOKUP(F2,A2:A10,B2:B10) searches for the value in F2 inside lookup_array A2:A10 and returns the corresponding entry from return_array B2:B10.',
    },
    {
      id: 'm05_q07',
      prompt: 'What does the if_not_found argument in XLOOKUP do?',
      options: [
        'Deletes missing records',
        'Displays a specified result when no match is found',
        'Sorts the lookup table',
        'Changes column width',
      ],
      correctOptionIndex: 1,
      explanation:
        'The optional fourth argument (if_not_found) lets XLOOKUP return a friendly message or fallback value (such as "Not Found") instead of displaying #N/A.',
    },
    {
      id: 'm05_q08',
      prompt: 'Which formula helps prevent a VLOOKUP error from displaying when no match is found?',
      options: [
        '=SUM(VLOOKUP(...))',
        '=IFERROR(VLOOKUP(...),"Not Found")',
        '=COUNT(VLOOKUP(...))',
        '=MAX(VLOOKUP(...))',
      ],
      correctOptionIndex: 1,
      explanation:
        'Wrapping VLOOKUP inside IFERROR(..., "Not Found") catches #N/A errors and displays clean text instead.',
    },
    {
      id: 'm05_q09',
      prompt: 'Which Excel versions generally support XLOOKUP?',
      options: [
        'Only Excel 2003',
        'Microsoft 365 and supported newer versions such as Excel 2021 and later',
        'Every Excel version without exception',
        'Only Excel for Mac',
      ],
      correctOptionIndex: 1,
      explanation:
        'XLOOKUP is supported in Microsoft 365, Excel for the Web, and newer standalone releases such as Excel 2021 and later, while older releases require VLOOKUP or INDEX/MATCH.',
    },
    {
      id: 'm05_q10',
      prompt:
        'Why should the VLOOKUP table range often use absolute references when copying formulas down?',
      options: [
        'To lock the lookup range so it does not shift',
        'To delete duplicate suppliers',
        'To convert numbers into text',
        'To sort data automatically',
      ],
      correctOptionIndex: 0,
      explanation:
        'Locking the table range with dollar signs (e.g., $A$2:$E$8) ensures every copied row continues looking up against the exact same master table.',
    },
  ],
};

// ============================================================================
// MODULE 06 QUIZ — Sorting, Filtering, Tables & Data Validation (10 Questions)
// ============================================================================
export const EXCEL_M06_QUIZ_CONFIG: PersistedAssessmentConfig = {
  id: `quiz_${EXCEL_M06_ID}`,
  courseId: COURSE_ID,
  courseSlug: COURSE_SLUG,
  courseTitle: COURSE_TITLE,
  assessmentType: 'module_quiz',
  moduleId: EXCEL_M06_ID,
  moduleOrder: 6,
  title: 'Module 06 Quiz: Sorting, Filtering, Tables & Data Validation',
  description:
    'Test your skills in sorting, multi-level sorting, filtering text/numbers/dates, Excel Tables, structured references, Total Rows, dropdown lists, Data Validation, and removing duplicates. Score at least 70% (7 out of 10) to pass Module 6 and unlock Module 7.',
  passPercentage: 70,
  questionCount: 10,
  randomizeOrder: false,
  requiredForCompletion: true,
  questions: [
    {
      id: 'm06_q01',
      prompt: 'Which feature arranges data alphabetically?',
      options: ['Filter', 'Sort', 'Freeze Panes', 'Merge'],
      correctOptionIndex: 1,
      explanation:
        'Sort rearranges rows in ascending (A–Z, smallest to largest, oldest to newest) or descending order.',
    },
    {
      id: 'm06_q02',
      prompt: 'What does filtering do?',
      options: [
        'Deletes all records',
        'Displays records matching selected conditions',
        'Changes formulas',
        'Creates a chart',
      ],
      correctOptionIndex: 1,
      explanation:
        'Filtering temporarily hides rows that do not meet your criteria while keeping all underlying records intact.',
    },
    {
      id: 'm06_q03',
      prompt: 'Which shortcut commonly converts a selected data range into an Excel Table?',
      options: ['Ctrl+P', 'Ctrl+T', 'Ctrl+Z', 'Ctrl+S'],
      correctOptionIndex: 1,
      explanation:
        'Pressing Ctrl+T (or Insert -> Table) converts a structured range into an official Excel Table with built-in filters, dynamic expansion, and styling.',
    },
    {
      id: 'm06_q04',
      prompt: 'What is Data Validation used for?',
      options: [
        'Restricting or controlling data entry',
        'Deleting worksheets',
        'Creating charts',
        'Changing fonts',
      ],
      correctOptionIndex: 0,
      explanation:
        'Data Validation enforces entry rules — such as dropdown lists, positive numbers, or valid date ranges — to prevent input mistakes.',
    },
    {
      id: 'm06_q05',
      prompt: 'Which Data Validation option creates a dropdown list?',
      options: ['Whole Number', 'Decimal', 'List', 'Date'],
      correctOptionIndex: 2,
      explanation:
        'Selecting Allow: List in Data Validation displays an in-cell dropdown menu so users pick only approved options.',
    },
    {
      id: 'm06_q06',
      prompt: 'Why should data be sorted using the entire table rather than only one column?',
      options: [
        'To preserve correct row relationships',
        'To remove formulas',
        'To change the workbook name',
        'To hide blank cells',
      ],
      correctOptionIndex: 0,
      explanation:
        'Sorting a single isolated column disconnects values from their matching PO numbers, suppliers, and dates in other columns, corrupting the dataset.',
    },
    {
      id: 'm06_q07',
      prompt: 'Which feature can remove repeated records?',
      options: ['AutoSum', 'Remove Duplicates', 'Freeze Panes', 'Wrap Text'],
      correctOptionIndex: 1,
      explanation:
        'Data -> Remove Duplicates identifies and removes repeated rows based on one or more key columns such as PO Number.',
    },
    {
      id: 'm06_q08',
      prompt: 'What does a Total Row in an Excel Table help calculate?',
      options: [
        'Workbook size',
        'Summary values such as totals and averages',
        'Worksheet names',
        'Font size',
      ],
      correctOptionIndex: 1,
      explanation:
        'Enabling Total Row adds an automatic summary row using SUBTOTAL functions (Sum, Average, Count, Min, Max) that dynamically respond to filters.',
    },
    {
      id: 'm06_q09',
      prompt: 'What is a structured reference?',
      options: [
        'A reference using Excel Table names and column names',
        'A reference to an image',
        'A password',
        'A chart title',
      ],
      correctOptionIndex: 0,
      explanation:
        'Structured references (like =SUM(PurchaseOrders[Purchase Amount])) use readable table and column headers and automatically expand when new rows are added.',
    },
    {
      id: 'm06_q10',
      prompt: 'What happens when a date filter is applied?',
      options: [
        'Excel deletes old dates',
        'Excel displays records matching the selected date conditions',
        'Excel changes all dates to text',
        'Excel removes the worksheet',
      ],
      correctOptionIndex: 1,
      explanation:
        'Date filters display only rows whose dates match the chosen condition (such as This Month, After, or Between) without deleting hidden rows.',
    },
  ],
};

// ============================================================================
// MODULE 07 QUIZ — Data Cleaning & Data Management (10 Questions)
// ============================================================================
export const EXCEL_M07_QUIZ_CONFIG: PersistedAssessmentConfig = {
  id: `quiz_${EXCEL_M07_ID}`,
  courseId: COURSE_ID,
  courseSlug: COURSE_SLUG,
  courseTitle: COURSE_TITLE,
  assessmentType: 'module_quiz',
  moduleId: EXCEL_M07_ID,
  moduleOrder: 7,
  title: 'Module 07 Quiz: Data Cleaning & Data Management',
  description:
    'Test your skills in cleaning messy datasets using TRIM, CLEAN, PROPER, LEN, Remove Duplicates, Text to Columns, Flash Fill, handling blank cells, and fixing numbers stored as text. Score at least 70% (7 out of 10) to pass Module 7 and unlock Module 8.',
  passPercentage: 70,
  questionCount: 10,
  randomizeOrder: false,
  requiredForCompletion: true,
  questions: [
    {
      id: 'm07_q01',
      prompt: 'What is data cleaning?',
      options: [
        'Adding colors to cells',
        'Identifying and correcting inaccurate or inconsistent data',
        'Creating charts only',
        'Deleting the workbook',
      ],
      correctOptionIndex: 1,
      explanation:
        'Data cleaning is the process of finding and fixing errors, extra spaces, duplicates, formatting mismatches, and inconsistencies so data is reliable for reporting.',
    },
    {
      id: 'm07_q02',
      prompt: 'Which function removes unnecessary extra spaces?',
      options: ['LEN', 'TRIM', 'MAX', 'COUNT'],
      correctOptionIndex: 1,
      explanation:
        'TRIM removes leading spaces, trailing spaces, and extra spaces between words, leaving only single spaces between words.',
    },
    {
      id: 'm07_q03',
      prompt: 'Which function removes non-printable characters?',
      options: ['CLEAN', 'SUM', 'LEFT', 'TODAY'],
      correctOptionIndex: 0,
      explanation:
        'CLEAN strips non-printable ASCII control characters (codes 0–31) often introduced when copying or exporting data from ERP systems and websites.',
    },
    {
      id: 'm07_q04',
      prompt: 'Which feature removes duplicate records?',
      options: ['Sort A–Z', 'Remove Duplicates', 'AutoSum', 'Merge Cells'],
      correctOptionIndex: 1,
      explanation:
        'Remove Duplicates deletes repeated entries based on the selected identifier columns while keeping the first unique occurrence.',
    },
    {
      id: 'm07_q05',
      prompt: 'Which function converts text to proper capitalization?',
      options: ['LOWER', 'UPPER', 'PROPER', 'COUNTIF'],
      correctOptionIndex: 2,
      explanation:
        'PROPER capitalizes the first letter of each word and converts the remaining letters to lowercase (e.g., "abc technologies" becomes "Abc Technologies").',
    },
    {
      id: 'm07_q06',
      prompt: 'Which function returns the number of characters in text?',
      options: ['LEN', 'LEFT', 'RIGHT', 'SUM'],
      correctOptionIndex: 0,
      explanation:
        'LEN counts every character in a cell, including spaces, making it ideal for spotting hidden trailing spaces or checking ID lengths.',
    },
    {
      id: 'm07_q07',
      prompt: 'Which feature splits text into separate columns?',
      options: ['Freeze Panes', 'Text to Columns', 'Conditional Formatting', 'PivotTable'],
      correctOptionIndex: 1,
      explanation:
        'Data -> Text to Columns splits combined text (such as "First Last" or comma-separated codes) across multiple columns using delimiters or fixed widths.',
    },
    {
      id: 'm07_q08',
      prompt: 'What does Flash Fill do?',
      options: [
        'Deletes empty rows',
        'Recognizes patterns and fills data automatically',
        'Creates charts',
        'Changes formulas into values',
      ],
      correctOptionIndex: 1,
      explanation:
        'Flash Fill (Ctrl+E) detects the formatting or extraction pattern from an example you type and automatically fills the rest of the column.',
    },
    {
      id: 'm07_q09',
      prompt: 'Why should missing data be reviewed before deleting it?',
      options: [
        'It may contain information required for reporting',
        'Excel cannot save blank cells',
        'It changes the font',
        'It automatically creates duplicates',
      ],
      correctOptionIndex: 0,
      explanation:
        'Deleting an entire row because one field is blank can erase valid purchase amounts, supplier records, or audit history needed for accurate totals.',
    },
    {
      id: 'm07_q10',
      prompt: 'Why should numbers stored as text be corrected?',
      options: [
        'They cannot be formatted',
        'They may not calculate or analyze correctly as numbers',
        'They create new worksheets',
        'They automatically become dates',
      ],
      correctOptionIndex: 1,
      explanation:
        'Functions like SUM, AVERAGE, and numerical sorting ignore or misorder numbers stored as text, leading to inaccurate workplace reports.',
    },
  ],
};

// ============================================================================
// MODULE 08 QUIZ — Conditional Formatting (10 Questions)
// ============================================================================
export const EXCEL_M08_QUIZ_CONFIG: PersistedAssessmentConfig = {
  id: `quiz_${EXCEL_M08_ID}`,
  courseId: COURSE_ID,
  courseSlug: COURSE_SLUG,
  courseTitle: COURSE_TITLE,
  assessmentType: 'module_quiz',
  moduleId: EXCEL_M08_ID,
  moduleOrder: 8,
  title: 'Module 08 Quiz: Conditional Formatting',
  description:
    'Test your mastery of highlight cell rules, duplicate alerts, data bars, color scales, icon sets, formula-based conditional formatting, TODAY() overdue checks, and Manage Rules. Score at least 70% (7 out of 10) to pass Module 8 and unlock Module 9.',
  passPercentage: 70,
  questionCount: 10,
  randomizeOrder: false,
  requiredForCompletion: true,
  questions: [
    {
      id: 'm08_q01',
      prompt: 'What is conditional formatting used for?',
      options: [
        'Automatically formatting cells based on rules',
        'Deleting worksheets',
        'Creating formulas only',
        'Saving files',
      ],
      correctOptionIndex: 0,
      explanation:
        'Conditional formatting automatically applies colors, fills, icons, or bars whenever cell values meet defined rules.',
    },
    {
      id: 'm08_q02',
      prompt: 'Which feature highlights repeated values?',
      options: ['Remove Duplicates', 'Duplicate Values rule', 'AutoSum', 'Freeze Panes'],
      correctOptionIndex: 1,
      explanation:
        'The Duplicate Values highlight rule visually flags repeated entries (such as duplicate invoice numbers) without deleting them.',
    },
    {
      id: 'm08_q03',
      prompt: 'What do data bars represent?',
      options: [
        'Relative values inside cells',
        'Worksheet names',
        'Formula errors',
        'Dates only',
      ],
      correctOptionIndex: 0,
      explanation:
        'Data bars draw proportional horizontal bars inside cells so larger numbers display longer bars, making comparisons effortless.',
    },
    {
      id: 'm08_q04',
      prompt: 'What do color scales show?',
      options: [
        'Relative values using different colors',
        'File size',
        'Sheet order',
        'Cell addresses',
      ],
      correctOptionIndex: 0,
      explanation:
        'Color scales apply a two- or three-color gradient across a range so high, medium, and low values stand out visually.',
    },
    {
      id: 'm08_q05',
      prompt: 'Which feature displays symbols such as arrows or indicators?',
      options: ['Icon Sets', 'Data Validation', 'Text to Columns', 'Flash Fill'],
      correctOptionIndex: 0,
      explanation:
        'Icon Sets add visual indicators like traffic lights, checkmarks, flags, or directional arrows based on value thresholds.',
    },
    {
      id: 'm08_q06',
      prompt: 'What does the formula =B2>50000 test?',
      options: [
        'Whether B2 is less than 50,000',
        'Whether B2 is greater than 50,000',
        'Whether B2 is blank',
        'Whether B2 contains text',
      ],
      correctOptionIndex: 1,
      explanation:
        'The comparison =B2>50000 evaluates to TRUE whenever cell B2 exceeds 50,000, triggering the conditional format.',
    },
    {
      id: 'm08_q07',
      prompt: 'Which function can identify repeated values using a formula-based rule?',
      options: ['COUNTIF', 'TODAY', 'LEFT', 'MAX'],
      correctOptionIndex: 0,
      explanation:
        'A rule such as =COUNTIF($A$2:$A$20,A2)>1 returns TRUE whenever an invoice or PO number appears more than once.',
    },
    {
      id: 'm08_q08',
      prompt: 'What does TODAY() return?',
      options: ['Current date', 'Current month only', 'Current time only', 'Workbook name'],
      correctOptionIndex: 0,
      explanation:
        'TODAY() returns the current system date and updates automatically each day, making it ideal for spotting overdue invoices.',
    },
    {
      id: 'm08_q09',
      prompt: 'Why is conditional formatting useful for overdue invoices?',
      options: [
        'It can visually highlight invoices past their due dates',
        'It automatically pays invoices',
        'It deletes pending invoices',
        'It changes supplier details',
      ],
      correctOptionIndex: 0,
      explanation:
        'Combining Status="Pending" with Due Date < TODAY() automatically highlights overdue invoices so finance and procurement teams act immediately.',
    },
    {
      id: 'm08_q10',
      prompt: 'Where can existing conditional formatting rules be reviewed and changed?',
      options: ['Manage Rules', 'Save As', 'Print Preview', 'Name Box'],
      correctOptionIndex: 0,
      explanation:
        'Home -> Conditional Formatting -> Manage Rules lets you inspect rule order, edit formulas or ranges, and remove unneeded rules.',
    },
  ],
};

// ============================================================================
// MODULE 09 QUIZ — PivotTables & Data Analysis (10 Questions)
// ============================================================================
export const EXCEL_M09_QUIZ_CONFIG: PersistedAssessmentConfig = {
  id: `quiz_${EXCEL_M09_ID}`,
  courseId: COURSE_ID,
  courseSlug: COURSE_SLUG,
  courseTitle: COURSE_TITLE,
  assessmentType: 'module_quiz',
  moduleId: EXCEL_M09_ID,
  moduleOrder: 9,
  title: 'Module 09 Quiz: PivotTables & Data Analysis',
  description:
    'Test your mastery of PivotTable preparation, Rows, Columns, Values, Filters, Slicers, refreshing source data, PivotCharts, and business performance analysis. Score at least 70% (7 out of 10) to pass Module 9 and unlock Module 10.',
  passPercentage: 70,
  questionCount: 10,
  randomizeOrder: false,
  requiredForCompletion: true,
  questions: [
    {
      id: 'm09_q01',
      prompt: 'What is a PivotTable primarily used for?',
      options: [
        'Formatting fonts',
        'Summarizing and analyzing data',
        'Deleting worksheets',
        'Creating passwords',
      ],
      correctOptionIndex: 1,
      explanation:
        'PivotTables dynamically group, summarize, aggregate, and cross-tabulate large datasets into actionable business reports without complex formulas.',
    },
    {
      id: 'm09_q02',
      prompt: 'Which PivotTable area contains fields used to group records vertically?',
      options: ['Rows', 'Values', 'Filters', 'Charts'],
      correctOptionIndex: 0,
      explanation:
        'Fields dragged into the Rows area create distinct vertical row labels (such as Department or Supplier) to group records.',
    },
    {
      id: 'm09_q03',
      prompt: 'Where are numerical calculations such as Sum and Average normally placed?',
      options: ['Rows', 'Columns', 'Values', 'Filters'],
      correctOptionIndex: 2,
      explanation:
        'The Values area aggregates numeric or countable fields using calculations like Sum, Count, Average, Min, or Max.',
    },
    {
      id: 'm09_q04',
      prompt: 'Which feature can filter a PivotTable visually?',
      options: ['Slicer', 'WordArt', 'Wrap Text', 'AutoFit'],
      correctOptionIndex: 0,
      explanation:
        'Slicers provide clickable visual filter buttons that make filtering one or more connected PivotTables intuitive for managers.',
    },
    {
      id: 'm09_q05',
      prompt: 'What must be done when the source data changes and the PivotTable needs updated results?',
      options: [
        'Delete the workbook',
        'Refresh the PivotTable',
        'Rename the worksheet',
        'Change the font',
      ],
      correctOptionIndex: 1,
      explanation:
        'PivotTables read from an internal cache, so you must click Refresh (or Refresh All / Alt+F5) after editing source records.',
    },
    {
      id: 'm09_q06',
      prompt: 'Which calculation adds all purchase amounts?',
      options: ['Count', 'Sum', 'Average', 'Minimum'],
      correctOptionIndex: 1,
      explanation:
        'Setting Value Field Settings to Sum adds all purchase amounts within each PivotTable group.',
    },
    {
      id: 'm09_q07',
      prompt: 'What does the Columns area control?',
      options: [
        'Horizontal grouping of PivotTable data',
        'Workbook password',
        'File location',
        'Page margins',
      ],
      correctOptionIndex: 0,
      explanation:
        'Fields placed in the Columns area spread categories horizontally across the top of the PivotTable (e.g., months or order status).',
    },
    {
      id: 'm09_q08',
      prompt: 'Why should source data have consistent column headings?',
      options: [
        'To allow Excel to identify and organize fields correctly',
        'To increase file size',
        'To delete blank worksheets',
        'To change the theme',
      ],
      correctOptionIndex: 0,
      explanation:
        'Excel uses the first row of source data as PivotTable field names; blank or duplicate headers prevent PivotTable creation or cause confusion.',
    },
    {
      id: 'm09_q09',
      prompt: 'What is a PivotChart?',
      options: [
        'A chart connected to PivotTable data',
        'A picture of a worksheet',
        'A type of password',
        'A formula error',
      ],
      correctOptionIndex: 0,
      explanation:
        'A PivotChart is linked directly to a PivotTable so any filtering, slicing, or refreshing updates the visual chart automatically.',
    },
    {
      id: 'm09_q10',
      prompt: 'Which analysis identifies the total purchasing amount for each department?',
      options: [
        'Department-wise PivotTable summary',
        'Text to Columns',
        'Find and Replace',
        'Freeze Panes',
      ],
      correctOptionIndex: 0,
      explanation:
        'Placing Department in Rows and Sum of Purchase Amount in Values immediately creates a department-wise spend summary.',
    },
  ],
};

// ============================================================================
// MODULE 10 QUIZ — Charts, Reports & Dashboards (10 Questions)
// ============================================================================
export const EXCEL_M10_QUIZ_CONFIG: PersistedAssessmentConfig = {
  id: `quiz_${EXCEL_M10_ID}`,
  courseId: COURSE_ID,
  courseSlug: COURSE_SLUG,
  courseTitle: COURSE_TITLE,
  assessmentType: 'module_quiz',
  moduleId: EXCEL_M10_ID,
  moduleOrder: 10,
  title: 'Module 10 Quiz: Charts, Reports & Dashboards',
  description:
    'Test your mastery of Excel charts (column, bar, line, pie, combo), KPI cards, slicers, clean dashboard design principles, and PivotTable-linked visual reports. Score at least 70% (7 out of 10) to pass Module 10 and unlock Module 11.',
  passPercentage: 70,
  questionCount: 10,
  randomizeOrder: false,
  requiredForCompletion: true,
  questions: [
    {
      id: 'm10_q01',
      prompt: 'What is a dashboard used for?',
      options: [
        'Displaying important information and performance metrics',
        'Deleting records',
        'Changing passwords',
        'Creating worksheets only',
      ],
      correctOptionIndex: 0,
      explanation:
        'A dashboard brings key KPIs, trends, and category comparisons together on a single screen so decision-makers see performance at a glance.',
    },
    {
      id: 'm10_q02',
      prompt: 'Which chart is most suitable for showing trends over time?',
      options: ['Pie chart', 'Line chart', 'Doughnut chart', 'Radar chart'],
      correctOptionIndex: 1,
      explanation:
        'Line charts connect chronological points smoothly, making monthly or weekly increases, dips, and seasonal trends easy to read.',
    },
    {
      id: 'm10_q03',
      prompt: 'Which chart is commonly used to compare categories?',
      options: ['Column chart', 'Scatter chart only', 'Surface chart', 'Stock chart'],
      correctOptionIndex: 0,
      explanation:
        'Column (and bar) charts make side-by-side category comparisons—such as spending by department or supplier—immediately clear.',
    },
    {
      id: 'm10_q04',
      prompt: 'What does KPI stand for?',
      options: [
        'Key Performance Indicator',
        'Key Purchase Information',
        'Known Product Index',
        'Key Process Input',
      ],
      correctOptionIndex: 0,
      explanation:
        'KPI stands for Key Performance Indicator—a quantifiable headline metric such as Total Purchase Value or Pending Order Count.',
    },
    {
      id: 'm10_q05',
      prompt: 'What is the purpose of a slicer in an interactive dashboard?',
      options: [
        'Filter connected data visually',
        'Delete records',
        'Change formulas',
        'Protect the workbook',
      ],
      correctOptionIndex: 0,
      explanation:
        'Slicers act as interactive visual filters that update all connected PivotTables, KPIs, and charts with a single click.',
    },
    {
      id: 'm10_q06',
      prompt: 'Which chart is useful for showing proportions of a whole?',
      options: ['Pie chart', 'Line chart', 'Scatter chart', 'Histogram only'],
      correctOptionIndex: 0,
      explanation:
        'Pie (and doughnut) charts show how a small number of slices contribute percentage shares to a 100% total.',
    },
    {
      id: 'm10_q07',
      prompt: 'Why should dashboards avoid unnecessary decoration?',
      options: [
        'To improve readability and focus on important information',
        'To reduce the number of worksheets',
        'To delete data',
        'To prevent calculations',
      ],
      correctOptionIndex: 0,
      explanation:
        'Removing visual clutter, heavy borders, and unnecessary 3D effects keeps executive attention focused on the numbers and trends.',
    },
    {
      id: 'm10_q08',
      prompt: 'What is a KPI card?',
      options: [
        'A visual display of an important metric',
        'A worksheet password',
        'A chart legend',
        'A formula error',
      ],
      correctOptionIndex: 0,
      explanation:
        'A KPI card highlights a single high-priority figure (linked via formula) at the top of a dashboard for instant visibility.',
    },
    {
      id: 'm10_q09',
      prompt: 'What should be done before creating a dashboard?',
      options: [
        'Prepare and organize reliable source data',
        'Delete all source records',
        'Hide every worksheet',
        'Remove formulas',
      ],
      correctOptionIndex: 0,
      explanation:
        'Clean, well-structured source data ensures every downstream KPI, PivotTable, and chart is accurate and easy to refresh.',
    },
    {
      id: 'm10_q10',
      prompt: 'What is the benefit of connecting charts to PivotTables?',
      options: [
        'Charts can reflect changes in summarized data',
        'Charts become static images',
        'Formulas stop working',
        'Worksheets are deleted',
      ],
      correctOptionIndex: 0,
      explanation:
        'PivotCharts stay synchronized with their underlying PivotTables, updating automatically when data is filtered, sliced, or refreshed.',
    },
  ],
};

// ============================================================================
// MODULE 11 QUIZ — Excel for Real Jobs & Workplace Tasks (10 Questions)
// ============================================================================
export const EXCEL_M11_QUIZ_CONFIG: PersistedAssessmentConfig = {
  id: `quiz_${EXCEL_M11_ID}`,
  courseId: COURSE_ID,
  courseSlug: COURSE_SLUG,
  courseTitle: COURSE_TITLE,
  assessmentType: 'module_quiz',
  moduleId: EXCEL_M11_ID,
  moduleOrder: 11,
  title: 'Module 11 Quiz: Excel for Real Jobs & Workplace Tasks',
  description:
    'Test your readiness for real workplace Excel workflows across Procurement, HR, Finance, Sales, Inventory, and Operations. Score at least 70% (7 out of 10) to pass Module 11 and unlock Module 12.',
  passPercentage: 70,
  questionCount: 10,
  randomizeOrder: false,
  requiredForCompletion: true,
  questions: [
    {
      id: 'm11_q01',
      prompt: 'Which Excel document is commonly used to track purchase orders?',
      options: [
        'Purchase Order Register',
        'Music Playlist',
        'Photo Album',
        'Presentation Theme',
      ],
      correctOptionIndex: 0,
      explanation:
        'A Purchase Order Register logs every PO number, supplier, department, order date, amount, and fulfillment status in one structured tracker.',
    },
    {
      id: 'm11_q02',
      prompt: 'What information is normally stored in a Supplier Master?',
      options: [
        'Supplier details and identifiers',
        'Employee passwords',
        'Chart colors',
        'Computer settings',
      ],
      correctOptionIndex: 0,
      explanation:
        'A Supplier Master acts as the single source of truth storing unique Supplier IDs, names, cities, categories, contacts, and payment terms.',
    },
    {
      id: 'm11_q03',
      prompt: 'Which function can retrieve a supplier name from a supplier ID?',
      options: ['XLOOKUP', 'TODAY', 'LEN', 'MAX'],
      correctOptionIndex: 0,
      explanation:
        'XLOOKUP (or VLOOKUP) looks up a Supplier ID in the Supplier Master sheet and automatically populates the matching Supplier Name.',
    },
    {
      id: 'm11_q04',
      prompt: 'What is the purpose of a delivery tracker?',
      options: [
        'Monitoring order and delivery progress',
        'Formatting charts',
        'Calculating employee age only',
        'Changing workbook themes',
      ],
      correctOptionIndex: 0,
      explanation:
        'A delivery tracker compares expected vs. actual delivery dates and highlights pending or delayed shipments for procurement follow-up.',
    },
    {
      id: 'm11_q05',
      prompt: 'Which feature can visually identify overdue invoices?',
      options: [
        'Conditional Formatting',
        'Merge Cells',
        'WordArt',
        'Freeze Panes only',
      ],
      correctOptionIndex: 0,
      explanation:
        'Conditional Formatting automatically flags unpaid invoices whose due date has passed so accounts teams can prioritize action.',
    },
    {
      id: 'm11_q06',
      prompt: 'Which Excel feature can summarize purchase spending by department?',
      options: ['PivotTable', 'Spell Check', 'Page Layout', 'Find and Replace'],
      correctOptionIndex: 0,
      explanation:
        'PivotTables group transactions by department and sum purchase amounts cleanly for monthly management reporting.',
    },
    {
      id: 'm11_q07',
      prompt: 'What is a stock register used for?',
      options: [
        'Recording inventory quantities and movements',
        'Recording employee passwords',
        'Creating presentations',
        'Formatting text only',
      ],
      correctOptionIndex: 0,
      explanation:
        'A stock register tracks opening balances, inward receipts, outward issues, closing balances, and reorder alerts.',
    },
    {
      id: 'm11_q08',
      prompt: 'Why are dropdown lists useful in workplace trackers?',
      options: [
        'They help standardize data entry',
        'They delete formulas',
        'They remove worksheets',
        'They stop calculations',
      ],
      correctOptionIndex: 0,
      explanation:
        'Dropdown lists prevent typos and inconsistent status names (like "Paid", "paid", "PAID"), keeping summaries and PivotTables accurate.',
    },
    {
      id: 'm11_q09',
      prompt: 'What should a Purchase Executive check when recording a purchase order?',
      options: [
        'Supplier, quantity, price and order details',
        'Only the font size',
        'Only the worksheet color',
        'Only the workbook name',
      ],
      correctOptionIndex: 0,
      explanation:
        'Accurate PO entry requires verifying the supplier ID/name, quantities, unit prices, totals, delivery timeline, and approval details.',
    },
    {
      id: 'm11_q10',
      prompt: 'What is the main benefit of maintaining an organized invoice register?',
      options: [
        'Tracking invoice details and payment status',
        'Creating animations',
        'Changing computer settings',
        'Removing supplier records',
      ],
      correctOptionIndex: 0,
      explanation:
        'An organized invoice register helps finance and procurement teams prevent duplicate payments, monitor due dates, and reconcile vendor accounts.',
    },
  ],
};

// ============================================================================
// MODULE 12 QUIZ — AI with Excel, Automation & Final Project (10 Questions)
// ============================================================================
export const EXCEL_M12_QUIZ_CONFIG: PersistedAssessmentConfig = {
  id: `quiz_${EXCEL_M12_ID}`,
  courseId: COURSE_ID,
  courseSlug: COURSE_SLUG,
  courseTitle: COURSE_TITLE,
  assessmentType: 'module_quiz',
  moduleId: EXCEL_M12_ID,
  moduleOrder: 12,
  title: 'Module 12 Quiz: AI with Excel, Automation & Final Project',
  description:
    'Test your understanding of responsible AI-assisted Excel workflows, formula verification, Macros, VBA basics, Power Query automation, and the Final Procurement Project. Score at least 70% (7 out of 10) to complete Excel for Job Seekers.',
  passPercentage: 70,
  questionCount: 10,
  randomizeOrder: false,
  requiredForCompletion: true,
  questions: [
    {
      id: 'm12_q01',
      prompt: 'How can AI help with Excel?',
      options: [
        'Generate and explain formulas',
        'Guarantee that every calculation is correct',
        'Replace all business judgment',
        'Delete all errors automatically',
      ],
      correctOptionIndex: 0,
      explanation:
        'AI tools can accelerate Excel work by drafting formulas, explaining complex syntax in plain language, and helping troubleshoot errors.',
    },
    {
      id: 'm12_q02',
      prompt: 'Why should AI-generated Excel formulas be tested?',
      options: [
        'AI can produce incorrect formulas',
        'Excel cannot calculate formulas',
        'Testing changes the workbook name',
        'AI formulas never work',
      ],
      correctOptionIndex: 0,
      explanation:
        'AI can misunderstand column references, edge cases, or Excel version compatibility, so every formula must be verified before relying on its output.',
    },
    {
      id: 'm12_q03',
      prompt: 'What is an Excel macro?',
      options: [
        'A recorded or programmed sequence of actions used to automate tasks',
        'A chart type',
        'A worksheet color',
        'A password',
      ],
      correctOptionIndex: 0,
      explanation:
        'A macro automates repetitive formatting, reporting, or calculation sequences so they can be re-executed consistently with one click.',
    },
    {
      id: 'm12_q04',
      prompt: 'What does VBA stand for?',
      options: [
        'Visual Basic for Applications',
        'Variable Business Analysis',
        'Verified Backup Application',
        'Visual Browser Access',
      ],
      correctOptionIndex: 0,
      explanation:
        'VBA stands for Visual Basic for Applications—the built-in programming language behind Microsoft Excel macros.',
    },
    {
      id: 'm12_q05',
      prompt: 'What is Power Query mainly used for?',
      options: [
        'Importing, transforming and preparing data',
        'Creating email accounts',
        'Changing desktop settings',
        'Recording audio',
      ],
      correctOptionIndex: 0,
      explanation:
        'Power Query automates importing, cleaning, reshaping, filtering, and combining data from files or tables into repeatable refreshable queries.',
    },
    {
      id: 'm12_q06',
      prompt: 'What happens when a Power Query is refreshed?',
      options: [
        'It reruns the data transformation process against its source',
        'It deletes the workbook',
        'It changes all formulas into text',
        'It removes all worksheets',
      ],
      correctOptionIndex: 0,
      explanation:
        'Refreshing a Power Query automatically pulls the latest source data and reapplies every saved cleaning and transformation step in seconds.',
    },
    {
      id: 'm12_q07',
      prompt: 'Which task is suitable for AI-assisted Excel work?',
      options: [
        'Explaining why a formula returns an error',
        'Sharing confidential passwords',
        'Guaranteeing business results',
        'Avoiding all verification',
      ],
      correctOptionIndex: 0,
      explanation:
        'Asking AI to diagnose formula errors (such as #N/A or #VALUE!) using anonymized examples is a safe, high-value workflow.',
    },
    {
      id: 'm12_q08',
      prompt: 'Why should confidential business information be protected when using AI?',
      options: [
        'To protect sensitive company and personal data',
        'To make formulas longer',
        'To change worksheet names',
        'To remove charts',
      ],
      correctOptionIndex: 0,
      explanation:
        'Never paste confidential salaries, supplier contracts, customer records, or private identifiers into unauthorized external AI tools.',
    },
    {
      id: 'm12_q09',
      prompt: 'What should students do before trusting an AI-generated formula?',
      options: [
        'Test it against known examples',
        'Submit it without checking',
        'Delete the source data',
        'Hide the formula',
      ],
      correctOptionIndex: 0,
      explanation:
        'Always verify AI-suggested formulas against small test rows with known answers before applying them to a full business report.',
    },
    {
      id: 'm12_q10',
      prompt: 'What is the purpose of the final procurement project?',
      options: [
        'Combine Excel skills into a practical workplace system',
        'Memorize Excel shortcuts only',
        'Create a photo gallery',
        'Avoid using formulas',
      ],
      correctOptionIndex: 0,
      explanation:
        'The final project integrates data entry, functions, lookups, validation, conditional formatting, PivotTables, dashboards, and automation into a job-ready portfolio workbook.',
    },
  ],
};

export const EXCEL_M05_TO_M12_QUIZ_CONFIGS: PersistedAssessmentConfig[] = [
  EXCEL_M05_QUIZ_CONFIG,
  EXCEL_M06_QUIZ_CONFIG,
  EXCEL_M07_QUIZ_CONFIG,
  EXCEL_M08_QUIZ_CONFIG,
  EXCEL_M09_QUIZ_CONFIG,
  EXCEL_M10_QUIZ_CONFIG,
  EXCEL_M11_QUIZ_CONFIG,
  EXCEL_M12_QUIZ_CONFIG,
];
