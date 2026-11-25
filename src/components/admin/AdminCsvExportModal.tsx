import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Users,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  ADMIN_CSV_DATASETS,
  AdminCsvDataset,
} from '../../utils/csvExport';
import {
  AdminExportDataSources,
  SuperAdminExportAuthStatus,
  checkSuperAdminExportAuth,
  downloadAuthorizedAdminCsv,
} from '../../services/adminExportService';
import {
  claimAdminAssessmentPasscode,
  loginAdminAssessmentPasscode,
} from '../../services/assessmentService';
import { signInWithFirebaseGoogle } from '../../lib/firebase';

interface AdminCsvExportModalProps {
  isOpen: boolean;
  initialDataset?: AdminCsvDataset;
  sources: AdminExportDataSources;
  onClose: () => void;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

const DATASET_ORDER: AdminCsvDataset[] = [
  'jobs',
  'applications',
  'student_progress',
  'candidates',
  'employers',
  'hiring_enquiries',
];

const datasetIcon = (id: AdminCsvDataset) => {
  switch (id) {
    case 'jobs':
      return <Briefcase className="w-4 h-4" />;
    case 'applications':
      return <FileText className="w-4 h-4" />;
    case 'student_progress':
      return <GraduationCap className="w-4 h-4" />;
    case 'candidates':
      return <Users className="w-4 h-4" />;
    case 'employers':
      return <Building2 className="w-4 h-4" />;
    case 'hiring_enquiries':
      return <Mail className="w-4 h-4" />;
  }
};

export const AdminCsvExportModal: React.FC<AdminCsvExportModalProps> = ({
  isOpen,
  initialDataset = 'jobs',
  sources,
  onClose,
  onNotify,
}) => {
  const [selectedDataset, setSelectedDataset] = useState<AdminCsvDataset>(initialDataset);
  const [authStatus, setAuthStatus] = useState<SuperAdminExportAuthStatus | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Inline Super Admin verification state
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [verifyingAuth, setVerifyingAuth] = useState(false);

  useEffect(() => {
    setSelectedDataset(initialDataset);
  }, [initialDataset]);

  const refreshAuthStatus = async () => {
    setCheckingAuth(true);
    setAuthError('');
    try {
      const status = await checkSuperAdminExportAuth();
      setAuthStatus(status);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshAuthStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getDatasetRecordHint = (id: AdminCsvDataset): string => {
    switch (id) {
      case 'jobs':
        return `${sources.jobs.length} record${sources.jobs.length === 1 ? '' : 's'}`;
      case 'applications':
        return `${sources.applications.length} record${sources.applications.length === 1 ? '' : 's'}`;
      case 'candidates':
        return `${sources.candidates.length} record${sources.candidates.length === 1 ? '' : 's'}`;
      case 'employers':
        return `${sources.employers.length} record${sources.employers.length === 1 ? '' : 's'}`;
      case 'hiring_enquiries':
        return `${sources.hiringEnquiries.length} record${sources.hiringEnquiries.length === 1 ? '' : 's'}`;
      case 'student_progress':
        return 'Live server & cloud data';
    }
  };

  const handleGoogleSuperAdminVerify = async () => {
    setVerifyingAuth(true);
    setAuthError('');
    try {
      await signInWithFirebaseGoogle();
      const updated = await checkSuperAdminExportAuth();
      setAuthStatus(updated);
      if (updated.authorized) {
        onNotify('success', 'Super Admin Verified', 'Authorized for secure CSV data exports.');
      } else {
        setAuthError(
          'This Google account is not authorized as a Super Admin. Please sign in with an authorized Super Admin email or use your Super Admin passcode.'
        );
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Unable to verify Google account.');
    } finally {
      setVerifyingAuth(false);
    }
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) {
      setAuthError('Please enter your Super Admin passcode.');
      return;
    }
    setVerifyingAuth(true);
    setAuthError('');
    try {
      if (authStatus?.passcodeMode === 'needs_setup') {
        await claimAdminAssessmentPasscode(passcodeInput.trim());
      } else {
        await loginAdminAssessmentPasscode(passcodeInput.trim());
      }
      setPasscodeInput('');
      const updated = await checkSuperAdminExportAuth();
      setAuthStatus(updated);
      if (updated.authorized) {
        onNotify('success', 'Super Admin Verified', 'Authorized session active for CSV export.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Super Admin verification failed.');
    } finally {
      setVerifyingAuth(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!authStatus?.authorized) {
      setAuthError('Super Admin authorization is required before downloading CSV data.');
      return;
    }

    setIsExporting(true);
    setAuthError('');
    try {
      const result = await downloadAuthorizedAdminCsv(selectedDataset, sources);
      const label = ADMIN_CSV_DATASETS[selectedDataset].label;
      onNotify(
        'success',
        'CSV Export Downloaded',
        `Exported ${result.rowCount} ${label.toLowerCase()} row${result.rowCount === 1 ? '' : 's'} to ${result.filename}.`
      );
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Unable to generate CSV export.';
      setAuthError(msg);
      onNotify('error', 'Export Blocked', msg);
    } finally {
      setIsExporting(false);
    }
  };

  const activeDef = ADMIN_CSV_DATASETS[selectedDataset];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#081D36]/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-csv-export-title"
    >
      <div className="bg-white rounded-2xl border border-[#E5EAF0] shadow-xl w-full max-w-[min(640px,calc(100vw-2rem))] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#081D36] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F47A24]/20 border border-[#F47A24]/40 text-[#F47A24] flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="admin-csv-export-title" className="text-base font-bold text-white truncate">
                Download Authorized System CSV
              </h2>
              <p className="text-xs text-slate-300 truncate">
                Super Admin verified export &middot; Formula-safe &amp; credentials excluded
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close CSV export modal"
            className="min-w-[40px] min-h-[40px] rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Authorization Status Banner */}
          {checkingAuth ? (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] text-sm text-[#566479]">
              <Loader2 className="w-4 h-4 animate-spin text-[#102B4E] shrink-0" />
              <span>Verifying Super Admin authorization with server...</span>
            </div>
          ) : authStatus?.authorized ? (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0 text-xs sm:text-sm">
                <p className="font-semibold text-emerald-900">
                  Super Admin Authorization Verified
                </p>
                <p className="text-emerald-700 mt-0.5">
                  Authenticated via{' '}
                  {authStatus.method === 'firebase'
                    ? `verified Google account (${authStatus.actorEmail || 'Super Admin'})`
                    : 'server-verified Super Admin session'}
                  . All exports are sanitized on the server.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3.5">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-amber-950">
                  <p className="font-semibold">Super Admin Verification Required</p>
                  <p className="text-amber-800 mt-0.5 leading-relaxed">
                    CSV exports of system data require a server-verified Super Admin session. Verify with your authorized Google Super Admin account or passcode below.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  disabled={verifyingAuth}
                  onClick={handleGoogleSuperAdminVerify}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#0B203B] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify with Super Admin Google</span>
                </button>
              </div>

              <form onSubmit={handlePasscodeSubmit} className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-amber-200/70">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-amber-700 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder={
                      authStatus?.passcodeMode === 'needs_setup'
                        ? 'Set initial Super Admin passcode (min 10 chars)...'
                        : 'Or enter Super Admin passcode...'
                    }
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl bg-white border border-amber-300 text-sm text-[#253449] focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifyingAuth}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer shrink-0"
                >
                  {authStatus?.passcodeMode === 'needs_setup' ? 'Set & Verify' : 'Verify Passcode'}
                </button>
              </form>
            </div>
          )}

          {authError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Dataset Picker */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#566479]">
              Select Authorized Dataset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DATASET_ORDER.map((id) => {
                const def = ADMIN_CSV_DATASETS[id];
                const isSelected = selectedDataset === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedDataset(id)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 min-h-[68px] ${
                      isSelected
                        ? 'border-[#102B4E] bg-[#102B4E]/[0.04] ring-1 ring-[#102B4E]'
                        : 'border-[#E5EAF0] bg-white hover:border-[#102B4E]/40'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[#102B4E] text-white'
                          : 'bg-[#F6F8FB] text-[#566479]'
                      }`}
                    >
                      {datasetIcon(id)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#102B4E] truncate">
                          {def.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#F47A24] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#778397] mt-0.5">
                        {getDatasetRecordHint(id)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Dataset Column Preview */}
          <div className="rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#102B4E]">
                Included Columns ({activeDef.columns.length})
              </span>
              <span className="text-[11px] font-medium text-[#778397]">
                UTF-8 CSV &middot; Formula-injection safe
              </span>
            </div>
            <p className="text-xs text-[#566479] leading-relaxed">{activeDef.description}</p>
            <p className="text-[11px] text-[#778397] leading-relaxed break-words">
              {activeDef.columns.join(' · ')}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 bg-[#F6F8FB] border-t border-[#E5EAF0] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#E5EAF0] hover:bg-slate-50 text-[#253449] text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!authStatus?.authorized || isExporting || checkingAuth}
            onClick={handleDownloadCsv}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating CSV...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {activeDef.shortLabel} CSV</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
