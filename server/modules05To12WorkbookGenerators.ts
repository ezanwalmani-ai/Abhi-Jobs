/**
 * SERVER-ONLY Practice Excel Workbook Generators for Learn with ABHI
 * Course: Excel for Job Seekers — Modules 05 through 12
 *
 * Uses ExcelJS to build standards-compliant `.xlsx` workbooks featuring:
 * - Styled corporate headers, Freeze Panes, readable column widths, and ₹ currency/date formats
 * - Live Excel formulas with cached calculated results
 * - Native Excel Tables & Total Rows (Module 6)
 * - Native Data Validation dropdown lists & positive-number restrictions (Modules 6, 11, 12)
 * - Native Conditional Formatting rules (cellIs, duplicateValues, colorScale, dataBar, formula expressions)
 * - Clear Instructions sheets documenting interactive Microsoft Excel steps (PivotTables, Slicers, Charts)
 */

import ExcelJS from 'exceljs';

const NAVY_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF102B4E' },
};

const SUBHEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF1F5FA' },
};

const ACCENT_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFF4EC' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  size: 13,
  bold: true,
  color: { argb: 'FF102B4E' },
};

const SECTION_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FF102B4E' },
};

const INR_FMT = '₹#,##0';

function styleHeaderRow(ws: ExcelJS.Worksheet, rowIndex: number, colCount: number): void {
  const row = ws.getRow(rowIndex);
  row.height = 24;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = NAVY_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  }
}

function setColWidths(ws: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

function addInstructionBlock(
  ws: ExcelJS.Worksheet,
  title: string,
  rows: (string | number)[][]
): void {
  ws.addRow([title]);
  ws.getRow(1).font = TITLE_FONT;
  ws.getRow(1).height = 26;
  rows.forEach((r) => ws.addRow(r));
  ws.eachRow((row, idx) => {
    if (idx > 1) {
      row.alignment = { vertical: 'top', wrapText: true };
      const firstVal = String(row.getCell(1).value ?? '');
      if (firstVal === firstVal.toUpperCase() && firstVal.length > 4 && !firstVal.startsWith('•')) {
        row.font = SECTION_FONT;
      }
    }
  });
}

async function toBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const arrayBuf = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuf);
}

const cache = new Map<number, Buffer>();

// ============================================================================
// MODULE 05 — VLOOKUP, XLOOKUP & Lookup Skills
// ============================================================================
const M05_SUPPLIERS: [string, string, string, string, string][] = [
  ['SUP001', 'ABC Technologies', 'Pune', 'IT', '30 Days'],
  ['SUP002', 'Global Supplies', 'Mumbai', 'Office Supplies', '15 Days'],
  ['SUP003', 'Tech Solutions', 'Bengaluru', 'IT', '45 Days'],
  ['SUP004', 'Paper World', 'Hyderabad', 'Stationery', '30 Days'],
  ['SUP005', 'Office Mart', 'Pune', 'Office Supplies', '15 Days'],
  ['SUP006', 'Metro Systems', 'Chennai', 'IT', '30 Days'],
  ['SUP007', 'Prime Stationers', 'Mumbai', 'Stationery', '15 Days'],
];

const M05_PURCHASES: [string, string][] = [
  ['PO001', 'SUP003'],
  ['PO002', 'SUP001'],
  ['PO003', 'SUP005'],
  ['PO004', 'SUP007'],
  ['PO005', 'SUP002'],
  ['PO006', 'SUP999'],
];

export async function getModule05PracticeWorkbookBuffer(): Promise<Buffer> {
  const hit = cache.get(5);
  if (hit) return hit;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Learn with ABHI';
  wb.created = new Date();

  // 1. Instructions
  const wsInst = wb.addWorksheet('Instructions');
  addInstructionBlock(wsInst, 'LEARN WITH ABHI — MODULE 05: VLOOKUP, XLOOKUP & LOOKUP SKILLS', [
    ['Activity Title:', 'Supplier and Purchase Order Lookup System'],
    ['Tools Supported:', 'Microsoft Excel (365 / 2021+ for XLOOKUP), Excel for the Web, Google Sheets, LibreOffice Calc'],
    [''],
    ['WORKBOOK SHEETS'],
    ['Instructions', 'Step-by-step lookup tasks and exact formula syntax.'],
    ['Supplier Master', '7 master supplier records (SUP001 to SUP007) with City, Category, and Payment Terms.'],
    ['Purchase Lookup Practice', 'Blank student answer cells (C2:F7) to practice VLOOKUP, IFERROR, and XLOOKUP.'],
    ['Completed Answer Sheet', 'Working formulas and expected lookup results (including missing supplier PO006 / SUP999).'],
    [''],
    ['EXACT FORMULAS TO ENTER ON "Purchase Lookup Practice"'],
    ['Column C (Supplier Name — VLOOKUP)', '=IFERROR(VLOOKUP(B2,\'Supplier Master\'!$A$2:$E$8,2,FALSE),"Not Found")'],
    ['Column D (City — VLOOKUP)', '=IFERROR(VLOOKUP(B2,\'Supplier Master\'!$A$2:$E$8,3,FALSE),"Not Found")'],
    ['Column E (Category — VLOOKUP)', '=IFERROR(VLOOKUP(B2,\'Supplier Master\'!$A$2:$E$8,4,FALSE),"Not Found")'],
    ['Column F (Payment Terms — XLOOKUP)', '=XLOOKUP(B2,\'Supplier Master\'!$A$2:$A$8,\'Supplier Master\'!$E$2:$E$8,"Not Found")'],
    [''],
    ['COMPATIBILITY NOTE'],
    ['•', 'XLOOKUP works in Microsoft 365, Excel 2021+, Excel for the Web, and Google Sheets. In older Excel versions, use =IFERROR(VLOOKUP(B2,\'Supplier Master\'!$A$2:$E$8,5,FALSE),"Not Found").'],
  ]);
  setColWidths(wsInst, [34, 78]);

  // 2. Supplier Master
  const wsMaster = wb.addWorksheet('Supplier Master');
  wsMaster.addRow(['Supplier ID', 'Supplier Name', 'City', 'Category', 'Payment Terms']);
  M05_SUPPLIERS.forEach((r) => wsMaster.addRow(r));
  styleHeaderRow(wsMaster, 1, 5);
  wsMaster.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsMaster, [14, 24, 16, 20, 16]);

  // 3. Purchase Lookup Practice (blank answer cells)
  const wsPrac = wb.addWorksheet('Purchase Lookup Practice');
  wsPrac.addRow(['Purchase ID', 'Supplier ID', 'Supplier Name', 'City', 'Category', 'Payment Terms']);
  M05_PURCHASES.forEach(([po, sup]) => wsPrac.addRow([po, sup, null, null, null, null]));
  styleHeaderRow(wsPrac, 1, 6);
  wsPrac.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsPrac, [14, 14, 24, 16, 20, 16]);

  // 4. Completed Answer Sheet
  const wsAns = wb.addWorksheet('Completed Answer Sheet');
  wsAns.addRow(['Purchase ID', 'Supplier ID', 'Supplier Name', 'City', 'Category', 'Payment Terms']);
  const supMap = new Map(M05_SUPPLIERS.map((s) => [s[0], s]));
  M05_PURCHASES.forEach(([po, sup], idx) => {
    const r = idx + 2;
    const match = supMap.get(sup);
    wsAns.addRow([
      po,
      sup,
      {
        formula: `IFERROR(VLOOKUP(B${r},'Supplier Master'!$A$2:$E$8,2,FALSE),"Not Found")`,
        result: match ? match[1] : 'Not Found',
      },
      {
        formula: `IFERROR(VLOOKUP(B${r},'Supplier Master'!$A$2:$E$8,3,FALSE),"Not Found")`,
        result: match ? match[2] : 'Not Found',
      },
      {
        formula: `IFERROR(VLOOKUP(B${r},'Supplier Master'!$A$2:$E$8,4,FALSE),"Not Found")`,
        result: match ? match[3] : 'Not Found',
      },
      {
        formula: `_xlfn.XLOOKUP(B${r},'Supplier Master'!$A$2:$A$8,'Supplier Master'!$E$2:$E$8,"Not Found")`,
        result: match ? match[4] : 'Not Found',
      },
    ]);
  });
  styleHeaderRow(wsAns, 1, 6);
  wsAns.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsAns, [14, 14, 24, 16, 20, 16]);

  const buf = await toBuffer(wb);
  cache.set(5, buf);
  return buf;
}

// ============================================================================
// MODULE 06 — Sorting, Filtering, Tables & Data Validation
// ============================================================================
const M06_PO_RECORDS: [string, string, string, string, string, number, string, string][] = [
  ['PO1001', 'ABC Technologies', 'IT', '2026-01-05', '2026-01-12', 45000, 'Delivered', 'Paid'],
  ['PO1002', 'Office Supplies Co.', 'HR', '2026-01-07', '2026-01-15', 12500, 'Pending', 'Unpaid'],
  ['PO1003', 'Tech Solutions', 'IT', '2026-01-10', '2026-01-18', 68000, 'Delivered', 'Paid'],
  ['PO1004', 'Paper World', 'Finance', '2026-01-12', '2026-01-19', 9200, 'Delivered', 'Paid'],
  ['PO1005', 'Global Supplies', 'Operations', '2026-01-14', '2026-01-24', 34000, 'In Transit', 'Unpaid'],
  ['PO1006', 'Metro Systems', 'IT', '2026-01-16', '2026-01-25', 54000, 'Delivered', 'Pending Approval'],
  ['PO1007', 'Office Mart', 'Admin', '2026-01-18', '2026-01-26', 15800, 'Delivered', 'Paid'],
  ['PO1008', 'Prime Stationers', 'Finance', '2026-01-20', '2026-01-28', 11400, 'Pending', 'Unpaid'],
  ['PO1009', 'ABC Technologies', 'IT', '2026-01-22', '2026-01-30', 72000, 'In Transit', 'Unpaid'],
  ['PO1010', 'Global Supplies', 'HR', '2026-01-24', '2026-02-01', 18500, 'Delivered', 'Paid'],
  ['PO1011', 'Tech Solutions', 'Operations', '2026-01-27', '2026-02-04', 49500, 'Delivered', 'Paid'],
  ['PO1012', 'Paper World', 'Admin', '2026-01-29', '2026-02-05', 8600, 'Cancelled', 'Not Applicable'],
  ['PO1013', 'Metro Systems', 'IT', '2026-02-02', '2026-02-10', 61000, 'Pending', 'Unpaid'],
  ['PO1014', 'Office Mart', 'HR', '2026-02-04', '2026-02-12', 14200, 'Delivered', 'Paid'],
  ['PO1015', 'Prime Stationers', 'Finance', '2026-02-06', '2026-02-14', 10800, 'Delivered', 'Pending Approval'],
  ['PO1016', 'ABC Technologies', 'Operations', '2026-02-09', '2026-02-18', 58000, 'In Transit', 'Unpaid'],
  ['PO1017', 'Global Supplies', 'Admin', '2026-02-11', '2026-02-19', 21500, 'Delivered', 'Paid'],
  ['PO1018', 'Tech Solutions', 'IT', '2026-02-14', '2026-02-22', 83000, 'Pending', 'Unpaid'],
  ['PO1019', 'Paper World', 'HR', '2026-02-16', '2026-02-24', 9400, 'Delivered', 'Paid'],
  ['PO1020', 'Metro Systems', 'Finance', '2026-02-18', '2026-02-26', 39500, 'Delivered', 'Paid'],
];

