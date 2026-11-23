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
              title: 'Module 02 Study Guide: Data Entry, Formatting & Worksheets',
              subtitle:
                'Detailed beginner-friendly walkthroughs with step-by-step instructions, real workplace examples, common mistakes to avoid, and everyday keyboard shortcuts.',
              sections: [
                {
                  heading: 'Topic A — Entering and Editing Data',
                  body: 'Accurate data entry is the foundation of every reliable workplace spreadsheet. Excel automatically recognizes three core data types: text (left-aligned by default), numbers (right-aligned), and dates (stored internally as serial numbers so you can sort and calculate with them).',
                  bullets: [
                    'Entering text, numbers, and dates: Click any cell, type your value, and press Enter (moves down) or Tab (moves right).',
                    'Editing existing cell contents: Double-click the cell, press F2, or click inside the Formula Bar to modify part of the text without retyping everything.',
                    'Replacing information: Click the cell once and start typing directly — pressing Enter replaces the old content completely.',
                    'Copying and pasting data: Duplicate repeated entries (such as department names or supplier categories) instead of retyping to prevent spelling inconsistencies.',
                    'Using AutoFill for simple sequences: Drag the small green Fill Handle square at the bottom-right corner of a selected cell to fill sequential Employee IDs (EMP-101, EMP-102), months (Jan, Feb, Mar), or dates.',
                    'Undo and Redo: Quickly reverse an accidental deletion or edit with Undo, or restore it with Redo.',
                    'Clearing cell contents: Pressing Delete removes only the text/number inside a cell while keeping borders and colors; use Home -> Clear -> Clear All to remove both content and formatting.',
                  ],
                  steps: [
                    'Click cell A2 and type "EMP-101", then press Tab to move to B2 and type the employee name.',
                    'To fix a typo in cell B2, select B2, press F2, edit the name, and press Enter.',
                    'To continue Employee IDs down Column A, select A2:A3, hover over the bottom-right Fill Handle until it turns into a thin black +, and drag down to Row 7.',
                    'If you accidentally overwrite a salary cell, press Ctrl + Z immediately to undo.',
                  ],
                  example:
                    'HR Employee Records: An HR coordinator enters EMP-101 and EMP-102 in Column A, drags the Fill Handle down to generate EMP-103 through EMP-120 in two seconds, and presses F2 to fix a spelling error in a job title without erasing the entire cell.',
                  commonMistake:
                    'Typing text like "6,500 AED" or "Rs. 6500" directly into a salary or expense cell. Mixing letters with numbers turns the cell into text so Excel cannot sum or average it. Enter plain numbers (6500) and apply Currency format instead.',
                  shortcuts: [
                    { keys: 'F2', action: 'Edit active cell in place' },
                    { keys: 'Ctrl + C / Ctrl + V', action: 'Copy and Paste' },
                    { keys: 'Ctrl + Z / Ctrl + Y', action: 'Undo and Redo' },
                    { keys: 'Delete', action: 'Clear cell content (keeps formatting)' },
                  ],
                },
                {
                  heading: 'Topic B — Formatting Text and Cells',
                  body: 'Formatting makes a spreadsheet easy for managers, HR teams, and auditors to scan in seconds. Consistent fonts, restrained colors, clear borders, and smart alignment distinguish headings from data rows.',
                  bullets: [
                    'Font type and size: Use clean workplace fonts (Calibri, Aptos, Arial, or Segoe UI) at 10–11pt for data rows and 11–12pt Bold for table headings.',
                    'Bold, italic, and underline: Use Bold for column headers and total rows; use italics sparingly for notes or subtitles.',
                    'Font colors and cell background (Fill) colors: Pair a dark Fill Color (like navy or teal) with white Bold text for headers, or soft pastel shading with dark text for subtle highlights.',
                    'Applying borders: Add light All Borders around data tables and a thicker bottom border under headers or totals to guide the eye.',
                    'Horizontal and vertical alignment: Left-align text, right-align numbers and currency, and apply Middle vertical alignment when row heights are taller.',
                    'Wrap Text: Forces long headings or descriptions (like "Office Stationery & Supplies") onto multiple lines inside the same cell so nothing gets cut off.',
                    'Merge & Center — and when to avoid it: Merge & Center combines several cells into one centered title banner above a table, but NEVER merge cells inside a data table because merged cells break sorting, filtering, and formulas.',
                  ],
                  steps: [
                    'Select your header row (A1:F1) on the Employee Details sheet.',
                    'On the Home tab, click Bold (Ctrl + B), pick a dark navy Fill Color, and set Font Color to White.',
                    'Click Wrap Text so multi-word headers like "Monthly Salary" stack cleanly if a column is narrow.',
                    'Select the entire table (A1:F7) and click Borders -> All Borders.',
                  ],
                  example:
                    'Supplier List & Monthly Expenses: A procurement buyer applies navy Fill Color with white bold text to Row 1, turns on Wrap Text for the "Expense Category" column, and keeps every data cell unmerged so the finance manager can sort expenses from highest to lowest.',
                  commonMistake:
                    'Merging cells inside table columns (such as merging three rows that share the same Department name). Merged data cells cause errors when sorting, filtering, or using formulas later — repeat the department name on each row instead.',
                  shortcuts: [
                    { keys: 'Ctrl + B', action: 'Toggle Bold' },
                    { keys: 'Ctrl + I', action: 'Toggle Italic' },
                    { keys: 'Ctrl + U', action: 'Toggle Underline' },
                    { keys: 'Alt + H + W', action: 'Toggle Wrap Text (Windows)' },
                  ],
                },
                {
                  heading: 'Topic C — Number Formatting',
                  body: 'Number formatting controls how numbers and dates look on screen and in print without changing the underlying math value. Understanding the difference between a cell’s stored value and its displayed format prevents costly calculation errors.',
                  bullets: [
                    'General format: Default format with no specific number styling (displays numbers as typed).',
                    'Number format: Adds thousand separators (e.g. 12,450.00) and controls decimal precision — ideal for inventory quantities or counts.',
                    'Currency format: Displays money with a currency symbol, comma separators, and decimals (e.g. $6,800.00 or AED 6,800.00).',
                    'Percentage format: Multiplies the stored decimal by 100 and displays a % sign (a stored value of 0.15 displays as 15%).',
                    'Date format: Displays calendar dates cleanly (e.g. 12-Feb-2024 or 02/12/2024) while allowing Excel to sort chronologically.',
                    'Decimal places: Use the Increase Decimal and Decrease Decimal buttons on the Home tab to standardize precision across a column.',
                    'Stored value vs. displayed format: A cell storing 1450.487 displayed with 0 decimal places shows 1,450 — yet Excel still uses the full stored value 1450.487 in formulas!',
                  ],
                  steps: [
                    'Select the Monthly Salary column values (F2:F7) on Employee Details.',
                    'Go to Home -> Number group -> open the format dropdown and choose Currency.',
                    'Select the Joining Date column (E2:E7) and choose Short Date or Long Date.',
                    'Use Increase Decimal or Decrease Decimal to keep all currency cells consistent (e.g. 2 decimal places).',
                  ],
                  example:
                    'Expense Tracking & Inventory: In Monthly Expenses, entering 1450.5 and applying Currency displays $1,450.50 while storing 1450.5 numerically. In Inventory Management, a 12.5% discount is stored as 0.125 and formatted as Percentage.',
                  commonMistake:
                    'Formatting a column as Percentage AFTER typing 15 instead of 0.15 — Excel displays 1500%! Either type "15%" directly, or enter 0.15 and then apply Percentage format.',
                  shortcuts: [
                    { keys: 'Ctrl + Shift + $', action: 'Apply Currency format' },
                    { keys: 'Ctrl + Shift + %', action: 'Apply Percentage format' },
                    { keys: 'Ctrl + Shift + #', action: 'Apply Date format' },
                    { keys: 'Ctrl + 1', action: 'Open Format Cells dialog' },
                  ],
                },
                {
                  heading: 'Topic D — Adjusting Rows and Columns',
                  body: 'Well-proportioned columns and rows eliminate cut-off labels and cramped text. When a column is too narrow for a formatted number or date, Excel displays ### instead of the value.',
                  bullets: [
                    'Changing column width: Drag the vertical line between column letters (e.g. between B and C) left or right.',
                    'Changing row height: Drag the horizontal line between row numbers (e.g. between 1 and 2) to give headers extra vertical space.',
                    'AutoFit: Double-click the border between column letters (or use Home -> Format -> AutoFit Column Width) to instantly size a column to fit its longest value.',
                    'Hiding and unhiding rows and columns: Right-click a column letter or row number -> Hide to temporarily tuck away sensitive or helper columns (like internal cost columns) without deleting data; select the neighboring columns on both sides -> Right-click -> Unhide to bring them back.',
                  ],
                  steps: [
                    'Select columns A through F by dragging across the column letters at the top.',
                    'Double-click the right edge of any selected column header to AutoFit all six columns at once.',
                    'Right-click Row 1 -> Row Height -> enter 24 -> click OK to give your header row clean visual breathing room.',
                    'Practice hiding Column F (Right-click F -> Hide), then select Columns E and G -> Right-click -> Unhide.',
                  ],
                  example:
                    'Inventory & Supplier Lists: After applying Currency format to supplier quotations, Column D shows "###". Double-clicking the divider between D and E triggers AutoFit and immediately reveals "18,900.00".',
                  commonMistake:
                    'Thinking "###" means an error deleted your data, or deleting a column you only wanted out of view for a meeting. "###" simply means the column is too narrow — AutoFit fixes it immediately, and Hide safely conceals columns without losing data.',
                  shortcuts: [
                    { keys: 'Alt + H + O + I', action: 'AutoFit Column Width (Windows)' },
                    { keys: 'Alt + H + O + A', action: 'AutoFit Row Height (Windows)' },
                    { keys: 'Ctrl + 0', action: 'Hide selected column' },
                    { keys: 'Ctrl + 9', action: 'Hide selected row' },
                  ],
                },
                {
                  heading: 'Topic E — Managing Worksheets',
                  body: 'A single Excel workbook can hold many worksheets (tabs along the bottom). Splitting related workplace data into dedicated worksheets keeps files organized, clean, and easy for colleagues to navigate.',
                  bullets: [
                    'Adding worksheets: Click the + (New Sheet) button at the bottom tab bar, or Right-click any sheet tab -> Insert -> Worksheet.',
                    'Renaming worksheets: Double-click a sheet tab (or Right-click -> Rename), type a clear name like "Employee Details", and press Enter. Only the sheet name changes — all data remains untouched.',
                    'Changing worksheet tab colors: Right-click a tab -> Tab Color to color-code departments or workflows (e.g. blue for HR, green for Expenses).',
                    'Moving worksheets: Click and drag a sheet tab left or right along the tab bar to reorder your workbook logically.',
                    'Copying worksheets: Right-click a tab -> Move or Copy -> tick "Create a copy" to duplicate a formatted monthly template (e.g. copying "March Expenses" to create "April Expenses").',
                    'Deleting worksheets: Right-click an unneeded sheet tab -> Delete (note: deleting a worksheet with data is permanent and cannot be undone with Ctrl + Z!).',
                    'Why multiple worksheets are useful: Separates distinct datasets (Employees, Departments, Expenses) in one shared workbook without mixing unrelated column structures.',
                  ],
                  steps: [
                    'Click the + icon at the bottom of Excel to insert a new worksheet.',
                    'Double-click "Sheet1", type "Employee Details", and press Enter.',
                    'Right-click the "Employee Details" tab -> Tab Color -> pick Navy Blue.',
                    'Drag tabs left or right so they appear in order: Employee Details, Department List, Monthly Expenses.',
                  ],
                  example:
                    'Operations & HR Workbooks: Instead of sending three separate email attachments, an HR officer shares one workbook containing "Employee Details", "Department List", and "Monthly Expenses" — each clearly named and color-coded.',
                  commonMistake:
                    'Leaving tabs named Sheet1, Sheet2, Sheet3, or accidentally deleting a worksheet thinking Ctrl + Z will bring it back. Always name tabs clearly and double-check before clicking Delete on a worksheet.',
                  shortcuts: [
                    { keys: 'Shift + F11', action: 'Insert a new worksheet' },
                    { keys: 'Ctrl + Page Down', action: 'Switch to next worksheet' },
                    { keys: 'Ctrl + Page Up', action: 'Switch to previous worksheet' },
                  ],
                },
                {
                  heading: 'Topic F — Freeze Panes',
                  body: 'When a workplace spreadsheet has dozens or hundreds of rows, scrolling down makes Row 1 headings disappear so you lose track of which column is which. Freeze Panes locks chosen header rows or identifier columns visibly on screen while the rest of the sheet scrolls.',
                  bullets: [
                    'Freezing the top row: Go to View -> Freeze Panes -> Freeze Top Row to keep Row 1 headers pinned while scrolling down.',
                    'Freezing the first column: Go to View -> Freeze Panes -> Freeze First Column to keep Column A (such as Employee ID or Supplier Name) visible while scrolling right.',
                    'Freezing selected rows and columns together: Click the single cell immediately BELOW the rows you want frozen and immediately TO THE RIGHT of the columns you want frozen (for example, click B2 to freeze both Row 1 and Column A), then select View -> Freeze Panes -> Freeze Panes.',
                    'When Freeze Panes is useful: Essential for large employee directories, multi-month expense trackers, and wide inventory sheets with 10+ columns.',
                  ],
                  steps: [
                    'Open the Employee Details worksheet with your column headings in Row 1.',
                    'Click the View tab on the Ribbon.',
                    'Click Freeze Panes -> Freeze Top Row.',
                    'Scroll down the worksheet and confirm Row 1 stays locked at the top. To remove it anytime, click View -> Freeze Panes -> Unfreeze Panes.',
                  ],
                  example:
                    'Inventory Management: A warehouse supervisor manages 600 inventory SKUs across 14 columns. Selecting cell C2 and applying Freeze Panes keeps Row 1 (column titles) and Columns A–B (SKU Code and Product Name) visible no matter how far down or right they scroll.',
                  commonMistake:
                    'Clicking the wrong active cell before choosing Freeze Panes -> Freeze Panes (for instance clicking A1 instead of B2), which freezes the middle of the screen awkwardly. If that happens, click View -> Freeze Panes -> Unfreeze Panes and retry.',
                  shortcuts: [
                    { keys: 'Alt + W + F + R', action: 'Freeze Top Row (Windows)' },
                    { keys: 'Alt + W + F + F', action: 'Toggle Freeze / Unfreeze Panes (Windows)' },
                  ],
                },
                {
                  heading: 'Topic G — Saving and Printing',
                  body: 'Knowing how to save in the right file format and configure print settings ensures your work is never lost and prints cleanly onto pages without splitting one stray column onto a second sheet.',
                  bullets: [
                    'Saving Excel workbooks: Save early and often with Ctrl + S so power cuts or closed tabs never erase your progress.',
                    'Save As: Creates a new copy under a different filename, folder, or file type (for example saving a monthly version like "Monthly_Expenses_March_2026.xlsx").',
                    'Choosing file locations: Save work files in clearly structured folders (e.g. Documents -> HR Reports -> 2026) or synced cloud storage (OneDrive / Google Drive).',
                    'XLSX vs. CSV formats: .xlsx is the standard Excel workbook format — it preserves multiple worksheets, colors, borders, currency formats, frozen panes, and formulas. .csv (Comma-Separated Values) saves ONLY one worksheet as plain text with zero formatting or formulas (used mainly for importing data into software systems).',
                    'Page orientation: Choose Portrait for tall, narrow lists and Landscape for wider workplace tables with 5+ columns.',
                    'Print Area: Select specific cells -> Page Layout -> Print Area -> Set Print Area to print only that table instead of scratch notes elsewhere on the sheet.',
                    'Print Preview: Always inspect File -> Print (Ctrl + P) before printing so you can spot cut-off columns or awkward page breaks.',
                    'Fitting a worksheet onto a printed page: In Print Preview -> Scaling, choose "Fit All Columns on One Page" or "Fit Sheet on One Page" for crisp single-page handouts.',
                  ],
                  steps: [
                    'Press Ctrl + S to save your workbook as an .xlsx file in a dedicated folder.',
                    'Press Ctrl + P to open Print Preview.',
                    'Change Portrait Orientation to Landscape Orientation.',
                    'Under Scaling, choose "Fit All Columns on One Page" and verify every column fits cleanly inside the preview.',
                  ],
                  example:
                    'Accounts & Management Reports: Before a Monday morning review, an accounts assistant sets Landscape orientation, sets Print Area around the Monthly Expenses table, selects "Fit All Columns on One Page" in Print Preview, and saves the master workbook as .xlsx.',
                  commonMistake:
                    'Saving a multi-sheet formatted workbook as .csv — CSV strips all borders, colors, currency formatting, and drops every other worksheet! Always keep your master file in .xlsx format.',
                  shortcuts: [
                    { keys: 'Ctrl + S', action: 'Save active workbook' },
                    { keys: 'F12', action: 'Open Save As dialog (Windows)' },
                    { keys: 'Ctrl + P', action: 'Open Print & Print Preview' },
                  ],
                },
              ],
              examples: [
                {
                  title: 'Worksheet 1 Preview: Employee Details',
                  subtitle:
                    'Target structure for the Practical Activity — formatted headers in Row 1, Date formatting in Column E, Currency formatting in Column F, and Top Row frozen.',
                  columns: [
                    'A · Employee ID',
                    'B · Employee Name',
                    'C · Department',
                    'D · Job Title',
                    'E · Joining Date',
                    'F · Monthly Salary',
                  ],
                  rows: [
                    ['EMP-101', 'Aarav Nair', 'Operations', 'Operations Coordinator', '12-Feb-2024', '$6,800.00'],
                    ['EMP-102', 'Meera Menon', 'Human Resources', 'HR Executive', '01-Apr-2024', '$7,200.00'],
                    ['EMP-103', 'Rohan Kapoor', 'Procurement', 'Junior Buyer', '18-Jun-2024', '$6,500.00'],
                    ['EMP-104', 'Fatima Al-Mansoor', 'Accounts & Finance', 'Accounts Payable Officer', '05-Sep-2024', '$8,400.00'],
                  ],
                },
                {
                  title: 'Worksheet 2 Preview: Department List',
                  subtitle:
                    'Dedicated reference worksheet keeping department IDs, names, and managers organized cleanly inside the same workbook.',
                  columns: ['A · Department ID', 'B · Department Name', 'C · Department Manager'],
                  rows: [
                    ['DEPT-01', 'Operations', 'Khalid Al-Suwaidi'],
                    ['DEPT-02', 'Human Resources', 'Priya Sharma'],
                    ['DEPT-03', 'Procurement', 'Tariq Mahmood'],
                    ['DEPT-04', 'Accounts & Finance', 'Lina George'],
                  ],
                },
                {
                  title: 'Worksheet 3 Preview: Monthly Expenses',
                  subtitle:
                    'Workplace expense ledger using Wrap Text on categories, Date formatting, Currency formatting, and clean status labels.',
                  columns: [
                    'A · Expense ID',
                    'B · Expense Category',
                    'C · Expense Date',
                    'D · Amount',
                    'E · Payment Status',
                  ],
                  rows: [
                    ['EXP-201', 'Office Stationery & Supplies', '02-Mar-2026', '$1,450.50', 'Paid'],
                    ['EXP-202', 'Cloud Software Subscriptions', '05-Mar-2026', '$3,200.00', 'Paid'],
                    ['EXP-203', 'Warehouse Packaging Stock', '09-Mar-2026', '$4,850.00', 'Pending'],
                    ['EXP-204', 'Staff Training & Workshops', '14-Mar-2026', '$2,750.00', 'Paid'],
                  ],
                },
              ],
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
              title: 'Module 03 Study Guide: Formula Fundamentals & Cell References',
              subtitle:
                'Complete beginner-friendly guide covering Excel formulas, operators, precedence, cell reference types, formula copying, and troubleshooting errors.',
              sections: [
                {
                  heading: 'Lesson 1 — What Is an Excel Formula?',
                  body: 'A formula is an instruction you type into a cell so Excel calculates a result automatically. Every Excel formula normally begins with an equals sign (=). Without the equals sign, Excel treats your typing as plain text instead of running a calculation.',
                  bullets: [
                    '=10+20 calculates 30 (Addition)',
                    '=50-10 calculates 40 (Subtraction)',
                    '=5*4 calculates 20 (Multiplication)',
                    '=100/5 calculates 20 (Division)',
                    'The worksheet cell displays the calculated answer, while the Formula Bar shows the underlying formula you wrote.',
                  ],
                  steps: [
                    'Click an empty cell where you want the calculated answer to appear.',
                    'Type the equals sign (=) first so Excel knows a formula is starting.',
                    'Enter numbers or cell references with mathematical operators (for example, =10+20).',
                    'Press Enter to calculate and display the result.',
                  ],
                  example:
                    'A petty-cash coordinator types =250+175 into cell B8 to verify two quick office receipts. Cell B8 displays 425 while the Formula Bar retains =250+175.',
                  commonMistake:
                    'Forgetting the leading equals sign (=) — typing 10+20 without = simply displays the text "10+20" and never calculates 30.',
                  shortcuts: [
                    { keys: 'Enter', action: 'Confirm formula and move down' },
                    { keys: 'Esc', action: 'Cancel formula edit safely' },
                    { keys: 'F2', action: 'Edit active formula in cell' },
                  ],
                },
                {
                  heading: 'Lesson 2 — Mathematical Operators',
                  body: 'Excel uses five standard mathematical operators to perform everyday business calculations. Notice that multiplication uses the asterisk (*) and division uses the forward slash (/) rather than the symbols written on paper.',
                  bullets: [
                    '+ (Addition): Adds two or more values — Example: =A1+B1',
                    '- (Subtraction): Subtracts one value from another — Example: =A1-B1',
                    '* (Multiplication): Multiplies values — Example: =A1*B1',
                    '/ (Division): Divides the first value by the second — Example: =A1/B1',
                    '^ (Power / Exponent): Raises a number to a power — Example: =A1^2 (squares the value in A1)',
                  ],
                  steps: [
                    'Select the result cell and type =.',
                    'Click or type the first cell reference (such as A1).',
                    'Type the mathematical operator (+, -, *, /, or ^).',
                    'Click or type the second cell reference (such as B1) and press Enter.',
                  ],
                  example:
                    'Sales & Payroll: Add Basic Salary and Allowance with =B2+C2, subtract Deductions with =E2-D2, calculate line totals with =B2*C2, compute unit cost with =D2/B2, or square a side length for area with =A2^2.',
                  commonMistake:
                    'Typing the letter "x" for multiplication (such as =5x4) instead of the asterisk (*), which causes Excel to show a formula error.',
                },
                {
                  heading: 'Lesson 3 — Using Cell References',
                  body: 'Instead of typing fixed numbers directly into formulas (hardcoding), reference the cells that hold those numbers. When a price, quantity, or salary changes later, Excel updates every dependent formula automatically without manual retyping.',
                  bullets: [
                    'Suppose Row 2 holds: A2 = Laptop, B2 = 2 (Quantity), C2 = 40000 (Price).',
                    'Typing =B2*C2 in cell D2 multiplies the value in B2 (2) by the value in C2 (40000) to produce 80000.',
                    'If the Laptop quantity in B2 changes from 2 to 3, D2 automatically updates from 80000 to 120000.',
                    'Cell references reduce typing mistakes and keep workplace reports auditable.',
                  ],
                  steps: [
                    'Enter clean numeric data in separate columns (Quantity in B2, Price in C2).',
                    'Click cell D2 and type =.',
                    'Click cell B2 (or type B2), type *, then click cell C2 (or type C2).',
                    'Press Enter and test updating B2 to confirm D2 recalculates automatically.',
                  ],
                  example:
                    'Procurement Order Sheet: If Laptop quantity is in B2 (2) and unit price is in C2 (40000), entering =B2*C2 in D2 calculates the line total (80000) dynamically whenever quantities or vendor quotes change.',
                  commonMistake:
                    'Typing =2*40000 instead of =B2*C2. If the quantity changes to 5 next week, a hardcoded formula stays stuck at 80000 and silently produces an inaccurate invoice.',
                },
                {
                  heading: 'Lesson 4 — Operator Precedence & Parentheses',
                  body: 'Excel follows standard mathematical calculation order (operator precedence): Parentheses first, then Powers (^), then Multiplication (*) and Division (/) from left to right, and finally Addition (+) and Subtraction (-) from left to right.',
                  bullets: [
                    'Without parentheses: =10+5*2 calculates 5*2 first (10), then adds 10 -> Result is 20 (NOT 30).',
                    'With parentheses: =(10+5)*2 calculates 10+5 first (15), then multiplies by 2 -> Result is 30.',
                    'Use parentheses whenever you want addition or subtraction to run before multiplication or division.',
                    'Clear parentheses also make complex workplace formulas much easier for colleagues to verify.',
                  ],
                  steps: [
                    'Identify which part of your calculation must happen first (for example, adding Basic Salary + Bonus before applying a tax rate).',
                    'Wrap that inner calculation inside parentheses: =(B2+C2)*0.10.',
                    'Check that every opening parenthesis "(" has a matching closing parenthesis ")".',
                    'Press Enter and sanity-check the result against a quick mental estimate.',
                  ],
                  example:
                    'Bonus Tax Calculation: To compute a 10% deduction on combined Basic Salary (B2) and Allowance (C2), write =(B2+C2)*0.10. Writing =B2+C2*0.10 without parentheses would only apply 10% to C2 and add full B2.',
                  commonMistake:
                    'Assuming Excel calculates strictly left to right. Always wrap sums or differences in parentheses before multiplying or dividing.',
                },
                {
                  heading: 'Lesson 5 — Relative Cell References',
                  body: 'By default, every cell reference in Excel (like B2 or C2) is a relative reference. That means Excel remembers the position relative to the formula cell — so when you copy a formula to another row or column, the references adjust automatically.',
                  bullets: [
                    'If cell D2 contains =B2*C2 and you copy it one row down into D3, Excel automatically changes it to =B3*C3.',
                    'Copying it down to D4 becomes =B4*C4, D5 becomes =B5*C5, and so on.',
                    'Copying =B2+C2 one column to the right updates it to =C2+D2.',
                    'Relative references let you write one accurate formula and apply it across hundreds or thousands of rows in seconds.',
                  ],
                  steps: [
                    'Write your first row formula cleanly in D2 (for example, =B2*C2).',
                    'Select D2 and copy it down to D3:D10 using the fill handle.',
                    'Click D3 and inspect the Formula Bar to confirm it now reads =B3*C3.',
                  ],
                  example:
                    'Payroll & Sales Tables: An HR executive with 250 employees writes =B2+C2-D2 once in E2 and copies it down to E251. Relative references automatically match each employee’s own row.',
                  commonMistake:
                    'Retyping formulas manually row by row (E2, E3, E4...) instead of letting relative references adjust automatically when copied.',
                },
                {
                  heading: 'Lesson 6 — Absolute Cell References ($)',
                  body: 'Sometimes a formula needs to point to one fixed cell — such as a single tax rate, commission percentage, or exchange rate stored at the top of a sheet. Placing dollar signs ($) before both the column letter and row number (for example, $B$1) locks that reference so it never shifts when copied.',
                  bullets: [
                    '$B$1 locks BOTH column B and row 1 (fully absolute reference).',
                    'Example: =$B$1*C2 — when copied down to row 3, it becomes =$B$1*C3; row 4 becomes =$B$1*C4.',
                    'Cell B1 stays pinned while C2 adjusts cleanly for every item row.',
                    'Press the F4 key while your cursor is on a cell reference in the Formula Bar to cycle through A1 -> $A$1 -> A$1 -> $A1.',
                  ],
                  steps: [
                    'Store the shared constant (such as Tax Rate 5% or Currency Rate) in a clearly labelled cell like B1.',
                    'Click the first result cell and type =B1*C2.',
                    'Place your cursor on B1 and press F4 (or type dollar signs manually) so it reads =$B$1*C2.',
                    'Copy the formula downward and verify every row still references $B$1.',
                  ],
                  example:
                    'VAT / Tax Rate Calculation: Cell B1 stores the 5% tax rate (0.05) and Column C lists item subtotals (C2:C50). Entering =$B$1*C2 in D2 and copying down calculates 5% tax accurately for all 50 items.',
                  commonMistake:
                    'Writing =B1*C2 without $ signs and copying down — Row 3 becomes =B2*C3 and Row 4 becomes =B3*C4, pulling blank cells or wrong numbers from column B!',
                  shortcuts: [
                    { keys: 'F4', action: 'Cycle reference type (A1 / $A$1 / A$1 / $A1)' },
                  ],
                },
                {
                  heading: 'Lesson 7 — Mixed Cell References',
                  body: 'A mixed cell reference locks ONLY the column OR ONLY the row — leaving the other part free to adjust when copied. Mixed references are ideal for two-way pricing grids, discount matrices, and multi-month budget tables.',
                  bullets: [
                    'A1 — Fully relative (both column and row adjust when copied).',
                    '$A$1 — Fully absolute (neither column nor row changes when copied).',
                    '$A1 — Mixed: Locked column A, flexible row (column A stays fixed when copied right; row changes when copied down).',
                    'A$1 — Mixed: Flexible column, locked row 1 (row 1 stays fixed when copied down; column changes when copied right).',
                  ],
                  steps: [
                    'Decide which direction must stay locked when copying: lock the column with $ before the letter ($A2) or lock the row with $ before the number (B$1).',
                    'In a pricing grid where item base prices sit in Column A ($A2) and discount percentages sit across Row 1 (B$1), enter =$A2*(1-B$1) in cell B2.',
                    'Copy B2 both across columns and down rows — one single formula fills the entire table.',
                  ],
                  example:
                    'Multi-Tier Discount Table: Base prices are listed down Column A (A2:A10) and discount rates (5%, 10%, 15%) sit across Row 1 (B1:D1). Formula =$A2*B$1 calculates every product’s discount across all tiers with a single copy-paste.',
                  commonMistake:
                    'Placing the $ sign on the wrong side (writing A$1 when you needed $A1). Read the $ sign as "lock the piece immediately after me": $A locks column A; $1 locks row 1.',
                },
                {
                  heading: 'Lesson 8 — Copying Formulas Safely',
                  body: 'Once you verify your first formula works, Excel gives you fast, accurate ways to copy it across rows or columns. Always inspect a few copied cells afterward to make sure references adjusted as intended.',
                  bullets: [
                    'Drag the fill handle: Click the small green square at the bottom-right corner of the active cell and drag down or right.',
                    'Double-click the fill handle: When adjacent columns already contain contiguous data, double-clicking the fill handle fills down automatically to the last populated row.',
                    'Copy and paste: Press Ctrl + C on the source formula cell, highlight the target range, and press Ctrl + V.',
                    'Check formulas after copying: Click a couple of copied cells (such as the second row and final row) and check the Formula Bar.',
                  ],
                  steps: [
                    'Select the verified formula cell (for example, E2 containing =B2+C2-D2).',
                    'Hover over the bottom-right corner until the pointer turns into a thin black plus sign (+).',
                    'Drag down to E6 (or double-click the fill handle to auto-fill down adjacent employee rows).',
                    'Click E3 and E6 to verify they read =B3+C3-D3 and =B6+C6-D6, then verify the numbers look reasonable.',
                  ],
                  example:
                    'Monthly Payroll Run: Instead of typing 50 separate formulas, an HR assistant writes =B2+C2-D2 in E2, double-clicks the fill handle to populate E2:E51 instantly, and spot-checks Row 2, Row 25, and Row 51.',
                  commonMistake:
                    'Dragging from the cell border (four-way arrow) instead of the fill handle (thin +), which MOVES the cell instead of copying the formula.',
                  shortcuts: [
                    { keys: 'Ctrl + C', action: 'Copy formula cell' },
                    { keys: 'Ctrl + V', action: 'Paste formula into selected cells' },
                    { keys: 'Ctrl + D', action: 'Fill formula down from top selected cell' },
                    { keys: 'Ctrl + `', action: 'Toggle Show Formulas view across sheet' },
                  ],
                },
                {
                  heading: 'Lesson 9 — Common Formula Errors & Troubleshooting',
                  body: 'Formula errors begin with a hash symbol (#) and tell you exactly what went wrong. Learning the four most common beginner errors helps you fix broken spreadsheets quickly and confidently.',
                  bullets: [
                    '#DIV/0! — Dividing by zero or an empty cell (for example, =B2/C2 when C2 is 0 or blank). Fix: Check the divisor cell and enter a valid non-zero number.',
                    '#VALUE! — Wrong data type used in a calculation (for example, adding a number to a text word like =25000+"Five"). Fix: Ensure all referenced cells contain clean numbers, not text.',
                    '#NAME? — Excel does not recognize a function name or misspelled reference (for example, typing =SMU(B2:B6) instead of =SUM(B2:B6)). Fix: Check spelling of functions and cell addresses.',
                    '#REF! — Invalid cell reference, usually caused by deleting a row, column, or sheet that a formula depended on. Fix: Undo immediately (Ctrl + Z) or rebuild the reference to the correct cell.',
                  ],
                  steps: [
                    'Click the cell showing the error (such as #DIV/0! or #VALUE!).',
                    'Look at the Formula Bar to inspect every cell reference and function name highlighted in color.',
                    'Trace each referenced cell on the grid to see if it is blank, zero, text, or deleted (#REF!).',
                    'Correct the cell data or formula spelling and press Enter to confirm the error disappears.',
                  ],
                  example:
                    'Expense Per Head Report: Cell D4 shows #DIV/0! because team headcount in C4 was left blank. Entering the headcount (12) immediately resolves the error and displays the accurate cost per employee.',
                  commonMistake:
                    'Deleting a formula cell instead of reading the error code, or typing commas/currency words like "Rs 25000" inside a numeric cell (which triggers #VALUE!).',
                },
              ],
              examples: [
                {
                  title: 'Example 1: Mathematical Operators Quick Reference',
                  subtitle:
                    'Core Excel arithmetic operators assuming A1 = 10 and B1 = 2.',
                  columns: ['Operator', 'Meaning', 'Formula Example', 'Calculated Result'],
                  rows: [
                    ['+', 'Addition', '=A1+B1', '12'],
                    ['-', 'Subtraction', '=A1-B1', '8'],
                    ['*', 'Multiplication', '=A1*B1', '20'],
                    ['/', 'Division', '=A1/B1', '5'],
                    ['^', 'Power (Exponent)', '=A1^2', '100'],
                  ],
                },
                {
                  title: 'Example 2: Using Cell References & Relative Copying (Item Order Sheet)',
                  subtitle:
                    'Entering =B2*C2 in D2 and copying downward adjusts row references automatically for every line item.',
                  columns: ['A (Item)', 'B (Quantity)', 'C (Price)', 'D (Formula)', 'D (Result)'],
                  rows: [
                    ['Laptop', '2', '40000', '=B2*C2', '80000'],
                    ['Monitor', '4', '12000', '=B3*C3', '48000'],
                    ['Keyboard', '6', '1500', '=B4*C4', '9000'],
                  ],
                },
                {
                  title: 'Example 3: Relative, Absolute & Mixed Reference Comparison',
                  subtitle:
                    'How the $ symbol controls which part of a reference stays locked when copied across rows or columns.',
                  columns: ['Reference', 'Type', 'Column Locked?', 'Row Locked?', 'Common Use'],
                  rows: [
                    ['A1', 'Relative', 'No', 'No', 'Row-by-row totals (=B2*C2)'],
                    ['$A$1', 'Absolute', 'Yes', 'Yes', 'Fixed tax or discount cell (=$B$1*C2)'],
                    ['$A1', 'Mixed', 'Yes', 'No', 'Locked price column copied right'],
                    ['A$1', 'Mixed', 'No', 'Yes', 'Locked rate header row copied down'],
                  ],
                },
                {
                  title: 'Example 4: Practical Activity Target Preview — Employee Salary Sheet',
                  subtitle:
                    'Net Salary uses =B2+C2-D2 copied down through Row 6, followed by a Total Net Salary formula in Row 7.',
                  columns: ['Employee Name', 'Basic Salary', 'Allowance', 'Deduction', 'Net Salary Formula'],
                  rows: [
                    ['Rahul', '25,000', '5,000', '2,000', '=B2+C2-D2  (28,000)'],
                    ['Priya', '30,000', '6,000', '2,500', '=B3+C3-D3  (33,500)'],
                    ['Ahmed', '22,000', '4,000', '1,500', '=B4+C4-D4  (24,500)'],
                    ['Sneha', '28,000', '5,000', '2,000', '=B5+C5-D5  (31,000)'],
                    ['Arjun', '35,000', '7,000', '3,000', '=B6+C6-D6  (39,000)'],
                    ['Total', '140,000', '27,000', '11,000', '=SUM(E2:E6)  (156,000)'],
                  ],
                },
              ],
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
        id: 'excel_m04_upcoming',
        order: 4,
        title: 'Module 04: Next Module in Curriculum',
        level: 'Beginner',
        summary:
          'Locked until you complete Module 03 and pass the Module 03 Quiz with 70% or higher.',
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
