/**
 * SERVER-ONLY Practice Excel Workbook Generator for Learn with ABHI
 * Course: Excel for Job Seekers — Module 03: Formula Fundamentals & Cell References
 *
 * Generates a valid `.xlsx` workbook containing:
 * 1. Instructions (step-by-step student checklist & formula tips)
 * 2. Employee Salary (student practice sheet with sample data & blank formula cells)
 * 3. Answer Reference (separated completed sheet with live Excel formulas & cached results)
 *
 * Openable in Microsoft Excel, Excel for the Web, Google Sheets, or LibreOffice Calc.
 */

import * as XLSX from 'xlsx';

let cachedWorkbookBuffer: Buffer | null = null;

export function getModule03PracticeWorkbookBuffer(): Buffer {
  if (cachedWorkbookBuffer) {
    return cachedWorkbookBuffer;
  }

  const wb = XLSX.utils.book_new();

  // ---------------------------------------------------------------------------
  // Sheet 1: Instructions
  // ---------------------------------------------------------------------------
  const instructionsRows = [
    ['LEARN WITH ABHI — EXCEL FOR JOB SEEKERS (MODULE 03 PRACTICE WORKBOOK)'],
    ['Activity Title:', 'Calculate Employee Salaries and Monthly Expenses'],
    ['Free Tools Supported:', 'Microsoft Excel, Excel for the Web (free), Google Sheets, or LibreOffice Calc'],
    [''],
    ['STEP-BY-STEP PRACTICAL ACTIVITY INSTRUCTIONS'],
    ['Step', 'Task', 'What to Do'],
    [
      '1',
      'Review Employee Salary Data',
      'Open the "Employee Salary" worksheet. Inspect the 5 employees (Rahul, Priya, Ahmed, Sneha, Arjun) along with their Basic Salary (Column B), Allowance (Column C), and Deduction (Column D).',
    ],
    [
      '2',
      'Write Your First Net Salary Formula',
      'Click cell E2 (Net Salary for Rahul). Type =B2+C2-D2 and press Enter. Always start formulas with the equals sign (=).',
    ],
    [
      '3',
      'Copy the Formula Down Using Relative References',
      'Select cell E2 and drag or double-click the fill handle (small square at the bottom-right corner of E2) down to cell E6. Observe how Excel automatically updates the row numbers (=B3+C3-D3 through =B6+C6-D6).',
    ],
    [
      '4',
      'Calculate Total Net Salary',
      'Click cell E7 (Total Net Salary row) and calculate the total using =E2+E3+E4+E5+E6 (or =SUM(E2:E6)). Optionally also total Basic Salary (B7), Allowance (C7), and Deduction (D7).',
    ],
    [
      '5',
      'Format Salary Columns Clearly',
      'Select cells B2:E7 and apply Currency or Number formatting with thousand separators so salary figures are easy to read.',
    ],
    [
      '6',
      'Verify All Calculations',
      'Double-click a few formula cells to verify the referenced cells, confirm there are no #VALUE!, #NAME?, #REF!, or #DIV/0! errors, and compare your completed sheet against the separated "Answer Reference" tab.',
    ],
    [''],
    ['FORMULA TIPS FOR BEGINNERS'],
    ['•', 'Formula Rule: Net Salary = Basic Salary + Allowance - Deduction (e.g., =B2+C2-D2).'],
    ['•', 'Parentheses: Use parentheses when mixing addition/subtraction with multiplication/division — e.g., =(10+5)*2 equals 30, whereas =10+5*2 equals 20.'],
    ['•', 'Reference Locking: Press F4 while editing a cell reference in Excel to cycle through A1, $A$1, A$1, and $A1.'],
    ['•', 'Answer Sheet: Try completing the entire "Employee Salary" tab first before checking the "Answer Reference" tab.'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsRows);
  wsInstructions['!cols'] = [{ wch: 10 }, { wch: 34 }, { wch: 92 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // ---------------------------------------------------------------------------
  // Sheet 2: Employee Salary (Student Practice Worksheet — Blank Formula Cells)
  // ---------------------------------------------------------------------------
  const practiceRows: (string | number)[][] = [
    ['Employee Name', 'Basic Salary', 'Allowance', 'Deduction', 'Net Salary'],
    ['Rahul', 25000, 5000, 2000, ''],
    ['Priya', 30000, 6000, 2500, ''],
    ['Ahmed', 22000, 4000, 1500, ''],
    ['Sneha', 28000, 5000, 2000, ''],
    ['Arjun', 35000, 7000, 3000, ''],
    ['Total', '', '', '', ''],
  ];

  const wsPractice = XLSX.utils.aoa_to_sheet(practiceRows);
  // Keep formula practice cells genuinely blank (remove empty-string placeholders)
  for (const addr of ['E2', 'E3', 'E4', 'E5', 'E6', 'B7', 'C7', 'D7', 'E7']) {
    delete wsPractice[addr];
  }
  wsPractice['!ref'] = 'A1:E7';
  wsPractice['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPractice, 'Employee Salary');

  // ---------------------------------------------------------------------------
  // Sheet 3: Answer Reference (Separated Completed Sheet with Live Formulas)
  // ---------------------------------------------------------------------------
  const referenceRows: (string | number)[][] = [
    ['Employee Name', 'Basic Salary', 'Allowance', 'Deduction', 'Net Salary'],
    ['Rahul', 25000, 5000, 2000, 28000],
    ['Priya', 30000, 6000, 2500, 33500],
    ['Ahmed', 22000, 4000, 1500, 24500],
    ['Sneha', 28000, 5000, 2000, 31000],
    ['Arjun', 35000, 7000, 3000, 39000],
    ['Total', 140000, 27000, 11000, 156000],
  ];

  const wsReference = XLSX.utils.aoa_to_sheet(referenceRows);

  // Attach real Excel formulas with cached numeric values & number formats
  const netSalaryFormulas: Array<{ cell: string; formula: string; value: number }> = [
    { cell: 'E2', formula: 'B2+C2-D2', value: 28000 },
    { cell: 'E3', formula: 'B3+C3-D3', value: 33500 },
    { cell: 'E4', formula: 'B4+C4-D4', value: 24500 },
    { cell: 'E5', formula: 'B5+C5-D5', value: 31000 },
    { cell: 'E6', formula: 'B6+C6-D6', value: 39000 },
    { cell: 'B7', formula: 'SUM(B2:B6)', value: 140000 },
    { cell: 'C7', formula: 'SUM(C2:C6)', value: 27000 },
    { cell: 'D7', formula: 'SUM(D2:D6)', value: 11000 },
    { cell: 'E7', formula: 'SUM(E2:E6)', value: 156000 },
  ];

  for (const item of netSalaryFormulas) {
    wsReference[item.cell] = {
      t: 'n',
      f: item.formula,
      v: item.value,
      z: '#,##0',
    };
  }

  for (let row = 2; row <= 6; row++) {
    for (const col of ['B', 'C', 'D']) {
      const cell = wsReference[`${col}${row}`];
      if (cell) {
        cell.z = '#,##0';
      }
    }
  }

  wsReference['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsReference, 'Answer Reference');

  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  cachedWorkbookBuffer = out;
  return out;
}
