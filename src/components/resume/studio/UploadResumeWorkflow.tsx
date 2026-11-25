import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ResumeData } from '../../../types/resume';
import {
  extractTextFromResumeFile,
  parseStructuredResumeText,
  validateResumeFile,
  ParsedResumeResult,
} from '../../../services/resumeParserService';
import { ParsedResumeReviewPanel } from './ParsedResumeReviewPanel';
import { EASE_PREMIUM } from '../../../lib/motion';
import {
  ArrowLeft,
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface UploadResumeWorkflowProps {
  onBack: () => void;
  onConfirmImport: (data: Partial<ResumeData>, goTo: 'wizard' | 'templates') => void;
}

export const UploadResumeWorkflow: React.FC<UploadResumeWorkflowProps> = ({
  onBack,
  onConfirmImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedResumeResult | null>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    const validation = validateResumeFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file.');
      return;
    }

    setUploadedFileName(file.name);
    setIsExtracting(true);
    try {
      const rawText = await extractTextFromResumeFile(file);
      const parsed = parseStructuredResumeText(rawText);
      setParsedResult(parsed);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Unable to extract text from this file. Please try another PDF or DOCX.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  if (parsedResult) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#778397] hover:text-[#102B4E] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Starting Options</span>
        </button>

        <ParsedResumeReviewPanel
          parsed={parsedResult}
          sourceLabel={uploadedFileName || 'Uploaded Resume'}
          onBack={() => setParsedResult(null)}
          onConfirm={onConfirmImport}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_PREMIUM }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#778397] hover:text-[#102B4E] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Starting Options</span>
      </button>

      <div className="bg-white rounded-xl border border-[#E5EAF0] p-5 sm:p-6 shadow-2xs space-y-6">
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#102B4E]/[0.06] border border-[#102B4E]/15 text-[#102B4E] flex items-center justify-center mx-auto">
            <Upload className="w-7 h-7 text-[#F47A24]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#102B4E] tracking-tight">
            Upload Your Existing Resume
          </h2>
          <p className="text-xs sm:text-sm text-[#778397] leading-relaxed">
            Upload a PDF or Word (.docx) document. ABHI JOBS extracts your information locally in your browser and organizes it into editable sections for review.
          </p>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isExtracting && fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-6 sm:p-7 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-[#F47A24] bg-[#F47A24]/5'
              : 'border-[#CBD5E1] hover:border-[#102B4E] bg-[#F6F8FB]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="hidden"
          />

          {isExtracting ? (
            <div className="space-y-3 py-4">
              <Loader2 className="w-8 h-8 text-[#F47A24] animate-spin mx-auto" />
              <div className="text-sm font-bold text-[#102B4E]">
                Extracting sections from {uploadedFileName}...
              </div>
              <p className="text-xs text-[#778397]">
                Identifying your contact details, experience, education, and skills.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5EAF0] shadow-2xs flex items-center justify-center mx-auto text-[#102B4E]">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-[#102B4E]">
                  Drop your PDF or DOCX file here, or click to browse
                </div>
                <p className="text-xs text-[#778397]">
                  Supported formats: .pdf, .docx · Max size: 10 MB
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#102B4E] text-white text-xs sm:text-sm font-bold">
                  Choose Resume File
                </span>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] flex items-start gap-2.5 text-xs text-[#778397]">
          <ShieldCheck className="w-4 h-4 text-[#102B4E] shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#102B4E]">Privacy &amp; Accuracy First:</strong> Text is extracted privately in your browser. Any unclear lines are shown for your review so nothing is silently dropped or invented.
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default UploadResumeWorkflow;