const M06_RAW_WITH_DUPLICATES = [
  ...M06_PO_RECORDS,
  // 2 intentional duplicate PO records for Remove Duplicates practice
  ['PO1003', 'Tech Solutions', 'IT', '2026-01-10', '2026-01-18', 68000, 'Delivered', 'Paid'] as [string, string, string, string, string, number, string, string],
  ['PO1013', 'Metro Systems', 'IT', '2026-02-02', '2026-02-10', 61000, 'Pending', 'Unpaid'] as [string, string, string, string, string, number, string, string],
];

export async function getModule06PracticeWorkbookBuffer(): Promise<Buffer> {
  const hit = cache.get(6);
  if (hit) return hit;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Learn with ABHI';

  // 1. Instructions
  const wsInst = wb.addWorksheet('Instructions');
  addInstructionBlock(wsInst, 'LEARN WITH ABHI — MODULE 06: SORTING, FILTERING, TABLES & DATA VALIDATION', [
    ['Activity Title:', 'Purchase Order Management Register'],
    ['Dataset:', '20 unique Purchase Orders (+2 intentional duplicates on "Purchase Order Data" for Remove Duplicates practice)'],
    [''],
    ['STUDENT TASKS ON "Filter and Sort Practice"'],
    ['1. Convert to Excel Table', 'Select A1:H23 and press Ctrl+T (ensure "My table has headers" is checked).'],
    ['2. Remove Duplicates', 'Use Data -> Remove Duplicates on the PO Number column (2 duplicates: PO1003 and PO1013).'],
    ['3. Sort Data', 'Sort by Purchase Amount (Largest to Smallest), then practice sorting by Order Date (Newest to Oldest).'],
    ['4. Apply Filters', 'Filter Order Status = "Pending" and Department = "IT". Clear filters afterward.'],
    ['5. Data Validation Dropdowns', 'Apply List validation to Order Status (Pending, In Transit, Delivered, Cancelled) and Payment Status (Paid, Unpaid, Pending Approval, Not Applicable).'],
    ['6. Positive Number Validation', 'Restrict Purchase Amount (Column F) to Whole Numbers greater than 0 with an Error Alert.'],
    ['7. Enable Total Row', 'In Table Design -> check Total Row to calculate dynamic SUBTOTAL sum of Purchase Amount.'],
    [''],
    ['COMPARE WITH "Completed Reference"'],
    ['•', 'The Completed Reference sheet contains a real Excel Table (PurchaseRegisterTable) with a Total Row, native Data Validation dropdowns, and positive number validation.'],
  ]);
  setColWidths(wsInst, [32, 82]);

  const headers = [
    'PO Number',
    'Supplier Name',
    'Department',
    'Order Date',
    'Delivery Date',
    'Purchase Amount',
    'Order Status',
    'Payment Status',
  ];

  // 2. Purchase Order Data (raw with 2 duplicates)
  const wsData = wb.addWorksheet('Purchase Order Data');
  wsData.addRow(headers);
  M06_RAW_WITH_DUPLICATES.forEach((r) => wsData.addRow(r));
  styleHeaderRow(wsData, 1, 8);
  for (let r = 2; r <= M06_RAW_WITH_DUPLICATES.length + 1; r++) {
    wsData.getCell(`F${r}`).numFmt = INR_FMT;
  }
  wsData.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsData, [13, 22, 14, 14, 14, 18, 15, 18]);

  // 3. Filter and Sort Practice (plain range for student to convert to Table + deduplicate + validate)
  const wsPrac = wb.addWorksheet('Filter and Sort Practice');
  wsPrac.addRow(headers);
  M06_RAW_WITH_DUPLICATES.forEach((r) => wsPrac.addRow(r));
  styleHeaderRow(wsPrac, 1, 8);
  for (let r = 2; r <= M06_RAW_WITH_DUPLICATES.length + 1; r++) {
    wsPrac.getCell(`F${r}`).numFmt = INR_FMT;
  }
  wsPrac.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsPrac, [13, 22, 14, 14, 14, 18, 15, 18]);

  // 4. Completed Reference (Native Excel Table + Total Row + Real Data Validation Dropdowns + Positive Validation)
  const wsRef = wb.addWorksheet('Completed Reference');
  wsRef.addTable({
    name: 'PurchaseRegisterTable',
    ref: 'A1',
    headerRow: true,
    totalsRow: true,
    style: {
      theme: 'TableStyleMedium2',
      showRowStripes: true,
    },
    columns: [
      { name: 'PO Number', totalsRowLabel: 'Total', filterButton: true },
      { name: 'Supplier Name', filterButton: true },
      { name: 'Department', filterButton: true },
      { name: 'Order Date', filterButton: true },
      { name: 'Delivery Date', filterButton: true },
      { name: 'Purchase Amount', totalsRowFunction: 'sum', filterButton: true },
      { name: 'Order Status', filterButton: true },
      { name: 'Payment Status', filterButton: true },
    ],
    rows: M06_PO_RECORDS,
  });

  const totalAmount = M06_PO_RECORDS.reduce((acc, r) => acc + r[5], 0);
  const totalRowIdx = M06_PO_RECORDS.length + 2;
  wsRef.getCell(`F${totalRowIdx}`).value = { formula: 'SUBTOTAL(109,F2:F21)', result: totalAmount };
  wsRef.getCell(`F${totalRowIdx}`).numFmt = INR_FMT;
  wsRef.getCell(`F${totalRowIdx}`).font = { bold: true };

  for (let r = 2; r <= M06_PO_RECORDS.length + 1; r++) {
    wsRef.getCell(`F${r}`).numFmt = INR_FMT;
    wsRef.getCell(`F${r}`).dataValidation = {
      type: 'whole',
      operator: 'greaterThan',
      allowBlank: false,
      formulae: [0],
      showInputMessage: true,
      promptTitle: 'Positive Amount Required',
      prompt: 'Enter a purchase amount greater than 0 (numbers only).',
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Invalid Purchase Amount',
      error: 'Purchase Amount must be a positive number greater than 0.',
    };
    wsRef.getCell(`G${r}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Pending,In Transit,Delivered,Cancelled"'],
      showInputMessage: true,
      promptTitle: 'Select Order Status',
      prompt: 'Choose Pending, In Transit, Delivered, or Cancelled.',
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Invalid Order Status',
      error: 'Please select an approved Order Status from the dropdown list.',
    };
    wsRef.getCell(`H${r}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Paid,Unpaid,Pending Approval,Not Applicable"'],
      showInputMessage: true,
      promptTitle: 'Select Payment Status',
      prompt: 'Choose Paid, Unpaid, Pending Approval, or Not Applicable.',
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Invalid Payment Status',
      error: 'Please select an approved Payment Status from the dropdown list.',
    };
  }
  wsRef.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsRef, [14, 22, 14, 14, 14, 18, 16, 18]);

  const buf = await toBuffer(wb);
  cache.set(6, buf);
  return buf;
}

// ============================================================================
// MODULE 07 — Data Cleaning & Data Management
// ============================================================================
const M07_RAW_ROWS: [string, string, string, string, string, string, string][] = [
  ['  sup001 ', '  abc   technologies ', 'pune ', 'it', '2026-01-10', '45000', 'Active'],
  ['SUP002', 'GLOBAL SUPPLIES  ', '  MUMBAI', 'office supplies', '15/01/2026', '12000', 'active'],
  ['sup003', '  tech solutions', 'Bengalore', 'IT ', '2026.01.20', '65000', 'ACTIVE'],
  ['SUP004', 'paper   world ', 'hydrabad ', 'Stationery', '2026-01-25', '8000', ''],
  ['SUP002', 'GLOBAL SUPPLIES  ', '  MUMBAI', 'office supplies', '15/01/2026', '12000', 'active'],
  ['  SUP005', 'office mart  ', 'PUNE', 'Office  Supplies', '2026-02-02', '15500', 'Active'],
  ['sup006 ', '  metro   systems', '  chennai ', 'it', '05-02-2026', '52000', 'Active'],
  ['SUP007', 'Prime Stationers', 'mumbai', 'STATIONERY ', '2026-02-08', '9800', 'Pending Review'],
  ['SUP008', '  nova   logistics ', '', 'Logistics', '2026-02-12', '27500', 'Active'],
  ['sup006 ', '  metro   systems', '  chennai ', 'it', '05-02-2026', '52000', 'Active'],
];

const M07_CLEANED_UNIQUE: [string, string, string, string, string, number, string][] = [
  ['SUP001', 'Abc Technologies', 'Pune', 'IT', '2026-01-10', 45000, 'Active'],
  ['SUP002', 'Global Supplies', 'Mumbai', 'Office Supplies', '2026-01-15', 12000, 'Active'],
  ['SUP003', 'Tech Solutions', 'Bengaluru', 'IT', '2026-01-20', 65000, 'Active'],
  ['SUP004', 'Paper World', 'Hyderabad', 'Stationery', '2026-01-25', 8000, 'Needs Verification'],
  ['SUP005', 'Office Mart', 'Pune', 'Office Supplies', '2026-02-02', 15500, 'Active'],
  ['SUP006', 'Metro Systems', 'Chennai', 'IT', '2026-02-05', 52000, 'Active'],
  ['SUP007', 'Prime Stationers', 'Mumbai', 'Stationery', '2026-02-08', 9800, 'Pending Review'],
  ['SUP008', 'Nova Logistics', 'Missing - Verify', 'Logistics', '2026-02-12', 27500, 'Active'],
];

