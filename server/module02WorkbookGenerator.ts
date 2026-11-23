/**
 * SERVER-ONLY Practice Excel Workbook Generator for Learn with ABHI
 * Course: Excel for Job Seekers — Module 02: Data Entry, Formatting & Worksheets
 *
 * Generates a valid `.xlsx` workbook containing:
 * 1. Instructions (separate instruction sheet with checklist & formatting goals)
 * 2. Employee Details (sample workplace employee records)
 * 3. Department List (sample company departments & managers)
 * 4. Monthly Expenses (sample monthly workplace expense records)
 *
 * Openable in Microsoft Excel, Excel for the Web, Google Sheets, or LibreOffice Calc.
 */

import * as XLSX from 'xlsx';

let cachedWorkbookBuffer: Buffer | null = null;

export function getModule02PracticeWorkbookBuffer(): Buffer {
  if (cachedWorkbookBuffer) {
    return cachedWorkbookBuffer;
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: Separate Instruction Sheet
  const instructionsRows = [
    ['LEARN WITH ABHI — EXCEL FOR JOB SEEKERS (MODULE 02 PRACTICE WORKBOOK)'],
    ['Activity Title:', 'Build a Professional Employee Information Workbook'],
    ['Free Tools Supported:', 'Microsoft Excel, Excel for the Web (free), Google Sheets, or LibreOffice Calc'],
    [''],
    ['STEP-BY-STEP PRACTICAL ACTIVITY CHECKLIST'],
    ['Step', 'Task', 'What to Do'],
    [
      '1',
      'Review & Enter Supplied Sample Data',
      'Inspect the three data worksheets (Employee Details, Department List, Monthly Expenses). Add at least 2 extra rows of your own realistic sample records to each worksheet.',
    ],
    [
      '2',
      'Format Headings Professionally',
      'Select Row 1 on each worksheet. Apply Bold formatting, increase font size to 11-12pt, center or align headers cleanly, and apply a dark navy or teal fill with white font color.',
    ],
    [
      '3',
      'Apply Borders and Suitable Colors',
      'Select each full data table and apply All Borders. Optionally apply soft light-gray or light-blue alternating shading for readability.',
    ],
    [
      '4',
      'Format Dates and Currency Correctly',
      'In Employee Details, format Joining Date as Date (e.g. DD-MMM-YYYY) and Monthly Salary as Currency with 2 decimal places. In Monthly Expenses, format Expense Date as Date and Amount as Currency.',
    ],
    [
      '5',
      'Adjust Row Heights & Column Widths',
      'Use AutoFit (double-click column header borders) so no text is cut off and no ### errors appear. Increase Row 1 height to 24-26pt for breathing room. Use Wrap Text on long descriptions.',
    ],
    [
      '6',
      'Verify & Rename Worksheets + Tab Colors',
      'Confirm the three data worksheets are cleanly named: Employee Details, Department List, and Monthly Expenses. Right-click each worksheet tab and assign distinct tab colors.',
    ],
    [
      '7',
      'Freeze the Heading Row',
      'On each data worksheet, go to View -> Freeze Panes -> Freeze Top Row so Row 1 stays visible when scrolling down.',
    ],
    [
      '8',
      'Print Preview & Save Workbook',
      'Open Print Preview (Ctrl + P), switch Page Orientation to Landscape, set Fit All Columns on One Page, and save your workbook as an .xlsx file (Ctrl + S).',
    ],
    [''],
    ['COMMON BEGINNER MISTAKES TO AVOID'],
    ['•', 'Do NOT use Merge & Center inside data table rows or headers — it breaks sorting and formulas.'],
    ['•', 'Do NOT type currency symbols manually into number cells (e.g. type 6500, then apply Currency format).'],
    ['•', 'Always save working files as .xlsx (not .csv) so multiple worksheets, formatting, and frozen panes are preserved.'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsRows);
  wsInstructions['!cols'] = [{ wch: 10 }, { wch: 34 }, { wch: 88 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Sheet 2: Employee Details
  const employeeRows = [
    ['Employee ID', 'Employee Name', 'Department', 'Job Title', 'Joining Date', 'Monthly Salary'],
    ['EMP-101', 'Aarav Nair', 'Operations', 'Operations Coordinator', '2024-02-12', 6800],
    ['EMP-102', 'Meera Menon', 'Human Resources', 'HR Executive', '2024-04-01', 7200],
    ['EMP-103', 'Rohan Kapoor', 'Procurement', 'Junior Buyer', '2024-06-18', 6500],
    ['EMP-104', 'Fatima Al-Mansoor', 'Accounts & Finance', 'Accounts Payable Officer', '2024-09-05', 8400],
    ['EMP-105', 'Daniel Fernandes', 'Sales', 'Sales Support Associate', '2025-01-15', 6200],
    ['EMP-106', 'Nadia Haddad', 'Operations', 'Inventory Specialist', '2025-03-10', 7100],
  ];

  const wsEmployees = XLSX.utils.aoa_to_sheet(employeeRows);
  wsEmployees['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 20 },
    { wch: 26 },
    { wch: 15 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsEmployees, 'Employee Details');

  // Sheet 3: Department List
  const departmentRows = [
    ['Department ID', 'Department Name', 'Department Manager'],
    ['DEPT-01', 'Operations', 'Khalid Al-Suwaidi'],
    ['DEPT-02', 'Human Resources', 'Priya Sharma'],
    ['DEPT-03', 'Procurement', 'Tariq Mahmood'],
    ['DEPT-04', 'Accounts & Finance', 'Lina George'],
    ['DEPT-05', 'Sales', 'Omar Al-Rashid'],
  ];

  const wsDepartments = XLSX.utils.aoa_to_sheet(departmentRows);
  wsDepartments['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsDepartments, 'Department List');

  // Sheet 4: Monthly Expenses
  const expenseRows = [
    ['Expense ID', 'Expense Category', 'Expense Date', 'Amount', 'Payment Status'],
    ['EXP-201', 'Office Stationery & Supplies', '2026-03-02', 1450.5, 'Paid'],
    ['EXP-202', 'Cloud Software Subscriptions', '2026-03-05', 3200.0, 'Paid'],
    ['EXP-203', 'Warehouse Packaging Stock', '2026-03-09', 4850.0, 'Pending'],
    ['EXP-204', 'Staff Training & Workshops', '2026-03-14', 2750.0, 'Paid'],
    ['EXP-205', 'Courier & Local Delivery', '2026-03-19', 980.25, 'Approved'],
    ['EXP-206', 'IT Equipment Maintenance', '2026-03-24', 1890.0, 'Pending'],
  ];

  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows);
  wsExpenses['!cols'] = [
    { wch: 14 },
    { wch: 30 },
    { wch: 15 },
    { wch: 14 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Monthly Expenses');

  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  cachedWorkbookBuffer = out;
  return out;
}
