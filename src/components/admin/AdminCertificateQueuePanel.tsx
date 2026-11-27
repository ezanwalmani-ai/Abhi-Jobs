import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import {
  listCertificateApprovalRequestsAdmin,
  approveCertificateRequestAtomic,
  rejectCertificateRequest,
  type CertificateApprovalRequestRecord,
} from '../../services/recruitmentFirestoreService';

interface AdminCertificateQueuePanelProps {
  adminUid: string;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const AdminCertificateQueuePanel: React.FC<AdminCertificateQueuePanelProps> = ({
  adminUid,
  onNotify,
}) => {
  const [requests, setRequests] = useState<CertificateApprovalRequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const loadRequests = async () => {
    setLoading(true);
    try {
      const items = await listCertificateApprovalRequestsAdmin(100);
      setRequests(items);
    } catch (err: any) {
      onNotify(
        'error',
        'Certificate Queue Unavailable',
        err?.message || 'Unable to load certificate approval requests from Firestore.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (req: CertificateApprovalRequestRecord) => {
    setProcessingId(req.id);
    try {
      const { certificateId } = await approveCertificateRequestAtomic({
        request: req,
        adminUid,
        reviewNote: reviewNotes[req.id] || 'Verified course completion and approved by Course Admin.',
      });
      onNotify(
        'success',
        'Admin-Approved Certificate Issued',
        `Issued ${certificateId} (method: admin_approved) for ${req.candidateName}.`
      );
      await loadRequests();
    } catch (err: any) {
      onNotify('error', 'Approval Failed', err?.message || 'Could not issue certificate.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: CertificateApprovalRequestRecord) => {
    const note = (reviewNotes[req.id] || '').trim();
    if (!note) {
      onNotify('warning', 'Review Note Required', 'Enter a short reason before rejecting a certificate request.');
      return;
    }
    setProcessingId(req.id);
    try {
      await rejectCertificateRequest({
        requestId: req.id,
        adminUid,
        reviewNote: note,
      });
      onNotify('info', 'Request Rejected', `Marked ${req.candidateName}'s request as rejected.`);
      await loadRequests();
    } catch (err: any) {
      onNotify('error', 'Rejection Failed', err?.message || 'Could not update request.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#102B4E] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#F47A24]" />
            <span>Admin-Approved Certificate Issuance Queue ({pendingCount} Pending)</span>
          </h3>
          <p className="text-xs text-[#778397] leading-relaxed">
            Starter-tier transparent workflow: approved certificates are written atomically to{' '}
            <code className="font-mono">/public_certificates</code> and{' '}
            <code className="font-mono">/users/&#123;uid&#125;/certificates</code> with{' '}
            <code className="font-mono">issuanceMethod: &quot;admin_approved&quot;</code> (zero fake HMAC signatures; existing HMAC-signed certificates remain untouched).
          </p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          disabled={loading}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E5EAF0] bg-white hover:bg-[#F6F8FB] text-[#102B4E] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="space-y-3">
        {requests.map((req) => {
          const isBusy = processingId === req.id;
          return (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-[#E5EAF0] p-4 sm:p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#102B4E]">{req.candidateName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border capitalize ${
                        req.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : req.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {req.status}
                    </span>
                    {req.issuedCertificateId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#102B4E] border border-blue-200 text-[11px] font-mono">
                        <ShieldCheck className="w-3 h-3" />
                        {req.issuedCertificateId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#F47A24]">{req.courseTitle}</p>
                  <p className="text-xs text-[#778397]">
                    UID: <span className="font-mono">{req.userId}</span> &middot; Completed lessons:{' '}
                    {req.completedLessonsCount} &middot; Requested: {(req.requestedAt || '').slice(0, 10) || '—'}
                  </p>
                  {req.candidateNote && (
                    <p className="text-xs text-[#253449] bg-[#F6F8FB] p-2.5 rounded-lg border border-[#E5EAF0] mt-1">
                      Learner note: {req.candidateNote}
                    </p>
                  )}
                </div>

                {req.status === 'pending' && (
                  <div className="flex flex-col gap-2 w-full sm:w-72 shrink-0">
                    <input
                      type="text"
                      value={reviewNotes[req.id] || ''}
                      onChange={(e) =>
                        setReviewNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                      }
                      placeholder="Review note (required for rejection)"
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E5EAF0] text-xs text-[#253449] focus:outline-none focus:border-[#102B4E]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApprove(req)}
                        className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Approve &amp; Issue</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleReject(req)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 disabled:opacity-60 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {req.reviewNote && req.status !== 'pending' && (
                <p className="text-xs text-[#566479] border-t border-[#E5EAF0] pt-2">
                  Review note: {req.reviewNote}
                </p>
              )}
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 text-center text-xs text-[#778397]">
            No pending or historical certificate approval requests found in <code className="font-mono">/certificate_requests</code>.
          </div>
        )}
      </div>
    </div>
  );
};
