import type { CourseModule } from '../types/learning';

export const EXCEL_MODULES_05_TO_08: CourseModule[] = [
  // ==========================================================================
  // MODULE 05 — VLOOKUP, XLOOKUP & LOOKUP SKILLS
  // ==========================================================================
  {
    id: 'excel_m05_vlookup_xlookup',
    order: 5,
    title: 'VLOOKUP, XLOOKUP & Lookup Skills',
    level: 'Intermediate',
    summary:
      'Teach students how to search for information in Excel tables and retrieve related information using VLOOKUP, XLOOKUP, IFERROR, and structured master tables.',
    estimatedMinutes: 65,
    learningObjectives: [
      'Understand what lookup functions do in workplace spreadsheets.',
      'Structure clean lookup tables with unique identifiers.',
      'Write accurate VLOOKUP formulas and understand all four arguments.',
      'Choose correctly between exact match (FALSE) and approximate match (TRUE).',
      'Lock lookup table ranges with absolute references ($A$2:$E$8) before copying formulas.',
      'Recognize VLOOKUP limitations and when to switch to XLOOKUP.',
      'Write XLOOKUP formulas and return values from columns on either side.',
      'Handle missing values cleanly with IFERROR and XLOOKUP if_not_found.',
      'Troubleshoot #N/A, #REF!, #VALUE!, spacing, and data-type lookup errors.',
      'Compare VLOOKUP and XLOOKUP across Excel versions and compatibility needs.',
    ],
    quizPlanned: true,
    quizRequired: true,
    passPercentage: 70,
    lessons: [
      {
        id: 'excel_m05_lesson_01',
        courseId: 'excel_for_job_seekers',
        moduleId: 'excel_m05_vlookup_xlookup',
        order: 1,
        title: 'Module 05: VLOOKUP, XLOOKUP & Lookup Skills',
        description:
          'Master VLOOKUP, XLOOKUP, exact vs. approximate match, IFERROR error handling, and supplier/purchase order lookups across worksheets.',
        estimatedMinutes: 65,
        videoUrl: 'https://www.youtube.com/watch?v=TDphx23AtqM',
        videos: [
          {
            id: 'excel_m05_video_01',
            title: "The Only VLOOKUP Guide You'll Ever Need. (No More Errors)",
            publisher: 'Leila Gharani',
            youtubeVideoId: 'TDphx23AtqM',
            watchUrl: 'https://www.youtube.com/watch?v=TDphx23AtqM',
            embedUrl: 'https://www.youtube.com/embed/TDphx23AtqM',
            verificationStatus: 'verified',
            durationSeconds: 1080,
            description:
              'Complete step-by-step guide to mastering VLOOKUP, preventing #N/A errors, using exact vs. approximate match, and building reliable lookup formulas.',
            order: 1,
          },
        ],
        writtenContent:
          'Lookup functions connect separate workplace sheets — such as matching a Supplier ID on a Purchase Order to the Supplier Master — without manual copying or typing errors.',
        studyGuide: {
          title: 'Study Guide',
          subtitle:
            'These topics cover the core lookup concepts from Module 05. Select any topic below to view syntax, error fixes, and comparisons.',
          sections: [
            {
              heading: 'Lookup Concepts & Structured Master Tables',
              shortDescription: 'How unique IDs connect master sheets (Suppliers, Employees) to transaction logs.',
              body: 'Lookup functions search for a known identifier (such as a Supplier ID or Employee ID) inside a master table and pull related details from the same row automatically.',
              bullets: [
                'Lookup value: The ID you are searching for (e.g., SUP003).',
                'Lookup column & return column: Where Excel searches and which column it sends back.',
                'Always use unique identifiers in the master table so every search returns one unambiguous match.',
              ],
              table: {
                title: 'Reference Supplier Master Table (A1:D6)',
                subtitle: 'Clean master table with unique Supplier IDs in Column A.',
                columns: ['Supplier ID', 'Supplier Name', 'City', 'Category'],
                rows: [
                  ['SUP001', 'ABC Technologies', 'Pune', 'IT'],
                  ['SUP002', 'Global Supplies', 'Mumbai', 'Office Supplies'],
                  ['SUP003', 'Tech Solutions', 'Bengaluru', 'IT'],
                  ['SUP004', 'Paper World', 'Hyderabad', 'Stationery'],
                  ['SUP005', 'Office Mart', 'Pune', 'Office Supplies'],
                ],
              },
            },
            {
              heading: 'VLOOKUP Syntax & How It Works',
              shortDescription: 'Understanding the four VLOOKUP arguments to retrieve matching column values.',
              body: 'VLOOKUP (Vertical Lookup) searches down the leftmost column of a table and returns a value from a specified column to the right.',
              formula: '=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])\n=VLOOKUP("SUP003", A2:D6, 2, FALSE)   -> "Tech Solutions"',
              bullets: [
                'lookup_value: Value or cell to find (e.g., F2).',
                'table_array: Range starting with the lookup column (e.g., A2:D6).',
                'col_index_num: Column number to return (2 = Supplier Name, 3 = City, 4 = Category).',
                'range_lookup: FALSE (0) for exact match; TRUE (1) for approximate match.',
              ],
            },
            {
              heading: 'Cell References & Locking Ranges with $',
              shortDescription: 'Anchoring table_array with $ signs so copied VLOOKUP formulas never drift.',
              body: 'Always reference a cell for lookup_value (such as F2) and lock the master table range with dollar signs ($A$2:$D$6) before copying formulas down multiple rows.',
              formula: '=VLOOKUP(F2, $A$2:$D$6, 2, FALSE)',
              commonMistake:
                'Leaving A2:D6 unlocked shifts row 3 to A3:D7 and row 4 to A4:D8 — causing #N/A errors for suppliers at the top of the table.',
            },
            {
              heading: 'Exact Match (FALSE) vs. Approximate Match (TRUE)',
              shortDescription: 'When to use exact matching for IDs versus approximate matching for numeric tiers.',
              body: 'Choose FALSE (0) for virtually all workplace ID and code lookups. Use TRUE (1) only on ascending-sorted numeric bracket tables such as tax slabs, commission tiers, or grade scales.',
              bullets: [
                'Exact Match (FALSE): Finds an exact ID match; returns #N/A if absent.',
                'Approximate Match (TRUE): Finds the largest value less than or equal to the lookup value on sorted numeric bands.',
              ],
            },
            {
              heading: 'Limitations of VLOOKUP',
              shortDescription: 'Four constraints of VLOOKUP that every job seeker should know in interviews.',
              body: 'Knowing where VLOOKUP falls short helps you avoid fragile spreadsheets and decide when to use XLOOKUP instead.',
              bullets: [
                'Only searches in the leftmost column of table_array and only returns columns to its right.',
                'Hardcoded col_index_num breaks if a colleague inserts or deletes a column inside the master table.',
                'Defaults to approximate match (TRUE) when the 4th argument is omitted, risking silent wrong matches.',
              ],
            },
            {
              heading: 'XLOOKUP Syntax & Modern Lookups',
              shortDescription: 'Searching left or right with default exact match and built-in not-found handling.',
              body: 'XLOOKUP replaces VLOOKUP with cleaner separate lookup and return arrays, exact match by default, and no column counting.',
              formula: '=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])\n=XLOOKUP(F2, A2:A6, B2:B6, "Supplier Not Found")',
              bullets: [
                'Searches in any column and returns values from columns to the left OR right.',
                'Inserting columns inside the master sheet never breaks XLOOKUP.',
                'Defaults to Exact Match automatically — no FALSE argument required.',
              ],
            },
            {
              heading: 'Handling Missing Values (IFERROR vs. XLOOKUP)',
              shortDescription: 'Replacing ugly #N/A errors with clean workplace messages like "Not Found".',
              body: 'When a Supplier ID is missing from the master sheet, VLOOKUP shows #N/A. Wrap VLOOKUP in IFERROR — or use XLOOKUP’s built-in 4th argument.',
              formula: '=IFERROR(VLOOKUP(F2, $A$2:$D$6, 2, FALSE), "Not Found")\n=XLOOKUP(F2, $A$2:$A$6, $B$2:$B$6, "Not Found")',
              example:
                'Purchase Order Review: Unknown ID SUP999 displays "Not Found" cleanly instead of #N/A, making missing master entries effortless to spot.',
            },
            {
              heading: 'Troubleshooting Common Lookup Errors',
              shortDescription: 'Pinpointing #N/A, #REF!, #VALUE!, hidden spaces, and text-vs-number mismatches.',
              body: 'Most broken lookups trace back to four quick checks.',
              bullets: [
                '#N/A: ID genuinely missing, trailing space (fix with TRIM), text vs. number mismatch ("101" vs 101), or unlocked table range.',
                '#REF!: col_index_num exceeds the number of columns in table_array.',
                '#VALUE!: col_index_num is less than 1, or XLOOKUP lookup_array and return_array have different row counts.',
                'Wrong Match: 4th VLOOKUP argument omitted or set to TRUE on unsorted IDs.',
              ],
            },
            {
              heading: 'VLOOKUP vs. XLOOKUP Comparison & Compatibility',
              shortDescription: 'Choosing between VLOOKUP and XLOOKUP across Excel versions.',
              body: 'XLOOKUP works in Microsoft 365, Excel 2021+, Excel for the Web, and Google Sheets. When sharing files with older Excel 2016/2019 users, use VLOOKUP with IFERROR.',
              table: {
                title: 'VLOOKUP vs. XLOOKUP Comparison',
                subtitle: 'Practical differences frequently tested in Excel job interviews.',
                columns: ['Feature', 'VLOOKUP', 'XLOOKUP'],
                rows: [
                  ['Lookup Direction', 'Right of lookup column only', 'Left or right (any column)'],
                  ['Default Match Mode', 'Approximate (must type FALSE)', 'Exact match by default'],
                  ['Column Insert Safety', 'Breaks hardcoded col_index_num', 'Safe (references return_array)'],
                  ['Missing Value Handling', 'Requires wrapping in IFERROR', 'Built-in if_not_found argument'],
                  ['Excel Compatibility', 'All Excel versions', 'Microsoft 365, Excel 2021+, Web'],
                ],
              },
            },
          ],
          examples: [],
        },
        exercise: {
          title: 'Practical Workplace Activity: Supplier and Purchase Order Lookup System',
          instructions: [
            'Download ABHI-Excel-Module-05-Practice-Workbook.xlsx and open it in Microsoft Excel, Excel for the Web, or Google Sheets.',
            '1. Review the 7 supplier records on "Supplier Master" (SUP001–SUP007).',
            '2. Switch to "Purchase Lookup Practice" (PO001–PO006, including missing ID SUP999 in row 7).',
            '3. In C2 (Supplier Name), enter =IFERROR(VLOOKUP(B2,\'Supplier Master\'!$A$2:$E$8,2,FALSE),"Not Found") and copy down to C7.',
            '4. In D2 (City) and E2 (Category), write VLOOKUP formulas using column index 3 and 4 with IFERROR, then copy down.',
            '5. In F2 (Payment Terms), enter =XLOOKUP(B2,\'Supplier Master\'!$A$2:$A$8,\'Supplier Master\'!$E$2:$E$8,"Not Found") and copy down to F7.',
            '6. Confirm that row 7 (PO006 / SUP999) cleanly displays "Not Found" instead of #N/A, and compare your results against "Completed Answer Sheet".',
          ].join('\n'),
          deliverable:
            'Completed Purchase Lookup Practice sheet with working VLOOKUP, IFERROR, and XLOOKUP formulas across all 6 purchase orders.',
        },
        attachments: [
          {
            id: 'excel_m05_practice_workbook',
            title: 'ABHI-Excel-Module-05-Practice-Workbook.xlsx',
            url: '/downloads/workbooks/ABHI-Excel-Module-05-Practice-Workbook.xlsx',
            fileType: 'Workbook',
            sizeLabel:
              '4 Sheets (Instructions + Supplier Master + Purchase Lookup Practice + Completed Answer Sheet) · .xlsx',
          },
          {
            id: 'excel_m05_instruction_sheet',
            title: 'Module 05 Practical Activity — Lookup Formula Sheet',
            url: '',
            fileType: 'PDF',
            sizeLabel: 'Printable Formula Guide · PDF',
            worksheetContent: [
              'PRACTICAL ACTIVITY: SUPPLIER AND PURCHASE ORDER LOOKUP SYSTEM',
              '',
              'Exact Formulas for "Purchase Lookup Practice":',
              'C2 (Supplier Name): =IFERROR(VLOOKUP(B2,\'Supplier Master\'!$A$2:$E$8,2,FALSE),"Not Found")',
              'D2 (City):          =IFERROR(VLOOKUP(B2,\'Supplier Master\'!$A$2:$E$8,3,FALSE),"Not Found")',
              'E2 (Category):      =IFERROR(VLOOKUP(B2,\'Supplier Master\'!$A$2:$E$8,4,FALSE),"Not Found")',
              'F2 (Payment Terms): =XLOOKUP(B2,\'Supplier Master\'!$A$2:$A$8,\'Supplier Master\'!$E$2:$E$8,"Not Found")',
            ].join('\n'),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULE 06 — SORTING, FILTERING, TABLES & DATA VALIDATION
  // ==========================================================================
  {
    id: 'excel_m06_sorting_filtering_tables',
    order: 6,
    title: 'Sorting, Filtering, Tables & Data Validation',
    level: 'Beginner to Intermediate',
    summary:
      'Teach students to organize, sort, filter, convert ranges into structured Excel Tables, prevent input errors with Data Validation dropdowns, and remove duplicates.',
    estimatedMinutes: 60,
    learningObjectives: [
      'Sort text alphabetically (A–Z / Z–A) and sort numbers and dates safely.',
      'Perform multi-level sorting across multiple business columns.',
      'Filter datasets by text, number ranges, and date conditions.',
      'Convert plain ranges into official Excel Tables using Ctrl+T.',
      'Use table styles, Total Rows, and readable structured references.',
      'Build in-cell dropdown lists with Data Validation.',
      'Restrict invalid numbers and dates with input messages and error alerts.',
      'Remove duplicate records cleanly without corrupting valid rows.',
    ],
    quizPlanned: true,
    quizRequired: true,
    passPercentage: 70,
    lessons: [
      {
        id: 'excel_m06_lesson_01',
        courseId: 'excel_for_job_seekers',
        moduleId: 'excel_m06_sorting_filtering_tables',
        order: 1,
        title: 'Module 06: Sorting, Filtering, Tables & Data Validation',
        description:
          'Organize workplace registers with multi-level sorting, dynamic filters, Excel Tables (Ctrl+T), Total Rows, Data Validation dropdowns, and duplicate removal.',
        estimatedMinutes: 60,
        videoUrl: 'https://www.youtube.com/watch?v=FRiFfKb_B_A',
        videos: [
          {
            id: 'excel_m06_video_01',
            title: 'Create SMART Drop Down Lists in Excel (with Data Validation)',
            publisher: 'Leila Gharani',
            youtubeVideoId: 'FRiFfKb_B_A',
            watchUrl: 'https://www.youtube.com/watch?v=FRiFfKb_B_A',
            embedUrl: 'https://www.youtube.com/embed/FRiFfKb_B_A',
            verificationStatus: 'verified',
            durationSeconds: 780,
            description:
              'Learn how to combine Excel Tables and Data Validation to build dynamic dropdown lists that prevent typos and keep registers clean.',
            order: 1,
          },
        ],
        writtenContent:
          'Well-structured Excel registers rely on Excel Tables, smart sorting/filtering, and Data Validation dropdowns so every team member enters clean, standardized records.',
        studyGuide: {
          title: 'Study Guide',
          subtitle:
            'These topics cover the core concepts from Module 06. Select any topic below to review sorting, filters, Excel Tables, and dropdown validation.',
          sections: [
            {
              heading: 'Sorting Data Safely (Text, Numbers & Dates)',
              shortDescription: 'Arranging records alphabetically, numerically, or chronologically without scrambling rows.',
              body: 'Sorting reorders rows so top values, recent dates, or alphabetical groups stand out immediately. Always click a single cell inside your contiguous table before sorting so every column in each row moves together.',
              bullets: [
                'Text Sort: A–Z or Z–A for Supplier Names and Departments.',
                'Number Sort: Largest to Smallest to review highest-value purchase orders first.',
                'Date Sort: Newest to Oldest to inspect recent orders first.',
              ],
              commonMistake:
                'Highlighting only one column before sorting scrambles rows and permanently detaches suppliers from their amounts.',
            },
            {
              heading: 'Multi-Level Sorting',
              shortDescription: 'Sorting by a primary column first and then breaking ties with a second column.',
              body: 'Use Data -> Sort -> Add Level when you want structured hierarchy — for example, grouping all orders by Department (A–Z) and ranking Purchase Amount (Largest to Smallest) inside each department.',
              steps: [
                'Click inside your table and open Data -> Sort.',
                'Set Level 1 to Department (A to Z).',
                'Click Add Level, set Level 2 to Purchase Amount (Largest to Smallest), and click OK.',
              ],
            },
            {
              heading: 'Filtering Text, Numbers & Dates',
              shortDescription: 'Focusing on specific records temporarily without deleting other rows.',
              body: 'Filtering hides non-matching rows so you can inspect specific slices (such as Pending IT orders placed this month) while keeping all underlying records intact.',
              bullets: [
                'Toggle filter arrows with Ctrl + Shift + L (or Data -> Filter).',
                'Text Filters: Equals, Begins With, or Contains (e.g., suppliers containing "Tech").',
                'Number Filters: Greater Than, Top 10, Above Average.',
                'Date Filters: This Month, Last Quarter, Between, or After.',
              ],
              shortcuts: [
                { keys: 'Ctrl + Shift + L', action: 'Toggle Filter arrows on/off' },
              ],
            },
            {
              heading: 'Converting Ranges into Excel Tables',
              shortDescription: 'Upgrading plain ranges with Ctrl + T for auto-expansion, banded rows, and sticky headers.',
              body: 'An official Excel Table (Insert -> Table or Ctrl + T) turns a static grid into a dynamic structured object that automatically grows when you type new rows below it.',
              bullets: [
                'Automatically copies formulas and formatting down to newly added rows.',
                'Keeps column headers visible inside the column letter bar while scrolling.',
                'Pairs cleanly with PivotTables, charts, and dynamic dropdown lists.',
              ],
              shortcuts: [
                { keys: 'Ctrl + T', action: 'Convert range to Excel Table' },
              ],
            },
            {
              heading: 'Structured References & Dynamic Total Rows',
              shortDescription: 'Readable table formulas and filtered-aware SUBTOTAL summary rows.',
              body: 'Excel Tables replace cryptic range addresses like F2:F21 with readable column names and add a built-in Total Row that calculates only visible filtered rows.',
              formula: '=SUM(PurchaseRegisterTable[Purchase Amount])',
              bullets: [
                'Enable Table Design -> Total Row to switch between Sum, Average, Count, Min, and Max.',
                'Because the Total Row uses SUBTOTAL, filtering to "IT" updates the Total automatically.',
              ],
            },
            {
              heading: 'Data Validation & Dropdown Lists',
              shortDescription: 'Preventing typos and invalid entries using in-cell dropdowns, rules, and alerts.',
              body: 'Data Validation (Data -> Data Validation) restricts what users can enter in a column before spelling errors or negative numbers ever pollute your register.',
              bullets: [
                'List Validation: Creates clean dropdown choices for Order Status and Payment Status.',
                'Whole Number / Date Rules: Blocks negative amounts or impossible delivery dates.',
                'Input Messages & Error Alerts: Guide users on click and block invalid entries with a clear message.',
              ],
              table: {
                title: 'Data Validation Rule Examples for a Purchase Register',
                subtitle: 'Standard validation controls used by procurement and operations teams.',
                columns: ['Column', 'Type', 'Rule / Allowed Values', 'Purpose'],
                rows: [
                  ['Order Status', 'List', 'Pending, In Transit, Delivered, Cancelled', 'Eliminates spelling variations'],
                  ['Payment Status', 'List', 'Paid, Unpaid, Pending Approval, N/A', 'Standardizes finance tracking'],
                  ['Purchase Amount', 'Whole Number', 'Greater than 0', 'Blocks negative/text values'],
                  ['Delivery Date', 'Date', 'Greater than or equal to Order Date', 'Prevents impossible dates'],
                ],
              },
            },
            {
              heading: 'Removing Duplicate Records Cleanly',
              shortDescription: 'Eliminating accidental double entries using unique key columns like PO Number.',
              body: 'Use Data -> Remove Duplicates and select your unique identifier column (such as PO Number) to strip repeated entries while preserving all unique transactions.',
              example:
                'Purchase Register Audit: Selecting only PO Number in Remove Duplicates removes duplicate PO1003 and PO1013 from 22 rows, leaving 20 clean unique orders.',
              commonMistake:
                'Running Remove Duplicates on a non-unique column like Department deletes every row after the first order per department!',
            },
          ],
          examples: [],
        },
        exercise: {
          title: 'Practical Workplace Activity: Purchase Order Management Register',
          instructions: [
            'Download ABHI-Excel-Module-06-Practice-Workbook.xlsx and open "Filter and Sort Practice".',
            '1. Review the 22 sample PO rows (includes 2 intentional duplicate PO numbers: PO1003 and PO1013).',
            '2. Convert A1:H23 into an Excel Table using Ctrl+T (My table has headers).',
            '3. Remove duplicate PO numbers via Data -> Remove Duplicates (check PO Number only) -> 20 unique records remain.',
            '4. Sort by Purchase Amount (Largest to Smallest), then test sorting by Order Date.',
            '5. Filter Order Status = "Pending" and Department = "IT", then clear filters.',
            '6. Apply Data Validation dropdowns to Order Status and Payment Status, and restrict Purchase Amount to whole numbers > 0.',
            '7. Turn on Table Design -> Total Row and verify Total Purchases against "Completed Reference".',
          ].join('\n'),
          deliverable:
            'Deduplicated Excel Table with working dropdown lists, positive-amount validation, and an active Total Row.',
        },
        attachments: [
          {
            id: 'excel_m06_practice_workbook',
            title: 'ABHI-Excel-Module-06-Practice-Workbook.xlsx',
            url: '/downloads/workbooks/ABHI-Excel-Module-06-Practice-Workbook.xlsx',
            fileType: 'Workbook',
            sizeLabel:
              '4 Sheets (Instructions + Purchase Order Data + Practice + Completed Table & Validation Reference) · .xlsx',
          },
          {
            id: 'excel_m06_instruction_sheet',
            title: 'Module 06 Practical Activity — Register Checklist',
            url: '',
            fileType: 'PDF',
            sizeLabel: 'Printable Practice Guide · PDF',
            worksheetContent: [
              'PRACTICAL ACTIVITY: PURCHASE ORDER MANAGEMENT REGISTER',
              '1. Convert A1:H23 to Excel Table (Ctrl+T).',
              '2. Data -> Remove Duplicates on PO Number (removes 2 duplicate rows).',
              '3. Practice sorting by Purchase Amount and Order Date.',
              '4. Filter Pending orders and IT department orders.',
              '5. Apply List Data Validation to Order Status & Payment Status; Whole Number > 0 to Purchase Amount.',
              '6. Enable Total Row to verify ₹7,21,900 total across 20 unique orders.',
            ].join('\n'),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULE 07 — DATA CLEANING & DATA MANAGEMENT
  // ==========================================================================
  {
    id: 'excel_m07_data_cleaning',
    order: 7,
    title: 'Data Cleaning & Data Management',
    level: 'Intermediate',
    summary:
      'Teach students to identify, clean, standardize, and prepare messy imported spreadsheets for accurate formulas, PivotTables, and management reports.',
    estimatedMinutes: 65,
    learningObjectives: [
      'Spot common data quality issues in imported workplace spreadsheets.',
      'Remove duplicate records safely using unique key identifiers.',
      'Clean extra spaces and non-printable characters using TRIM and CLEAN.',
      'Standardize text casing with PROPER, UPPER, and LOWER.',
      'Extract, measure, find, substitute, and combine text with LEFT, RIGHT, MID, LEN, SUBSTITUTE, CONCAT, and TEXTJOIN.',
      'Split messy columns with Text to Columns and automate patterns with Flash Fill.',
      'Handle blank cells responsibly without deleting needed audit data.',
      'Standardize mixed date formats and convert numbers stored as text.',
    ],
    quizPlanned: true,
    quizRequired: true,
    passPercentage: 70,
    lessons: [
      {
        id: 'excel_m07_lesson_01',
        courseId: 'excel_for_job_seekers',
        moduleId: 'excel_m07_data_cleaning',
        order: 1,
        title: 'Module 07: Data Cleaning & Data Management',
        description:
          'Master Excel’s top 10 data cleaning tools — TRIM, CLEAN, PROPER, SUBSTITUTE, Text to Columns, Flash Fill, Remove Duplicates, and date/number standardization.',
        estimatedMinutes: 65,
        videoUrl: 'https://www.youtube.com/watch?v=tOY6_yhqR-w',
        videos: [
          {
            id: 'excel_m07_video_01',
            title: 'Top 10 Data Cleaning Techniques in Excel | Step-by-Step Tutorial for Beginners',
            publisher: 'Excel Map',
            youtubeVideoId: 'tOY6_yhqR-w',
            watchUrl: 'https://www.youtube.com/watch?v=tOY6_yhqR-w',
            embedUrl: 'https://www.youtube.com/embed/tOY6_yhqR-w',
            verificationStatus: 'verified',
            durationSeconds: 900,
            description:
              'Hands-on walkthrough of the top 10 workplace data cleaning techniques in Excel for preparing messy exports for analysis.',
            order: 1,
          },
        ],
        writtenContent:
          'Real workplace exports from ERPs, CRMs, and emails rarely arrive clean. Mastering Excel’s cleaning formulas and tools turns messy files into trusted reporting datasets.',
        studyGuide: {
          title: 'Study Guide',
          subtitle:
            'These topics cover the core data cleaning methods from Module 07. Select any topic below to view formulas and workflows.',
          sections: [
            {
              heading: 'Spotting Poor-Quality Data & Removing Duplicates',
              shortDescription: 'Standardizing key IDs before running Remove Duplicates on messy exports.',
              body: 'Exported ERP and CRM sheets often contain repeated rows, extra spaces, misspelled cities, blank fields, mixed date formats, and text-stored numbers. Standardize IDs first with UPPER(TRIM(...)) so " sup001 " and "SUP001" match accurately before running Data -> Remove Duplicates.',
              formula: '=UPPER(TRIM(CLEAN(A2)))',
            },
            {
              heading: 'Removing Extra Spaces & Hidden Characters (TRIM & CLEAN)',
              shortDescription: 'Stripping leading/trailing spaces and invisible control characters.',
              body: 'TRIM removes leading spaces, trailing spaces, and multiple internal spaces, leaving single spaces between words. CLEAN strips invisible non-printable characters (ASCII 0–31) imported from web forms or ERP exports.',
              formula: '=TRIM(CLEAN(A2))',
              example:
                'Supplier Names: "  abc   technologies " becomes "abc technologies" so lookups and PivotTables stop splitting the same vendor across two rows.',
            },
            {
              heading: 'Standardizing Text Case (PROPER, UPPER, LOWER)',
              shortDescription: 'Applying consistent capitalization across names, IDs, and email addresses.',
              body: 'Consistent capitalization makes lists readable and uniform across team reports.',
              formula: '=PROPER(A2)  -> "Abc Technologies"\n=UPPER(A2)   -> "SUP001"\n=LOWER(A2)   -> "vendor@company.com"',
              bullets: [
                'PROPER: Names, cities, and titles.',
                'UPPER: Codes, IDs, and department acronyms (IT, HR, SUP001).',
                'LOWER: Email addresses and usernames.',
              ],
            },
            {
              heading: 'Extracting, Finding & Replacing Text',
              shortDescription: 'Fixing typos and parsing codes with SUBSTITUTE, LEFT, RIGHT, MID, and LEN.',
              body: 'Use LEFT, RIGHT, and MID to pull structured codes out of combined text, LEN to detect hidden extra characters, FIND/SEARCH to locate symbols, and SUBSTITUTE to correct recurring spelling variations.',
              formula: '=SUBSTITUTE(A2, "Bengalore", "Bengaluru")\n=LEFT(A2, 3)   |   =RIGHT(A2, 4)   |   =LEN(A2)',
              example:
                'City Cleanup: Nesting SUBSTITUTE fixes both "Bengalore" -> "Bengaluru" and "Hydrabad" -> "Hyderabad" cleanly across hundreds of supplier records.',
            },
            {
              heading: 'Combining Text Fields (CONCAT & TEXTJOIN)',
              shortDescription: 'Merging separate columns cleanly while skipping empty cells automatically.',
              body: 'Combine First Name + Last Name or Supplier + City using CONCAT or TEXTJOIN. TEXTJOIN lets you set a delimiter once and skip blanks automatically.',
              formula: '=CONCAT(A2, " ", B2)\n=TEXTJOIN(" ", TRUE, A2:C2)',
            },
            {
              heading: 'Splitting Data with Text to Columns & Flash Fill',
              shortDescription: 'Breaking combined columns apart and filling repeating patterns instantly.',
              body: 'When one cell holds combined information (like "SUP001 - ABC Tech - Pune"), split it into separate columns without manual retyping.',
              bullets: [
                'Data -> Text to Columns (Delimited): Splits text at commas, spaces, hyphens, or tabs.',
                'Flash Fill (Ctrl + E): Type one cleaned example in the adjacent column and let Excel pattern-match the rest.',
              ],
              shortcuts: [
                { keys: 'Ctrl + E', action: 'Run Flash Fill' },
              ],
            },
            {
              heading: 'Handling Blank Cells Responsibly',
              shortDescription: 'Flagging missing attributes clearly without deleting valid transaction records.',
              body: 'Never blindly delete rows containing a blank cell — the row may hold valid spend or audit information. Use IF to label blank fields clearly for follow-up.',
              formula: '=IF(TRIM(G2)="", "Needs Verification", PROPER(TRIM(G2)))',
              commonMistake:
                'Filtering blanks and deleting entire rows can silently remove legitimate supplier spend from your financial totals.',
            },
            {
              heading: 'Date Consistency, Text-Numbers & Clean Organization',
              shortDescription: 'Converting text-formatted numbers and standardizing dates before analysis.',
              body: 'Numbers stored as text are ignored by SUM and PivotTables, and mixed date formats prevent chronological grouping. Convert text numbers with VALUE(TRIM(...)) or Paste Special -> Multiply by 1, and standardize dates to YYYY-MM-DD.',
              formula: '=VALUE(TRIM(F2))',
              table: {
                title: 'Data Cleaning Formula Toolkit',
                subtitle: 'Core cleaning formulas applied in the Module 07 Supplier Cleaning activity.',
                columns: ['Data Problem', 'Formula', 'Before -> After'],
                rows: [
                  ['Extra spaces & hidden chars', '=TRIM(CLEAN(A2))', '"  abc   tech " -> "abc tech"'],
                  ['Inconsistent ID casing', '=UPPER(TRIM(A2))', '" sup001 " -> "SUP001"'],
                  ['Misspelled city name', '=SUBSTITUTE(A2,"Bengalore","Bengaluru")', 'Bengalore -> Bengaluru'],
                  ['Number stored as text', '=VALUE(TRIM(F2))', '"45000" -> 45000 (numeric)'],
                  ['Blank status field', '=IF(TRIM(G2)="","Needs Verification",G2)', '"" -> "Needs Verification"'],
                ],
              },
            },
          ],
          examples: [],
        },
        exercise: {
          title: 'Practical Workplace Activity: Supplier Data Cleaning',
          instructions: [
            'Download ABHI-Excel-Module-07-Practice-Workbook.xlsx and inspect "Raw Supplier Data" (10 messy rows with spaces, typos, duplicates, blanks, mixed dates, and text-formatted numbers).',
            '1. On "Cleaning Practice", write formulas in H2:N11 using UPPER, TRIM, CLEAN, PROPER, SUBSTITUTE, VALUE, and IF.',
            '2. Fix misspelled cities ("Bengalore" -> "Bengaluru", "Hydrabad" -> "Hyderabad") and flag blank City/Status cells without deleting valid supplier records.',
            '3. Convert text-stored Annual Spend values to real numbers with =VALUE(TRIM(F2)) so SUM calculates accurately.',
            '4. Copy your cleaned table -> Paste Values -> remove the 2 duplicate supplier IDs (SUP002 & SUP006) so 8 clean unique suppliers remain.',
            '5. Compare your final table and ₹2,34,800 total spend against "Cleaned Answer Sheet".',
          ].join('\n'),
          deliverable:
            'Standardized, deduplicated 8-row supplier table with numeric spend values and zero trailing spaces.',
        },
        attachments: [
          {
            id: 'excel_m07_practice_workbook',
            title: 'ABHI-Excel-Module-07-Practice-Workbook.xlsx',
            url: '/downloads/workbooks/ABHI-Excel-Module-07-Practice-Workbook.xlsx',
            fileType: 'Workbook',
            sizeLabel:
              '4 Sheets (Instructions + Raw Supplier Data + Cleaning Practice + Cleaned Answer Sheet) · .xlsx',
          },
          {
            id: 'excel_m07_instruction_sheet',
            title: 'Module 07 Practical Activity — Data Cleaning Formula Guide',
            url: '',
            fileType: 'PDF',
            sizeLabel: 'Printable Cleaning Guide · PDF',
            worksheetContent: [
              'PRACTICAL ACTIVITY: SUPPLIER DATA CLEANING',
              'Clean ID:     =UPPER(TRIM(CLEAN(A2)))',
              'Clean Name:   =PROPER(TRIM(CLEAN(B2)))',
              'Clean City:   =IF(TRIM(C2)="","Missing - Verify",PROPER(TRIM(SUBSTITUTE(SUBSTITUTE(LOWER(C2),"bengalore","bengaluru"),"hydrabad","hyderabad"))))',
              'Clean Spend:  =VALUE(TRIM(F2))',
              'Clean Status: =IF(TRIM(G2)="","Needs Verification",PROPER(TRIM(G2)))',
            ].join('\n'),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULE 08 — CONDITIONAL FORMATTING
  // ==========================================================================
  {
    id: 'excel_m08_conditional_formatting',
    order: 8,
    title: 'Conditional Formatting',
    level: 'Intermediate',
    summary:
      'Teach students to highlight high-value transactions, duplicate invoice numbers, overdue payments, and visual trends automatically using Excel Conditional Formatting rules.',
    estimatedMinutes: 60,
    learningObjectives: [
      'Apply built-in Highlight Cells Rules (Greater Than, Less Than, Between, Equal To, Text Containing).',
      'Highlight duplicate and unique values to catch repeated invoices or POs.',
      'Use Top/Bottom rules, Data Bars, Color Scales, and Icon Sets.',
      'Build custom formula-based conditional formatting rules for entire rows.',
      'Flag overdue pending invoices dynamically using TODAY() and AND().',
      'Review, prioritize, edit, and clear rules using Manage Rules.',
    ],
    quizPlanned: true,
    quizRequired: true,
    passPercentage: 70,
    lessons: [
      {
        id: 'excel_m08_lesson_01',
        courseId: 'excel_for_job_seekers',
        moduleId: 'excel_m08_conditional_formatting',
        order: 1,
        title: 'Module 08: Conditional Formatting',
        description:
          'Highlight business exceptions automatically with cell rules, duplicate checks, Data Bars, Color Scales, Icon Sets, and formula-driven entire-row alerts.',
        estimatedMinutes: 60,
        videoUrl: 'https://www.youtube.com/watch?v=Jp29JYGq5Hw',
        videos: [
          {
            id: 'excel_m08_video_01',
            title: 'Conditional Formatting in Excel Tutorial',
            publisher: 'Kevin Stratvert',
            youtubeVideoId: 'Jp29JYGq5Hw',
            watchUrl: 'https://www.youtube.com/watch?v=Jp29JYGq5Hw',
            embedUrl: 'https://www.youtube.com/embed/Jp29JYGq5Hw',
            verificationStatus: 'verified',
            durationSeconds: 780,
            description:
              'Step-by-step tutorial on highlight rules, data bars, color scales, icon sets, and formula-based conditional formatting in Excel.',
            order: 1,
          },
        ],
        writtenContent:
          'Conditional formatting turns dense invoice and purchase trackers into instant visual alert boards that update automatically whenever values or dates change.',
        studyGuide: {
          title: 'Study Guide',
          subtitle:
            'These topics cover the core Conditional Formatting tools from Module 08. Select any topic below to view rules and formulas.',
          sections: [
            {
              heading: 'Highlight Cells Rules (Numeric Thresholds)',
              shortDescription: 'Flagging values Greater Than, Less Than, Between, or Equal To automatically.',
              body: 'Built-in Highlight Cells Rules (Home -> Conditional Formatting -> Highlight Cells Rules) dynamically format cells whenever numbers cross a business threshold — updating automatically as values change.',
              bullets: [
                'Greater Than / Less Than: Spotlight invoices above ₹50,000 or low stock below reorder level.',
                'Between / Equal To: Highlight mid-tier spend bands or exact target values.',
              ],
            },
            {
              heading: 'Highlighting Duplicate & Unique Values',
              shortDescription: 'Catching repeated invoice numbers or POs before duplicate payments happen.',
              body: 'Apply Highlight Cells Rules -> Duplicate Values to any ID column to immediately flag repeated entries for review without deleting data.',
              formula: '=COUNTIF($A$2:$A$13, A2) > 1',
              example:
                'Accounts Payable Audit: Applying Duplicate Values to Invoice Number immediately flags double-entered INV-2026-003 before payment is released twice.',
            },
            {
              heading: 'Text-Based Conditional Rules',
              shortDescription: 'Color-coding status labels such as Pending, Delayed, Paid, or Approved.',
              body: 'Use Highlight Cells Rules -> Text That Contains (or Equal To) to give instant visual meaning to text statuses across trackers.',
              bullets: [
                'Highlight cells containing "Pending" or "Delayed" in soft amber/red.',
                'Highlight cells containing "Paid" or "Delivered" in soft green.',
              ],
            },
            {
              heading: 'Top/Bottom Rules & Data Bars',
              shortDescription: 'Comparing magnitudes visually inside cells without building a separate chart.',
              body: 'Top/Bottom Rules identify top performers or outliers (Top 10 Items, Top 10%, Above Average), while Data Bars draw proportional horizontal bars directly inside numeric cells.',
              example:
                'Invoice Spend Column: Adding Data Bars to E2:E13 lets managers see the largest supplier invoices at a glance while keeping exact numbers visible.',
            },
            {
              heading: 'Color Scales & Icon Sets',
              shortDescription: 'Using gradients and traffic-light icons to reveal patterns across ranges.',
              body: 'Color Scales apply a 2- or 3-color heat gradient from low to high values, and Icon Sets add status indicators (arrows, checkmarks, flags, traffic lights) based on numeric thresholds.',
              commonMistake:
                'Layering Color Scales, Data Bars, and bright fills on the same table creates visual noise — choose one clear visual cue per metric.',
            },
            {
              heading: 'Formula-Based & Entire-Row Formatting',
              shortDescription: 'Writing custom logical formulas to highlight full rows based on dates and status.',
              body: 'Choose Conditional Formatting -> New Rule -> Use a formula to determine which cells to format. Lock column letters with $ ($F2, $D2) while leaving the row relative (2) so the entire row formats together.',
              formula: '=AND($F2="Pending", $D2<TODAY())   (Overdue Pending Row)\n=$F2="Paid"                        (Paid Row)',
              table: {
                title: 'Workplace Formula-Based Formatting Rules',
                subtitle: 'Dynamic alert rules built into the Module 08 Invoice Tracker.',
                columns: ['Business Alert', 'Applies To', 'Formula Rule', 'Visual'],
                rows: [
                  ['Invoices > ₹50,000', 'E2:E13', '=E2>50000', 'Bold navy / soft amber'],
                  ['Duplicate Invoice No.', 'A2:A13', '=COUNTIF($A$2:$A$13,A2)>1', 'Amber warning'],
                  ['Overdue Pending Invoice', 'A2:F13', '=AND($F2="Pending",$D2<TODAY())', 'Soft red row highlight'],
                  ['Paid Invoice', 'A2:F13', '=$F2="Paid"', 'Soft green row highlight'],
                ],
              },
            },
            {
              heading: 'Managing, Prioritizing & Clearing Rules',
              shortDescription: 'Inspecting all active rules, adjusting priority order, and cleaning up duplicates.',
              body: 'Open Home -> Conditional Formatting -> Manage Rules (select "This Worksheet") to see every rule, adjust its Applies To range, reorder rule priority (top rule wins), or delete obsolete rules cleanly.',
            },
          ],
          examples: [],
        },
        exercise: {
          title: 'Practical Workplace Activity: Purchase and Invoice Tracking',
          instructions: [
            'Download ABHI-Excel-Module-08-Practice-Workbook.xlsx and open "Conditional Formatting Practice".',
            '1. Highlight duplicate invoice numbers in A2:A13 (catches duplicate INV-2026-003).',
            '2. Highlight invoices above ₹50,000 in E2:E13.',
            '3. Apply Data Bars or a 3-Color Scale to Invoice Amount (E2:E13).',
            '4. Select A2:F13 and create a formula-based rule =AND($F2="Pending",$D2<TODAY()) with a red fill to highlight overdue unpaid invoices.',
            '5. Create a second row rule =$F2="Paid" with a soft green fill, then open Manage Rules to review rule order.',
            '6. Open "Completed Reference" in Microsoft Excel to compare against pre-built native conditional formatting rules.',
          ].join('\n'),
          deliverable:
            'Formatted Invoice Tracker visually flagging overdue pending rows, duplicate invoice numbers, and high-value amounts.',
        },
        attachments: [
          {
            id: 'excel_m08_practice_workbook',
            title: 'ABHI-Excel-Module-08-Practice-Workbook.xlsx',
            url: '/downloads/workbooks/ABHI-Excel-Module-08-Practice-Workbook.xlsx',
            fileType: 'Workbook',
            sizeLabel:
              '4 Sheets (Instructions + Invoice Data + Practice + Completed Live CF Reference) · .xlsx',
          },
          {
            id: 'excel_m08_instruction_sheet',
            title: 'Module 08 Practical Activity — Conditional Formatting Rules Guide',
            url: '',
            fileType: 'PDF',
            sizeLabel: 'Printable Rules Guide · PDF',
            worksheetContent: [
              'PRACTICAL ACTIVITY: PURCHASE AND INVOICE TRACKING',
              '1. Duplicate Invoices (A2:A13): =COUNTIF($A$2:$A$13,A2)>1',
              '2. High-Value Invoices (E2:E13): =E2>50000 (+ Data Bars or Color Scale)',
              '3. Overdue Pending Rows (A2:F13): =AND($F2="Pending",$D2<TODAY())',
              '4. Paid Rows (A2:F13): =$F2="Paid"',
            ].join('\n'),
          },
        ],
      },
    ],
  },
];
