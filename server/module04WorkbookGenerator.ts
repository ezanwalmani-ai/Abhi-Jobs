/**
 * SERVER-ONLY Practice Excel Workbook Generator for Learn with ABHI
 * Course: Excel for Job Seekers — Module 04: Essential Excel Functions
 *
 * Generates a valid `.xlsx` workbook containing 4 worksheets:
 * 1. Instructions (step-by-step student checklist, exact formulas & target cells)
 * 2. Purchase Data (clean 8-row sample purchase dataset)
 * 3. Function Practice (student exercise sheet with blank formula cells F2:F9 & B13:B19)
 * 4. Completed Answer Sheet (verified live Excel formulas & cached numeric/text results)
 *
 * Openable in Microsoft Excel, Excel for the Web, Google Sheets, or LibreOffice Calc.
 */

import * as XLSX from 'xlsx';

let cachedWorkbookBuffer: Buffer | null = null;

const PURCHASE_HEADERS = ['Purchase ID', 'Department', 'Supplier', 'Purchase Amount', 'Status'];

const PURCHASE_ROWS: [string, string, string, number, string][] = [
  ['PO001', 'IT', 'ABC Technologies', 45000, 'Completed'],
  ['PO002', 'HR', 'Office Supplies Co.', 12000, 'Pending'],
  ['PO003', 'IT', 'Tech Solutions', 65000, 'Completed'],
  ['PO004', 'Finance', 'Paper World', 8000, 'Completed'],
  ['PO005', 'HR', 'Office Supplies Co.', 15000, 'Pending'],
  ['PO006', 'IT', 'Global Computers', 38000, 'Pending'],
  ['PO007', 'Finance', 'Paper World', 10000, 'Completed'],
  ['PO008', 'IT', 'ABC Technologies', 52000, 'Completed'],
];

