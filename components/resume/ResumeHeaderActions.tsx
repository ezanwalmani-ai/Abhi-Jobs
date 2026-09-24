import React from 'react';
import { Save, Download, ArrowDownToLine, Check, RefreshCw, AlertCircle, FileText } from 'lucide-react';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

interface ResumeHeaderActionsProps {
  saveStatus: SaveStatus;
  isDownloading: boolean;
  onSave: () => void;
  onDownloadPdf: () => void;
  onOpenImportModal: () => void;
}

export const ResumeHeaderActions: React.FC<ResumeHeaderActionsProps> = ({
  saveStatus,
  isDownloading,
  onSave,
  onDownloadPdf,
  onOpenImportModal,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 text-[#004D40] text-xs font-semibold mb-2">
          <FileText className="w-3.5 h-3.5 text-[#004D40]" />
          <span>Resume Builder</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Build Your Resume
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
          Create a professional resume using your experience, skills, education, and achievements.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start md:self-auto">
        {/* Real-time Save Status Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white text-xs font-semibold shadow-2xs">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-700">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              <span>Saved</span>
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-teal-700">
              <RefreshCw className="w-3.5 h-3.5 text-[#004D40] animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="flex items-center gap-1.5 text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Unsaved changes</span>
            </span>
          )}
        </div>

        {/* Import from profile */}
        <button
          type="button"
          onClick={onOpenImportModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowDownToLine className="w-4 h-4 text-[#004D40]" />
          <span>Import from Profile</span>
        </button>

        {/* Save button */}
        <button
          type="button"
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
        >
          <Save className="w-4 h-4 text-slate-600" />
          <span>Save Resume</span>
        </button>

        {/* Download PDF button (Visually Prominent) */}
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all hover:shadow-md cursor-pointer disabled:opacity-60"
        >
          {isDownloading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
