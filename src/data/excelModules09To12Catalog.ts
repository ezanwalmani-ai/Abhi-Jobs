import type { CourseModule } from '../types/learning';

export const EXCEL_MODULES_09_TO_12: CourseModule[] = [
  // ==========================================================================
  // MODULE 09 — PIVOTTABLES & DATA ANALYSIS
  // ==========================================================================
  {
    id: 'excel_m09_pivottables_analysis',
    order: 9,
    title: 'PivotTables & Data Analysis',
    level: 'Intermediate to Advanced',
    summary:
      'Teach students to summarize large datasets quickly and create interactive business performance reports using PivotTables, date grouping, Slicers, and PivotCharts.',
    estimatedMinutes: 70,
    learningObjectives: [
      'Understand what PivotTables are and why businesses rely on them.',
      'Prepare clean, header-consistent source datasets for PivotTable analysis.',
      'Create PivotTables and arrange Rows, Columns, Values, and Filters.',
      'Summarize totals (Sum), record counts (Count), and averages (Average).',
      'Sort, filter, and group dates by month and year inside PivotTables.',
      'Add visual Slicers, refresh PivotTables after source edits, and build PivotCharts.',
      'Apply PivotTable summaries across procurement, sales, inventory, and HR reporting.',
    ],
    quizPlanned: true,
    quizRequired: true,
    passPercentage: 70,
    lessons: [
      {
        id: 'excel_m09_lesson_01',
        courseId: 'excel_for_job_seekers',
        moduleId: 'excel_m09_pivottables_analysis',
        order: 1,
        title: 'Module 09: PivotTables & Data Analysis',
        description:
          'Build PivotTables from raw business transactions to analyze spend by department, supplier, month, category, status, and buyer using Slicers and PivotCharts.',
        estimatedMinutes: 70,
        videoUrl: 'https://www.youtube.com/watch?v=wZDpNXZCyFQ',
        videos: [
          {
            id: 'excel_m09_video_01',
            title: 'Excel Pivot Table Tutorial for Beginners | Step-by-Step Course',
            publisher: 'Data Universe',
            youtubeVideoId: 'wZDpNXZCyFQ',
            watchUrl: 'https://www.youtube.com/watch?v=wZDpNXZCyFQ',
            embedUrl: 'https://www.youtube.com/embed/wZDpNXZCyFQ',
            verificationStatus: 'verified',
            durationSeconds: 1200,
            description:
              'Step-by-step course introducing PivotTable setup, Rows/Columns/Values/Filters, date grouping, Slicers, Refreshing, and PivotCharts.',
            order: 1,
          },
        ],
        writtenContent:
          'PivotTables let you turn hundreds or thousands of raw transaction rows into clear executive summaries in seconds through drag-and-drop fields.',
        studyGuide: {
          title: 'Study Guide',
          subtitle:
            'These topics cover the core PivotTable concepts from Module 09. Select any topic below to review source rules, field areas, and summaries.',
          sections: [
            {
              heading: 'What PivotTables Do & Why Businesses Use Them',
              shortDescription: 'Turning hundreds of raw transactions into instant executive summaries without manual formulas.',
              body: 'A PivotTable is an interactive summary engine that groups, counts, sums, and averages large datasets through drag-and-drop fields — letting analysts answer management questions in seconds.',
              example:
                'Procurement, Sales, Inventory, and HR teams use PivotTables daily to summarize spend by supplier, revenue by region, stock value by warehouse, and headcount by department.',
            },
            {
              heading: 'Preparing Clean Source Data',
              shortDescription: 'Four structural rules your dataset must satisfy before inserting a PivotTable.',
              body: 'PivotTables work reliably only when built on clean tabular source data.',
              bullets: [
                'Unique, non-blank column heading in every column of Row 1.',
                'No completely blank rows or blank columns splitting the dataset.',
                'No merged cells anywhere inside the table.',
                'Consistent data types — amounts stored as numbers and dates stored as real Excel dates.',
              ],
            },
            {
              heading: 'Creating a PivotTable',
              shortDescription: 'Converting source data into a Table first and inserting a PivotTable cleanly.',
              body: 'Format your raw dataset as an Excel Table (Ctrl + T) first so new rows are automatically included when you refresh, then insert the PivotTable onto a clean worksheet.',
              steps: [
                'Click any single cell inside your structured data table.',
                'Go to Insert -> PivotTable.',
                'Confirm the table/range name, select New Worksheet (or target sheet), and click OK.',
              ],
            },
            {
              heading: 'Rows, Columns, Values & Filters Areas',
              shortDescription: 'How the four PivotTable Field List boxes control layout and calculations.',
              body: 'Drag fields into the four layout areas in the PivotTable Fields pane to shape your report:',
              bullets: [
                'Rows: Vertical grouping categories (e.g., Department, Supplier, Buyer).',
                'Columns: Horizontal cross-tab categories (e.g., Month or Order Status).',
                'Values: Numeric calculations (Sum of Purchase Amount, Count of PO Number).',
                'Filters: High-level report filters placed above the PivotTable.',
              ],
            },
            {
              heading: 'Summarizing Values (Sum, Count & Average)',
              shortDescription: 'Switching calculation modes via Value Field Settings and formatting numbers cleanly.',
              body: 'Click any field in the Values box -> Value Field Settings to switch between Sum, Count, Average, Max, or Min, and click Number Format to apply clean currency formatting directly to the PivotTable field.',
              commonMistake:
                'If Purchase Amount defaults to "Count" instead of "Sum", check the source column for blank cells or numbers stored as text.',
            },
            {
              heading: 'Sorting, Filtering & Grouping Dates',
              shortDescription: 'Ranking top suppliers and grouping daily dates into monthly or yearly trends.',
              body: 'PivotTables make ranking and time-series grouping effortless.',
              bullets: [
                'Sort Top Performers: Right-click any Value cell -> Sort -> Largest to Smallest.',
                'Group Dates: Right-click a Date field in Rows -> Group -> choose Months and Years to turn daily PO dates into clean monthly spending trends.',
              ],
            },
            {
              heading: 'Slicers, Refreshing & PivotCharts',
              shortDescription: 'Adding visual filter buttons, refreshing cached summaries, and connecting live charts.',
              body: 'Slicers and PivotCharts turn static PivotTables into interactive management tools.',
              bullets: [
                'Slicers (PivotTable Analyze -> Insert Slicer): Clickable visual buttons to filter by Department or Status.',
                'Refresh (Alt + F5 or Data -> Refresh All): Required whenever source rows change because PivotTables read from an internal cache.',
                'PivotCharts: Live charts linked directly to your PivotTable that update whenever you click a slicer.',
              ],
              shortcuts: [
                { keys: 'Alt + F5', action: 'Refresh active PivotTable' },
              ],
            },
            {
              heading: 'Workplace PivotTable Summary Layouts',
              shortDescription: 'Six essential procurement report layouts built from a single transaction register.',
              body: 'One clean transaction dataset can power multiple management summaries simultaneously.',
              table: {
                title: 'Six Core Procurement PivotTable Layouts',
                subtitle: 'Field placements for the Module 09 Purchase Analysis Report.',
                columns: ['Analysis Goal', 'Rows Area', 'Values Area', 'Calculation'],
                rows: [
                  ['Spend by department', 'Department', 'Purchase Amount', 'Sum'],
                  ['Top suppliers by spend', 'Supplier', 'Purchase Amount', 'Sum (Sorted Z–A)'],
                  ['Monthly trend', 'Month / Date', 'Purchase Amount', 'Sum'],
                  ['Orders by status', 'Order Status', 'PO Number', 'Count'],
                  ['Avg PO by category', 'Category', 'Purchase Amount', 'Average'],
                  ['Spend per buyer', 'Buyer', 'Purchase Amount', 'Sum'],
                ],
              },
            },
          ],
          examples: [],
        },
        exercise: {
          title: 'Practical Workplace Activity: Purchase Analysis Report (44 Transactions)',
          instructions: [
            'Download ABHI-Excel-Module-09-Practice-Workbook.xlsx and inspect the 44 realistic purchase transactions on "Purchase Transactions".',
            '1. Click inside A1:I45 -> Insert -> PivotTable onto "PivotTable Practice".',
            '2. Build 6 PivotTables: (a) Total Purchases by Department, (b) Total Purchases by Supplier, (c) Monthly Purchasing Trends, (d) Purchase Count by Order Status, (e) Average Purchase Value by Category, and (f) Purchase Amount by Buyer.',
            '3. Insert Slicers for Department and Order Status and test Report Connections across multiple PivotTables.',
            '4. Cross-check every single PivotTable figure against the live SUMIFS/COUNTIF/AVERAGEIFS verification tables on "Completed Analysis Reference" (note: the reference sheet clearly uses verification formulas rather than claiming static tables are PivotTables).',
          ].join('\n'),
          deliverable:
            'Six interactive PivotTables with Department & Order Status slicers built inside Microsoft Excel from the 44-row dataset.',
        },
        attachments: [
          {
            id: 'excel_m09_practice_workbook',
            title: 'ABHI-Excel-Module-09-Practice-Workbook.xlsx',
            url: '/api/learning/resources/excel-module-09-practice-workbook.xlsx',
            fileType: 'Workbook',
            sizeLabel:
              '4 Sheets (Instructions + 44 Purchase Transactions + Practice Guide + Formula Benchmarks) · .xlsx',
          },
          {
            id: 'excel_m09_instruction_sheet',
            title: 'Module 09 Practical Activity — PivotTable Setup Guide',
            url: '',
            fileType: 'PDF',
            sizeLabel: 'Printable PivotTable Guide · PDF',
            worksheetContent: [
              'PRACTICAL ACTIVITY: PURCHASE ANALYSIS REPORT (44 TRANSACTIONS)',
              'Note: Build live PivotTables inside Microsoft Excel from Purchase Transactions (A1:I45):',
              '1. Department Spend: Rows = Department, Values = Sum of Purchase Amount',
              '2. Supplier Spend:   Rows = Supplier, Values = Sum of Purchase Amount',
              '3. Monthly Trend:    Rows = Month, Values = Sum of Purchase Amount',
              '4. Status Count:     Rows = Order Status, Values = Count of PO Number',
              '5. Category Avg:     Rows = Category, Values = Average of Purchase Amount',
              '6. Buyer Spend:      Rows = Buyer, Values = Sum of Purchase Amount',
            ].join('\n'),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULE 10 — CHARTS, REPORTS & DASHBOARDS
  // ==========================================================================
  {
    id: 'excel_m10_charts_dashboards',
    order: 10,
    title: 'Charts, Reports & Dashboards',
    level: 'Intermediate to Advanced',
    summary:
      'Teach students to turn structured data into clear charts, KPI cards, executive reports, and interactive slicer-driven dashboards.',
    estimatedMinutes: 70,
    learningObjectives: [
      'Understand core principles of business data visualization.',
      'Choose and create Column, Bar, Line, Pie/Doughnut, and Combination charts.',
      'Format chart titles, data labels, axes, and legends for clarity.',
      'Build formula-linked KPI cards for executive summaries.',
      'Design clean, clutter-free interactive dashboards with Slicers.',
      'Prepare dashboards cleanly for printing and PDF sharing.',
    ],
    quizPlanned: true,
    quizRequired: true,
    passPercentage: 70,
    lessons: [
      {
        id: 'excel_m10_lesson_01',
        courseId: 'excel_for_job_seekers',
        moduleId: 'excel_m10_charts_dashboards',
        order: 1,
        title: 'Module 10: Charts, Reports & Dashboards',
        description:
          'Design executive-ready Excel charts, KPI cards, and an interactive Monthly Procurement Dashboard with consistent layout and clear visual storytelling.',
        estimatedMinutes: 70,
        videoUrl: 'https://www.youtube.com/watch?v=qdYXuPyltkA',
        videos: [
          {
            id: 'excel_m10_video_01',
            title: 'Build This Excel Dashboard from Scratch in 30 MINUTES',
            publisher: 'Excel Campus — Jon Acampora',
            youtubeVideoId: 'qdYXuPyltkA',
            watchUrl: 'https://www.youtube.com/watch?v=qdYXuPyltkA',
            embedUrl: 'https://www.youtube.com/embed/qdYXuPyltkA',
            verificationStatus: 'verified',
            durationSeconds: 1800,
            description:
              'Complete 30-minute walkthrough showing how to turn raw Excel tables into PivotTables, KPI summaries, charts, and an interactive slicer-driven dashboard.',
            order: 1,
          },
        ],
        writtenContent:
          'Great dashboards communicate key numbers in five seconds. Combine clean source data, formula-driven KPI cards, the right chart types, and interactive slicers.',
        studyGuide: {
          title: 'Study Guide',
          subtitle:
            'These topics cover chart selection, formatting, KPIs, and dashboard design from Module 10. Select any topic below to view details.',
          sections: [
            {
              heading: 'Preparing Summary Data for Charts & Reports',
              shortDescription: 'Building clean PivotTable or SUMIFS summary tables before inserting charts.',
              body: 'Never build charts directly from dozens of unsorted raw transaction rows. Summarize your source data first using PivotTables or SUMIFS tables so each chart plots crisp, unambiguous totals.',
              example:
                'Monthly Procurement Report: Group the 36 transaction rows into a 6-row Jan–Jun summary table first, then plot that summary table as a clean Line Chart.',
            },
            {
              heading: 'Choosing the Right Chart Type',
              shortDescription: 'Matching Column, Bar, Line, Pie/Doughnut, and Combo charts to your business question.',
              body: 'Every chart type answers a specific analytical question cleanly.',
              table: {
                title: 'Chart Selection Cheat Sheet',
                subtitle: 'Choose the clearest chart type for workplace reporting and interviews.',
                columns: ['Business Question', 'Best Chart Type', 'Why It Works'],
                rows: [
                  ['How did spend change Jan–Jun?', 'Line Chart', 'Highlights chronological trend'],
                  ['Which department spent the most?', 'Column Chart', 'Clear vertical category comparison'],
                  ['Who are our top 5 suppliers?', 'Horizontal Bar Chart', 'Gives long supplier names room'],
                  ['What % share is each category?', 'Doughnut / Pie Chart', 'Shows proportional share (3–5 items max)'],
                  ['Spend (₹) vs PO Count by month', 'Combo Chart', 'Plots two scales on dual axes'],
                ],
              },
            },
            {
              heading: 'Formatting Chart Titles, Labels, Axes & Legends',
              shortDescription: 'Removing clutter and writing clear titles so executives grasp insights in seconds.',
              body: 'Clean formatting separates professional reports from messy defaults.',
              bullets: [
                'Replace generic "Chart Title" text with clear titles (e.g., "Monthly Procurement Spend — H1 2026").',
                'Remove redundant legends on single-series charts, heavy gridlines, and 3D effects that distort values.',
                'Add concise data labels and consistent currency formatting on axes.',
              ],
            },
            {
              heading: 'Designing Formula-Driven KPI Cards',
              shortDescription: 'Linking top-line executive metrics dynamically to live summary cells.',
              body: 'KPI (Key Performance Indicator) cards highlight your 3–4 most critical headline numbers across the top of a dashboard — always linked via formulas rather than typed manually.',
              formula: "=SUM('Purchase Data'!F2:F37)\n=COUNTA('Purchase Data'!A2:A37)\n=AVERAGE('Purchase Data'!F2:F37)\n=COUNTIF('Purchase Data'!G2:G37,\"Pending\")",
              example:
                'Top KPI Row: Total Purchase Value, Total POs, Average PO Value, and Pending Orders update automatically whenever new rows are entered.',
            },
            {
              heading: 'Structuring a Clean Dashboard Layout',
              shortDescription: 'Arranging KPI cards, aligned charts, whitespace, and hidden gridlines.',
              body: 'Place KPI cards across the top row, align 3–4 complementary charts in a clean 2x2 grid below, use 2–3 restrained brand colors, and hide worksheet gridlines (View -> Gridlines) for an executive finish.',
              commonMistake:
                'Cramming 8+ charts, bright rainbow colors, and decorative clipart onto one sheet makes key numbers harder to read.',
            },
            {
              heading: 'Connecting Interactive Slicers & PivotCharts',
              shortDescription: 'Allowing managers to filter an entire dashboard with one click.',
              body: 'Connect charts to PivotTables, insert Slicers for key filters (Department, Category, Status), and use Slicer -> Report Connections so one slicer click updates multiple charts and KPIs simultaneously.',
            },
            {
              heading: 'Presenting, Printing & Exporting Reports to PDF',
              shortDescription: 'Preparing dashboards to print cleanly on one landscape page for meetings.',
              body: 'Set Page Layout -> Orientation -> Landscape, set Fit to 1 Page Wide by 1 Page Tall, verify everything in Print Preview (Ctrl + P), and export as PDF when sharing read-only executive snapshots.',
            },
          ],
          examples: [],
        },
        exercise: {
          title: 'Practical Workplace Activity: Monthly Procurement Dashboard',
          instructions: [
            'Download ABHI-Excel-Module-10-Practice-Workbook.xlsx and review the 36 transactions on "Purchase Data" (Jan–Jun 2026).',
            '1. On "Dashboard Practice", enter live KPI formulas for Total Purchase Value (=SUM), Total Purchase Orders (=COUNTA), Average Purchase Value (=AVERAGE), and Pending Orders (=COUNTIF).',
            '2. Build SUMIFS summary tables (or PivotTables) for Monthly Trend, Department Spend, Supplier Spend, and Category Share.',
            '3. Insert 4 formatted Excel charts: Line Chart (Monthly Trend), Column Chart (Departments), Bar Chart (Suppliers), and Doughnut/Pie Chart (Categories).',
            '4. Align charts cleanly, hide gridlines, add clear titles and ₹ formatting, and cross-check every KPI and summary figure against "Completed Dashboard Reference".',
          ].join('\n'),
          deliverable:
            'Single-screen Monthly Procurement Dashboard with 4 live KPI cards and 4 formatted Excel charts.',
        },
        attachments: [
          {
            id: 'excel_m10_practice_workbook',
            title: 'ABHI-Excel-Module-10-Practice-Workbook.xlsx',
            url: '/api/learning/resources/excel-module-10-practice-workbook.xlsx',
            fileType: 'Workbook',
            sizeLabel:
              '4 Sheets (Instructions + Purchase Data + Dashboard Practice + Formula KPI & Summary Reference) · .xlsx',
          },
          {
            id: 'excel_m10_instruction_sheet',
            title: 'Module 10 Practical Activity — Dashboard Build Checklist',
            url: '',
            fileType: 'PDF',
            sizeLabel: 'Printable Dashboard Guide · PDF',
            worksheetContent: [
              'PRACTICAL ACTIVITY: MONTHLY PROCUREMENT DASHBOARD',
              'KPI 1 (Total Value):    =SUM(\'Purchase Data\'!F2:F37)',
              'KPI 2 (Total POs):      =COUNTA(\'Purchase Data\'!A2:A37)',
              'KPI 3 (Average Value):  =AVERAGE(\'Purchase Data\'!F2:F37)',
              'KPI 4 (Pending Orders): =COUNTIF(\'Purchase Data\'!G2:G37,"Pending")',
              'Charts to Insert in Excel: Line (Monthly), Column (Department), Bar (Supplier), Doughnut/Pie (Category).',
            ].join('\n'),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULE 11 — EXCEL FOR REAL JOBS & WORKPLACE TASKS
  // ==========================================================================
  {
    id: 'excel_m11_real_jobs_workplace',
    order: 11,
    title: 'Excel for Real Jobs & Workplace Tasks',
    level: 'Job-Ready',
    summary:
      'Teach students how Excel powers day-to-day roles in Procurement, Purchasing, HR, Finance, Sales, Inventory, and Operations through multi-sheet operational trackers.',
    estimatedMinutes: 75,
    learningObjectives: [
      'Build Procurement & Purchasing trackers (PO registers, supplier comparison, quotation analysis, delivery tracking).',
      'Design HR & Administration trackers (employee master, attendance, leave, joining/exit reports).',
      'Maintain Finance & Accounts sheets (expense trackers, invoice registers, payment status, monthly summaries).',
      'Track Sales performance (sales registers, target vs. achievement, monthly rep reports).',
      'Manage Inventory & Operations (stock registers, inward/outward movement, reorder-level & low-stock alerts).',
      'Combine master data, lookups, dropdowns, conditional formatting, and monthly summaries into audit-ready files.',
    ],
    quizPlanned: true,
    quizRequired: true,
    passPercentage: 70,
    lessons: [
      {
        id: 'excel_m11_lesson_01',
        courseId: 'excel_for_job_seekers',
        moduleId: 'excel_m11_real_jobs_workplace',
        order: 1,
        title: 'Module 11: Excel for Real Jobs & Workplace Tasks',
        description:
          'Apply Excel across Procurement, HR, Finance, Sales, and Inventory workflows by building an integrated 7-sheet Procurement Operations Workbook.',
        estimatedMinutes: 75,
        videoUrl: 'https://www.youtube.com/watch?v=IeDKwNeZ2Sg',
        videos: [
          {
            id: 'excel_m11_video_01',
            title: 'How to Make an Inventory Tracker in Excel | Beginner Tutorial',
            publisher: 'Excel Your Mind',
            youtubeVideoId: 'IeDKwNeZ2Sg',
            watchUrl: 'https://www.youtube.com/watch?v=IeDKwNeZ2Sg',
            embedUrl: 'https://www.youtube.com/embed/IeDKwNeZ2Sg',
            verificationStatus: 'verified',
            durationSeconds: 720,
            description:
              'Practical workplace build demonstrating how to construct an operational Excel tracker with stock movements, formulas, dropdowns, and low-stock status alerts.',
            order: 1,
          },
        ],
        writtenContent:
          'Hiring managers test whether you can organize real multi-tab workbooks cleanly. Learn the exact trackers used daily across Procurement, HR, Finance, Sales, and Inventory teams.',
        studyGuide: {
          title: 'Study Guide',
          subtitle:
            'These topics cover real job workflows across business departments from Module 11. Select any topic below to explore role examples and formulas.',
          sections: [
            {
              heading: 'Professional Workbook Structure & Master Data',
              shortDescription: 'Separating Master sheets, Transaction Registers, and Summary Reports cleanly.',
              body: 'Job-ready workbooks separate static Master Data (Supplier Master, Employee Master, Product Master) from daily Transaction Registers (PO Register, Attendance, Invoices) and Summary Reports. Updating a master detail once automatically refreshes every connected tab through lookup formulas.',
            },
            {
              heading: 'Procurement & Purchasing Workflows',
              shortDescription: 'PO registers, supplier quotation comparison, and delivery status tracking.',
              body: 'Purchase Executives and Buyers rely on structured multi-tab trackers to control spending and vendor timelines.',
              formula: '=IF(Actual="", "Pending", IF(Actual>Expected, "Delayed", "On Time"))',
              bullets: [
                'Supplier Master & Quotation Comparison (=MIN to identify the lowest compliant bid).',
                'Purchase Order Register with automatic Supplier lookups and Qty * Unit Price totals.',
                'Delivery Tracker flagging Pending and Delayed shipments automatically.',
              ],
            },
            {
              heading: 'HR & Administration Trackers',
              shortDescription: 'Employee masters, monthly attendance sheets, leave balances, and joining/exit logs.',
              body: 'HR teams track staff lifecycle and attendance cleanly using standardized sheets and conditional counts.',
              formula: '=COUNTIF(C2:AG2, "P")',
              bullets: [
                'Employee Master storing unique IDs, departments, roles, and joining dates.',
                'Attendance & Leave Trackers counting Present ("P"), Absent ("A"), and Leave ("L") days automatically.',
                'Monthly joining and exit headcount summaries for management.',
              ],
            },
            {
              heading: 'Finance & Accounts Sheets',
              shortDescription: 'Expense trackers, invoice registers, payment status, and overdue aging.',
              body: 'Accounts teams maintain clean audit trails of payables, due dates, and monthly department expenses.',
              formula: '=AND($F2="Pending", $D2<TODAY())',
              bullets: [
                'Invoice Register tracking Invoice No., Supplier, Due Date, Amount, and Payment Status.',
                'Overdue aging calculations (=TODAY()-DueDate) paired with red Conditional Formatting alerts.',
                'Monthly expense summaries by department using SUMIF or PivotTables.',
              ],
            },
            {
              heading: 'Sales Performance Trackers',
              shortDescription: 'Sales registers, target versus achievement percentages, and rep summaries.',
              body: 'Sales Coordinators track revenue against targets across teams and territories.',
              formula: '=Actual / Target   (formatted as Percentage)',
              bullets: [
                'Sales Register logging customer, salesperson, date, and order value.',
                'Target vs. Achievement percentage and IF-based target met flags.',
                'Monthly leaderboard sorted from highest to lowest achievement.',
              ],
            },
            {
              heading: 'Inventory & Operations Trackers',
              shortDescription: 'Stock registers, inward/outward movement, and low-stock reorder alerts.',
              body: 'Warehouse and operations teams track live inventory balances to prevent stockouts.',
              formula: '=Opening + Inward - Outward\n=IF(Closing <= ReorderLevel, "Reorder Now", "In Stock")',
              bullets: [
                'Closing Stock calculated dynamically from Opening, Inward, and Outward quantities.',
                'Automatic low-stock alerts when Closing Stock falls at or below Reorder Level.',
              ],
            },
            {
              heading: 'Combining Lookups, Validation, Alerts & Summaries',
              shortDescription: 'Connecting all Excel skills inside one multi-sheet operational system.',
              body: 'Real job tasks combine features together: Data Validation standardizes entries, VLOOKUP/XLOOKUP auto-fills master details, Conditional Formatting flags exceptions, and SUMIF/PivotTables summarize monthly KPIs.',
              table: {
                title: 'Signature Excel Workflows by Job Role',
                subtitle: 'Core sheets and formulas frequently tested in role-specific Excel assessments.',
                columns: ['Department / Role', 'Key Workbook', 'Signature Formula'],
                rows: [
                  ['Procurement Buyer', 'PO & Delivery Tracker', '=IF(Actual="","Pending",IF(Actual>Expected,"Delayed","On Time"))'],
                  ['HR Executive', 'Attendance & Leave Sheet', '=COUNTIF(C2:AG2,"P")'],
                  ['Accounts / Finance', 'Invoice Aging Register', '=AND($F2="Pending",$D2<TODAY())'],
                  ['Sales Coordinator', 'Target vs Achievement', '=Actual/Target (%)'],
                  ['Inventory / Ops', 'Stock & Reorder Register', '=IF(Closing<=ReorderLevel,"Reorder","In Stock")'],
                ],
              },
            },
            {
              heading: 'Accuracy Audits, File Naming & Workplace Best Practices',
              shortDescription: 'Reconciling totals, preventing hardcoded overrides, and naming shared files cleanly.',
              body: 'Professional spreadsheet habits protect your credibility on the job.',
              bullets: [
                'Reconcile PO register totals against Invoice and Summary totals before sending reports.',
                'Never hardcode manual numbers over formula cells; inspect formula ranges after adding rows.',
                'Use clear dated filenames (e.g., Procurement_Operations_2026_02.xlsx) and protect formula sheets before sharing.',
              ],
            },
          ],
          examples: [],
        },
        exercise: {
          title: 'Practical Workplace Activity: Complete Procurement Operations Workbook',
          instructions: [
            'Download ABHI-Excel-Module-11-Practice-Workbook.xlsx (7 integrated worksheets tailored for Purchase Executive, Procurement Buyer, and Operations roles).',
            '1. Review "Supplier Master", "Purchase Register" (live VLOOKUP + Qty*Price + status dropdowns), "Delivery Tracker" (On Time/Delayed IF logic + color alerts), and "Invoice Tracker" (overdue red highlight).',
            '2. Switch to "Monthly Summary" and enter the 5 required summary formulas in Column B (Total PO Value, Total PO Count, IT Department Spend, Delayed Deliveries, Pending Invoice Value).',
            '3. Test adding a new PO row in "Purchase Register" using Supplier ID SUP003 and verify that Supplier Name, Total Amount, and Monthly Summary recalculate automatically.',
            '4. Compare your completed summary figures against "Completed Reference".',
          ].join('\n'),
          deliverable:
            'Completed 7-sheet Procurement Operations Workbook with working cross-sheet lookups, dropdowns, alerts, and summary KPIs.',
        },
        attachments: [
          {
            id: 'excel_m11_practice_workbook',
            title: 'ABHI-Excel-Module-11-Practice-Workbook.xlsx',
            url: '/api/learning/resources/excel-module-11-practice-workbook.xlsx',
            fileType: 'Workbook',
            sizeLabel:
              '7 Sheets (Instructions + Supplier + PO + Delivery + Invoice + Summary + Reference) · .xlsx',
          },
          {
            id: 'excel_m11_instruction_sheet',
            title: 'Module 11 Practical Activity — Procurement Workbook Checklist',
            url: '',
            fileType: 'PDF',
            sizeLabel: 'Printable Role Guide · PDF',
            worksheetContent: [
              'PRACTICAL ACTIVITY: COMPLETE PROCUREMENT OPERATIONS WORKBOOK',
              'Formulas for "Monthly Summary":',
              'B3 (Total PO Value):        =SUM(\'Purchase Register\'!H2:H7)',
              'B4 (Total PO Count):        =COUNTA(\'Purchase Register\'!A2:A7)',
              'B5 (IT Department Spend):   =SUMIF(\'Purchase Register\'!E2:E7,"IT",\'Purchase Register\'!H2:H7)',
              'B6 (Delayed Deliveries):    =COUNTIF(\'Delivery Tracker\'!E2:E7,"Delayed")',
              'B7 (Pending Invoice Value): =SUMIF(\'Invoice Tracker\'!F2:F6,"Pending",\'Invoice Tracker\'!E2:E6)',
            ].join('\n'),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULE 12 — AI WITH EXCEL, AUTOMATION & FINAL PROJECT
  // ==========================================================================
  {
    id: 'excel_m12_ai_automation_project',
    order: 12,
    title: 'AI with Excel, Automation & Final Project',
    level: 'Advanced / Job-Ready',
    summary:
      'Introduce responsible AI-assisted Excel workflows, Macros & VBA basics, Power Query data automation, and a capstone Procurement Management & Reporting System project.',
    estimatedMinutes: 90,
    learningObjectives: [
      'Use AI responsibly to draft, explain, and troubleshoot Excel formulas without paying for subscriptions.',
      'Test and verify every AI-generated formula against known examples before using it in reports.',
      'Protect confidential company, supplier, and employee data when using AI tools.',
      'Understand Excel Macros and foundational VBA concepts for repetitive tasks.',
      'Use Power Query to import, clean, transform, combine, and refresh recurring datasets.',
      'Complete the capstone Final Project combining all skills from Modules 1–11.',
    ],
    quizPlanned: true,
    quizRequired: true,
    passPercentage: 70,
    lessons: [
      {
        id: 'excel_m12_lesson_01',
        courseId: 'excel_for_job_seekers',
        moduleId: 'excel_m12_ai_automation_project',
        order: 1,
        title: 'Module 12: AI with Excel, Automation & Final Project',
        description:
          'Learn Power Query automation, Macros & VBA essentials, responsible AI prompting for Excel, and build the capstone Complete Procurement Management and Reporting System.',
        estimatedMinutes: 90,
        videoUrl: 'https://www.youtube.com/watch?v=vq9AgAtSvQg',
        videos: [
          {
            id: 'excel_m12_video_01',
            title: 'Automate Data Tasks in Excel & Power BI',
            publisher: 'Excel Campus — Jon Acampora',
            youtubeVideoId: 'vq9AgAtSvQg',
            watchUrl: 'https://www.youtube.com/watch?v=vq9AgAtSvQg',
            embedUrl: 'https://www.youtube.com/embed/vq9AgAtSvQg',
            verificationStatus: 'verified',
            durationSeconds: 1140,
            description:
              'Practical guide to automating repetitive Excel data cleaning, reshaping, and reporting workflows using Power Query (How To Automate Data Tasks In Excel Using Power Query).',
            order: 1,
          },
        ],
        writtenContent:
          'Modern job seekers stand out by pairing strong Excel fundamentals with repeatable Power Query automation, basic Macro awareness, and disciplined, privacy-safe AI workflows.',
        studyGuide: {
          title: 'Study Guide',
          subtitle:
            'These topics cover AI-assisted workflows, Macros, Power Query, and the capstone project from Module 12. Select any topic below to view details.',
          sections: [
            {
              heading: 'AI-Assisted Excel Tasks & Effective Prompting',
              shortDescription: 'Using free AI assistants as a formula partner while staying in full control of accuracy.',
              body: 'AI tools help you draft formulas faster, understand unfamiliar syntax, and brainstorm cleaning steps — without needing a paid subscription. Always specify exact column letters and expected output when writing prompts.',
              example:
                'Clear Prompt: "Write an Excel formula that calculates net salary using Basic Salary in B2, Allowance in C2, and Deduction in D2." Always verify =B2+C2-D2 on known test rows.',
            },
            {
              heading: 'Generating, Explaining & Troubleshooting Formulas with AI',
              shortDescription: 'Asking AI to break down complex formulas step by step and diagnose #N/A or #VALUE! errors.',
              body: 'Beyond generating formulas, AI excels at explaining inherited spreadsheets and listing troubleshooting checks.',
              bullets: [
                'Explain Prompt: "Explain this formula step by step in simple language: =IFERROR(VLOOKUP(B2,\'Supplier Master\'!$A$2:$E$8,2,FALSE),\"Not Found\")."',
                'Debug Prompt: "Explain why my VLOOKUP returns #N/A and list checks for spaces, data types, and table ranges."',
              ],
              commonMistake:
                'Copying an AI-generated formula into a live report without testing it on known examples first — AI can invent wrong ranges or mismatched arguments.',
            },
            {
              heading: 'AI-Assisted Sample Data, Cleaning & Data Analysis',
              shortDescription: 'Creating safe practice tables, planning cleaning steps, and interpreting summarized KPIs.',
              body: 'Ask AI to generate realistic dummy tables (fake suppliers, sample POs) so you can practice PivotTables or cleaning formulas without touching confidential files. You can also share anonymized summary metrics to brainstorm trend questions.',
            },
            {
              heading: 'Excel Macros & VBA Basics',
              shortDescription: 'Recording repetitive formatting steps and understanding safe macro practices.',
              body: 'An Excel Macro is a recorded or programmed sequence of actions that automates repetitive tasks. Macros are stored as VBA (Visual Basic for Applications) code behind the workbook.',
              bullets: [
                'Record a Macro: View -> Macros -> Record Macro -> perform steps -> Stop Recording.',
                'Macro-enabled workbooks must be saved as .xlsm (Excel Macro-Enabled Workbook).',
                'Security rule: Never enable macros inside files received from untrusted senders.',
              ],
            },
            {
              heading: 'Power Query Fundamentals (Import, Transform & Refresh)',
              shortDescription: 'Using Excel’s built-in no-code engine to clean and reshape recurring datasets.',
              body: 'Power Query (Data -> Get & Transform Data) records every data-cleaning step — removing unused columns, trimming text, fixing data types, splitting columns, and combining CSV files — into a repeatable pipeline.',
              bullets: [
                'Import from Excel tables, CSVs, or entire folders of monthly files.',
                'Every edit is saved in Applied Steps so you never repeat manual cleaning next month.',
                'Click Data -> Refresh All to rerun the entire transformation automatically when new files arrive.',
              ],
            },
            {
              heading: 'Automating Repeatable Workplace Workflows',
              shortDescription: 'Choosing between formulas, Power Query, and Macros for recurring weekly/monthly tasks.',
              body: 'Match the right automation tool to the job:',
              bullets: [
                'Use Excel Tables + Formulas for dynamic row calculations and KPI cards.',
                'Use Power Query for repeatable data imports, cleaning, and combining monthly CSVs.',
                'Use recorded Macros for repeatable formatting or print-layout routines.',
              ],
            },
            {
              heading: 'Responsible AI Privacy & Final Project Workflow',
              shortDescription: 'Protecting confidential company data and building the 12-part capstone procurement system.',
              body: 'Never paste confidential financials, supplier contracts, salaries, or employee personal details into unauthorized public AI tools — always anonymize headers and use dummy numbers. Combine every skill from Modules 1–11 to complete your capstone workbook.',
              table: {
                title: '12-Part Final Project Architecture',
                subtitle: 'Complete Procurement Management and Reporting System (Modules 1–12 Capstone).',
                columns: ['Component', 'Skills Applied', 'Verification Check'],
                rows: [
                  ['Supplier & Buyer Masters', 'Clean formatting, unique IDs', 'Zero duplicates or extra spaces'],
                  ['PR & PO Registers', 'Formulas, Data Validation', 'Line Total = Quantity * Unit Price'],
                  ['Supplier Lookup', 'VLOOKUP + IFERROR / XLOOKUP', 'Auto-fills Supplier Name cleanly'],
                  ['Automated Classification', 'IF (>50000 High Value)', 'Flags high-value approvals'],
                  ['Delivery & Invoice Alerts', 'Conditional Formatting + TODAY()', 'Highlights overdue pending items'],
                  ['KPIs, PivotTables & Dashboard', 'SUM/AVG/COUNTIF/SUMIF + Charts', 'Matches Completed Reference'],
                ],
              },
            },
          ],
          examples: [],
        },
        exercise: {
          title: 'Final Project: Complete Procurement Management and Reporting System',
          instructions: [
            'Download ABHI-Excel-Module-12-Practice-Workbook.xlsx (no paid AI subscription required).',
            '1. Read all 12 items on the "Project Instructions" evaluation checklist and inspect "Sample Data" (Supplier Master + 10 Procurement Transactions).',
            '2. Open "Blank Student Project" and implement: (a) Supplier Name VLOOKUP/XLOOKUP, (b) Total Amount (=E3*F3), (c) Automated Value Tier (=IF(G3>50000,"High Value","Standard")), and (d) all 5 Executive KPI formulas in B15:B19.',
            '3. Apply Conditional Formatting rules to flag High Value tiers and Overdue Pending orders (=AND($J3="Pending",$I3<TODAY())).',
            '4. Insert PivotTables and Dashboard Charts from your completed register in Microsoft Excel, and optionally load "Sample Data" into Power Query (Data -> From Table/Range) to practice Refresh All.',
            '5. Audit every calculation against "Completed Reference Project", then pass the Module 12 Quiz (70%+) to complete Excel for Job Seekers!',
          ].join('\n'),
          deliverable:
            'Portfolio-ready Complete Procurement Management and Reporting System workbook passing all 12 checklist criteria.',
        },
        attachments: [
          {
            id: 'excel_m12_practice_workbook',
            title: 'ABHI-Excel-Module-12-Practice-Workbook.xlsx',
            url: '/api/learning/resources/excel-module-12-practice-workbook.xlsx',
            fileType: 'Workbook',
            sizeLabel:
              '4 Sheets (Project Instructions + Sample Data + Blank Student Project + Completed Reference Project) · .xlsx',
          },
          {
            id: 'excel_m12_instruction_sheet',
            title: 'Module 12 Final Project — Evaluation Checklist & AI Prompt Guide',
            url: '',
            fileType: 'PDF',
            sizeLabel: 'Printable Project Guide · PDF',
            worksheetContent: [
              'FINAL PROJECT: COMPLETE PROCUREMENT MANAGEMENT AND REPORTING SYSTEM',
              'Key Formulas on "Blank Student Project":',
              'C3 (Supplier Lookup): =IFERROR(VLOOKUP(B3,\'Sample Data\'!$A$3:$E$8,2,FALSE),"Not Found")',
              'G3 (Total Amount):    =E3*F3',
              'H3 (Value Tier):      =IF(G3>50000,"High Value","Standard")',
              'B15 (Total Spend):    =SUM(G3:G12)',
              'B16 (Average PO):     =AVERAGE(G3:G12)',
              'B17 (Completed POs):  =COUNTIF(J3:J12,"Completed")',
              'B18 (Pending Spend):  =SUMIF(J3:J12,"Pending",G3:G12)',
              'B19 (High Value POs): =COUNTIF(H3:H12,"High Value")',
              '',
              'Responsible AI Rule: Never share real confidential supplier or employee data with external AI tools; always verify formulas against known rows.',
            ].join('\n'),
          },
        ],
      },
    ],
  },
];