export function getModule04PracticeWorkbookBuffer(): Buffer {
  if (cachedWorkbookBuffer) {
    return cachedWorkbookBuffer;
  }

  const wb = XLSX.utils.book_new();

  // ---------------------------------------------------------------------------
  // Sheet 1: Instructions
  // ---------------------------------------------------------------------------
  const instructionsRows = [
    ['LEARN WITH ABHI — EXCEL FOR JOB SEEKERS (MODULE 04 PRACTICE WORKBOOK)'],
    ['Activity Title:', 'Purchase and Expense Report Using Excel Functions'],
    ['Free Tools Supported:', 'Microsoft Excel, Excel for the Web (free), Google Sheets, or LibreOffice Calc'],
    [''],
    ['WORKBOOK STRUCTURE'],
    ['Sheet Name', 'Purpose'],
    ['Instructions', 'Step-by-step instructions, exact formulas, and target cells for every calculation.'],
    ['Purchase Data', 'Clean 8-row reference dataset (PO001 to PO008) across IT, HR, and Finance.'],
    ['Function Practice', 'Your student exercise sheet with blank cells (F2:F9 and B13:B19) for entering live Excel functions.'],
    ['Completed Answer Sheet', 'Finished solution sheet with working formulas and expected answers — check only after trying yourself!'],
    [''],
    ['STEP-BY-STEP FORMULA GUIDE (ENTER ON THE "Function Practice" SHEET)'],
    ['Task #', 'Calculation Goal', 'Target Cell', 'Exact Formula to Enter'],
    ['1', 'Total purchase amount (SUM)', 'B13', '=SUM(D2:D9)'],
    ['2', 'Average purchase amount (AVERAGE)', 'B14', '=AVERAGE(D2:D9)'],
    ['3', 'Highest purchase amount (MAX)', 'B15', '=MAX(D2:D9)'],
    ['4', 'Lowest purchase amount (MIN)', 'B16', '=MIN(D2:D9)'],
    ['5', 'Number of purchase records (COUNTA)', 'B17', '=COUNTA(A2:A9)'],
    ['6', 'Number of completed purchases (COUNTIF)', 'B18', '=COUNTIF(E2:E9,"Completed")'],
    ['7', 'Total IT purchases (SUMIF)', 'B19', '=SUMIF(B2:B9,"IT",D2:D9)'],
    ['8', 'Classify purchases over ₹40,000 as High Value, else Standard Value (IF)', 'F2 (copy down to F9)', '=IF(D2>40000,"High Value","Standard Value")'],
    [''],
    ['COMMON FUNCTION TIPS'],
    ['•', 'Always wrap text criteria (such as "Completed", "IT", "High Value") inside double quotation marks.'],
    ['•', 'Do NOT type currency symbols manually inside Purchase Amount cells — enter pure numbers and apply ₹ Currency format.'],
    ['•', 'After entering all 8 formulas on "Function Practice", verify your numbers against "Completed Answer Sheet".'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsRows);
  wsInstructions['!cols'] = [{ wch: 24 }, { wch: 48 }, { wch: 24 }, { wch: 46 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // ---------------------------------------------------------------------------
  // Sheet 2: Purchase Data (Clean Sample Data)
  // ---------------------------------------------------------------------------
  const dataSheetRows: (string | number)[][] = [PURCHASE_HEADERS, ...PURCHASE_ROWS];
  const wsData = XLSX.utils.aoa_to_sheet(dataSheetRows);
  for (let row = 2; row <= 9; row++) {
    const amtCell = wsData[`D${row}`];
    if (amtCell) amtCell.z = '₹#,##0';
  }
  wsData['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsData, 'Purchase Data');

  // ---------------------------------------------------------------------------
  // Sheet 3: Function Practice (Student Exercise Sheet — Blank Formula Cells)
  // ---------------------------------------------------------------------------
  const practiceRows: (string | number)[][] = [
    [...PURCHASE_HEADERS, 'Value Classification'],
    ...PURCHASE_ROWS.map((r) => [...r, '']),
    [''],
    ['PURCHASE SUMMARY CALCULATIONS — ENTER FORMULAS IN COLUMN B'],
    ['Metric', 'Your Formula Result', 'Function Required'],
    ['Total Purchase Amount', '', 'Use SUM on D2:D9'],
    ['Average Purchase Amount', '', 'Use AVERAGE on D2:D9'],
    ['Highest Purchase Amount', '', 'Use MAX on D2:D9'],
    ['Lowest Purchase Amount', '', 'Use MIN on D2:D9'],
    ['Number of Purchase Records', '', 'Use COUNTA on A2:A9'],
    ['Number of Completed Purchases', '', 'Use COUNTIF on E2:E9 for "Completed"'],
    ['Total IT Purchases', '', 'Use SUMIF on B2:B9 ("IT") and D2:D9'],
  ];

  const wsPractice = XLSX.utils.aoa_to_sheet(practiceRows);
  for (let row = 2; row <= 9; row++) {
    const amtCell = wsPractice[`D${row}`];
    if (amtCell) amtCell.z = '₹#,##0';
    // Keep student IF formula cells genuinely blank
    delete wsPractice[`F${row}`];
  }
  // Keep student KPI formula cells genuinely blank (B13:B19)
  for (let row = 13; row <= 19; row++) {
    delete wsPractice[`B${row}`];
  }
  wsPractice['!ref'] = 'A1:F19';
  wsPractice['!cols'] = [
    { wch: 30 },
    { wch: 22 },
    { wch: 38 },
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPractice, 'Function Practice');

  // ---------------------------------------------------------------------------
  // Sheet 4: Completed Answer Sheet (Live Excel Formulas + Cached Values)
  // ---------------------------------------------------------------------------
  const answerRows: (string | number)[][] = [
    [...PURCHASE_HEADERS, 'Value Classification'],
    ...PURCHASE_ROWS.map((r) => [...r, r[3] > 40000 ? 'High Value' : 'Standard Value']),
    [''],
    ['COMPLETED PURCHASE SUMMARY (WITH LIVE EXCEL FORMULAS)'],
    ['Metric', 'Calculated Result', 'Formula Used'],
    ['Total Purchase Amount', 245000, '=SUM(D2:D9)'],
    ['Average Purchase Amount', 30625, '=AVERAGE(D2:D9)'],
    ['Highest Purchase Amount', 65000, '=MAX(D2:D9)'],
    ['Lowest Purchase Amount', 8000, '=MIN(D2:D9)'],
    ['Number of Purchase Records', 8, '=COUNTA(A2:A9)'],
    ['Number of Completed Purchases', 5, '=COUNTIF(E2:E9,"Completed")'],
    ['Total IT Purchases', 200000, '=SUMIF(B2:B9,"IT",D2:D9)'],
  ];

  const wsAnswer = XLSX.utils.aoa_to_sheet(answerRows);

  for (let row = 2; row <= 9; row++) {
    const amtCell = wsAnswer[`D${row}`];
    if (amtCell) amtCell.z = '₹#,##0';
    const isHigh = PURCHASE_ROWS[row - 2][3] > 40000;
    wsAnswer[`F${row}`] = {
      t: 's',
      f: `IF(D${row}>40000,"High Value","Standard Value")`,
      v: isHigh ? 'High Value' : 'Standard Value',
    };
  }

  const summaryFormulas: Array<{ cell: string; formula: string; value: number; format: string }> = [
    { cell: 'B13', formula: 'SUM(D2:D9)', value: 245000, format: '₹#,##0' },
    { cell: 'B14', formula: 'AVERAGE(D2:D9)', value: 30625, format: '₹#,##0' },
    { cell: 'B15', formula: 'MAX(D2:D9)', value: 65000, format: '₹#,##0' },
    { cell: 'B16', formula: 'MIN(D2:D9)', value: 8000, format: '₹#,##0' },
    { cell: 'B17', formula: 'COUNTA(A2:A9)', value: 8, format: '#,##0' },
    { cell: 'B18', formula: 'COUNTIF(E2:E9,"Completed")', value: 5, format: '#,##0' },
    { cell: 'B19', formula: 'SUMIF(B2:B9,"IT",D2:D9)', value: 200000, format: '₹#,##0' },
  ];

  for (const item of summaryFormulas) {
    wsAnswer[item.cell] = {
      t: 'n',
      f: item.formula,
      v: item.value,
      z: item.format,
    };
  }

  wsAnswer['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 34 },
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAnswer, 'Completed Answer Sheet');

  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  cachedWorkbookBuffer = out;
  return out;
}
