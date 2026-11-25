import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { AbhiJobsWordmarkSVG } from '../components/AbhiJobsLogo';
import { verifyCertificatePublic } from '../services/certificateService';
import { formatCertificateDate } from '../services/certificatePdfGenerator';
import { CertificateVerificationResult } from '../types/learning';

interface CertificateVerificationPageProps {
  navigate: (route: string) => void;
  initialCertificateId?: string;
}

/**
 * Public ABHI JOBS Certificate Verification Page (/verify-certificate and /verify-certificate/:certificateId).
 * Accessible without sign-in. Strictly displays ONLY:
 * - Certificate Validity Status
 * - Candidate Name
 * - Course Name
 * - Certificate ID
 * - Issue Date
 * Never exposes candidate contact info, personal profile details, or assessment answers.
 */
export const CertificateVerificationPage: React.FC<CertificateVerificationPageProps> = ({
  navigate,
  initialCertificateId,
}) => {
  const [inputId, setInputId] = useState(initialCertificateId || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [checkedId, setCheckedId] = useState<string | null>(null);
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);

  const runVerification = async (rawId: string) => {
    const trimmed = rawId.trim().toUpperCase();
    if (!trimmed) {
      setResult(null);
      setCheckedId(null);
      return;
    }

    setIsVerifying(true);
    setCheckedId(trimmed);
    try {
      const outcome = await verifyCertificatePublic(trimmed);
      setResult(outcome);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (initialCertificateId && initialCertificateId.trim()) {
      const clean = initialCertificateId.trim().toUpperCase();
      setInputId(clean);
      void runVerification(clean);
    }
  }, [initialCertificateId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runVerification(inputId);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate('/learning')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#566479] hover:text-[#102B4E] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Learn with ABHI</span>
        </button>

        {/* Verification Header & Search Card */}
        <section className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 space-y-6">
          <div className="space-y-3 border-b border-[#E5EAF0] pb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <AbhiJobsWordmarkSVG theme="color" className="h-6 sm:h-7 w-auto" />
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102B4E]">
                <ShieldCheck className="w-4 h-4 text-[#C59B43]" />
                <span>Official Credential Verification</span>
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#102B4E] tracking-tight">
              Verify an ABHI JOBS Certificate
            </h1>
            <p className="text-sm text-[#566479] leading-relaxed">
              Enter the unique Certificate ID printed on a Learn with ABHI certificate or scan its QR code to confirm authenticity.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label
              htmlFor="certificate-id-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#566479]"
            >
              Certificate ID
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="certificate-id-input"
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value.toUpperCase())}
                placeholder="e.g. ABHI-2026-K8M4P9Q2"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-h-[48px] px-4 py-3 rounded-xl border border-[#D4DCE6] bg-[#FAFBFD] focus:bg-white focus:border-[#102B4E] focus:outline-none text-sm font-semibold text-[#102B4E] tabular-nums tracking-wide"
              />
              <button
                type="submit"
                disabled={isVerifying || !inputId.trim()}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-[#C59B43]" />
                    <span>Verify Certificate</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Verification Result Area */}
          {isVerifying && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-sm text-[#566479]">
              <Loader2 className="w-6 h-6 animate-spin text-[#102B4E]" />
              <span>Checking official ABHI JOBS credential registry...</span>
            </div>
          )}

          {!isVerifying && result && (
            <div
              role="status"
              className={`rounded-2xl border p-5 sm:p-6 space-y-5 ${
                result.status === 'valid'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : result.status === 'revoked'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-red-50/60 border-red-200'
              }`}
            >
              {/* Status Header (Explicit Icon + Text) */}
              <div className="flex items-start gap-3">
                {result.status === 'valid' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                ) : result.status === 'revoked' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
                )}

                <div className="space-y-0.5 min-w-0">
                  <p
                    className={`font-display text-base sm:text-lg font-extrabold ${
                      result.status === 'valid'
                        ? 'text-emerald-900'
                        : result.status === 'revoked'
                        ? 'text-amber-900'
                        : 'text-red-900'
                    }`}
                  >
                    {result.status === 'valid'
                      ? 'Valid Certificate'
                      : result.status === 'revoked'
                      ? 'Certificate Revoked'
                      : 'Certificate Not Found'}
                  </p>
                  <p
                    className={`text-xs sm:text-sm ${
                      result.status === 'valid'
                        ? 'text-emerald-800'
                        : result.status === 'revoked'
                        ? 'text-amber-800'
                        : 'text-red-800'
                    }`}
                  >
                    {result.status === 'valid'
                      ? 'This certificate was officially issued by Learn with ABHI (ABHI JOBS) and is currently valid.'
                      : result.status === 'revoked'
                      ? 'This certificate record exists but is no longer active.'
                      : `No certificate matching "${checkedId}" was found in the ABHI JOBS registry. Please verify the ID and try again.`}
                  </p>
                </div>
              </div>

              {/* Strictly Minimal Public Verification Fields (Zero PII / Zero Assessment Answers) */}
              {result.found && result.certificate && (
                <dl className="bg-white rounded-xl border border-[#E5EAF0] divide-y divide-[#E5EAF0]">
                  <div className="px-4 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[#778397]">
                      Candidate Name
                    </dt>
                    <dd className="sm:col-span-2 text-sm font-bold text-[#102B4E]">
                      {result.certificate.candidateName}
                    </dd>
                  </div>

                  <div className="px-4 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[#778397]">
                      Course Name
                    </dt>
                    <dd className="sm:col-span-2 text-sm font-bold text-[#102B4E]">
                      {result.certificate.courseTitle}
                    </dd>
                  </div>

                  <div className="px-4 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[#778397]">
                      Certificate ID
                    </dt>
                    <dd className="sm:col-span-2 text-sm font-bold text-[#102B4E] tabular-nums">
                      {result.certificate.certificateId}
                    </dd>
                  </div>

                  <div className="px-4 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[#778397]">
                      Issue Date
                    </dt>
                    <dd className="sm:col-span-2 text-sm font-semibold text-[#102B4E]">
                      {formatCertificateDate(result.certificate.issueDate)}
                    </dd>
                  </div>

                  <div className="px-4 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[#778397]">
                      Certificate Status
                    </dt>
                    <dd className="sm:col-span-2 text-sm font-bold">
                      {result.certificate.status === 'valid' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Valid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Revoked</span>
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-[#778397]">
          For privacy protection, public verification displays only the recipient&apos;s name, course title, certificate ID, issue date, and validity status.
        </p>
      </div>
    </div>
  );
};

export default CertificateVerificationPage;
