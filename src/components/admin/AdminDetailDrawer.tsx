import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { sanitizeRecordForAdminDisplay } from '../../services/adminPanelService';

export interface AdminDetailDrawerProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  record: Record<string, unknown> | null;
  onClose: () => void;
  footer?: React.ReactNode;
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function safeStringify(val: unknown): string {
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

function renderFieldValue(val: unknown): React.ReactNode {
  if (val === null || val === undefined || val === '') {
    return <span className="text-slate-400 italic">Not set</span>;
  }
  if (typeof val === 'boolean') {
    return (
      <span className={val ? 'text-emerald-700 font-semibold' : 'text-slate-600 font-medium'}>
        {val ? 'Yes' : 'No'}
      </span>
    );
  }
  if (typeof val === 'number') {
    return <span className="font-mono tabular-nums text-[#081D36]">{val.toLocaleString()}</span>;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-slate-400 italic">None</span>;
    const isSimple = val.every((v) => typeof v === 'string' || typeof v === 'number');
    if (isSimple) {
      return <span className="text-slate-700 break-words">{val.join(' · ')}</span>;
    }
    return (
      <pre className="text-[11px] font-mono bg-[#FAFBFD] border border-[#E5EAF0] rounded-lg p-2.5 overflow-x-auto text-slate-700 max-h-48">
        {safeStringify(val)}
      </pre>
    );
  }
  if (typeof val === 'object') {
    return (
      <pre className="text-[11px] font-mono bg-[#FAFBFD] border border-[#E5EAF0] rounded-lg p-2.5 overflow-x-auto text-slate-700 max-h-48">
        {safeStringify(val)}
      </pre>
    );
  }
  return <span className="text-slate-800 break-words whitespace-pre-wrap">{String(val)}</span>;
}

export const AdminDetailDrawer: React.FC<AdminDetailDrawerProps> = ({
  isOpen,
  title,
  subtitle,
  record,
  onClose,
  footer,
}) => {
  if (!isOpen || !record) return null;

  const safeRecord = sanitizeRecordForAdminDisplay(record);
  const entries = Object.entries(safeRecord);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#081D36]/50 backdrop-blur-[1px] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-detail-drawer-title"
    >
      <div className="bg-white w-full max-w-[min(560px,100vw)] h-full flex flex-col border-l border-[#E5EAF0] shadow-2xl">
        <div className="px-5 py-4 bg-[#081D36] text-white flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h3 id="admin-detail-drawer-title" className="text-base font-bold text-white tracking-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-300 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail inspector"
            className="min-w-[40px] min-h-[40px] rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-2.5 bg-[#FAFBFD] border-b border-[#E5EAF0] flex items-center gap-2 text-[11px] text-slate-600 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Sanitized view · Passwords, tokens, and secret keys are automatically excluded.</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 divide-y divide-[#E5EAF0]">
          {entries.map(([key, value]) => (
            <div key={key} className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-3 text-xs">
              <div className="font-semibold text-slate-500">{formatFieldLabel(key)}</div>
              <div className="sm:col-span-2 min-w-0">{renderFieldValue(value)}</div>
            </div>
          ))}
        </div>

        {footer && (
          <div className="px-5 py-3.5 bg-[#FAFBFD] border-t border-[#E5EAF0] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
