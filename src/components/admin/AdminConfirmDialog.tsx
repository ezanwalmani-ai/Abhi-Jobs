import React from 'react';
import { AlertTriangle, ShieldAlert, Info, X, Loader2 } from 'lucide-react';

export interface AdminConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
  busy?: boolean;
  details?: { label: string; value: string }[];
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  tone = 'warning',
  busy = false,
  details,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const toneStyles =
    tone === 'danger'
      ? {
          iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
          Icon: ShieldAlert,
        }
      : tone === 'warning'
      ? {
          iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
          confirmBtn: 'bg-[#102B4E] hover:bg-[#081D36] text-white',
          Icon: AlertTriangle,
        }
      : {
          iconBg: 'bg-blue-50 text-[#102B4E] border-blue-200',
          confirmBtn: 'bg-[#102B4E] hover:bg-[#081D36] text-white',
          Icon: Info,
        };

  const IconComp = toneStyles.Icon;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#081D36]/55 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-dialog-title"
    >
      <div className="bg-white rounded-xl border border-[#E5EAF0] shadow-xl w-full max-w-[min(480px,calc(100vw-2rem))] overflow-hidden">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${toneStyles.iconBg}`}
              >
                <IconComp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3
                  id="admin-confirm-dialog-title"
                  className="text-base font-bold text-[#102B4E] leading-snug"
                >
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              aria-label="Close confirmation dialog"
              className="min-w-[36px] min-h-[36px] rounded-lg text-[#64748B] hover:text-[#102B4E] hover:bg-[#F6F8FB] flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {details && details.length > 0 && (
            <div className="rounded-lg bg-[#FAFBFD] border border-[#E5EAF0] divide-y divide-[#E5EAF0] text-xs">
              {details.map((item) => (
                <div key={item.label} className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <span className="text-[#64748B] font-medium">{item.label}</span>
                  <span className="text-[#102B4E] font-semibold text-right break-all">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 py-3.5 bg-[#FAFBFD] border-t border-[#E5EAF0] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-[42px] px-4 py-2 rounded-lg bg-white border border-[#D4DCE6] hover:bg-[#F6F8FB] text-[#102B4E] text-sm font-semibold transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`min-h-[42px] px-5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 ${toneStyles.confirmBtn}`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
