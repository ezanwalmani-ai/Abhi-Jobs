import React, { useMemo, useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertCircle,
  Inbox,
  Download,
} from 'lucide-react';
import { exportTableToCsv, type TableCsvSubColumn } from '../../utils/csvExport';

export interface AdminColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
  minWidthClass?: string;
  csvValue?: (row: T) => unknown;
  csvColumns?: TableCsvSubColumn<T>[];
  excludeFromCsv?: boolean;
}

export interface AdminFilterOption {
  value: string;
  label: string;
}

export interface AdminDataTableProps<T> {
  key?: string | number;
  rows: T[];
  columns: AdminColumn<NoInfer<T>>[];
  rowKey: (row: NoInfer<T>) => string;
  loading?: boolean;
  error?: string | null;
  searchPlaceholder?: string;
  searchText?: (row: NoInfer<T>) => string;
  filterLabel?: string;
  filterOptions?: AdminFilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  headerActions?: React.ReactNode;
  onRowClick?: (row: NoInfer<T>) => void;
  csvExportFilename?: string;
  canExportCsv?: boolean;
  onCsvExported?: (rowCount: number, filename: string) => void;
}

export function AdminDataTable<T>({
  rows,
  columns,
  rowKey,
  loading = false,
  error = null,
  searchPlaceholder = 'Search records...',
  searchText,
  filterLabel,
  filterOptions,
  filterValue,
  onFilterChange,
  pageSize = 12,
  emptyTitle = 'No matching records found',
  emptyDescription = 'Records will appear here once stored in Firestore or after adjusting filters.',
  emptyAction,
  headerActions,
  onRowClick,
  csvExportFilename,
  canExportCsv = true,
  onCsvExported,
}: AdminDataTableProps<T>) {
  const [queryText, setQueryText] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    let list = rows;
    if (q && searchText) {
      list = list.filter((row) => String(searchText(row) ?? '').toLowerCase().includes(q));
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        const getter = col.sortValue;
        list = [...list].sort((a, b) => {
          const av = getter(a);
          const bv = getter(b);
          if (typeof av === 'number' && typeof bv === 'number') {
            return sortDir === 'asc' ? av - bv : bv - av;
          }
          return sortDir === 'asc'
            ? String(av).localeCompare(String(bv))
            : String(bv).localeCompare(String(av));
        });
      }
    }
    return list;
  }, [rows, queryText, searchText, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const hasExportableColumns = useMemo(
    () =>
      columns.some(
        (col) =>
          !col.excludeFromCsv &&
          (typeof col.csvValue === 'function' || (Array.isArray(col.csvColumns) && col.csvColumns.length > 0))
      ),
    [columns]
  );

  const showCsvExport = Boolean(csvExportFilename && canExportCsv && hasExportableColumns);

  const handleExportCsv = () => {
    if (!csvExportFilename || !canExportCsv || filteredRows.length === 0) return;
    const result = exportTableToCsv({
      columns,
      rows: filteredRows,
      filenamePrefix: csvExportFilename,
    });
    if (result.exported && onCsvExported) {
      onCsvExported(result.rowCount, result.filename);
    }
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] shadow-[0_1px_2px_rgba(16,43,78,0.03)] overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-[#E5EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFBFD]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
          {searchText && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={queryText}
                onChange={(e) => {
                  setQueryText(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full min-h-[38px] pl-9 pr-3 py-1.5 rounded-lg bg-white border border-[#D4DCE6] text-xs sm:text-sm text-[#081D36] placeholder:text-[#64748B] focus:outline-none focus:border-[#102B4E]"
              />
            </div>
          )}

          {filterOptions && onFilterChange && (
            <div className="flex items-center gap-2 shrink-0">
              {filterLabel && (
                <span className="text-xs font-medium text-[#64748B] hidden md:inline">
                  {filterLabel}
                </span>
              )}
              <select
                value={filterValue || 'all'}
                onChange={(e) => {
                  onFilterChange(e.target.value);
                  setPage(1);
                }}
                aria-label={filterLabel || 'Filter records'}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white border border-[#D4DCE6] text-xs sm:text-sm text-[#081D36] focus:outline-none focus:border-[#102B4E]"
              >
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
          <span className="text-xs font-mono tabular-nums text-[#64748B]">
            {filteredRows.length} {filteredRows.length === 1 ? 'record' : 'records'}
          </span>
          {showCsvExport && (
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={loading || filteredRows.length === 0}
              title={
                filteredRows.length === 0
                  ? 'No visible records to export'
                  : `Export ${filteredRows.length} visible ${
                      filteredRows.length === 1 ? 'record' : 'records'
                    } to CSV`
              }
              className="min-h-[40px] sm:min-h-[38px] px-3 py-1.5 rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F1F5FA] hover:border-[#102B4E]/40 text-[#102B4E] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#F47A24] shrink-0" />
              <span>Export to CSV</span>
            </button>
          )}
          {headerActions}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-4 py-3 bg-rose-50 border-b border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-[13.5px]">
          <thead>
            <tr className="border-b border-[#E5EAF0] bg-[#FAFBFD] text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 whitespace-nowrap ${col.minWidthClass || ''} ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-[#102B4E] transition-colors cursor-pointer"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5EAF0]">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="h-[44px]">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-3.5 bg-[#F1F5FA] rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length > 0 ? (
              pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`min-h-[44px] hover:bg-[#F6F8FB] transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 align-middle ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="max-w-sm mx-auto space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-[#F1F5FA] text-[#64748B] flex items-center justify-center mx-auto">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-[#102B4E]">{emptyTitle}</p>
                    <p className="text-xs text-[#64748B] leading-relaxed">{emptyDescription}</p>
                    {emptyAction && <div className="pt-2">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && filteredRows.length > pageSize && (
        <div className="px-4 py-3 border-t border-[#E5EAF0] bg-[#FAFBFD] flex items-center justify-between gap-3 text-xs text-[#475569]">
          <span className="font-mono tabular-nums">
            Showing {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredRows.length)} of {filteredRows.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-w-[36px] min-h-[36px] px-2.5 rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono tabular-nums font-semibold text-[#102B4E]">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="min-w-[36px] min-h-[36px] px-2.5 rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
