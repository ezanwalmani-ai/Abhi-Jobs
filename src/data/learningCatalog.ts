import {
  CourseLesson,
  CourseModule,
  LearningAssessmentDomain,
  LearningCategory,
  LearningCourseItem,
} from '../types/learning';
import { EXCEL_MODULES_05_TO_08 } from './excelModules05To08Catalog';
import { EXCEL_MODULES_09_TO_12 } from './excelModules09To12Catalog';

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
      'Build job-ready Microsoft Excel skills step by step — starting with Module 01: Excel Fundamentals and Module 02: Data Entry, Formatting & Worksheets.',
    fullDescription:
      'A practical, career-focused 12-module Microsoft Excel curriculum designed for job seekers and working professionals. Master Excel fundamentals, clean data entry, professional cell and number formatting, worksheet organization, Freeze Panes, and workplace-ready printing.',
    level: 'Beginner',
    estimatedDuration: 'Modules 01–02 · ~65 mins',
    isFree: true,
    sequentialUnlock: true,
    passPercentage: 70,
    certificateTemplateId: 'default_abhi_certificate',
    status: 'published',
    courseIntroduction: {
      headline: 'Master Microsoft Excel for Real Workplace Roles',
      overview:
        'Watch each guided video lesson inside Learn with ABHI, review the structured study material and real workplace spreadsheet examples, complete the practical activities, and pass each Module Quiz with 70% or higher to unlock the next module.',
      studyGuidance: [
        'Watch at least 90% of each module’s embedded video lesson to unlock its 10-question Module Quiz.',
        'Review the structured study guide and workplace spreadsheet examples beneath each video.',
        'Complete the hands-on practical activities using Excel, Excel for the Web, Google Sheets, or LibreOffice Calc.',
        'Score 70% or higher (7/10) on each Module Quiz to unlock the next module.',
      ],
      prerequisites: 'No prior Excel experience required. Suitable for complete beginners and job seekers.',
    },
    whatYouWillLearn: [
      'Understand what Microsoft Excel is, its interface, workbooks, worksheets, rows, columns, and cell references',
      'Enter, edit, and organize workplace data cleanly across multiple structured worksheets',
      'Format text, numbers, currency, percentages, dates, borders, alignment, and column widths professionally',
      'Use Wrap Text, Merge & Center appropriately, Freeze Panes, and Print Preview for workplace-ready sheets',
    ],
    skillsDeveloped: [
      'Excel Fundamentals & Interface Navigation',
      'Accurate Workplace Data Entry & Editing',
      'Professional Cell & Number Formatting',
      'Worksheet Organization & Freeze Panes',
      'Print Setup & Workplace Spreadsheet Readiness',
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
              title: 'Study Guide',
              subtitle:
                'These topics cover the core concepts from Module 01. Select any topic below to view its explanation and workplace examples.',
              sections: [
                {
                  heading: 'What Microsoft Excel Is',
                  shortDescription: 'How Excel organizes numbers and text inside a structured spreadsheet grid.',
                  body: 'Microsoft Excel is a spreadsheet program used to organize, calculate, and analyze data in a structured grid. Instead of scattered notes, Excel stores records cleanly in tables that can be sorted, filtered, and calculated quickly.',
                  example:
                    'HR, Procurement, and Accounts teams store employee rosters, vendor quotes, and monthly expenses in Excel so numbers stay structured and easy to audit.',
                },
                {
                  heading: 'Why Companies Use Excel',
                  shortDescription: 'Core workplace reasons Excel remains essential across office roles.',
                  body: 'Businesses of every size rely on Excel because it is fast, flexible, and universally understood across teams. It helps employees reduce manual errors, summarize large lists, prepare reports, and make decisions backed by accurate numbers.',
                  bullets: [
                    'Replaces error-prone manual calculations with automatic formulas.',
                    'Summarizes hundreds or thousands of records cleanly for managers.',
                    'Works across departments without requiring specialized programming.',
                  ],
                },
                {
                  heading: 'Workbooks and Worksheets',
                  shortDescription: 'The difference between an Excel file (.xlsx) and the tabs inside it.',
                  body: 'An Excel file saved as .xlsx is called a Workbook. Inside one workbook, you can store one or more spreadsheet tabs along the bottom — each individual tab is called a Worksheet (such as "Employees", "Attendance", or "Suppliers").',
                  bullets: [
                    'Workbook = the entire Excel file (e.g., Company_Records.xlsx).',
                    'Worksheet = an individual sheet tab inside that workbook.',
                  ],
                },
                {
                  heading: 'Rows, Columns, and Cells',
                  shortDescription: 'Understanding vertical columns, horizontal rows, and individual cells.',
                  body: 'Every worksheet is a grid built from vertical Columns identified by letters across the top (A, B, C, ...), horizontal Rows identified by numbers down the left side (1, 2, 3, ...), and Cells — the single rectangular boxes formed where a column and row intersect.',
                  bullets: [
                    'Columns run vertically and usually represent fields (Name, Department, Salary).',
                    'Rows run horizontally and usually represent individual records (one employee or order).',
                    'Each cell holds one piece of text, a number, a date, or a formula.',
                  ],
                },
                {
                  heading: 'Cell References (Addresses)',
                  shortDescription: 'How Excel identifies every cell using its column letter and row number (e.g., A1, B5).',
                  body: 'Every cell has a unique address called a cell reference, written with the column letter first and the row number second. Formulas point to cell references so calculations update automatically whenever values change.',
                  bullets: [
                    'A1 refers to Column A, Row 1 (commonly the first table header).',
                    'B5 refers to Column B, Row 5.',
                    'A range like A1:E5 refers to all cells from A1 through E5.',
                  ],
                  table: {
                    title: 'Workplace Example: Employee Spreadsheet (HR)',
                    subtitle:
                      'Row 1 stores column headers (A1:E1). Each row holds one employee record — cell B5 holds the Name in Column B, Row 5.',
                    columns: ['A · Employee ID', 'B · Name', 'C · Department', 'D · Joining Date', 'E · Location'],
                    rows: [
                      ['EMP-101', 'Aarav Nair', 'Operations', '2024-02-12', 'Dubai'],
                      ['EMP-102', 'Meera Menon', 'Human Resources', '2024-04-01', 'Abu Dhabi'],
                      ['EMP-103', 'Rohan Kapoor', 'Procurement', '2024-06-18', 'Sharjah'],
                      ['EMP-104', 'Fatima Al-Mansoor', 'Accounts', '2024-09-05', 'Dubai'],
                    ],
                  },
                },
                {
                  heading: 'The Excel Interface: Ribbon, Name Box & Formula Bar',
                  shortDescription: 'Navigating the three core interface controls you use in every session.',
                  body: 'Recognizing three core areas at the top of the Excel window makes navigating commands and inspecting data effortless.',
                  bullets: [
                    'Ribbon: Top command bar grouped into tabs (Home, Insert, Page Layout, Formulas, Data) holding formatting, chart, and data tools.',
                    'Name Box: Left of the Formula Bar — displays the active cell address (such as A1 or B5) so you always know where your cursor is.',
                    'Formula Bar: Directly above the column letters — displays and lets you edit the text, number, or formula stored inside the selected cell.',
                  ],
                },
                {
                  heading: 'Common Workplace Applications',
                  shortDescription: 'How HR, Procurement, Accounts, Sales, and Operations use Excel daily.',
                  body: 'Excel supports daily tracking, comparison, and reporting across virtually every business department.',
                  bullets: [
                    'HR: Employee directories, attendance logs, leave trackers, and onboarding checklists.',
                    'Procurement: Supplier lists, quotation comparisons, purchase order trackers, and delivery timelines.',
                    'Accounts & Finance: Expense registers, invoice tracking, monthly budgets, and reconciliations.',
                    'Sales & Operations: Lead pipelines, sales targets, inventory counts, and dispatch schedules.',
                  ],
                  table: {
                    title: 'Workplace Example: Supplier List (Procurement)',
                    subtitle:
                      'Procurement teams organize supplier quotes in columns so prices and lead times can be compared accurately.',
                    columns: ['A · Supplier ID', 'B · Supplier Name', 'C · Category', 'D · Price (AED)', 'E · Lead Time'],
                    rows: [
                      ['SUP-01', 'Gulf Office Supplies LLC', 'Stationery', '4,250', '2 Days'],
                      ['SUP-02', 'Emirates Tech Trading', 'IT Hardware', '18,900', '4 Days'],
                      ['SUP-03', 'Al Noor Packaging Co.', 'Packaging', '6,400', '3 Days'],
                    ],
                  },
                },
              ],
              examples: [],
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
        id: 'excel_m02_data_entry_formatting',
        order: 2,
        title: 'Data Entry, Formatting & Worksheets',
        level: 'Beginner',
        summary:
          'Learn how to enter information into Excel, format spreadsheets professionally, organize worksheets and prepare data for everyday workplace use.',
        learningObjectives: [
          'Enter and edit information in Excel.',
          'Format text, numbers and dates.',
          'Change fonts, colors, borders and alignment.',
          'Adjust column widths and row heights.',
          'Use Wrap Text and Merge & Center appropriately.',
          'Add, rename, move, copy and delete worksheets.',
          'Use Freeze Panes.',
          'Prepare a professional spreadsheet for workplace use.',
          'Save and print an Excel worksheet.',
        ],
        estimatedMinutes: 40,
        quizPlanned: true,
        quizRequired: true,
        passPercentage: 70,
        lessons: [
          {
            id: 'excel_m02_lesson_01',
            courseId: 'excel_for_job_seekers',
            moduleId: 'excel_m02_data_entry_formatting',
            order: 1,
            title: 'Module 02: Data Entry, Formatting & Worksheets',
            description:
              'Learn how to enter information into Excel, format spreadsheets professionally, organize worksheets and prepare data for everyday workplace use.',
            videoUrl: 'https://www.youtube.com/embed/k1VUZEVuDJ8',
            videos: [
              {
                id: 'excel_m02_vid_01',
                title: 'Microsoft Excel Tutorial - Beginners Level 1',
                publisher: "Teacher's Tech",
                youtubeVideoId: 'k1VUZEVuDJ8',
                embedUrl: 'https://www.youtube.com/embed/k1VUZEVuDJ8',
                description:
                  'Complete beginner tutorial covering inputting data, formatting text and currency, wrapping text, inserting rows, cell borders and colors, and print view.',
                durationSeconds: 0,
                durationLabel: 'Video Lesson',
                order: 1,
                sections: [
                  { timestamp: '07:30', label: 'Inputting Data' },
                  { timestamp: '10:56', label: 'Formatting Data' },
                  { timestamp: '13:38', label: 'Wrapping Text' },
                  { timestamp: '14:22', label: 'Insert Row / Merge & Center' },
                  { timestamp: '15:41', label: 'Currency Formatting' },
                  { timestamp: '16:20', label: 'Print View' },
                  { timestamp: '17:02', label: 'Add Cell Borders and Colors' },
                ],
                sectionsNote:
                  'This video also covers additional Excel basics. Watch the complete video (at least 90%) to unlock the Module 02 Quiz — the highlighted timestamps above are especially relevant to this module.',
              },
            ],
            estimatedMinutes: 40,
            writtenContent:
              'Clean data entry, readable formatting, well-organized worksheets, Freeze Panes, and proper print setup turn raw numbers into workplace-ready Excel spreadsheets.',
            studyGuide: {
              title: 'Study Guide',
              subtitle:
                'These topics cover the core concepts from Module 02. Select any topic below to view steps, workplace examples, and shortcuts.',
              sections: [
                {
                  heading: 'Entering and Editing Data',
                  shortDescription: 'Typing text, numbers, and dates, editing in place, AutoFill, and Undo/Redo.',
                  body: 'Accurate data entry is the foundation of every reliable spreadsheet. Excel treats text as left-aligned, numbers as right-aligned, and dates as serial numbers that can be sorted and calculated.',
                  bullets: [
                    'Enter values and press Enter (move down) or Tab (move right).',
                    'Edit existing text without retyping by double-clicking, pressing F2, or clicking the Formula Bar.',
                    'Drag the green Fill Handle (bottom-right corner of a cell) to AutoFill IDs (EMP-101, EMP-102), months, or dates.',
                    'Press Delete to clear contents while keeping formatting; use Home -> Clear -> Clear All to remove both.',
                  ],
                  steps: [
                    'Click A2, type "EMP-101", press Tab, and type the employee name in B2.',
                    'Press F2 on any cell to fix a typo without overwriting the entire cell.',
                    'Select A2:A3 and drag the Fill Handle down to generate sequential IDs.',
                  ],
                  example:
                    'HR Employee Records: Enter EMP-101 and EMP-102 in Column A, drag the Fill Handle to generate EMP-103 through EMP-120 in seconds, and press Ctrl + Z immediately if you overwrite a value by mistake.',
                  commonMistake:
                    'Typing text like "6,500 AED" inside a numeric salary cell turns it into text so Excel cannot sum or average it. Enter plain numbers (6500) and apply Currency format instead.',
                  shortcuts: [
                    { keys: 'F2', action: 'Edit active cell' },
                    { keys: 'Ctrl + Z / Y', action: 'Undo / Redo' },
                    { keys: 'Delete', action: 'Clear contents only' },
                  ],
                },
                {
                  heading: 'Formatting Text, Cells, Borders & Alignment',
                  shortDescription: 'Making tables readable with clean fonts, fill colors, borders, Wrap Text, and alignment.',
                  body: 'Thoughtful formatting helps managers and auditors read a spreadsheet in seconds. Consistent typography, subtle borders, and clean alignment separate headers from data rows.',
                  bullets: [
                    'Use clean fonts (Calibri, Aptos, Arial) at 10–11pt for data and 11–12pt Bold for headers.',
                    'Pair a dark header fill with white bold text and light All Borders around data cells.',
                    'Left-align text, right-align numbers, and enable Wrap Text for long headers or categories.',
                    'Use Merge & Center only for standalone titles above a table — never merge cells inside a data table.',
                  ],
                  example:
                    'Supplier List & Monthly Expenses: Navy headers with white bold text, Wrap Text on "Expense Category", and zero merged data rows allow finance managers to sort expenses cleanly.',
                  table: {
                    title: 'Formatted Table Example: Employee Details',
                    subtitle: 'Bold header row, clean alignment, Date format in Column E, and Currency format in Column F.',
                    columns: ['Employee ID', 'Employee Name', 'Department', 'Job Title', 'Joining Date', 'Monthly Salary'],
                    rows: [
                      ['EMP-101', 'Aarav Nair', 'Operations', 'Operations Coordinator', '12-Feb-2024', '$6,800.00'],
                      ['EMP-102', 'Meera Menon', 'Human Resources', 'HR Executive', '01-Apr-2024', '$7,200.00'],
                      ['EMP-103', 'Rohan Kapoor', 'Procurement', 'Junior Buyer', '18-Jun-2024', '$6,500.00'],
                      ['EMP-104', 'Fatima Al-Mansoor', 'Accounts & Finance', 'Accounts Payable Officer', '05-Sep-2024', '$8,400.00'],
                    ],
                  },
                  commonMistake:
                    'Merging cells inside table columns breaks sorting, filtering, and formulas later — repeat the department name on every row instead.',
                  shortcuts: [
                    { keys: 'Ctrl + B', action: 'Bold' },
                    { keys: 'Alt + H + W', action: 'Wrap Text (Windows)' },
                  ],
                },
                {
                  heading: 'Number, Currency, Percentage & Date Formats',
                  shortDescription: 'Controlling how numbers and dates display without changing their underlying values.',
                  body: 'Number formatting changes how values look on screen and in print while preserving the exact numeric value Excel uses in formulas.',
                  bullets: [
                    'Number: Adds thousand separators and consistent decimals for counts or quantities.',
                    'Currency: Displays money with symbol, commas, and decimals (e.g., $6,800.00).',
                    'Percentage: Multiplies a stored decimal by 100 and appends % (0.15 displays as 15%).',
                    'Date: Formats calendar dates consistently (e.g., 12-Feb-2024) while keeping chronological sorting intact.',
                    'Stored vs. displayed: 1450.487 displayed with 0 decimals shows 1,450, but Excel still calculates using 1450.487.',
                  ],
                  table: {
                    title: 'Formatted Table Example: Monthly Expenses',
                    subtitle: 'Date formatting in Column C and Currency formatting in Column D keep expense ledgers clean.',
                    columns: ['Expense ID', 'Expense Category', 'Expense Date', 'Amount', 'Status'],
                    rows: [
                      ['EXP-201', 'Office Stationery & Supplies', '02-Mar-2026', '$1,450.50', 'Paid'],
                      ['EXP-202', 'Cloud Software Subscriptions', '05-Mar-2026', '$3,200.00', 'Paid'],
                      ['EXP-203', 'Warehouse Packaging Stock', '09-Mar-2026', '$4,850.00', 'Pending'],
                      ['EXP-204', 'Staff Training & Workshops', '14-Mar-2026', '$2,750.00', 'Paid'],
                    ],
                  },
                  commonMistake:
                    'Typing 15 and then applying Percentage format displays 1500%. Enter 0.15 first or type "15%" directly.',
                  shortcuts: [
                    { keys: 'Ctrl + Shift + $', action: 'Currency format' },
                    { keys: 'Ctrl + Shift + %', action: 'Percentage format' },
                    { keys: 'Ctrl + 1', action: 'Open Format Cells' },
                  ],
                },
                {
                  heading: 'Adjusting Row Heights & Column Widths',
                  shortDescription: 'Using AutoFit, fixing ### display issues, and safely hiding or unhiding columns.',
                  body: 'Proper column widths and row heights prevent cut-off labels and cramped rows. When a column is too narrow for a formatted number or date, Excel displays ### — your data is still safe.',
                  bullets: [
                    'AutoFit: Double-click the divider between two column letters to fit the longest cell automatically.',
                    'Row Height: Right-click Row 1 -> Row Height -> 24pt to give table headings breathing room.',
                    'Hide / Unhide: Right-click a column letter -> Hide to temporarily tuck away sensitive columns without deleting data; select neighboring columns -> Right-click -> Unhide to restore.',
                  ],
                  example:
                    'Supplier Quotes: After applying Currency format, Column D shows "###". Double-clicking the border between D and E triggers AutoFit and immediately reveals "18,900.00".',
                  shortcuts: [
                    { keys: 'Alt + H + O + I', action: 'AutoFit Column Width' },
                    { keys: 'Ctrl + 0 / 9', action: 'Hide selected column / row' },
                  ],
                },
                {
                  heading: 'Managing Worksheets',
                  shortDescription: 'Adding, renaming, color-coding, moving, copying, and deleting sheet tabs.',
                  body: 'Splitting related datasets into clearly named worksheets keeps one workbook tidy and easy for coworkers to navigate.',
                  bullets: [
                    'Add a sheet with the + button (or Shift + F11); double-click any tab to rename it clearly.',
                    'Right-click a tab -> Tab Color to color-code departments (e.g., blue for HR, green for Expenses).',
                    'Drag tabs to reorder, or Right-click -> Move or Copy -> "Create a copy" to duplicate a monthly template.',
                    'Deleting a worksheet with data is permanent and cannot be undone with Ctrl + Z.',
                  ],
                  table: {
                    title: 'Multi-Sheet Example: Department List Tab',
                    subtitle: 'Keeping lookup reference lists on their own tab separates master data from transaction rows.',
                    columns: ['Department ID', 'Department Name', 'Department Manager'],
                    rows: [
                      ['DEPT-01', 'Operations', 'Khalid Al-Suwaidi'],
                      ['DEPT-02', 'Human Resources', 'Priya Sharma'],
                      ['DEPT-03', 'Procurement', 'Tariq Mahmood'],
                      ['DEPT-04', 'Accounts & Finance', 'Lina George'],
                    ],
                  },
                  shortcuts: [
                    { keys: 'Shift + F11', action: 'Insert new worksheet' },
                    { keys: 'Ctrl + PgDn / PgUp', action: 'Switch next / previous sheet' },
                  ],
                },
                {
                  heading: 'Freeze Panes',
                  shortDescription: 'Keeping header rows and key identifier columns visible while scrolling large tables.',
                  body: 'Freeze Panes locks selected rows or columns on screen so you never lose sight of column titles or IDs when scrolling through large datasets.',
                  bullets: [
                    'View -> Freeze Panes -> Freeze Top Row locks Row 1 while scrolling down.',
                    'View -> Freeze Panes -> Freeze First Column locks Column A while scrolling right.',
                    'To freeze both rows and columns, click the single cell immediately below the rows and right of the columns you want frozen (e.g., B2 freezes Row 1 and Column A), then choose Freeze Panes.',
                  ],
                  example:
                    'Inventory Sheet: Clicking C2 and applying Freeze Panes locks Row 1 (headers) and Columns A–B (SKU Code and Product Name) across 600+ rows and 14 columns.',
                  commonMistake:
                    'Clicking the wrong cell before choosing Freeze Panes freezes the middle of the sheet. Use View -> Freeze Panes -> Unfreeze Panes to reset cleanly.',
                },
                {
                  heading: 'Saving (.xlsx vs .csv) & Print Setup',
                  shortDescription: 'Choosing the right file format and fitting tables cleanly onto printed pages.',
                  body: 'Saving in the right format protects your formulas and formatting, while Print Preview prevents stray columns from spilling onto extra pages.',
                  bullets: [
                    '.xlsx preserves multiple worksheets, formatting, Freeze Panes, and formulas; .csv stores only one plain-text sheet with zero formatting or formulas.',
                    'Use Landscape orientation for wide tables (5+ columns) and set Print Area to exclude scratch notes.',
                    'In Print Preview (Ctrl + P) -> Scaling, select "Fit All Columns on One Page" for clean handouts.',
                  ],
                  commonMistake:
                    'Saving a formatted multi-sheet workbook as .csv strips all styling and discards every other worksheet.',
                  shortcuts: [
                    { keys: 'Ctrl + S', action: 'Save workbook' },
                    { keys: 'Ctrl + P', action: 'Print Preview' },
                  ],
                },
              ],
              examples: [],
            },
            exercise: {
              title: 'Build a Professional Employee Information Workbook',
              instructions:
                'Download the free practice Excel workbook below (works in Microsoft Excel, free Excel for the Web, Google Sheets, or LibreOffice Calc — no paid Excel license required). Your workbook must contain three clearly named data worksheets:\n\n1. Worksheet 1 — Employee Details: Employee ID, Employee Name, Department, Job Title, Joining Date, Monthly Salary\n2. Worksheet 2 — Department List: Department ID, Department Name, Department Manager\n3. Worksheet 3 — Monthly Expenses: Expense ID, Expense Category, Expense Date, Amount, Payment Status\n\nComplete every step from the Instructions sheet:\n• Enter the supplied sample data (and add 2 extra realistic rows per sheet).\n• Format headings professionally (bold, clean font, fill & text color).\n• Apply borders and suitable colors.\n• Format dates (Date format) and salary/expense values (Currency format) correctly.\n• Adjust row heights and column widths using AutoFit and Wrap Text.\n• Verify and rename all three worksheets clearly.\n• Freeze the top heading row on each worksheet.\n• Preview your layout in Print Preview (Landscape, Fit All Columns on One Page) and save the workbook as an .xlsx file.',
              deliverable:
                'A saved .xlsx workbook with 3 professionally formatted, frozen-header worksheets: Employee Details, Department List, and Monthly Expenses.',
            },
            attachments: [
              {
                id: 'excel_m02_practice_workbook',
                title: 'ABHI-Excel-Module-02-Practice-Workbook.xlsx',
                url: '/api/learning/resources/excel-module-02-practice-workbook.xlsx',
                fileType: 'Workbook',
                sizeLabel: '4 Sheets (Instructions + 3 Data Sheets) · .xlsx',
              },
              {
                id: 'excel_m02_instruction_sheet',
                title: 'Module 02 Practical Activity — Instruction Sheet',
                url: '',
                fileType: 'PDF',
                sizeLabel: 'Printable Checklist · PDF',
                worksheetContent: [
                  'PRACTICAL ACTIVITY: BUILD A PROFESSIONAL EMPLOYEE INFORMATION WORKBOOK',
                  '',
                  'Free Tools Supported: Microsoft Excel, Excel for the Web (free), Google Sheets, or LibreOffice Calc.',
                  '',
                  'REQUIRED WORKSHEETS & COLUMNS:',
                  '1. Employee Details: Employee ID | Employee Name | Department | Job Title | Joining Date | Monthly Salary',
                  '2. Department List: Department ID | Department Name | Department Manager',
                  '3. Monthly Expenses: Expense ID | Expense Category | Expense Date | Amount | Payment Status',
                  '',
                  'STEP-BY-STEP COMPLETION CHECKLIST:',
                  '1. Download ABHI-Excel-Module-02-Practice-Workbook.xlsx and open it in Excel, Google Sheets, or LibreOffice Calc.',
                  '2. Enter the supplied sample data and practice adding 2 extra rows to each worksheet.',
                  '3. Format Row 1 headings professionally (Bold, 11-12pt font, high-contrast Fill Color and Font Color).',
                  '4. Apply All Borders to each table and use clean, subtle cell colors.',
                  '5. Format Joining Date & Expense Date as Date, and Monthly Salary & Amount as Currency (2 decimal places).',
                  '6. Adjust row heights (e.g. Row 1 = 24pt) and AutoFit all column widths; apply Wrap Text on long descriptions.',
                  '7. Rename all worksheets cleanly (Employee Details, Department List, Monthly Expenses) and assign tab colors.',
                  '8. Apply View -> Freeze Panes -> Freeze Top Row on each worksheet.',
                  '9. Inspect Print Preview (Ctrl + P) with Landscape orientation and Fit All Columns on One Page, then save as .xlsx (Ctrl + S).',
                ].join('\n'),
              },
            ],
          },
        ],
      },
      {
        id: 'excel_m03_formulas_references',
        order: 3,
        title: 'Formula Fundamentals & Cell References',
        level: 'Beginner',
        summary:
          'Learn to create Excel formulas, perform calculations, use mathematical operators, and master relative, absolute, and mixed cell references.',
        learningObjectives: [
          'Understand what an Excel formula is.',
          'Start a formula using the equals sign.',
          'Perform addition, subtraction, multiplication, and division.',
          'Understand operator precedence.',
          'Use parentheses in formulas.',
          'Calculate using cell references.',
          'Understand relative references.',
          'Understand absolute references using $.',
          'Understand mixed references.',
          'Copy formulas across rows and columns.',
          'Identify and correct basic formula errors.',
        ],
        quizPlanned: true,
        quizRequired: true,
        passPercentage: 70,
        lessons: [
          {
            id: 'excel_m03_lesson_01',
            courseId: 'excel_for_job_seekers',
            moduleId: 'excel_m03_formulas_references',
            order: 1,
            title: 'Module 03: Formula Fundamentals & Cell References',
            description:
              'Build accurate workplace formulas using operators, parentheses, relative/absolute/mixed cell references, formula copying, and error troubleshooting.',
            estimatedMinutes: 45,
            videoUrl: 'https://www.youtube.com/watch?v=V6YJ2kYq8qQ',
            videos: [
              {
                id: 'excel_m03_video_01',
                title: 'Excel Formulas and Functions for Beginners',
                youtubeVideoId: 'V6YJ2kYq8qQ',
                embedUrl: 'https://www.youtube.com/embed/V6YJ2kYq8qQ',
                durationSeconds: 900,
                description:
                  'Learn how to write Excel formulas with operators, parentheses, and relative, absolute, and mixed cell references.',
                order: 1,
              },
            ],
            writtenContent:
              'Excel formulas turn static tables into automatic calculators. Master the equals sign, operators, parentheses, relative/absolute/mixed cell references, formula copying, and common formula errors.',
            studyGuide: {
              title: 'Study Guide',
              subtitle:
                'These topics cover the core concepts from Module 03. Select any topic below to view formulas, reference rules, and worked examples.',
              sections: [
                {
                  heading: 'Formula Structure & the Equals Sign',
                  shortDescription: 'How every Excel calculation starts with = and displays results dynamically.',
                  body: 'A formula is an instruction typed into a cell so Excel calculates a result automatically. Every formula starts with an equals sign (=); without it, Excel treats your entry as plain text.',
                  formula: '=10+20   (returns 30)\n=50-10   (returns 40)\n=5*4     (returns 20)\n=100/5   (returns 20)',
                  bullets: [
                    'The cell displays the calculated answer while the Formula Bar shows the formula behind it.',
                    'Press Enter to confirm a formula, Esc to cancel edits safely, or F2 to edit in place.',
                  ],
                  commonMistake:
                    'Typing 10+20 without a leading equals sign (=) simply displays the text "10+20" instead of calculating 30.',
                },
                {
                  heading: 'Mathematical Operators',
                  shortDescription: 'Using +, -, *, /, and ^ for everyday business calculations.',
                  body: 'Excel uses five standard arithmetic operators. Notice that multiplication uses the asterisk (*) and division uses the forward slash (/).',
                  formula: '=A1+B1   |   =A1-B1   |   =A1*B1   |   =A1/B1   |   =A1^2',
                  table: {
                    title: 'Mathematical Operators Quick Reference (A1 = 10, B1 = 2)',
                    subtitle: 'Core arithmetic operators used in payroll, procurement, and sales sheets.',
                    columns: ['Operator', 'Meaning', 'Formula Example', 'Result'],
                    rows: [
                      ['+', 'Addition', '=A1+B1', '12'],
                      ['-', 'Subtraction', '=A1-B1', '8'],
                      ['*', 'Multiplication', '=A1*B1', '20'],
                      ['/', 'Division', '=A1/B1', '5'],
                      ['^', 'Power (Exponent)', '=A1^2', '100'],
                    ],
                  },
                  commonMistake:
                    'Typing the letter "x" for multiplication (such as =5x4) instead of the asterisk (*) triggers a formula error.',
                },
                {
                  heading: 'Using Cell References Instead of Hardcoded Numbers',
                  shortDescription: 'Pointing formulas at cell addresses so totals update automatically when data changes.',
                  body: 'Instead of typing fixed numbers inside a formula, reference the cells holding those values. Whenever a quantity, price, or salary changes, Excel recalculates every dependent cell automatically.',
                  formula: '=B2*C2',
                  example:
                    'Procurement Order Sheet: If Laptop quantity is in B2 (2) and unit price is in C2 (40,000), entering =B2*C2 in D2 returns 80,000 — and automatically updates to 120,000 if B2 changes to 3.',
                  table: {
                    title: 'Worked Example: Item Order Sheet',
                    subtitle: 'Cell references calculate line totals automatically across rows.',
                    columns: ['A (Item)', 'B (Qty)', 'C (Price)', 'D (Formula)', 'D (Result)'],
                    rows: [
                      ['Laptop', '2', '40000', '=B2*C2', '80000'],
                      ['Monitor', '4', '12000', '=B3*C3', '48000'],
                      ['Keyboard', '6', '1500', '=B4*C4', '9000'],
                    ],
                  },
                  commonMistake:
                    'Hardcoding =2*40000 instead of =B2*C2 leaves invoices out of date whenever quantities or quotes change.',
                },
                {
                  heading: 'Operator Precedence & Parentheses',
                  shortDescription: 'Controlling calculation order so Excel evaluates addition before multiplication when needed.',
                  body: 'Excel follows mathematical order of operations: Parentheses first, then Powers (^), then Multiplication (*) and Division (/), and finally Addition (+) and Subtraction (-).',
                  formula: '=10+5*2    -> 20  (multiplies 5*2 first)\n=(10+5)*2  -> 30  (adds 10+5 first)',
                  example:
                    'Bonus Tax Calculation: To apply 10% tax on combined Basic Salary (B2) and Allowance (C2), write =(B2+C2)*0.10. Without parentheses, Excel would only multiply C2 by 0.10.',
                  commonMistake:
                    'Assuming Excel always calculates strictly from left to right. Wrap sums or differences in parentheses before multiplying or dividing.',
                },
                {
                  heading: 'Relative Cell References',
                  shortDescription: 'Default references (B2, C2) that shift automatically when copied down or across.',
                  body: 'By default, every Excel cell reference is relative. When you copy a formula to another row or column, Excel adjusts the row numbers or column letters automatically.',
                  formula: 'In D2: =B2*C2  ->  Copied to D3: =B3*C3  ->  Copied to D4: =B4*C4',
                  example:
                    'Payroll Sheets: Write =B2+C2-D2 once in E2 and copy down 250 employee rows — each row automatically calculates using its own Basic Salary, Allowance, and Deduction.',
                },
                {
                  heading: 'Absolute Cell References ($)',
                  shortDescription: 'Locking a fixed cell like a tax rate or exchange rate using dollar signs ($B$1).',
                  body: 'When every row must multiply by one fixed cell (such as a VAT rate stored in B1), place $ before both the column letter and row number ($B$1) so the reference never shifts when copied.',
                  formula: '=$B$1*C2   (copied to Row 3 -> =$B$1*C3)',
                  bullets: [
                    '$B$1 locks both column B and row 1.',
                    'Press F4 in the Formula Bar to cycle through A1 -> $A$1 -> A$1 -> $A1.',
                  ],
                  example:
                    'VAT Calculation: Store 5% (0.05) in B1 and subtotals in C2:C50. Entering =$B$1*C2 in D2 and copying down calculates 5% tax accurately for all 50 rows.',
                  commonMistake:
                    'Copying =B1*C2 without $ signs shifts B1 to B2, B3, B4 — pulling blank cells or wrong numbers.',
                  shortcuts: [
                    { keys: 'F4', action: 'Cycle relative / absolute / mixed reference' },
                  ],
                },
                {
                  heading: 'Mixed Cell References',
                  shortDescription: 'Locking only the column ($A1) or only the row (A$1) for two-way tables.',
                  body: 'A mixed reference locks either the column or the row while letting the other part adjust when copied. Read $ as "lock the piece immediately after me."',
                  formula: '=$A2*(1-B$1)   (locks column A prices and row 1 discount rates)',
                  table: {
                    title: 'Relative, Absolute & Mixed Reference Comparison',
                    subtitle: 'How $ controls what stays locked when copying formulas.',
                    columns: ['Reference', 'Type', 'Column Locked?', 'Row Locked?', 'Common Use'],
                    rows: [
                      ['A1', 'Relative', 'No', 'No', 'Row-by-row totals (=B2*C2)'],
                      ['$A$1', 'Absolute', 'Yes', 'Yes', 'Fixed tax/rate cell (=$B$1*C2)'],
                      ['$A1', 'Mixed', 'Yes', 'No', 'Locked price column copied right'],
                      ['A$1', 'Mixed', 'No', 'Yes', 'Locked rate header row copied down'],
                    ],
                  },
                },
                {
                  heading: 'Copying Formulas Safely',
                  shortDescription: 'Filling formulas across rows quickly and verifying copied references.',
                  body: 'Once your first row formula is verified, copy it across the table using the Fill Handle, Ctrl + D, or Ctrl + C / Ctrl + V, then spot-check the Formula Bar on copied rows.',
                  bullets: [
                    'Double-click the green Fill Handle to auto-fill down adjacent populated rows.',
                    'Spot-check the second row and final row in the Formula Bar after copying.',
                  ],
                  table: {
                    title: 'Worked Example: Employee Salary Sheet',
                    subtitle: 'Net Salary uses =B2+C2-D2 copied down to Row 6, plus =SUM(E2:E6) in Row 7.',
                    columns: ['Employee', 'Basic', 'Allowance', 'Deduction', 'Net Salary Formula'],
                    rows: [
                      ['Rahul', '25,000', '5,000', '2,000', '=B2+C2-D2 (28,000)'],
                      ['Priya', '30,000', '6,000', '2,500', '=B3+C3-D3 (33,500)'],
                      ['Ahmed', '22,000', '4,000', '1,500', '=B4+C4-D4 (24,500)'],
                      ['Sneha', '28,000', '5,000', '2,000', '=B5+C5-D5 (31,000)'],
                      ['Arjun', '35,000', '7,000', '3,000', '=B6+C6-D6 (39,000)'],
                      ['Total', '140,000', '27,000', '11,000', '=SUM(E2:E6) (156,000)'],
                    ],
                  },
                  shortcuts: [
                    { keys: 'Ctrl + D', action: 'Fill formula down' },
                    { keys: 'Ctrl + `', action: 'Show all formulas on sheet' },
                  ],
                },
                {
                  heading: 'Common Formula Errors & Troubleshooting',
                  shortDescription: 'Reading and fixing #DIV/0!, #VALUE!, #NAME?, and #REF! errors quickly.',
                  body: 'Formula error codes start with # and point directly to what went wrong so you can fix the formula instead of rebuilding the sheet.',
                  bullets: [
                    '#DIV/0! — Dividing by zero or a blank cell. Fix: Enter a valid non-zero divisor.',
                    '#VALUE! — Math attempted on text (e.g., =25000+"Five"). Fix: Ensure referenced cells contain clean numbers.',
                    '#NAME? — Misspelled function name or unquoted text (e.g., =SMU instead of =SUM). Fix: Check spelling.',
                    '#REF! — Formula points to a deleted row, column, or sheet. Fix: Undo (Ctrl + Z) or update the cell reference.',
                  ],
                  example:
                    'Expense Per Head: Cell D4 shows #DIV/0! because team headcount in C4 is blank. Entering 12 resolves the error immediately.',
                },
              ],
              examples: [],
            },
            exercise: {
              title: 'Calculate Employee Salaries and Monthly Expenses',
              instructions:
                'Download the free Module 03 Practice Workbook below (works in Microsoft Excel, Excel for the Web, Google Sheets, or LibreOffice Calc). Open the "Employee Salary" worksheet containing Rahul, Priya, Ahmed, Sneha, and Arjun.\n\nColumns: Employee Name (A) | Basic Salary (B) | Allowance (C) | Deduction (D) | Net Salary (E)\n• Rahul: Basic 25000, Allowance 5000, Deduction 2000\n• Priya: Basic 30000, Allowance 6000, Deduction 2500\n• Ahmed: Basic 22000, Allowance 4000, Deduction 1500\n• Sneha: Basic 28000, Allowance 5000, Deduction 2000\n• Arjun: Basic 35000, Allowance 7000, Deduction 3000\n\nComplete these 6 steps:\n1. Verify all 5 employee records are entered cleanly on the Employee Salary sheet.\n2. Calculate Net Salary for Rahul in cell E2 using the formula: =B2+C2-D2 (Basic Salary + Allowance - Deduction).\n3. Copy the formula from E2 down to E6 for the remaining employees using the fill handle.\n4. Calculate Total Net Salary in cell E7 using a formula such as =E2+E3+E4+E5+E6 or =SUM(E2:E6).\n5. Format all salary columns (B2:E7) clearly as Currency or Number with thousand separators.\n6. Check every calculation and compare your finished sheet against the separated "Answer Reference" worksheet in the workbook.',
              deliverable:
                'A completed Employee Salary worksheet with live formulas for every employee’s Net Salary (=B2+C2-D2 through =B6+C6-D6), Total Net Salary (156,000), and clean number/currency formatting.',
            },
            attachments: [
              {
                id: 'excel_m03_practice_workbook',
                title: 'ABHI-Excel-Module-03-Practice-Workbook.xlsx',
                url: '/api/learning/resources/excel-module-03-practice-workbook.xlsx',
                fileType: 'Workbook',
                sizeLabel: '3 Sheets (Instructions + Blank Practice + Answer Reference) · .xlsx',
              },
              {
                id: 'excel_m03_instruction_sheet',
                title: 'Module 03 Practical Activity — Instruction Sheet',
                url: '',
                fileType: 'PDF',
                sizeLabel: 'Printable Checklist · PDF',
                worksheetContent: [
                  'PRACTICAL ACTIVITY: CALCULATE EMPLOYEE SALARIES AND MONTHLY EXPENSES',
                  '',
                  'Free Tools Supported: Microsoft Excel, Excel for the Web (free), Google Sheets, or LibreOffice Calc.',
                  '',
                  'EMPLOYEE SALARY TABLE (Columns A–E):',
                  'Employee Name | Basic Salary | Allowance | Deduction | Net Salary',
                  'Rahul         | 25000        | 5000      | 2000      | (Enter =B2+C2-D2)',
                  'Priya         | 30000        | 6000      | 2500      | (Copy formula down)',
                  'Ahmed         | 22000        | 4000      | 1500      | (Copy formula down)',
                  'Sneha         | 28000        | 5000      | 2000      | (Copy formula down)',
                  'Arjun         | 35000        | 7000      | 3000      | (Copy formula down)',
                  '',
                  'STEP-BY-STEP COMPLETION CHECKLIST:',
                  '1. Download ABHI-Excel-Module-03-Practice-Workbook.xlsx and open the "Employee Salary" sheet.',
                  '2. In cell E2, enter the Net Salary formula: =B2+C2-D2 (Basic Salary + Allowance - Deduction).',
                  '3. Copy E2 down to E6 using the fill handle (drag or double-click) and verify relative row adjustment.',
                  '4. In cell E7, calculate Total Net Salary using =E2+E3+E4+E5+E6 or =SUM(E2:E6).',
                  '5. Format columns B through E as Currency or Number with thousand separators.',
                  '6. Verify every calculation and check your answers against the separated "Answer Reference" tab.',
                ].join('\n'),
              },
            ],
          },
        ],
      },
      {
        id: 'excel_m04_essential_functions',
        order: 4,
        title: 'Essential Excel Functions',
        level: 'Beginner to Intermediate',
        summary:
          'Learn how to use essential Excel functions — SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, COUNTIF, SUMIF, IF, basic text functions, and date functions — for reporting, data analysis, and everyday workplace tasks.',
        learningObjectives: [
          'Understand Excel functions and their syntax.',
          'Use SUM and AVERAGE.',
          'Use MIN and MAX.',
          'Count cells using COUNT and COUNTA.',
          'Use COUNTIF and SUMIF.',
          'Use IF for logical decisions.',
          'Use basic text functions.',
          'Use date functions.',
          'Combine functions in practical workplace reports.',
          'Troubleshoot common function errors.',
        ],
        quizPlanned: true,
        quizRequired: true,
        passPercentage: 70,
        lessons: [
          {
            id: 'excel_m04_lesson_01',
            courseId: 'excel_for_job_seekers',
            moduleId: 'excel_m04_essential_functions',
            order: 1,
            title: 'Module 04: Essential Excel Functions',
            description:
              'Master core workplace Excel functions including SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, COUNTIF, SUMIF, IF, text functions, date functions, and error troubleshooting.',
            estimatedMinutes: 55,
            videoUrl: 'https://www.youtube.com/watch?v=Jl0Qk63z2ZY',
            videos: [
              {
                id: 'excel_m04_video_01',
                title: 'Excel Formulas and Functions Tutorial',
                publisher: 'Kevin Stratvert',
                youtubeVideoId: 'Jl0Qk63z2ZY',
                embedUrl: 'https://www.youtube.com/embed/Jl0Qk63z2ZY',
                durationSeconds: 737,
                description:
                  'Hands-on walkthrough covering addition, subtraction, multiplication, division, SUM, MIN, MAX, COUNT, COUNTA, AVERAGE, IF, COUNTIF, and SUMIF in Microsoft Excel.',
                order: 1,
              },
            ],
            writtenContent:
              'Excel functions replace slow manual calculations with reliable, reusable workplace reports. Master syntax, SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, COUNTIF, SUMIF, IF, text functions, date functions, and troubleshooting.',
            studyGuide: {
              title: 'Study Guide',
              subtitle:
                'These topics cover the core functions from Module 04. Select any topic below to view syntax, examples, and common troubleshooting tips.',
              sections: [
                {
                  heading: 'Understanding Excel Functions & Syntax',
                  shortDescription: 'How pre-built functions work, arguments inside parentheses, and AutoSum.',
                  body: 'A function is a built-in named operation (such as SUM or AVERAGE) used inside a formula. Every function follows three parts: the equals sign (=), the function name, and parentheses holding its arguments.',
                  formula: '=SUM(A1:A5)',
                  bullets: [
                    'Formula vs. Function: =B2+C2-D2 is a manual formula; =SUM(A1:A5) uses the SUM function.',
                    'Type = followed by the first letters of a function and press Tab to accept Excel’s suggestion.',
                    'Press Alt + = beneath a numeric column to insert AutoSum instantly.',
                  ],
                  shortcuts: [
                    { keys: 'Alt + =', action: 'Insert AutoSum' },
                    { keys: 'Tab', action: 'Accept suggested function' },
                  ],
                },
                {
                  heading: 'SUM Function',
                  shortDescription: 'Adding numeric ranges, individual cells, or multiple columns quickly.',
                  body: 'SUM adds all numeric values in one or more ranges or cell references. It is the most widely used function across finance, HR, procurement, and sales reporting.',
                  formula: '=SUM(B2:B10)   |   =SUM(B2,B5,B8)   |   =SUM(B2:B10,D2:D10)',
                  example:
                    'Procurement Report: With 8 purchase orders in D2:D9, =SUM(D2:D9) returns Total Purchase Amount (₹2,45,000) instantly.',
                  commonMistake:
                    'Including the total cell itself inside the range (typing =SUM(D2:D10) inside D10) causes a circular reference.',
                },
                {
                  heading: 'AVERAGE Function',
                  shortDescription: 'Calculating the mean while understanding how Excel handles blanks versus zeros.',
                  body: 'AVERAGE calculates the arithmetic mean of numeric cells in a range. Blank cells and text are ignored automatically, while cells containing 0 ARE included in the calculation.',
                  formula: '=AVERAGE(B2:B10)',
                  example:
                    'Purchase Analysis: Across 8 purchase orders totaling ₹2,45,000 in D2:D9, =AVERAGE(D2:D9) returns ₹30,625 per order.',
                  commonMistake:
                    'Typing 0 into empty future months artificially pulls the average down — leave unavailable entries blank instead.',
                },
                {
                  heading: 'MIN and MAX Functions',
                  shortDescription: 'Identifying the lowest and highest numbers in any range instantly.',
                  body: 'MIN returns the smallest numeric value in a range and MAX returns the largest — ideal for spotting lowest supplier quotes, peak expenses, or maximum salaries.',
                  formula: '=MIN(B2:B10)\n=MAX(B2:B10)',
                  example:
                    'Vendor Comparison: On D2:D9, =MAX(D2:D9) finds the highest purchase (₹65,000) and =MIN(D2:D9) finds the lowest (₹8,000).',
                  commonMistake:
                    'Including the Total row inside MAX (e.g., =MAX(D2:D10)) returns the Total instead of the highest individual transaction.',
                },
                {
                  heading: 'COUNT and COUNTA Functions',
                  shortDescription: 'Counting numeric cells only (COUNT) versus all non-empty cells (COUNTA).',
                  body: 'COUNT counts only cells containing numbers (including dates), ignoring text. COUNTA counts every non-empty cell — text, IDs, numbers, and dates.',
                  formula: '=COUNT(A2:A20)   (numbers only)\n=COUNTA(A2:A20)  (all non-empty cells)',
                  example:
                    'Purchase & HR Logs: Use =COUNTA(A2:A9) on text Purchase IDs (PO001–PO008) to return 8 records; =COUNT(A2:A9) on text IDs returns 0.',
                  commonMistake:
                    'Using COUNT on a text column like Employee Name or Purchase ID and getting 0 instead of the record count.',
                },
                {
                  heading: 'COUNTIF Function',
                  shortDescription: 'Counting cells that satisfy a single text or numeric condition.',
                  body: 'COUNTIF counts how many cells in a range match a criterion — such as completed purchase orders, pending deliveries, or employees in a department.',
                  formula: '=COUNTIF(C2:C20,"Completed")\n=COUNTIF(D2:D9,">40000")',
                  example:
                    'Order Tracking: =COUNTIF(E2:E9,"Completed") counts all 5 completed orders in the Module 04 Purchase Data table.',
                  commonMistake:
                    'Forgetting double quotes around text criteria (writing Completed instead of "Completed") produces a #NAME? error.',
                },
                {
                  heading: 'SUMIF Function',
                  shortDescription: 'Adding values in one column only where another column meets a condition.',
                  body: 'SUMIF adds numeric values conditionally using three arguments in order: criteria_range, criteria, and sum_range.',
                  formula: '=SUMIF(A2:A10,"IT",B2:B10)',
                  bullets: [
                    'Criteria range: Column containing the category or department (e.g., B2:B9).',
                    'Criteria: Condition to match (e.g., "IT").',
                    'Sum range: Matching-height numeric column to total (e.g., D2:D9).',
                  ],
                  example:
                    'Department Spend: =SUMIF(B2:B9,"IT",D2:D9) sums all IT orders to return ₹2,00,000.',
                  commonMistake:
                    'Selecting misaligned ranges (such as B2:B9 with D2:D10) shifts rows and produces wrong totals.',
                },
                {
                  heading: 'IF Function (Logical Decisions)',
                  shortDescription: 'Returning one result when a test is TRUE and another when it is FALSE.',
                  body: 'IF evaluates a logical test and returns value_if_true or value_if_false automatically — ideal for budget flags, payment labels, and approval tiers.',
                  formula: '=IF(B2>=50000,"High","Low")\n=IF(D2>40000,"High Value","Standard Value")',
                  bullets: [
                    'Operators: =, <> (not equal), >, <, >=, <=.',
                    'Wrap text outputs in double quotes ("Paid", "Over Budget"), but leave numeric thresholds unquoted (40000).',
                  ],
                  example:
                    'Purchase Tiers: =IF(D2>40000,"High Value","Standard Value") flags PO001, PO003, and PO008 automatically.',
                },
                {
                  heading: 'Basic Text Functions',
                  shortDescription: 'Extracting codes and cleaning extra spaces with LEFT, RIGHT, MID, LEN, and TRIM.',
                  body: 'Text functions clean exported strings and extract structured prefix/suffix IDs from combined codes like "PO001" or "EMP-2045".',
                  formula: '=LEFT(A2,3)   |   =RIGHT(A2,4)   |   =MID(A2,2,3)\n=LEN(A2)      |   =TRIM(A2)',
                  bullets: [
                    'LEFT / RIGHT / MID extract specific character positions from a cell.',
                    'LEN counts total characters including spaces — great for spotting hidden trailing spaces.',
                    'TRIM strips leading, trailing, and duplicate spaces so COUNTIF and SUMIF match reliably.',
                  ],
                  example:
                    'Cleaning Supplier Exports: =TRIM(C2) turns "  ABC   Technologies  " into "ABC Technologies".',
                },
                {
                  heading: 'Date Functions',
                  shortDescription: 'Tracking current dates and extracting day, month, and year parts for reports.',
                  body: 'Excel stores dates as serial numbers so you can calculate invoice age and group transactions by month or year.',
                  formula: '=TODAY()   |   =NOW()\n=DAY(A2)   |   =MONTH(A2)   |   =YEAR(A2)',
                  bullets: [
                    'TODAY() and NOW() refresh automatically whenever Excel recalculates.',
                    'DAY, MONTH, and YEAR extract numeric date components for monthly summaries.',
                    'Subtract an invoice date from TODAY() (=TODAY()-A2) to measure overdue days.',
                  ],
                  commonMistake:
                    'Using =TODAY() for a fixed historical invoice date causes that date to change tomorrow. Use Ctrl + ; for a static date.',
                },
                {
                  heading: 'Combining Functions in Practical Reports',
                  shortDescription: 'Bringing SUM, AVERAGE, MIN, MAX, COUNTA, COUNTIF, SUMIF, and IF together.',
                  body: 'Real workplace dashboards combine multiple functions on a single clean transaction table so managers see totals, averages, extremes, counts, and flags simultaneously.',
                  table: {
                    title: 'Worked Report: Purchase & Expense Summary (Rows 2–9)',
                    subtitle: 'Expected formulas and calculated outputs for the 8-record Purchase Data table.',
                    columns: ['Metric', 'Cell', 'Formula', 'Result'],
                    rows: [
                      ['Total Purchase Amount', 'B13', '=SUM(D2:D9)', '₹2,45,000'],
                      ['Average Purchase Amount', 'B14', '=AVERAGE(D2:D9)', '₹30,625'],
                      ['Highest / Lowest Purchase', 'B15 / B16', '=MAX(D2:D9) / =MIN(D2:D9)', '₹65,000 / ₹8,000'],
                      ['Total Purchase Records', 'B17', '=COUNTA(A2:A9)', '8'],
                      ['Completed Purchases', 'B18', '=COUNTIF(E2:E9,"Completed")', '5'],
                      ['Total IT Purchases', 'B19', '=SUMIF(B2:B9,"IT",D2:D9)', '₹2,00,000'],
                      ['Value Classification', 'F2:F9', '=IF(D2>40000,"High Value","Standard Value")', '3 High Value'],
                    ],
                  },
                },
                {
                  heading: 'Troubleshooting Common Function Errors',
                  shortDescription: 'Diagnosing #NAME?, #VALUE!, #DIV/0!, missing quotes, and range mistakes.',
                  body: 'Inspecting the Formula Bar and colored range borders quickly resolves almost every function error.',
                  bullets: [
                    '#NAME? — Misspelled function (=AVARAGE) or unquoted text criterion (=COUNTIF(E2:E9,Completed)).',
                    '#VALUE! — Invalid data type passed to a math or date function.',
                    '#DIV/0! — Dividing by zero or running AVERAGE on a range with no numeric values.',
                    'Wrong range or mismatched parentheses — Verify colored grid borders cover all data rows (excluding Totals) and every ( has a matching ).',
                  ],
                  example:
                    'Quick Fix: Changing =SUMIF(B2:B9,IT,D2:D9) to =SUMIF(B2:B9,"IT",D2:D9) immediately clears #NAME? and returns ₹2,00,000.',
                },
              ],
              examples: [],
            },
            exercise: {
              title: 'Purchase and Expense Report Using Excel Functions',
              instructions:
                'Download the real `.xlsx` Practice Workbook below (works free in Microsoft Excel, Excel for the Web, Google Sheets, or LibreOffice Calc). Open the "Function Practice" worksheet containing all 8 purchase records (PO001–PO008 in A2:E9) with blank cells ready for your formulas.\n\nEnter these exact formulas in the specified blank cells on the "Function Practice" sheet:\n1. Cell B13 (Total Purchase Amount — SUM): =SUM(D2:D9)\n2. Cell B14 (Average Purchase Amount — AVERAGE): =AVERAGE(D2:D9)\n3. Cell B15 (Highest Purchase Amount — MAX): =MAX(D2:D9)\n4. Cell B16 (Lowest Purchase Amount — MIN): =MIN(D2:D9)\n5. Cell B17 (Number of Purchase Records — COUNTA): =COUNTA(A2:A9)\n6. Cell B18 (Number of Completed Purchases — COUNTIF): =COUNTIF(E2:E9,"Completed")\n7. Cell B19 (Total IT Purchases — SUMIF): =SUMIF(B2:B9,"IT",D2:D9)\n8. Cell F2 (Value Classification — IF): =IF(D2>40000,"High Value","Standard Value") — then copy F2 down to F9 using the fill handle.\n\nVerify all results match the "Completed Answer Sheet" tab only after attempting every formula yourself.',
              deliverable:
                'A completed Function Practice sheet with working SUM, AVERAGE, MAX, MIN, COUNTA, COUNTIF, SUMIF, and IF formulas matching the Completed Answer Sheet (Total ₹2,45,000; Average ₹30,625; IT Total ₹2,00,000; Completed 5).',
            },
            attachments: [
              {
                id: 'excel_m04_practice_workbook',
                title: 'ABHI-Excel-Module-04-Practice-Workbook.xlsx',
                url: '/api/learning/resources/excel-module-04-practice-workbook.xlsx',
                fileType: 'Workbook',
                sizeLabel:
                  '4 Sheets (Instructions + Purchase Data + Function Practice + Completed Answer Sheet) · .xlsx',
              },
              {
                id: 'excel_m04_instruction_sheet',
                title: 'Module 04 Practical Activity — Instruction Sheet',
                url: '',
                fileType: 'PDF',
                sizeLabel: 'Printable Formula Guide · PDF',
                worksheetContent: [
                  'PRACTICAL ACTIVITY: PURCHASE AND EXPENSE REPORT USING EXCEL FUNCTIONS',
                  '',
                  'Free Tools Supported: Microsoft Excel, Excel for the Web (free), Google Sheets, or LibreOffice Calc.',
                  '',
                  'PURCHASE DATA (Rows 2–9, Columns A–E):',
                  'PO001 | IT      | ABC Technologies    | 45000 | Completed',
                  'PO002 | HR      | Office Supplies Co. | 12000 | Pending',
                  'PO003 | IT      | Tech Solutions      | 65000 | Completed',
                  'PO004 | Finance | Paper World         |  8000 | Completed',
                  'PO005 | HR      | Office Supplies Co. | 15000 | Pending',
                  'PO006 | IT      | Global Computers    | 38000 | Pending',
                  'PO007 | Finance | Paper World         | 10000 | Completed',
                  'PO008 | IT      | ABC Technologies    | 52000 | Completed',
                  '',
                  'EXACT FORMULAS TO ENTER ON THE "Function Practice" SHEET:',
                  '1. Cell B13 (SUM):     =SUM(D2:D9)',
                  '2. Cell B14 (AVERAGE): =AVERAGE(D2:D9)',
                  '3. Cell B15 (MAX):     =MAX(D2:D9)',
                  '4. Cell B16 (MIN):     =MIN(D2:D9)',
                  '5. Cell B17 (COUNTA):  =COUNTA(A2:A9)',
                  '6. Cell B18 (COUNTIF): =COUNTIF(E2:E9,"Completed")',
                  '7. Cell B19 (SUMIF):   =SUMIF(B2:B9,"IT",D2:D9)',
                  '8. Cell F2:F9 (IF):    =IF(D2>40000,"High Value","Standard Value")',
                  '',
                  'Compare your finished workbook against the "Completed Answer Sheet" tab in the downloaded .xlsx file.',
                ].join('\n'),
              },
            ],
          },
        ],
      },
      ...EXCEL_MODULES_05_TO_08,
      ...EXCEL_MODULES_09_TO_12,
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
