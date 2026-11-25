/**
 * Generates and validates all 11 static Excel Practice Workbooks (Modules 02–12)
 * for the "Excel for Job Seekers" course into public/downloads/workbooks/
 * so Netlify serves them directly as static assets (Starter-tier compatible, zero server cost).
 */
import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { getModule02PracticeWorkbookBuffer } from '../server/module02WorkbookGenerator';
import { getModule03PracticeWorkbookBuffer } from '../server/module03WorkbookGenerator';
import { getModule04PracticeWorkbookBuffer } from '../server/module04WorkbookGenerator';
import {
  getModule05PracticeWorkbookBuffer,
  getModule06PracticeWorkbookBuffer,
  getModule07PracticeWorkbookBuffer,
  getModule08PracticeWorkbookBuffer,
  getModule09PracticeWorkbookBuffer,
  getModule10PracticeWorkbookBuffer,
  getModule11PracticeWorkbookBuffer,
  getModule12PracticeWorkbookBuffer,
} from '../server/modules05To12WorkbookGenerators';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'downloads', 'workbooks');

interface WorkbookSpec {
  moduleNumber: string;
  filename: string;
  build: () => Promise<Buffer> | Buffer;
}

const WORKBOOKS: WorkbookSpec[] = [
  { moduleNumber: '02', filename: 'ABHI-Excel-Module-02-Practice-Workbook.xlsx', build: getModule02PracticeWorkbookBuffer },
  { moduleNumber: '03', filename: 'ABHI-Excel-Module-03-Practice-Workbook.xlsx', build: getModule03PracticeWorkbookBuffer },
  { moduleNumber: '04', filename: 'ABHI-Excel-Module-04-Practice-Workbook.xlsx', build: getModule04PracticeWorkbookBuffer },
  { moduleNumber: '05', filename: 'ABHI-Excel-Module-05-Practice-Workbook.xlsx', build: getModule05PracticeWorkbookBuffer },
  { moduleNumber: '06', filename: 'ABHI-Excel-Module-06-Practice-Workbook.xlsx', build: getModule06PracticeWorkbookBuffer },
  { moduleNumber: '07', filename: 'ABHI-Excel-Module-07-Practice-Workbook.xlsx', build: getModule07PracticeWorkbookBuffer },
  { moduleNumber: '08', filename: 'ABHI-Excel-Module-08-Practice-Workbook.xlsx', build: getModule08PracticeWorkbookBuffer },
  { moduleNumber: '09', filename: 'ABHI-Excel-Module-09-Practice-Workbook.xlsx', build: getModule09PracticeWorkbookBuffer },
  { moduleNumber: '10', filename: 'ABHI-Excel-Module-10-Practice-Workbook.xlsx', build: getModule10PracticeWorkbookBuffer },
  { moduleNumber: '11', filename: 'ABHI-Excel-Module-11-Practice-Workbook.xlsx', build: getModule11PracticeWorkbookBuffer },
  { moduleNumber: '12', filename: 'ABHI-Excel-Module-12-Practice-Workbook.xlsx', build: getModule12PracticeWorkbookBuffer },
];

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const results: Array<{ module: string; filename: string; bytes: number; sheets: string[] }> = [];

  for (const spec of WORKBOOKS) {
    const raw = await spec.build();
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    if (buf.length < 1000 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
      throw new Error(`Invalid XLSX/ZIP header for Module ${spec.moduleNumber}`);
    }

    const outPath = path.join(OUTPUT_DIR, spec.filename);
    fs.writeFileSync(outPath, buf);

    // Validate the written file by re-parsing it with ExcelJS
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(outPath);
    const sheetNames = wb.worksheets.map((ws) => ws.name);
    if (sheetNames.length < 2) {
      throw new Error(`Workbook ${spec.filename} has too few worksheets (${sheetNames.length})`);
    }
    results.push({
      module: spec.moduleNumber,
      filename: spec.filename,
      bytes: buf.length,
      sheets: sheetNames,
    });
  }

  console.log(`Generated and validated ${results.length} Excel workbooks in ${OUTPUT_DIR}:`);
  for (const r of results) {
    console.log(`  Module ${r.module}: ${r.filename} (${r.bytes} bytes, ${r.sheets.length} sheets: ${r.sheets.join(' | ')})`);
  }
}

main().catch((err) => {
  console.error('Workbook generation failed:', err);
  process.exit(1);
});
