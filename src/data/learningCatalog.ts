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
        id: 'excel_m03_upcoming',
        order: 3,
        title: 'Module 03: Next Module in Curriculum',
        level: 'Beginner',
        summary:
          'Locked until you complete Module 02 and pass the Module 02 Quiz with 70% or higher.',
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
