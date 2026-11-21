import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeData } from '../../../types/resume';
import { ResumeDocumentRenderer } from '../templates/ResumeDocumentRenderer';
import {
  generateResumePdf,
  printExactTemplatePdf,
  validateResumeForPdf,
  getResumePdfFilename,
} from '../../../services/resumePdfService';
import { EASE_PREMIUM } from '../../../lib/motion';
import {
  X,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck2,
} from 'lucide-react';

interface ResumePdfPreviewModalProps {
  resume: ResumeData | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloaded?: () => void;
}

export const ResumePdfPreviewModal: React.FC<ResumePdfPreviewModalProps> = ({
  resume,
  isOpen,
  onClose,
  onDownloaded,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!resume) return null;

  const validation = validateResumeForPdf(resume);
  const fileName = getResumePdfFilename(resume);

  const handleDirectDownload = async () => {
    if (!validation.valid) {
      setErrorMessage(validation.errors[0]);
      return;
    }
    setErrorMessage(null);
    setIsGenerating(true);
    try {
      await generateResumePdf(resume);
      setDownloadSuccess(true);
      onDownloaded?.();
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to generate PDF. Please check your entries.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExactPrintPdf = () => {
    if (!validation.valid) {
      setErrorMessage(validation.errors[0]);
      return;
    }
    setErrorMessage(null);
    const ok = printExactTemplatePdf('resume-final-pdf-sheet', resume);
    if (!ok) {
      setErrorMessage('Could not initialize print preview. Use Download Vector PDF instead.');
    } else {
      onDownloaded?.();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-[#081D36]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="final-pdf-preview-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE_PREMIUM }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[calc(100vw-1.5rem)] lg:max-w-5xl bg-white rounded-3xl border border-[#E5EAF0] shadow-2xl overflow-hidden max-h-[93vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 bg-[#102B4E] text-white flex items-center justify-between gap-4 border-b-2 border-[#F47A24] shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-white/75 font-semibold">
                  <FileCheck2 className="w-4 h-4 text-[#F47A24]" />
                  <span>Final Pre-Download Review</span>
                </div>
                <h2
                  id="final-pdf-preview-title"
                  className="text-base sm:text-lg font-extrabold truncate"
                >
                  {fileName}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close final preview"
                className="p-2 rounded-xl hover:bg-white/10 text-white cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alerts */}
            {(!validation.valid || errorMessage || downloadSuccess) && (
              <div className="px-5 pt-4 space-y-2 shrink-0">
                {!validation.valid && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <strong>Before exporting:</strong> {validation.errors.join(' ')}
                    </div>
                  </div>
                )}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                {downloadSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Selectable-text A4 PDF downloaded successfully ({fileName}).</span>
                  </div>
                )}
              </div>
            )}

            {/* Full A4 Preview Canvas */}
            <div className="p-4 sm:p-6 bg-[#EFF3F8] overflow-auto flex-1 flex justify-center">
              <div className="origin-top scale-[0.42] sm:scale-[0.68] md:scale-[0.82] lg:scale-[0.9] shadow-xl bg-white shrink-0 mb-8">
                <ResumeDocumentRenderer id="resume-final-pdf-sheet" resume={resume} />
              </div>
            </div>

            {/* Footer Export Controls */}
            <div className="px-5 sm:px-6 py-4 bg-white border-t border-[#E5EAF0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <p className="text-[11px] text-[#778397]">
                Both options output crisp, selectable text formatted for A4 paper. Use{' '}
                <strong className="text-[#102B4E]">Print / Save Exact Template</strong> for exact two-column &amp; visual layout fidelity.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleExactPrintPdf}
                  disabled={!validation.valid}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#102B4E] text-[#102B4E] hover:bg-[#102B4E]/5 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Exact Layout PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDirectDownload}
                  disabled={isGenerating || !validation.valid}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Preparing PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResumePdfPreviewModal;
