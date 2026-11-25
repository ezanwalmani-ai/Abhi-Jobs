import React, { useMemo, useState } from 'react';
import {
  CloudUpload,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  scanLocalStorageForAuthenticatedUser,
  executeUserConsentedLocalMigration,
  type LocalStorageMigrationResult,
} from '../services/localMigrationService';
import { useApp } from '../context/AppContext';

export const LocalDataMigrationCard: React.FC = () => {
  const { jobs, showToast } = useApp();
  const [scanTick, setScanTick] = useState(0);
  const [consentChecked, setConsentChecked] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<LocalStorageMigrationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const preview = useMemo(() => {
    void scanTick;
    return scanLocalStorageForAuthenticatedUser();
  }, [scanTick]);

  const handleImport = async () => {
    if (!consentChecked) {
      setErrorMsg('Please confirm consent to import your matched local browser records into Firestore.');
      return;
    }
    setMigrating(true);
    setErrorMsg('');
    try {
      const res = await executeUserConsentedLocalMigration(jobs);
      setResult(res);
      setScanTick((t) => t + 1);
      showToast(
        'success',
        'Local Data Imported to Firebase',
        `Synced ${res.migratedProfile ? 'profile, ' : ''}${res.migratedResumes} resume(s), and ${res.migratedSavedJobs} saved job(s).`
      );
    } catch (err: any) {
      const msg = err?.message || 'Could not import local browser records.';
      setErrorMsg(msg);
      showToast('error', 'Import Failed', msg);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CloudUpload className="w-4 h-4 text-[#004D40]" />
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              Import Legacy Browser Data to Firebase Cloud
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
              User-Consented &amp; Idempotent
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            Checks this browser&apos;s localStorage strictly for records matching your verified Firebase email
            {preview.matchedEmail ? ` (${preview.matchedEmail})` : ''}. Base64 binary files are automatically stripped so only clean structured JSON is stored in Firestore.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScanTick((t) => t + 1)}
          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-scan Browser</span>
        </button>
      </div>

      {/* Preview summary */}
      {preview.eligible ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Profile', val: preview.candidateProfileFound ? '1 found' : '0' },
              { label: 'Structured Resumes', val: String(preview.resumesCount) },
              { label: 'Saved Jobs', val: String(preview.savedJobsCount) },
              { label: 'Recently Viewed', val: String(preview.recentlyViewedCount) },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center"
              >
                <div className="text-sm font-bold text-[#102B4E]">{item.val}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>

          {preview.alreadyMigratedAt && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Previously imported on {new Date(preview.alreadyMigratedAt).toLocaleString()}. Re-running is safe and idempotent.
              </span>
            </div>
          )}

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 rounded text-[#004D40] focus:ring-[#004D40] w-4 h-4 cursor-pointer shrink-0"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              I confirm these local browser records belong to my verified account ({preview.matchedEmail}) and consent to importing them into Cloud Firestore.
            </span>
          </label>

          <button
            type="button"
            disabled={!consentChecked || migrating}
            onClick={handleImport}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            {migrating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing to Cloud Firestore...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#F47A24]" />
                <span>Import Matched Records to Firebase</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          {preview.reason || 'No legacy browser records eligible for import.'}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {result && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
          <p className="font-bold">Import Complete</p>
          <p>
            Profile synced: {result.migratedProfile ? 'Yes' : 'No'} &middot; Resumes:{' '}
            {result.migratedResumes} &middot; Saved jobs: {result.migratedSavedJobs} &middot;
            Recently viewed: {result.migratedRecentlyViewed}
          </p>
          {result.skippedReasons.length > 0 && (
            <p className="text-amber-800">Notes: {result.skippedReasons.join('; ')}</p>
          )}
        </div>
      )}
    </div>
  );
};