export async function getModule07PracticeWorkbookBuffer(): Promise<Buffer> {
  const hit = cache.get(7);
  if (hit) return hit;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Learn with ABHI';

  // 1. Instructions
  const wsInst = wb.addWorksheet('Instructions');
  addInstructionBlock(wsInst, 'LEARN WITH ABHI — MODULE 07: DATA CLEANING & DATA MANAGEMENT', [
    ['Activity Title:', 'Supplier Data Cleaning'],
    ['Issues Planted in Raw Data:', 'Extra spaces, mixed case, 2 duplicate IDs (SUP002 & SUP006), misspelled cities (Bengalore, Hydrabad), mixed date formats, blank fields, numbers stored as text, inconsistent categories.'],
    [''],
    ['CLEANING FORMULA REFERENCE (ON "Cleaning Practice")'],
    ['Clean Supplier ID', '=UPPER(TRIM(CLEAN(A2)))'],
    ['Clean Supplier Name', '=PROPER(TRIM(CLEAN(B2)))'],
    ['Standardize City (with Blank Check)', '=IF(TRIM(C2)="","Missing - Verify",PROPER(TRIM(SUBSTITUTE(SUBSTITUTE(LOWER(C2),"bengalore","bengaluru"),"hydrabad","hyderabad"))))'],
    ['Standardize Category', '=IF(UPPER(TRIM(D2))="IT","IT",PROPER(TRIM(D2)))'],
    ['Convert Text Amount to Number', '=VALUE(TRIM(F2))'],
    ['Handle Blank Status', '=IF(TRIM(G2)="","Needs Verification",PROPER(TRIM(G2)))'],
    ['Final Step', 'Copy cleaned formulas -> Paste Values -> Data -> Remove Duplicates on Clean Supplier ID.'],
  ]);
  setColWidths(wsInst, [34, 86]);

  const rawHeaders = [
    'Raw Supplier ID',
    'Raw Supplier Name',
    'Raw City',
    'Raw Category',
    'Raw Onboarding Date',
    'Raw Annual Spend (Text)',
    'Raw Status',
  ];

  // 2. Raw Supplier Data
  const wsRaw = wb.addWorksheet('Raw Supplier Data');
  wsRaw.addRow(rawHeaders);
  M07_RAW_ROWS.forEach((r) => {
    const row = wsRaw.addRow(r);
    // Explicitly store column F as text string to demonstrate numbers stored as text
    row.getCell(6).numFmt = '@';
  });
  styleHeaderRow(wsRaw, 1, 7);
  wsRaw.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsRaw, [18, 24, 16, 20, 20, 24, 18]);

  // 3. Cleaning Practice (Raw data in A:G, blank student cleaning columns in H:N)
  const wsPrac = wb.addWorksheet('Cleaning Practice');
  wsPrac.addRow([
    ...rawHeaders,
    'Clean Supplier ID',
    'Clean Supplier Name',
    'Clean City',
    'Clean Category',
    'Standard Date',
    'Numeric Spend',
    'Clean Status',
  ]);
  M07_RAW_ROWS.forEach((r) => {
    const row = wsPrac.addRow([...r, null, null, null, null, null, null, null]);
    row.getCell(6).numFmt = '@';
  });
  styleHeaderRow(wsPrac, 1, 14);
  wsPrac.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsPrac, [16, 22, 14, 18, 18, 22, 16, 18, 22, 18, 18, 16, 16, 20]);

  // 4. Cleaned Answer Sheet (Formula-driven cleaning + clean deduplicated summary)
  const wsAns = wb.addWorksheet('Cleaned Answer Sheet');
  wsAns.addRow([
    'Clean Supplier ID',
    'Clean Supplier Name',
    'Clean City',
    'Clean Category',
    'Standard Date (YYYY-MM-DD)',
    'Annual Spend (Numeric)',
    'Clean Status',
  ]);
  const sourceRowMap = [2, 3, 4, 5, 7, 8, 9, 10]; // unique rows in Raw Supplier Data (excluding duplicate rows 6 & 11)
  M07_CLEANED_UNIQUE.forEach((clean, idx) => {
    const sr = sourceRowMap[idx];
    const row = wsAns.addRow([
      { formula: `UPPER(TRIM(CLEAN('Raw Supplier Data'!A${sr})))`, result: clean[0] },
      { formula: `PROPER(TRIM(CLEAN('Raw Supplier Data'!B${sr})))`, result: clean[1] },
      {
        formula: `IF(TRIM('Raw Supplier Data'!C${sr})="","Missing - Verify",PROPER(TRIM(SUBSTITUTE(SUBSTITUTE(LOWER('Raw Supplier Data'!C${sr}),"bengalore","bengaluru"),"hydrabad","hyderabad"))))`,
        result: clean[2],
      },
      {
        formula: `IF(UPPER(TRIM('Raw Supplier Data'!D${sr}))="IT","IT",PROPER(TRIM('Raw Supplier Data'!D${sr})))`,
        result: clean[3],
      },
      clean[4],
      { formula: `VALUE(TRIM('Raw Supplier Data'!F${sr}))`, result: clean[5] },
      {
        formula: `IF(TRIM('Raw Supplier Data'!G${sr})="","Needs Verification",PROPER(TRIM('Raw Supplier Data'!G${sr})))`,
        result: clean[6],
      },
    ]);
    row.getCell(6).numFmt = INR_FMT;
  });

  const totalSpend = M07_CLEANED_UNIQUE.reduce((s, r) => s + r[5], 0);
  wsAns.addRow([]);
  const sumRow = wsAns.addRow([
    'Total Verified Annual Spend (Numeric SUM):',
    '',
    '',
    '',
    '',
    { formula: 'SUM(F2:F9)', result: totalSpend },
    { formula: 'COUNTA(A2:A9)&" Unique Suppliers"', result: '8 Unique Suppliers' },
  ]);
  sumRow.font = { bold: true };
  sumRow.getCell(6).numFmt = INR_FMT;

  styleHeaderRow(wsAns, 1, 7);
  wsAns.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsAns, [18, 22, 18, 18, 24, 22, 20]);

  const buf = await toBuffer(wb);
  cache.set(7, buf);
  return buf;
}

// ============================================================================
// MODULE 08 — Conditional Formatting
// ============================================================================
const M08_INVOICES: [string, string, Date, Date, number, string][] = [
  ['INV-2026-001', 'ABC Technologies', new Date('2026-01-05'), new Date('2026-01-25'), 64000, 'Pending'],
  ['INV-2026-002', 'Office Supplies Co.', new Date('2026-01-08'), new Date('2026-02-07'), 18500, 'Paid'],
  ['INV-2026-003', 'Tech Solutions', new Date('2026-01-12'), new Date('2026-02-11'), 82000, 'Pending'],
  ['INV-2026-004', 'Paper World', new Date('2026-01-15'), new Date('2026-02-14'), 12400, 'Paid'],
  ['INV-2026-005', 'Global Supplies', new Date('2026-01-18'), new Date('2026-02-17'), 54000, 'Pending'],
  ['INV-2026-003', 'Tech Solutions', new Date('2026-01-12'), new Date('2026-02-11'), 82000, 'Pending'], // Intentional duplicate
  ['INV-2026-006', 'Metro Systems', new Date('2026-01-22'), new Date('2026-02-21'), 47000, 'Paid'],
  ['INV-2026-007', 'Office Mart', new Date('2026-02-01'), new Date('2026-03-03'), 29000, 'Pending'],
  ['INV-2026-008', 'Prime Stationers', new Date('2026-02-05'), new Date('2026-03-07'), 15000, 'Paid'],
  ['INV-2026-009', 'ABC Technologies', new Date('2026-02-10'), new Date('2026-12-30'), 95000, 'Pending'],
  ['INV-2026-010', 'Global Supplies', new Date('2026-02-14'), new Date('2026-12-31'), 36000, 'Pending'],
  ['INV-2026-011', 'Metro Systems', new Date('2026-02-18'), new Date('2026-03-20'), 58500, 'Paid'],
];

