import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Download, ArrowDownToLine, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { EASE_PREMIUM, AnimatedTextSwap } from '../../lib/motion';

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
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F47A24] mb-1">
          Resume Builder
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#102B4E] tracking-tight">
          Build Your Resume
        </h1>
        <p className="text-xs sm:text-sm text-[#778397] mt-1 max-w-xl">
          Edit sections on the left to watch your formatted resume preview update live without interrupting your workflow.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start md:self-auto">
        {/* Smooth Real-time Save Status Transition */}
        <div className="flex items-center px-3 py-2 min-h-[40px] rounded-xl border border-[#E5EAF0] bg-white text-xs font-semibold shadow-2xs min-w-[116px] justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {saveStatus === 'saved' && (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: EASE_PREMIUM }}
                className="flex items-center gap-1.5 text-emerald-700"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span>Saved</span>
              </motion.span>
            )}
            {saveStatus === 'saving' && (
              <motion.span
                key="saving"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: EASE_PREMIUM }}
                className="flex items-center gap-1.5 text-[#102B4E]"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#F47A24] animate-spin" />
                <span>Saving...</span>
              </motion.span>
            )}
            {saveStatus === 'unsaved' && (
              <motion.span
                key="unsaved"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: EASE_PREMIUM }}
                className="flex items-center gap-1.5 text-amber-700"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Unsaved</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Import from profile */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onOpenImportModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 bg-white hover:bg-[#F6F8FB] text-[#102B4E] text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowDownToLine className="w-4 h-4 text-[#F47A24]" />
          <span>Import from Profile</span>
        </motion.button>

        {/* Save button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 bg-white hover:bg-[#F6F8FB] text-[#102B4E] text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
        >
          <Save className="w-4 h-4 text-[#778397]" />
          <span>Save Resume</span>
        </motion.button>

        {/* Download PDF button */}
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onDownloadPdf}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
        >
          <AnimatedTextSwap stateKey={isDownloading ? 'pdf-busy' : 'pdf-ready'}>
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
          </AnimatedTextSwap>
        </motion.button>
      </div>
    </div>
  );
};
