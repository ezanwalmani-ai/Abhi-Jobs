/**
 * ABHI JOBS — Safe RFC 4180 CSV Builder with Spreadsheet Formula Neutralization
 * Used by admin-operations Edge Function for Super Admin CSV exports.
 */

export const EXPORT_DATASETS = [
  'jobs',
  'applications',
  'candidates',
  'employers',
  'hiring_enquiries',
  'student_progress',
] as const;

export type ExportDataset = (typeof EXPORT_DATASETS)[number];

export const MAX_EXPORT_ROWS = 5000;

export function isAllowedExportDataset(value: unknown): value is ExportDataset {
  return typeof value === 'string' && (EXPORT_DATASETS as readonly string[]).includes(value);
}

/**
 * Neutralizes spreadsheet formula injection (=, +, -, @, tab, CR)
 * and escapes quotes/commas/newlines per RFC 4180.
 */
export function escapeCsvCell(raw: unknown): string {
  if (raw === null || raw === undefined) return '';

  let str = '';
  if (Array.isArray(raw)) {
    str = raw.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join('; ');
  } else if (typeof raw === 'object') {
    str = JSON.stringify(raw);
  } else {
    str = String(raw);
  }

  // Normalize line endings inside cells
  str = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Neutralize formula triggers (leading whitespace followed by =, +, -, @, tab, CR)
  if (/^[\s]*[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  const mustQuote = /[",\n]/.test(str);
  if (mustQuote) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvColumn<T extends Record<string, unknown>> {
  header: string;
  accessor: (row: T) => unknown;
}

export function buildSafeCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[],
): string {
  const headerLine = columns.map((col) => escapeCsvCell(col.header)).join(',');
  const dataLines = rows.slice(0, MAX_EXPORT_ROWS).map((row) =>
    columns.map((col) => escapeCsvCell(col.accessor(row))).join(','),
  );

  // Prefix with UTF-8 BOM for clean Excel rendering of international text
  return `\uFEFF${[headerLine, ...dataLines].join('\r\n')}\r\n`;
}