export async function getModule08PracticeWorkbookBuffer(): Promise<Buffer> {
  const hit = cache.get(8);
  if (hit) return hit;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Learn with ABHI';

  // 1. Instructions
  const wsInst = wb.addWorksheet('Instructions');
  addInstructionBlock(wsInst, 'LEARN WITH ABHI — MODULE 08: CONDITIONAL FORMATTING', [
    ['Activity Title:', 'Purchase and Invoice Tracking'],
    [''],
    ['CONDITIONAL FORMATTING RULES TO APPLY ON "Conditional Formatting Practice"'],
    ['1. Duplicate Invoice Numbers', 'Select A2:A13 -> Home -> Conditional Formatting -> Highlight Cells Rules -> Duplicate Values (flags INV-2026-003).'],
    ['2. High-Value Invoices (> ₹50,000)', 'Select E2:E13 -> Highlight Cells Rules -> Greater Than -> 50000 (or formula =E2>50000).'],
    ['3. Data Bars / Color Scale', 'Select E2:E13 -> apply Data Bars or a 3-Color Scale to visualize invoice sizes.'],
    ['4. Formula Rule — Overdue Pending Rows', 'Select A2:F13 -> New Rule -> Use a formula -> =AND($F2="Pending",$D2<TODAY()) -> Red fill.'],
    ['5. Formula Rule — Paid Rows', 'Select A2:F13 -> New Rule -> Use a formula -> =$F2="Paid" -> Soft green fill.'],
    ['6. Manage Rules', 'Open Conditional Formatting -> Manage Rules to inspect rule priority and verify formulas.'],
    [''],
    ['COMPLETED REFERENCE'],
    ['•', 'Open "Completed Reference" in Microsoft Excel to inspect live native conditional formatting rules already applied!'],
  ]);
  setColWidths(wsInst, [36, 84]);

  const invHeaders = [
    'Invoice Number',
    'Supplier',
    'Invoice Date',
    'Due Date',
    'Invoice Amount',
    'Payment Status',
  ];

  function populateInvoices(ws: ExcelJS.Worksheet): void {
    ws.addRow(invHeaders);
    M08_INVOICES.forEach((inv) => {
      const row = ws.addRow(inv);
      row.getCell(3).numFmt = 'yyyy-mm-dd';
      row.getCell(4).numFmt = 'yyyy-mm-dd';
      row.getCell(5).numFmt = INR_FMT;
    });
    styleHeaderRow(ws, 1, 6);
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    setColWidths(ws, [18, 24, 15, 15, 18, 16]);
  }

  // 2. Invoice Data
  populateInvoices(wb.addWorksheet('Invoice Data'));

  // 3. Conditional Formatting Practice
  populateInvoices(wb.addWorksheet('Conditional Formatting Practice'));

  // 4. Completed Reference (with REAL ExcelJS Conditional Formatting rules!)
  const wsRef = wb.addWorksheet('Completed Reference');
  populateInvoices(wsRef);

  // Rule 1: Duplicate Invoice Numbers on A2:A13
  wsRef.addConditionalFormatting({
    ref: 'A2:A13',
    rules: [
      {
        type: 'expression',
        priority: 1,
        formulae: ['COUNTIF($A$2:$A$13,A2)>1'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFDE68A' } },
          font: { bold: true, color: { argb: 'FF92400E' } },
        },
      },
    ],
  });

  // Rule 2: Pending Overdue Invoices entire-row highlight on A2:F13
  wsRef.addConditionalFormatting({
    ref: 'A2:F13',
    rules: [
      {
        type: 'expression',
        priority: 2,
        formulae: ['AND($F2="Pending",$D2<TODAY())'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } },
          font: { color: { argb: 'FF991B1B' } },
        },
      },
      {
        type: 'expression',
        priority: 3,
        formulae: ['$F2="Paid"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFDCFCE7' } },
          font: { color: { argb: 'FF166534' } },
        },
      },
    ],
  });

  // Rule 3: Invoices > ₹50,000 + Data Bar on E2:E13
  wsRef.addConditionalFormatting({
    ref: 'E2:E13',
    rules: [
      {
        type: 'cellIs',
        operator: 'greaterThan',
        priority: 4,
        formulae: [50000],
        style: {
          font: { bold: true, color: { argb: 'FF102B4E' } },
        },
      },
      {
        type: 'dataBar',
        priority: 5,
        cfvo: [{ type: 'min' }, { type: 'max' }],
      },
    ],
  });

  const buf = await toBuffer(wb);
  cache.set(8, buf);
  return buf;
}

// ============================================================================
// MODULE 09 — PivotTables & Data Analysis (44 realistic purchase records)
// ============================================================================
interface M09PurchaseTx {
  po: string;
  supplier: string;
  department: string;
  date: string;
  month: string;
  category: string;
  amount: number;
  buyer: string;
  status: string;
}

function buildModule09Dataset(): M09PurchaseTx[] {
  const suppliers = [
    'ABC Technologies',
    'Tech Solutions',
    'Global Supplies',
    'Office Mart',
    'Metro Systems',
    'Paper World',
  ];
  const departments = ['IT', 'Operations', 'Finance', 'HR', 'Admin'];
  const categories = ['Hardware', 'Software', 'Office Supplies', 'Logistics', 'Stationery'];
  const buyers = ['Aarav Mehta', 'Priya Nair', 'Rohan Kulkarni', 'Sneha Iyer'];
  const statuses = ['Completed', 'Completed', 'Completed', 'Pending', 'In Transit'];
  const months = [
    { key: '2026-01', label: 'Jan 2026' },
    { key: '2026-02', label: 'Feb 2026' },
    { key: '2026-03', label: 'Mar 2026' },
    { key: '2026-04', label: 'Apr 2026' },
  ];

  const rows: M09PurchaseTx[] = [];
  for (let i = 0; i < 44; i++) {
    const m = months[i % months.length];
    const day = String(((i * 3) % 26) + 1).padStart(2, '0');
    const dept = departments[i % departments.length];
    const sup = suppliers[(i * 2 + 1) % suppliers.length];
    const cat =
      dept === 'IT'
        ? i % 2 === 0
          ? 'Hardware'
          : 'Software'
        : categories[(i + 2) % categories.length];
    const base = dept === 'IT' ? 42000 : dept === 'Operations' ? 31000 : 12000;
    const amount = base + ((i * 7) % 9) * 3500;
    rows.push({
      po: `PO-90${String(i + 1).padStart(2, '0')}`,
      supplier: sup,
      department: dept,
      date: `${m.key}-${day}`,
      month: m.label,
      category: cat,
      amount,
      buyer: buyers[i % buyers.length],
      status: statuses[i % statuses.length],
    });
  }
  return rows;
}

