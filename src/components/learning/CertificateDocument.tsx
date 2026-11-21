import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import { CourseCertificateRecord } from '../../types/learning';
import { AbhiJobsWordmarkSVG } from '../AbhiJobsLogo';
import {
  downloadCertificatePdf,
  formatCertificateDate,
  generateCertificateQrDataUrl,
} from '../../services/certificatePdfGenerator';

interface CertificateDocumentProps {
  certificate: CourseCertificateRecord;
}

/**
 * Premium Printable A4 Landscape (297:210) Course Completion Certificate.
 * Crisp white canvas, deep navy blue (#102B4E) & subtle antique gold (#C59B43) accents.
 */
export const CertificateDocument: React.FC<CertificateDocumentProps> = ({
  certificate,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    generateCertificateQrDataUrl(certificate.certificateId)
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [certificate.certificateId]);

  const formattedCompletionDate = formatCertificateDate(certificate.completionDate);

  return (
    <article
      aria-label={`Certificate of Completion for ${certificate.candidateName}`}
      className="certificate-sheet relative w-full bg-white text-[#102B4E] shadow-sm border border-[#E5EAF0] aspect-[297/210] overflow-hidden select-text"
    >
      {/* Outer Navy Architectural Frame */}
      <div className="absolute inset-3 sm:inset-5 border-[2.5px] border-[#102B4E] pointer-events-none" />
      {/* Inner Subtle Antique Gold Frame */}
      <div className="absolute inset-4.5 sm:inset-7 border border-[#C59B43] pointer-events-none" />

      {/* Four Subtle Corner Accents */}
      <span
        aria-hidden="true"
        className="absolute top-6 left-6 sm:top-9 sm:left-9 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-l-2 border-[#102B4E] pointer-events-none"
      />
      <span
        aria-hidden="true"
        className="absolute top-6 right-6 sm:top-9 sm:right-9 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-r-2 border-[#102B4E] pointer-events-none"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-6 left-6 sm:bottom-9 sm:left-9 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-l-2 border-[#102B4E] pointer-events-none"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-6 right-6 sm:bottom-9 sm:right-9 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-r-2 border-[#102B4E] pointer-events-none"
      />

      {/* Certificate Interior Grid */}
      <div className="relative h-full w-full px-7 py-6 sm:px-14 sm:py-10 md:px-16 md:py-11 flex flex-col justify-between">
        {/* Top Row: Official ABHI JOBS Brand Lockup */}
        <header className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
          <AbhiJobsWordmarkSVG theme="color" className="h-5 sm:h-7 md:h-8 w-auto" />
          <p className="text-[8px] sm:text-[10px] font-semibold tracking-[0.22em] text-[#6B7A90] uppercase">
            Learn with ABHI · Career Development Academy
          </p>
          <div className="w-16 sm:w-24 h-px bg-[#C59B43] mt-0.5" aria-hidden="true" />
        </header>

        {/* Center: Formal Title, Candidate Name, Course Name & Structured Metrics */}
        <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3.5 my-auto py-1">
          <h2 className="font-certificate-serif text-xl sm:text-3xl md:text-[40px] font-bold text-[#102B4E] leading-none tracking-tight">
            Certificate of Completion
          </h2>

          <p className="text-[10px] sm:text-xs md:text-sm text-[#566479] font-medium">
            This is to certify that
          </p>

          <div className="space-y-1 sm:space-y-1.5 max-w-[88%]">
            <p className="font-certificate-serif text-lg sm:text-3xl md:text-[36px] font-bold text-[#102B4E] leading-tight break-words">
              {certificate.candidateName}
            </p>
            <div
              className="mx-auto w-36 sm:w-64 h-px bg-[#E5D5AE]"
              aria-hidden="true"
            />
          </div>

          <p className="text-[9.5px] sm:text-xs md:text-sm text-[#566479] max-w-[60ch] leading-snug">
            has successfully completed all required lessons, module quizzes, and final assessment for
          </p>

          <h3 className="font-display text-sm sm:text-lg md:text-[22px] font-extrabold text-[#102B4E] tracking-tight max-w-[85%] leading-snug">
            {certificate.courseTitle}
          </h3>

          {/* Structured Metadata Strip */}
          <div className="w-full max-w-2xl border-y border-[#E5EAF0] py-2 sm:py-3 mt-1 grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="min-w-0">
              <p className="text-[7px] sm:text-[9px] font-semibold uppercase tracking-[0.14em] text-[#778397]">
                Completion Date
              </p>
              <p className="text-[10px] sm:text-xs md:text-sm font-bold text-[#102B4E] mt-0.5 truncate">
                {formattedCompletionDate}
              </p>
            </div>
            <div className="min-w-0 border-x border-[#E5EAF0] px-1">
              <p className="text-[7px] sm:text-[9px] font-semibold uppercase tracking-[0.14em] text-[#778397]">
                Final Assessment Score
              </p>
              <p className="text-[10px] sm:text-xs md:text-sm font-bold text-[#102B4E] mt-0.5 tabular-nums">
                {certificate.finalAssessmentScore}% (Passed)
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[7px] sm:text-[9px] font-semibold uppercase tracking-[0.14em] text-[#778397]">
                Certificate ID
              </p>
              <p className="text-[9.5px] sm:text-xs md:text-sm font-bold text-[#102B4E] mt-0.5 tabular-nums truncate">
                {certificate.certificateId}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Row: Authorized Signature | Gold Seal | QR Code Verification */}
        <footer className="grid grid-cols-3 items-end gap-2 sm:gap-6 pt-1">
          {/* Authorized Signature */}
          <div className="flex flex-col items-center text-center">
            <p className="font-certificate-serif italic text-sm sm:text-xl md:text-2xl text-[#102B4E] leading-none pb-1">
              Abhishek Sharma
            </p>
            <div className="w-24 sm:w-40 h-px bg-[#102B4E]" aria-hidden="true" />
            <p className="text-[8px] sm:text-[11px] font-bold text-[#102B4E] mt-1">
              Authorized Signatory
            </p>
            <p className="text-[7px] sm:text-[9.5px] text-[#778397] leading-tight">
              Director of Career Development, ABHI JOBS
            </p>
          </div>

          {/* Subtle Navy & Gold Verification Seal */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full border-2 border-[#C59B43] flex items-center justify-center p-1 bg-white">
              <div className="w-full h-full rounded-full border border-[#102B4E]/80 flex flex-col items-center justify-center text-center px-0.5">
                <span className="text-[6.5px] sm:text-[8px] font-extrabold tracking-widest text-[#102B4E] uppercase leading-tight">
                  Verified
                </span>
                <span className="text-[6px] sm:text-[7.5px] font-semibold tracking-wider text-[#C59B43] uppercase leading-tight mt-0.5">
                  ABHI JOBS
                </span>
              </div>
            </div>
          </div>

          {/* QR Code for Public Verification */}
          <div className="flex flex-col items-center text-center">
            <div className="p-1 sm:p-1.5 bg-white border border-[#E5EAF0] rounded">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code to verify certificate ${certificate.certificateId}`}
                  className="w-11 h-11 sm:w-16 sm:h-16 md:w-[70px] md:h-[70px] block"
                />
              ) : (
                <div className="w-11 h-11 sm:w-16 sm:h-16 bg-[#F6F8FB] flex items-center justify-center text-[8px] text-[#778397]">
                  QR
                </div>
              )}
            </div>
            <p className="text-[7.5px] sm:text-[9.5px] font-bold text-[#102B4E] mt-1">
              Scan to Verify
            </p>
            <p className="text-[6.5px] sm:text-[8.5px] text-[#778397] tabular-nums">
              {certificate.certificateId}
            </p>
          </div>
        </footer>
      </div>
    </article>
  );
};

interface CertificateViewerModalProps {
  certificate: CourseCertificateRecord | null;
  onClose: () => void;
  onVerifyCertificate?: (certificateId: string) => void;
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  certificate,
  onClose,
  onVerifyCertificate,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!certificate) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [certificate, onClose]);

  if (!certificate) return null;

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadCertificatePdf(certificate);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Certificate of Completion — ${certificate.courseTitle}`}
      className="certificate-print-root fixed inset-0 z-50 bg-[#081D36]/70 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-5xl max-h-[94vh] bg-white rounded-2xl border border-[#E5EAF0] shadow-2xl flex flex-col overflow-hidden">
        {/* Action Header Bar (Hidden when printing) */}
        <div className="no-print px-4 sm:px-6 py-3.5 border-b border-[#E5EAF0] bg-[#FAFBFD] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="w-5 h-5 text-[#102B4E] shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#102B4E] truncate">
                {certificate.courseTitle}
              </p>
              <p className="text-xs text-[#566479] tabular-nums flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Verified ID: {certificate.certificateId}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isDownloading}
              onClick={() => void handleDownload()}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-[#C59B43]" />
              )}
              <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            {onVerifyCertificate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onVerifyCertificate(certificate.certificateId);
                }}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Verify Link</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close certificate preview"
              className="min-h-[42px] min-w-[42px] rounded-xl border border-[#E5EAF0] bg-white hover:bg-[#F6F8FB] text-[#566479] hover:text-[#102B4E] inline-flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Certificate Canvas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-[#F2F5F9]">
          <div className="max-w-[960px] mx-auto">
            <CertificateDocument certificate={certificate} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDocument;
