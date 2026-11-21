import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { CourseCertificateRecord } from '../../types/learning';
import { loadCandidateCertificates } from '../../services/certificateService';
import {
  downloadCertificatePdf,
  formatCertificateDate,
} from '../../services/certificatePdfGenerator';
import { CertificateViewerModal } from './CertificateDocument';
import {
  cleanupOwnLegacyCourseRecords,
  purgeLegacyLocalLearningData,
} from '../../services/learningResetService';

interface MyCertificatesCardProps {
  userId: string;
  navigate: (route: string) => void;
  /** Optional external certificates list if already loaded by parent */
  certificatesOverride?: CourseCertificateRecord[];
}

export const MyCertificatesCard: React.FC<MyCertificatesCardProps> = ({
  userId,
  navigate,
  certificatesOverride,
}) => {
  const [certificates, setCertificates] = useState<CourseCertificateRecord[]>(
    certificatesOverride || []
  );
  const [isLoading, setIsLoading] = useState(!certificatesOverride);
  const [viewingCert, setViewingCert] = useState<CourseCertificateRecord | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (certificatesOverride) {
      setCertificates(certificatesOverride);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    purgeLegacyLocalLearningData(false);
    cleanupOwnLegacyCourseRecords(userId)
      .catch(() => 0)
      .then(() => loadCandidateCertificates(userId))
      .then((res) => {
        if (active) setCertificates(res.certificates);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, certificatesOverride]);

  const handleDownloadPdf = async (cert: CourseCertificateRecord) => {
    if (downloadingId) return;
    setDownloadingId(cert.certificateId);
    try {
      await downloadCertificatePdf(cert);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <section
        aria-label="My Certificates"
        className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Award className="w-4 h-4 text-[#C59B43] shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-[#102B4E] truncate">
              My Certificates
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/verify-certificate')}
            className="text-xs font-semibold text-[#566479] hover:text-[#102B4E] inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#102B4E]" />
            <span>Verify ID</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-xs text-[#778397]">
            Loading your certificates...
          </div>
        ) : certificates.length > 0 ? (
          <div className="space-y-3">
            {certificates.map((cert) => {
              const isThisDownloading = downloadingId === cert.certificateId;
              return (
                <div
                  key={cert.certificateId}
                  className="p-4 rounded-2xl border border-[#E5EAF0] bg-[#FAFBFD] space-y-3"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-xs sm:text-sm font-bold text-[#102B4E] leading-snug">
                        {cert.courseTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#566479] tabular-nums">
                        <span>Issued {formatCertificateDate(cert.completionDate)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#102B4E]">
                          {cert.certificateId}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 shrink-0 pt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingCert(cert)}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C59B43]" />
                      <span>View Certificate</span>
                    </button>

                    <button
                      type="button"
                      disabled={isThisDownloading}
                      onClick={() => void handleDownloadPdf(cert)}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-[#D4DCE6] hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                    >
                      {isThisDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>{isThisDownloading ? 'Preparing...' : 'Download PDF'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-dashed border-[#D4DCE6] bg-[#FAFBFD] text-center space-y-2.5">
            <div className="w-10 h-10 mx-auto rounded-xl bg-white border border-[#E5EAF0] flex items-center justify-center text-[#102B4E]">
              <Award className="w-5 h-5 text-[#C59B43]" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-[#102B4E]">
                No certificates earned yet
              </p>
              <p className="text-[11px] text-[#566479] leading-relaxed max-w-xs mx-auto">
                Complete all required lessons, module quizzes, and pass the final assessment with at least 70% to earn an official ABHI JOBS certificate.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/learning')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Browse Free Courses
            </button>
          </div>
        )}
      </section>

      <CertificateViewerModal
        certificate={viewingCert}
        onClose={() => setViewingCert(null)}
        onVerifyCertificate={(certId) => navigate(`/verify-certificate/${certId}`)}
      />
    </>
  );
};

export default MyCertificatesCard;