export async function getModule09PracticeWorkbookBuffer(): Promise<Buffer> {
  const hit = cache.get(9);
  if (hit) return hit;

  const data = buildModule09Dataset();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Learn with ABHI';

  // 1. Instructions
  const wsInst = wb.addWorksheet('Instructions');
  addInstructionBlock(wsInst, 'LEARN WITH ABHI — MODULE 09: PIVOTTABLES & DATA ANALYSIS', [
    ['Activity Title:', 'Purchase Analysis Report (44 Realistic Purchase Transactions)'],
    ['Workbook Note:', 'Programmatic PivotTable XML caching is not generated by server-side libraries; instead, this workbook provides a clean structured source dataset, step-by-step Excel PivotTable instructions, and formula-driven SUMIFS/COUNTIFS/AVERAGEIFS verification benchmarks on "Completed Analysis Reference" so you can cross-check every PivotTable number you create in Microsoft Excel.'],
    [''],
    ['6 PIVOTTABLES TO BUILD IN MICROSOFT EXCEL (FROM "Purchase Transactions" A1:I45)'],
    ['1. Total Purchases by Department', 'Insert -> PivotTable -> Rows: Department | Values: Sum of Purchase Amount'],
    ['2. Total Purchases by Supplier', 'Rows: Supplier | Values: Sum of Purchase Amount -> Sort Largest to Smallest'],
    ['3. Monthly Purchasing Trends', 'Rows: Month (or Purchase Date grouped by Month) | Values: Sum of Purchase Amount'],
    ['4. Purchase Count by Order Status', 'Rows: Order Status | Values: Count of PO Number'],
    ['5. Average Purchase Value by Category', 'Rows: Category | Values: Average of Purchase Amount'],
    ['6. Purchase Amount by Buyer', 'Rows: Buyer | Values: Sum of Purchase Amount'],
    ['7. Add Interactive Slicers', 'Click inside a PivotTable -> PivotTable Analyze -> Insert Slicer -> select Department and Order Status.'],
  ]);
  setColWidths(wsInst, [36, 86]);

  // 2. Purchase Transactions (44 rows)
  const wsTx = wb.addWorksheet('Purchase Transactions');
  wsTx.addRow([
    'PO Number',
    'Supplier',
    'Department',
    'Purchase Date',
    'Month',
    'Category',
    'Purchase Amount',
    'Buyer',
    'Order Status',
  ]);
  data.forEach((d) => {
    const row = wsTx.addRow([
      d.po,
      d.supplier,
      d.department,
      d.date,
      d.month,
      d.category,
      d.amount,
      d.buyer,
      d.status,
    ]);
    row.getCell(7).numFmt = INR_FMT;
  });
  styleHeaderRow(wsTx, 1, 9);
  wsTx.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsTx, [13, 20, 14, 15, 12, 17, 18, 18, 14]);

  // 3. PivotTable Practice (structured checklist area)
  const wsPrac = wb.addWorksheet('PivotTable Practice');
  wsPrac.addRow(['PIVOTTABLE PRACTICE WORKSPACE — BUILD YOUR 6 PIVOTTABLES BELOW']);
  wsPrac.getRow(1).font = TITLE_FONT;
  wsPrac.addRow(['Tip: Click cell A4, go to Insert -> PivotTable, and select \'Purchase Transactions\'!$A$1:$I$45 as the Table/Range.']);
  wsPrac.addRow(['']);
  wsPrac.addRow(['Target Placement Guide:', 'PivotTable 1 (Dept) -> A6', 'PivotTable 2 (Supplier) -> E6', 'PivotTable 3 (Month) -> I6']);
  wsPrac.addRow(['Target Placement Guide:', 'PivotTable 4 (Status) -> A16', 'PivotTable 5 (Category Avg) -> E16', 'PivotTable 6 (Buyer) -> I16']);
  setColWidths(wsPrac, [28, 28, 28, 28]);

  // 4. Completed Analysis Reference (honestly labeled formula-based SUMIFS/COUNTIFS/AVERAGEIFS verification benchmarks)
  const wsRef = wb.addWorksheet('Completed Analysis Reference');
  wsRef.addRow([
    'COMPLETED ANALYSIS REFERENCE (FORMULA-DRIVEN VERIFICATION BENCHMARKS FOR YOUR EXCEL PIVOTTABLES)',
  ]);
  wsRef.getRow(1).font = TITLE_FONT;
  wsRef.addRow([
    'Note: These live SUMIFS/COUNTIFS/AVERAGEIFS tables verify the exact numbers your Microsoft Excel PivotTables should produce from "Purchase Transactions".',
  ]);
  wsRef.addRow([]);

  const txRange = `'Purchase Transactions'`;
  const lastRow = data.length + 1;

  // Table A: Department Totals
  wsRef.addRow(['1. Total Purchases by Department', 'Total Spend (SUMIFS)', 'PO Count (COUNTIF)']);
  styleHeaderRow(wsRef, 4, 3);
  const depts = ['IT', 'Operations', 'Finance', 'HR', 'Admin'];
  depts.forEach((dept, idx) => {
    const r = 5 + idx;
    const sum = data.filter((d) => d.department === dept).reduce((a, b) => a + b.amount, 0);
    const cnt = data.filter((d) => d.department === dept).length;
    const row = wsRef.addRow([
      dept,
      { formula: `SUMIFS(${txRange}!$G$2:$G$${lastRow},${txRange}!$C$2:$C$${lastRow},A${r})`, result: sum },
      { formula: `COUNTIF(${txRange}!$C$2:$C$${lastRow},A${r})`, result: cnt },
    ]);
    row.getCell(2).numFmt = INR_FMT;
  });

  wsRef.addRow([]);
  const supHeaderRow = wsRef.rowCount + 1;
  wsRef.addRow(['2. Total Purchases by Supplier', 'Total Spend (SUMIFS)', 'PO Count (COUNTIF)']);
  styleHeaderRow(wsRef, supHeaderRow, 3);
  const suppliers = Array.from(new Set(data.map((d) => d.supplier)));
  suppliers.forEach((sup) => {
    const r = wsRef.rowCount + 1;
    const sum = data.filter((d) => d.supplier === sup).reduce((a, b) => a + b.amount, 0);
    const cnt = data.filter((d) => d.supplier === sup).length;
    const row = wsRef.addRow([
      sup,
      { formula: `SUMIFS(${txRange}!$G$2:$G$${lastRow},${txRange}!$B$2:$B$${lastRow},A${r})`, result: sum },
      { formula: `COUNTIF(${txRange}!$B$2:$B$${lastRow},A${r})`, result: cnt },
    ]);
    row.getCell(2).numFmt = INR_FMT;
  });

  wsRef.addRow([]);
  const monthHeaderRow = wsRef.rowCount + 1;
  wsRef.addRow(['3. Monthly Purchasing Trend', 'Total Spend (SUMIFS)', 'PO Count (COUNTIF)']);
  styleHeaderRow(wsRef, monthHeaderRow, 3);
  const months = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026'];
  months.forEach((mo) => {
    const r = wsRef.rowCount + 1;
    const sum = data.filter((d) => d.month === mo).reduce((a, b) => a + b.amount, 0);
    const cnt = data.filter((d) => d.month === mo).length;
    const row = wsRef.addRow([
      mo,
      { formula: `SUMIFS(${txRange}!$G$2:$G$${lastRow},${txRange}!$E$2:$E$${lastRow},A${r})`, result: sum },
      { formula: `COUNTIF(${txRange}!$E$2:$E$${lastRow},A${r})`, result: cnt },
    ]);
    row.getCell(2).numFmt = INR_FMT;
  });

  wsRef.addRow([]);
  const catHeaderRow = wsRef.rowCount + 1;
  wsRef.addRow(['4. Average Purchase Value by Category', 'Average Spend (AVERAGEIFS)', 'Total Spend (SUMIFS)']);
  styleHeaderRow(wsRef, catHeaderRow, 3);
  const cats = Array.from(new Set(data.map((d) => d.category)));
  cats.forEach((cat) => {
    const r = wsRef.rowCount + 1;
    const filtered = data.filter((d) => d.category === cat);
    const sum = filtered.reduce((a, b) => a + b.amount, 0);
    const avg = Math.round(sum / filtered.length);
    const row = wsRef.addRow([
      cat,
      { formula: `AVERAGEIFS(${txRange}!$G$2:$G$${lastRow},${txRange}!$F$2:$F$${lastRow},A${r})`, result: avg },
      { formula: `SUMIFS(${txRange}!$G$2:$G$${lastRow},${txRange}!$F$2:$F$${lastRow},A${r})`, result: sum },
    ]);
    row.getCell(2).numFmt = INR_FMT;
    row.getCell(3).numFmt = INR_FMT;
  });

  wsRef.addRow([]);
  const statusHeaderRow = wsRef.rowCount + 1;
  wsRef.addRow(['5. Purchase Count by Order Status', 'Order Count (COUNTIF)', 'Total Value (SUMIFS)']);
  styleHeaderRow(wsRef, statusHeaderRow, 3);
  ['Completed', 'Pending', 'In Transit'].forEach((st) => {
    const r = wsRef.rowCount + 1;
    const filtered = data.filter((d) => d.status === st);
    const sum = filtered.reduce((a, b) => a + b.amount, 0);
    const row = wsRef.addRow([
      st,
      { formula: `COUNTIF(${txRange}!$I$2:$I$${lastRow},A${r})`, result: filtered.length },
      { formula: `SUMIFS(${txRange}!$G$2:$G$${lastRow},${txRange}!$I$2:$I$${lastRow},A${r})`, result: sum },
    ]);
    row.getCell(3).numFmt = INR_FMT;
  });

  wsRef.addRow([]);
  const buyerHeaderRow = wsRef.rowCount + 1;
  wsRef.addRow(['6. Purchase Amount by Buyer', 'Total Spend (SUMIFS)', 'PO Count (COUNTIF)']);
  styleHeaderRow(wsRef, buyerHeaderRow, 3);
  const buyers = Array.from(new Set(data.map((d) => d.buyer)));
  buyers.forEach((buyer) => {
    const r = wsRef.rowCount + 1;
    const filtered = data.filter((d) => d.buyer === buyer);
    const sum = filtered.reduce((a, b) => a + b.amount, 0);
    const row = wsRef.addRow([
      buyer,
      { formula: `SUMIFS(${txRange}!$G$2:$G$${lastRow},${txRange}!$H$2:$H$${lastRow},A${r})`, result: sum },
      { formula: `COUNTIF(${txRange}!$H$2:$H$${lastRow},A${r})`, result: filtered.length },
    ]);
    row.getCell(2).numFmt = INR_FMT;
  });

  setColWidths(wsRef, [36, 26, 24]);

  const buf = await toBuffer(wb);
  cache.set(9, buf);
  return buf;
}

// ============================================================================
// MODULE 10 — Charts, Reports & Dashboards
// ============================================================================
export async function getModule10PracticeWorkbookBuffer(): Promise<Buffer> {
  const hit = cache.get(10);
  if (hit) return hit;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Learn with ABHI';

  const months = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];
  const depts = ['IT', 'Operations', 'Finance', 'HR', 'Admin'];
  const suppliers = ['ABC Technologies', 'Tech Solutions', 'Global Supplies', 'Metro Systems', 'Office Mart'];
  const categories = ['Hardware', 'Software', 'Office Supplies', 'Services'];
  const statuses = ['Completed', 'Completed', 'Completed', 'Pending'];

  const rows: [string, string, string, string, string, number, string][] = [];
  for (let i = 0; i < 36; i++) {
    const mo = months[i % months.length];
    const dept = depts[i % depts.length];
    const sup = suppliers[(i * 2) % suppliers.length];
    const cat = categories[i % categories.length];
    const amt = (dept === 'IT' ? 48000 : dept === 'Operations' ? 32000 : 16000) + (i % 6) * 4500;
    const st = statuses[i % statuses.length];
    rows.push([`PO-10${String(i + 1).padStart(2, '0')}`, mo, dept, sup, cat, amt, st]);
  }

  // 1. Instructions
  const wsInst = wb.addWorksheet('Instructions');
  addInstructionBlock(wsInst, 'LEARN WITH ABHI — MODULE 10: CHARTS, REPORTS & DASHBOARDS', [
    ['Activity Title:', 'Monthly Procurement Dashboard'],
    ['Workbook Note:', 'KPI cards and all 4 chart-source tables on "Completed Dashboard Reference" use live Excel formulas (SUM, COUNTA, AVERAGE, COUNTIF, SUMIFS). Because server-side ExcelJS does not emit embedded OOXML drawing/chart XML objects, follow the 4 quick Insert Chart steps below inside Microsoft Excel to attach live charts directly to those summary tables.'],
    [''],
    ['STEP-BY-STEP DASHBOARD ASSEMBLY'],
    ['Step 1 — KPI Cards (B4:E5)', 'Enter =SUM(\'Purchase Data\'!F2:F37), =COUNTA(\'Purchase Data\'!A2:A37), =AVERAGE(\'Purchase Data\'!F2:F37), and =COUNTIF(\'Purchase Data\'!G2:G37,"Pending").'],
    ['Step 2 — Monthly Trend Line Chart', 'Select the Monthly Purchase Trend table (A9:B15) -> Insert -> Line Chart with Markers.'],
    ['Step 3 — Department Column Chart', 'Select the Department-wise Spend table (D9:E14) -> Insert -> Clustered Column Chart.'],
    ['Step 4 — Supplier Bar Chart', 'Select the Supplier-wise Spend table (A18:B23) -> Insert -> Clustered Bar Chart.'],
    ['Step 5 — Category Doughnut/Pie Chart', 'Select the Category Analysis table (D18:E22) -> Insert -> Doughnut or Pie Chart with Data Labels.'],
    ['Step 6 — Clean Layout', 'Hide gridlines (View -> uncheck Gridlines), align cards, and add clear chart titles.'],
  ]);
  setColWidths(wsInst, [34, 86]);

  // 2. Purchase Data
  const wsData = wb.addWorksheet('Purchase Data');
  wsData.addRow(['PO Number', 'Month', 'Department', 'Supplier', 'Category', 'Purchase Amount', 'Order Status']);
  rows.forEach((r) => {
    const row = wsData.addRow(r);
    row.getCell(6).numFmt = INR_FMT;
  });
  styleHeaderRow(wsData, 1, 7);
  wsData.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsData, [14, 12, 14, 22, 18, 18, 14]);

  // 3. Dashboard Practice (blank KPI cells & summary targets)
  const wsPrac = wb.addWorksheet('Dashboard Practice');
  wsPrac.addRow(['MONTHLY PROCUREMENT DASHBOARD — STUDENT PRACTICE']);
  wsPrac.getRow(1).font = TITLE_FONT;
  wsPrac.addRow([]);
  wsPrac.addRow(['KPI CARD', 'Total Purchase Value', 'Total Purchase Orders', 'Average Purchase Value', 'Pending Orders']);
  styleHeaderRow(wsPrac, 3, 5);
  wsPrac.addRow(['Your Formula ->', null, null, null, null]);
  wsPrac.addRow([]);
  wsPrac.addRow(['Build your SUMIFS summary tables below (Monthly, Department, Supplier, Category) and insert 4 Excel charts.']);
  setColWidths(wsPrac, [22, 24, 24, 24, 20]);

  // 4. Completed Dashboard Reference (Formula-driven KPI Cards + 4 Dynamic Summary Tables ready for 1-click Charts)
  const wsRef = wb.addWorksheet('Completed Dashboard Reference');
  wsRef.views = [{ showGridLines: false }];
  wsRef.addRow(['MONTHLY PROCUREMENT EXECUTIVE DASHBOARD (FORMULA-DRIVEN REFERENCE)']);
  wsRef.getRow(1).font = TITLE_FONT;
  wsRef.addRow(['Tip: Select any summary table below and click Insert -> Line / Column / Bar / Pie Chart in Microsoft Excel to render interactive visuals.']);
  wsRef.addRow([]);

  const totalVal = rows.reduce((s, r) => s + r[5], 0);
  const avgVal = Math.round(totalVal / rows.length);
  const pendingCnt = rows.filter((r) => r[6] === 'Pending').length;

  wsRef.getCell('A4').value = 'TOTAL PURCHASE VALUE';
  wsRef.getCell('B4').value = 'TOTAL PURCHASE ORDERS';
  wsRef.getCell('C4').value = 'AVERAGE PURCHASE VALUE';
  wsRef.getCell('D4').value = 'PENDING ORDERS';
  styleHeaderRow(wsRef, 4, 4);

  wsRef.getCell('A5').value = { formula: "SUM('Purchase Data'!F2:F37)", result: totalVal };
  wsRef.getCell('A5').numFmt = INR_FMT;
  wsRef.getCell('B5').value = { formula: "COUNTA('Purchase Data'!A2:A37)", result: rows.length };
  wsRef.getCell('B5').numFmt = '#,##0';
  wsRef.getCell('C5').value = { formula: "AVERAGE('Purchase Data'!F2:F37)", result: avgVal };
  wsRef.getCell('C5').numFmt = INR_FMT;
  wsRef.getCell('D5').value = { formula: 'COUNTIF(\'Purchase Data\'!G2:G37,"Pending")', result: pendingCnt };
  wsRef.getCell('D5').numFmt = '#,##0';

  ['A5', 'B5', 'C5', 'D5'].forEach((addr) => {
    const c = wsRef.getCell(addr);
    c.fill = ACCENT_FILL;
    c.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FF102B4E' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  wsRef.getRow(5).height = 30;

  // Monthly Trend Table (A8:B14) & Department Table (D8:E13)
  wsRef.getCell('A8').value = 'Monthly Trend (Insert Line Chart)';
  wsRef.getCell('B8').value = 'Purchase Value';
  wsRef.getCell('D8').value = 'Department Spend (Insert Column Chart)';
  wsRef.getCell('E8').value = 'Purchase Value';
  ['A8', 'B8', 'D8', 'E8'].forEach((addr) => {
    const cell = wsRef.getCell(addr);
    cell.fill = NAVY_FILL;
    cell.font = HEADER_FONT;
  });

  months.forEach((mo, idx) => {
    const r = 9 + idx;
    const val = rows.filter((x) => x[1] === mo).reduce((a, b) => a + b[5], 0);
    wsRef.getCell(`A${r}`).value = mo;
    wsRef.getCell(`B${r}`).value = {
      formula: `SUMIFS('Purchase Data'!$F$2:$F$37,'Purchase Data'!$B$2:$B$37,A${r})`,
      result: val,
    };
    wsRef.getCell(`B${r}`).numFmt = INR_FMT;
  });

  depts.forEach((dept, idx) => {
    const r = 9 + idx;
    const val = rows.filter((x) => x[2] === dept).reduce((a, b) => a + b[5], 0);
    wsRef.getCell(`D${r}`).value = dept;
    wsRef.getCell(`E${r}`).value = {
      formula: `SUMIFS('Purchase Data'!$F$2:$F$37,'Purchase Data'!$C$2:$C$37,D${r})`,
      result: val,
    };
    wsRef.getCell(`E${r}`).numFmt = INR_FMT;
  });

  // Supplier Table (A17:B22) & Category Table (D17:E21)
  wsRef.getCell('A17').value = 'Supplier Spend (Insert Bar Chart)';
  wsRef.getCell('B17').value = 'Purchase Value';
  wsRef.getCell('D17').value = 'Category Share (Insert Pie/Doughnut)';
  wsRef.getCell('E17').value = 'Purchase Value';
  ['A17', 'B17', 'D17', 'E17'].forEach((addr) => {
    const cell = wsRef.getCell(addr);
    cell.fill = NAVY_FILL;
    cell.font = HEADER_FONT;
  });

  suppliers.forEach((sup, idx) => {
    const r = 18 + idx;
    const val = rows.filter((x) => x[3] === sup).reduce((a, b) => a + b[5], 0);
    wsRef.getCell(`A${r}`).value = sup;
    wsRef.getCell(`B${r}`).value = {
      formula: `SUMIFS('Purchase Data'!$F$2:$F$37,'Purchase Data'!$D$2:$D$37,A${r})`,
      result: val,
    };
    wsRef.getCell(`B${r}`).numFmt = INR_FMT;
  });

  categories.forEach((cat, idx) => {
    const r = 18 + idx;
    const val = rows.filter((x) => x[4] === cat).reduce((a, b) => a + b[5], 0);
    wsRef.getCell(`D${r}`).value = cat;
    wsRef.getCell(`E${r}`).value = {
      formula: `SUMIFS('Purchase Data'!$F$2:$F$37,'Purchase Data'!$E$2:$E$37,D${r})`,
      result: val,
    };
    wsRef.getCell(`E${r}`).numFmt = INR_FMT;
  });

  // Visual Data Bars on Spend tables for immediate readability
  wsRef.addConditionalFormatting({
    ref: 'B9:B14',
    rules: [{ type: 'dataBar', priority: 1, cfvo: [{ type: 'min' }, { type: 'max' }] }],
  });
  wsRef.addConditionalFormatting({
    ref: 'E9:E13',
    rules: [{ type: 'dataBar', priority: 2, cfvo: [{ type: 'min' }, { type: 'max' }] }],
  });
  wsRef.addConditionalFormatting({
    ref: 'B18:B22',
    rules: [{ type: 'dataBar', priority: 3, cfvo: [{ type: 'min' }, { type: 'max' }] }],
  });

  setColWidths(wsRef, [34, 24, 6, 36, 22]);

  const buf = await toBuffer(wb);
  cache.set(10, buf);
  return buf;
}

// ============================================================================
// MODULE 11 — Excel for Real Jobs & Workplace Tasks (7-Sheet Procurement Workbook)
// ============================================================================
export async function getModule11PracticeWorkbookBuffer(): Promise<Buffer> {
  const hit = cache.get(11);
  if (hit) return hit;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Learn with ABHI';

  // 1. Instructions
  const wsInst = wb.addWorksheet('Instructions');
  addInstructionBlock(wsInst, 'LEARN WITH ABHI — MODULE 11: EXCEL FOR REAL JOBS & WORKPLACE TASKS', [
    ['Activity Title:', 'Complete Procurement Operations Workbook (Job-Ready Portfolio Project)'],
    ['Role Focus:', 'Purchase Executive, Procurement Buyer, Operations Coordinator, Finance & Admin Analyst'],
    [''],
    ['WORKBOOK STRUCTURE (7 INTEGRATED WORKSHEETS)'],
    ['1. Instructions', 'Workflow guide, formulas, dropdowns, and alert rules across all trackers.'],
    ['2. Supplier Master', 'Approved vendor directory with Supplier IDs, cities, categories, and payment terms.'],
    ['3. Purchase Register', 'Purchase Requisition & PO tracker with VLOOKUP supplier auto-fill, qty*price totals, and status dropdowns.'],
    ['4. Delivery Tracker', 'Monitors Expected vs. Actual delivery dates with live IF status classification ("On Time", "Delayed", "Pending").'],
    ['5. Invoice Tracker', 'Tracks invoices with due dates, payment status dropdowns, and Conditional Formatting for overdue unpaid invoices.'],
    ['6. Monthly Summary', 'Blank KPI & department spend summary sheet for students to complete with SUM, COUNTIF, and SUMIF.'],
    ['7. Completed Reference', 'Verified formula-driven summary showing exact KPIs, department spend, and operational risk counts.'],
  ]);
  setColWidths(wsInst, [28, 86]);

  // 2. Supplier Master
  const wsSup = wb.addWorksheet('Supplier Master');
  wsSup.addRow(['Supplier ID', 'Supplier Name', 'City', 'Category', 'Payment Terms', 'Contact Email']);
  const supRows: [string, string, string, string, string, string][] = [
    ['SUP001', 'ABC Technologies', 'Pune', 'IT', '30 Days', 'orders@abctech.example'],
    ['SUP002', 'Global Supplies', 'Mumbai', 'Office Supplies', '15 Days', 'sales@globalsupplies.example'],
    ['SUP003', 'Tech Solutions', 'Bengaluru', 'IT', '45 Days', 'billing@techsolutions.example'],
    ['SUP004', 'Paper World', 'Hyderabad', 'Stationery', '30 Days', 'support@paperworld.example'],
    ['SUP005', 'Metro Systems', 'Chennai', 'Operations', '30 Days', 'dispatch@metrosystems.example'],
  ];
  supRows.forEach((r) => wsSup.addRow(r));
  styleHeaderRow(wsSup, 1, 6);
  wsSup.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsSup, [14, 22, 14, 18, 15, 30]);

  // 3. Purchase Register
  const wsPO = wb.addWorksheet('Purchase Register');
  wsPO.addRow([
    'PO Number',
    'PR Ref',
    'Supplier ID',
    'Supplier Name (Lookup)',
    'Department',
    'Quantity',
    'Unit Price',
    'Total Amount',
    'Order Status',
  ]);
  const poData: [string, string, string, string, string, number, number, string][] = [
    ['PO-1101', 'PR-01', 'SUP001', 'ABC Technologies', 'IT', 4, 14500, 'Approved'],
    ['PO-1102', 'PR-02', 'SUP002', 'Global Supplies', 'HR', 25, 650, 'Delivered'],
    ['PO-1103', 'PR-03', 'SUP003', 'Tech Solutions', 'IT', 2, 34000, 'Delivered'],
    ['PO-1104', 'PR-04', 'SUP004', 'Paper World', 'Finance', 40, 280, 'Delivered'],
    ['PO-1105', 'PR-05', 'SUP005', 'Metro Systems', 'Operations', 10, 4800, 'In Transit'],
    ['PO-1106', 'PR-06', 'SUP001', 'ABC Technologies', 'IT', 3, 18000, 'Pending'],
  ];
  poData.forEach((p, idx) => {
    const r = idx + 2;
    const total = p[5] * p[6];
    const row = wsPO.addRow([
      p[0],
      p[1],
      p[2],
      { formula: `IFERROR(VLOOKUP(C${r},'Supplier Master'!$A$2:$E$6,2,FALSE),"Not Found")`, result: p[3] },
      p[4],
      p[5],
      p[6],
      { formula: `F${r}*G${r}`, result: total },
      p[7],
    ]);
    row.getCell(7).numFmt = INR_FMT;
    row.getCell(8).numFmt = INR_FMT;
    row.getCell(9).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Pending,Approved,In Transit,Delivered,Cancelled"'],
    };
  });
  styleHeaderRow(wsPO, 1, 9);
  wsPO.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsPO, [12, 10, 13, 24, 14, 11, 14, 16, 15]);

  // 4. Delivery Tracker
  const wsDel = wb.addWorksheet('Delivery Tracker');
  wsDel.addRow(['PO Number', 'Supplier Name', 'Expected Delivery', 'Actual Delivery', 'Delivery Status']);
  const delRows: [string, string, Date, Date | null, string][] = [
    ['PO-1101', 'ABC Technologies', new Date('2026-01-20'), new Date('2026-01-24'), 'Delayed'],
    ['PO-1102', 'Global Supplies', new Date('2026-01-22'), new Date('2026-01-21'), 'On Time'],
    ['PO-1103', 'Tech Solutions', new Date('2026-01-25'), new Date('2026-01-25'), 'On Time'],
    ['PO-1104', 'Paper World', new Date('2026-01-28'), new Date('2026-01-27'), 'On Time'],
    ['PO-1105', 'Metro Systems', new Date('2026-02-05'), null, 'Pending'],
    ['PO-1106', 'ABC Technologies', new Date('2026-02-10'), null, 'Pending'],
  ];
  delRows.forEach((d, idx) => {
    const r = idx + 2;
    const row = wsDel.addRow([
      d[0],
      { formula: `IFERROR(VLOOKUP(A${r},'Purchase Register'!$A$2:$D$7,4,FALSE),"")`, result: d[1] },
      d[2],
      d[3],
      { formula: `IF(D${r}="","Pending",IF(D${r}>C${r},"Delayed","On Time"))`, result: d[4] },
    ]);
    row.getCell(3).numFmt = 'yyyy-mm-dd';
    row.getCell(4).numFmt = 'yyyy-mm-dd';
  });
  wsDel.addConditionalFormatting({
    ref: 'E2:E7',
    rules: [
      {
        type: 'expression',
        priority: 1,
        formulae: ['E2="Delayed"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } },
          font: { bold: true, color: { argb: 'FF991B1B' } },
        },
      },
      {
        type: 'expression',
        priority: 2,
        formulae: ['E2="On Time"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFDCFCE7' } },
          font: { bold: true, color: { argb: 'FF166534' } },
        },
      },
    ],
  });
  styleHeaderRow(wsDel, 1, 5);
  wsDel.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsDel, [14, 24, 18, 18, 16]);

  // 5. Invoice Tracker
  const wsInv = wb.addWorksheet('Invoice Tracker');
  wsInv.addRow(['Invoice No', 'PO Number', 'Supplier', 'Due Date', 'Invoice Amount', 'Payment Status']);
  const invRows: [string, string, string, Date, number, string][] = [
    ['INV-501', 'PO-1101', 'ABC Technologies', new Date('2026-02-15'), 58000, 'Pending'],
    ['INV-502', 'PO-1102', 'Global Supplies', new Date('2026-02-05'), 16250, 'Paid'],
    ['INV-503', 'PO-1103', 'Tech Solutions', new Date('2026-03-10'), 68000, 'Paid'],
    ['INV-504', 'PO-1104', 'Paper World', new Date('2026-02-25'), 11200, 'Paid'],
    ['INV-505', 'PO-1105', 'Metro Systems', new Date('2026-02-18'), 48000, 'Pending'],
  ];
  invRows.forEach((inv) => {
    const row = wsInv.addRow(inv);
    row.getCell(4).numFmt = 'yyyy-mm-dd';
    row.getCell(5).numFmt = INR_FMT;
    row.getCell(6).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Paid,Pending,On Hold"'],
    };
  });
  wsInv.addConditionalFormatting({
    ref: 'A2:F6',
    rules: [
      {
        type: 'expression',
        priority: 1,
        formulae: ['AND($F2="Pending",$D2<TODAY())'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } },
          font: { color: { argb: 'FF991B1B' } },
        },
      },
    ],
  });
  styleHeaderRow(wsInv, 1, 6);
  wsInv.views = [{ state: 'frozen', ySplit: 1 }];
  setColWidths(wsInv, [14, 14, 24, 16, 18, 16]);

  // 6. Monthly Summary (Student Practice — Blank formula cells)
  const wsSummary = wb.addWorksheet('Monthly Summary');
  wsSummary.addRow(['MONTHLY PROCUREMENT SUMMARY — ENTER YOUR FORMULAS IN COLUMN B']);
  wsSummary.getRow(1).font = TITLE_FONT;
  wsSummary.addRow(['Metric', 'Your Formula', 'Hint']);
  styleHeaderRow(wsSummary, 2, 3);
  wsSummary.addRow(['Total PO Value', null, "Use =SUM('Purchase Register'!H2:H7)"]);
  wsSummary.addRow(['Total PO Count', null, "Use =COUNTA('Purchase Register'!A2:A7)"]);
  wsSummary.addRow(['IT Department Spend', null, "Use =SUMIF('Purchase Register'!E2:E7,\"IT\",'Purchase Register'!H2:H7)"]);
  wsSummary.addRow(['Delayed Deliveries', null, "Use =COUNTIF('Delivery Tracker'!E2:E7,\"Delayed\")"]);
  wsSummary.addRow(['Pending Invoice Value', null, "Use =SUMIF('Invoice Tracker'!F2:F6,\"Pending\",'Invoice Tracker'!E2:E6)"]);
  setColWidths(wsSummary, [28, 22, 62]);

  // 7. Completed Reference
  const wsRef = wb.addWorksheet('Completed Reference');
  wsRef.addRow(['COMPLETED PROCUREMENT OPERATIONS SUMMARY (VERIFIED LIVE FORMULAS)']);
  wsRef.getRow(1).font = TITLE_FONT;
  wsRef.addRow(['Metric', 'Calculated Result', 'Formula']);
  styleHeaderRow(wsRef, 2, 3);
  const totalPoVal = poData.reduce((s, p) => s + p[5] * p[6], 0);
  const itVal = poData.filter((p) => p[4] === 'IT').reduce((s, p) => s + p[5] * p[6], 0);
  const refMetrics: [string, string, number, string][] = [
    ['Total PO Value', "SUM('Purchase Register'!H2:H7)", totalPoVal, INR_FMT],
    ['Total PO Count', "COUNTA('Purchase Register'!A2:A7)", poData.length, '#,##0'],
    ['IT Department Spend', 'SUMIF(\'Purchase Register\'!E2:E7,"IT",\'Purchase Register\'!H2:H7)', itVal, INR_FMT],
    ['Delayed Deliveries', 'COUNTIF(\'Delivery Tracker\'!E2:E7,"Delayed")', 1, '#,##0'],
    ['Pending Invoice Value', 'SUMIF(\'Invoice Tracker\'!F2:F6,"Pending",\'Invoice Tracker\'!E2:E6)', 106000, INR_FMT],
  ];
  refMetrics.forEach(([label, formula, res, fmt]) => {
    const row = wsRef.addRow([label, { formula, result: res }, `=${formula}`]);
    row.getCell(2).numFmt = fmt;
  });
  setColWidths(wsRef, [28, 22, 62]);

  const buf = await toBuffer(wb);
  cache.set(11, buf);
  return buf;
}

// ============================================================================
// MODULE 12 — AI with Excel, Automation & Final Project
// ============================================================================
export async function getModule12PracticeWorkbookBuffer(): Promise<Buffer> {
  const hit = cache.get(12);
  if (hit) return hit;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Learn with ABHI';

  // 1. Project Instructions + Evaluation Checklist
  const wsInst = wb.addWorksheet('Project Instructions');
  addInstructionBlock(wsInst, 'LEARN WITH ABHI — MODULE 12 FINAL PROJECT: COMPLETE PROCUREMENT MANAGEMENT & REPORTING SYSTEM', [
    ['Project Goal:', 'Combine all skills from Modules 1–11 (Formatting, Formulas, Functions, Lookups, Tables, Data Validation, Data Cleaning, Conditional Formatting, PivotTables, Dashboards, Power Query, and Responsible AI verification) into one job-ready workbook.'],
    ['AI Subscription Needed?:', 'None. Complete the entire project offline in Excel or with free AI prompt verification guidelines.'],
    [''],
    ['12-POINT FINAL PROJECT EVALUATION CHECKLIST'],
    ['1. Supplier & Buyer Masters', 'Clean unique IDs (SUP001–SUP006, BUY01–BUY04) with zero duplicates or trailing spaces.'],
    ['2. Purchase Requisition & PO Register', 'Live line totals (=Quantity*Unit Price) and dropdown validation for Department and Status.'],
    ['3. Supplier & Buyer Lookups', 'Auto-populate Supplier Name and Payment Terms using VLOOKUP/IFERROR or XLOOKUP.'],
    ['4. Automated Value Classification', 'Use =IF(Amount>50000,"High Value","Standard") to flag executive approvals.'],
    ['5. Delivery & Invoice Tracking', 'Track expected vs. actual delivery and invoice due dates using TODAY() logic.'],
    ['6. Conditional Formatting Alerts', 'Highlight High Value orders, Delayed deliveries, and Overdue Unpaid invoices.'],
    ['7. Expense & KPI Summary', 'Calculate Total Spend, Avg Order Value, Completed Count, Pending Spend via SUM/AVERAGE/COUNTIF/SUMIF.'],
    ['8. PivotTable Analysis (in Excel)', 'Insert PivotTables from the Sample Data PO table summarizing spend by Department, Supplier, and Buyer.'],
    ['9. Executive Dashboard (in Excel)', 'Attach Line/Column/Bar charts to the summary tables and add Slicers for interactive filtering.'],
    ['10. Power Query Workflow', 'Load Sample Data into Power Query (Data -> From Table/Range), trim text, set types, and test Refresh All.'],
    ['11. Safe Macro Practice (Optional)', 'Record a simple formatting macro on a copy saved as .xlsm; never run untrusted macros.'],
    ['12. Responsible AI Audit', 'Verify every formula on known rows; never share confidential employee or supplier data with external AI tools.'],
  ]);
  setColWidths(wsInst, [34, 88]);

  // 2. Sample Data (Supplier Master + Buyer Master + 10 Procurement Transactions)
  const wsSample = wb.addWorksheet('Sample Data');
  wsSample.addRow(['SUPPLIER MASTER (A2:E7)']);
  wsSample.getRow(1).font = SECTION_FONT;
  wsSample.addRow(['Supplier ID', 'Supplier Name', 'City', 'Category', 'Payment Terms']);
  styleHeaderRow(wsSample, 2, 5);
  const suppliers: [string, string, string, string, string][] = [
    ['SUP001', 'ABC Technologies', 'Pune', 'IT', '30 Days'],
    ['SUP002', 'Global Supplies', 'Mumbai', 'Office Supplies', '15 Days'],
    ['SUP003', 'Tech Solutions', 'Bengaluru', 'IT', '45 Days'],
    ['SUP004', 'Paper World', 'Hyderabad', 'Stationery', '30 Days'],
    ['SUP005', 'Metro Systems', 'Chennai', 'Operations', '30 Days'],
    ['SUP006', 'Prime Logistics', 'Delhi', 'Logistics', '30 Days'],
  ];
  suppliers.forEach((s) => wsSample.addRow(s));

  wsSample.addRow([]);
  wsSample.addRow(['PROCUREMENT TRANSACTIONS (A11:I20) — PO, DELIVERY & INVOICE SAMPLE DATA']);
  wsSample.getRow(10).font = SECTION_FONT;
  wsSample.addRow([
    'PO Number',
    'PR Ref',
    'Supplier ID',
    'Buyer',
    'Department',
    'Quantity',
    'Unit Price',
    'Due Date',
    'Status',
  ]);
  styleHeaderRow(wsSample, 11, 9);

  const txRows: [string, string, string, string, string, number, number, Date, string][] = [
    ['PO-1201', 'PR-101', 'SUP001', 'Aarav Mehta', 'IT', 5, 14000, new Date('2026-01-25'), 'Pending'],
    ['PO-1202', 'PR-102', 'SUP002', 'Priya Nair', 'HR', 30, 600, new Date('2026-02-05'), 'Completed'],
    ['PO-1203', 'PR-103', 'SUP003', 'Aarav Mehta', 'IT', 2, 36000, new Date('2026-02-10'), 'Completed'],
    ['PO-1204', 'PR-104', 'SUP004', 'Rohan Kulkarni', 'Finance', 50, 260, new Date('2026-02-15'), 'Completed'],
    ['PO-1205', 'PR-105', 'SUP005', 'Sneha Iyer', 'Operations', 12, 4500, new Date('2026-02-18'), 'Pending'],
    ['PO-1206', 'PR-106', 'SUP006', 'Sneha Iyer', 'Operations', 8, 3800, new Date('2026-02-25'), 'Completed'],
    ['PO-1207', 'PR-107', 'SUP001', 'Aarav Mehta', 'IT', 4, 16500, new Date('2026-03-02'), 'Pending'],
    ['PO-1208', 'PR-108', 'SUP002', 'Priya Nair', 'Admin', 20, 750, new Date('2026-03-08'), 'Completed'],
    ['PO-1209', 'PR-109', 'SUP003', 'Rohan Kulkarni', 'IT', 3, 22000, new Date('2026-03-14'), 'Completed'],
    ['PO-1210', 'PR-110', 'SUP005', 'Sneha Iyer', 'Operations', 6, 5200, new Date('2026-12-30'), 'Pending'],
  ];
  txRows.forEach((t) => {
    const row = wsSample.addRow(t);
    row.getCell(7).numFmt = INR_FMT;
    row.getCell(8).numFmt = 'yyyy-mm-dd';
  });
  setColWidths(wsSample, [14, 12, 14, 18, 15, 11, 14, 14, 14]);

  // 3. Blank Student Project (structured template with blank formula cells + dropdowns)
  const wsBlank = wb.addWorksheet('Blank Student Project');
  wsBlank.addRow(['FINAL PROJECT WORKSPACE — COMPLETE ALL FORMULAS, LOOKUPS & ALERTS']);
  wsBlank.getRow(1).font = TITLE_FONT;
  wsBlank.addRow([
    'PO Number',
    'Supplier ID',
    'Supplier Name (VLOOKUP/XLOOKUP)',
    'Department',
    'Quantity',
    'Unit Price',
    'Total Amount (=E*F)',
    'Value Tier (IF >50000)',
    'Due Date',
    'Status',
  ]);
  styleHeaderRow(wsBlank, 2, 10);
  txRows.forEach((t) => {
    const row = wsBlank.addRow([t[0], t[2], null, t[4], t[5], t[6], null, null, t[7], t[8]]);
    row.getCell(6).numFmt = INR_FMT;
    row.getCell(9).numFmt = 'yyyy-mm-dd';
    row.getCell(10).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Completed,Pending,In Transit,Cancelled"'],
    };
  });
  wsBlank.addRow([]);
  wsBlank.addRow(['EXECUTIVE KPI SUMMARY (ENTER FORMULAS IN COLUMN B)']);
  wsBlank.getRow(14).font = SECTION_FONT;
  wsBlank.addRow(['Total Procurement Spend', null]);
  wsBlank.addRow(['Average Order Value', null]);
  wsBlank.addRow(['Completed Orders', null]);
  wsBlank.addRow(['Pending Spend Value', null]);
  wsBlank.addRow(['High Value Orders (> ₹50,000)', null]);
  setColWidths(wsBlank, [14, 13, 28, 14, 11, 14, 18, 22, 14, 14]);

  // 4. Completed Reference Project (Live formulas + Conditional Formatting + KPI Summary + Dept Breakdown)
  const wsRef = wb.addWorksheet('Completed Reference Project');
  wsRef.addRow(['COMPLETED FINAL PROJECT REFERENCE — PROCUREMENT MANAGEMENT & REPORTING SYSTEM']);
  wsRef.getRow(1).font = TITLE_FONT;
  wsRef.addRow([
    'PO Number',
    'Supplier ID',
    'Supplier Name',
    'Department',
    'Quantity',
    'Unit Price',
    'Total Amount',
    'Value Tier',
    'Due Date',
    'Status',
  ]);
  styleHeaderRow(wsRef, 2, 10);

  const supMap = new Map(suppliers.map((s) => [s[0], s[1]]));
  let totalSpend = 0;
  let pendingSpend = 0;
  let completedCount = 0;
  let highValueCount = 0;

  txRows.forEach((t, idx) => {
    const r = idx + 3;
    const amt = t[5] * t[6];
    const tier = amt > 50000 ? 'High Value' : 'Standard';
    totalSpend += amt;
    if (t[8] === 'Pending') pendingSpend += amt;
    if (t[8] === 'Completed') completedCount++;
    if (amt > 50000) highValueCount++;

    const row = wsRef.addRow([
      t[0],
      t[2],
      {
        formula: `IFERROR(VLOOKUP(B${r},'Sample Data'!$A$3:$E$8,2,FALSE),"Not Found")`,
        result: supMap.get(t[2]) || 'Not Found',
      },
      t[4],
      t[5],
      t[6],
      { formula: `E${r}*F${r}`, result: amt },
      { formula: `IF(G${r}>50000,"High Value","Standard")`, result: tier },
      t[7],
      t[8],
    ]);
    row.getCell(6).numFmt = INR_FMT;
    row.getCell(7).numFmt = INR_FMT;
    row.getCell(9).numFmt = 'yyyy-mm-dd';
  });

  // Conditional Formatting: Overdue Pending orders highlighted in red, High Value highlighted bold amber
  wsRef.addConditionalFormatting({
    ref: 'A3:J12',
    rules: [
      {
        type: 'expression',
        priority: 1,
        formulae: ['AND($J3="Pending",$I3<TODAY())'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } },
          font: { color: { argb: 'FF991B1B' } },
        },
      },
    ],
  });
  wsRef.addConditionalFormatting({
    ref: 'H3:H12',
    rules: [
      {
        type: 'expression',
        priority: 2,
        formulae: ['H3="High Value"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFF4EC' } },
          font: { bold: true, color: { argb: 'FFB45309' } },
        },
      },
    ],
  });

  wsRef.addRow([]);
  wsRef.addRow(['EXECUTIVE KPI SUMMARY', 'Calculated Value', 'Formula']);
  styleHeaderRow(wsRef, 14, 3);
  const kpiRows: [string, string, number, string][] = [
    ['Total Procurement Spend', 'SUM(G3:G12)', totalSpend, INR_FMT],
    ['Average Order Value', 'AVERAGE(G3:G12)', Math.round(totalSpend / txRows.length), INR_FMT],
    ['Completed Orders', 'COUNTIF(J3:J12,"Completed")', completedCount, '#,##0'],
    ['Pending Spend Value', 'SUMIF(J3:J12,"Pending",G3:G12)', pendingSpend, INR_FMT],
    ['High Value Orders (> ₹50,000)', 'COUNTIF(H3:H12,"High Value")', highValueCount, '#,##0'],
  ];
  kpiRows.forEach(([label, formula, res, fmt]) => {
    const row = wsRef.addRow([label, { formula, result: res }, `=${formula}`]);
    row.getCell(2).numFmt = fmt;
    row.getCell(2).fill = SUBHEADER_FILL;
    row.getCell(2).font = { bold: true };
  });

  wsRef.views = [{ state: 'frozen', ySplit: 2 }];
  setColWidths(wsRef, [28, 16, 24, 14, 11, 14, 18, 18, 14, 14]);

  const buf = await toBuffer(wb);
  cache.set(12, buf);
  return buf;
}
