import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  Search,
  Trash2,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  auth,
  onAuthStateChanged,
  resendFirebaseEmailVerification,
  type FirebaseUser,
} from '../lib/firebase';
import {
  buildSearchAlertLabel,
  computeSearchAlertKey,
  deleteJobSearchAlert,
  sanitizeJobSearchAlertCriteria,
  saveJobSearchAlertPreference,
  stashAlertCriteriaForJobsPage,
  subscribeUserJobAlerts,
  toggleJobSearchAlertEnabled,
  updateJobSearchAlertFrequency,
} from '../services/jobAlertService';
import type {
  JobSearchAlert,
  JobSearchAlertCriteria,
  JobSearchAlertFrequency,
} from '../types';

export interface JobSearchAlertsManagerProps {
  mode: 'jobs-bar' | 'settings-panel';
  navigate: (route: string) => void;
  currentCriteria?: JobSearchAlertCriteria;
  onApplyCriteria?: (criteria: JobSearchAlertCriteria) => void;
  onNotify?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
  fallbackEmail?: string;
  /** Optional preloaded alerts for SSR/testing; ignored once live Firestore updates arrive. */
  initialAlerts?: JobSearchAlert[];
}

const FREQUENCY_OPTIONS: { value: JobSearchAlertFrequency; label: string }[] = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly digest' },
];

export const JobSearchAlertsManager: React.FC<JobSearchAlertsManagerProps> = ({
  mode,
  navigate,
  currentCriteria,
  onApplyCriteria,
  onNotify,
  fallbackEmail,
  initialAlerts,
}) => {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [alerts, setAlerts] = useState<JobSearchAlert[]>(() => initialAlerts ?? []);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState<boolean>(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<JobSearchAlertFrequency>('daily');
  const [isSavingCurrent, setIsSavingCurrent] = useState<boolean>(false);
  const [busyAlertIds, setBusyAlertIds] = useState<Record<string, boolean>>({});
  const [isListExpanded, setIsListExpanded] = useState<boolean>(false);
  const [isResendingVerification, setIsResendingVerification] = useState<boolean>(false);

  // Track real Firebase Auth session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time Firestore job alerts for the signed-in user
  useEffect(() => {
    if (!fbUser?.uid) {
      if (!initialAlerts) {
        setAlerts([]);
      }
      setIsLoadingAlerts(false);
      setAlertsError(null);
      return;
    }

    setIsLoadingAlerts(true);
    setAlertsError(null);

    const unsubscribe = subscribeUserJobAlerts(
      fbUser.uid,
      (nextAlerts) => {
        setAlerts(nextAlerts);
        setIsLoadingAlerts(false);
        setAlertsError(null);
      },
      () => {
        setIsLoadingAlerts(false);
        setAlertsError('Unable to load your saved search alerts right now.');
      }
    );

    return () => unsubscribe();
  }, [fbUser?.uid, initialAlerts]);

  const normalizedCriteria = useMemo(() => {
    if (!currentCriteria) return null;
    return sanitizeJobSearchAlertCriteria(currentCriteria);
  }, [currentCriteria]);

  const currentQueryKey = useMemo(() => {
    if (!normalizedCriteria) return '';
    return computeSearchAlertKey(normalizedCriteria);
  }, [normalizedCriteria]);

  const currentQueryLabel = useMemo(() => {
    if (!normalizedCriteria) return 'All Published Jobs';
    return buildSearchAlertLabel(normalizedCriteria);
  }, [normalizedCriteria]);

  const matchingAlert = useMemo(() => {
    if (!currentQueryKey) return null;
    return alerts.find((a) => a.queryKey === currentQueryKey || a.id === currentQueryKey) ?? null;
  }, [alerts, currentQueryKey]);

  // Keep frequency dropdown synchronized with the currently matching saved alert
  useEffect(() => {
    if (matchingAlert?.frequency) {
      setSelectedFrequency(matchingAlert.frequency);
    }
  }, [matchingAlert?.id, matchingAlert?.frequency]);

  const activeAlertsCount = useMemo(
    () => alerts.filter((a) => a.enabled).length,
    [alerts]
  );

  const destinationEmail = fbUser?.email || fallbackEmail || '';
  const isSignedIn = Boolean(fbUser?.uid);
  const isEmailVerified = Boolean(fbUser?.emailVerified);

  const setAlertBusy = (alertId: string, busy: boolean) => {
    setBusyAlertIds((prev) => {
      if (busy) return { ...prev, [alertId]: true };
      const next = { ...prev };
      delete next[alertId];
      return next;
    });
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      await resendFirebaseEmailVerification();
      onNotify?.(
        'info',
        'Verification Email Sent',
        `Check ${destinationEmail || 'your inbox'} to verify your email address, then reload to enable Email Alerts.`
      );
    } catch {
      onNotify?.(
        'warning',
        'Could Not Send Verification Email',
        'Please wait a moment before trying again.'
      );
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleToggleCurrentQuery = async () => {
    if (!normalizedCriteria) return;

    if (!isSignedIn || !fbUser?.uid) {
      onNotify?.(
        'info',
        'Sign In Required',
        'Please sign in to your job seeker account to save Email Alerts for your searches.'
      );
      navigate('/login');
      return;
    }

    if (!isEmailVerified) {
      onNotify?.(
        'warning',
        'Email Verification Required',
        'Verify your email address first so we can securely store your Email Alert preferences.'
      );
      return;
    }

    if (!destinationEmail || destinationEmail.length <= 3) {
      onNotify?.(
        'warning',
        'Email Address Missing',
        'Your account needs a valid email address before Email Alerts can be enabled.'
      );
      return;
    }

    const nextEnabled = !(matchingAlert?.enabled ?? false);
    setIsSavingCurrent(true);
    try {
      await saveJobSearchAlertPreference({
        userId: fbUser.uid,
        email: destinationEmail,
        criteria: normalizedCriteria,
        frequency: selectedFrequency,
        enabled: nextEnabled,
      });
      onNotify?.(
        'success',
        nextEnabled ? 'Email Alerts Enabled' : 'Email Alerts Paused',
        nextEnabled
          ? `Saved ${selectedFrequency} alert preference for ${currentQueryLabel}.`
          : `Paused email alerts for ${currentQueryLabel}.`
      );
    } catch {
      onNotify?.(
        'error',
        'Unable to Save Preference',
        'We could not update your Email Alert preference in Firestore. Please try again.'
      );
    } finally {
      setIsSavingCurrent(false);
    }
  };

  const handleChangeCurrentFrequency = async (nextFrequency: JobSearchAlertFrequency) => {
    setSelectedFrequency(nextFrequency);
    if (!matchingAlert || !fbUser?.uid || !isEmailVerified) return;

    setIsSavingCurrent(true);
    try {
      await updateJobSearchAlertFrequency(fbUser.uid, matchingAlert.id, nextFrequency);
      onNotify?.(
        'success',
        'Alert Frequency Updated',
        `Email alert cadence set to ${nextFrequency} for ${matchingAlert.label}.`
      );
    } catch {
      onNotify?.(
        'error',
        'Unable to Update Frequency',
        'Please try changing the alert frequency again.'
      );
    } finally {
      setIsSavingCurrent(false);
    }
  };

  const handleToggleAlertItem = async (alert: JobSearchAlert) => {
    if (!fbUser?.uid || !isEmailVerified) {
      onNotify?.(
        'warning',
        'Email Verification Required',
        'Verify your email address to modify saved Email Alerts.'
      );
      return;
    }

    const nextEnabled = !alert.enabled;
    setAlertBusy(alert.id, true);
    try {
      await toggleJobSearchAlertEnabled(fbUser.uid, alert.id, nextEnabled);
      onNotify?.(
        'success',
        nextEnabled ? 'Email Alert Enabled' : 'Email Alert Paused',
        `${nextEnabled ? 'Resumed' : 'Paused'} alerts for ${alert.label}.`
      );
    } catch {
      onNotify?.(
        'error',
        'Update Failed',
        'Could not update this alert preference. Please try again.'
      );
    } finally {
      setAlertBusy(alert.id, false);
    }
  };

  const handleFrequencyAlertItem = async (
    alert: JobSearchAlert,
    nextFrequency: JobSearchAlertFrequency
  ) => {
    if (!fbUser?.uid || !isEmailVerified) return;
    setAlertBusy(alert.id, true);
    try {
      await updateJobSearchAlertFrequency(fbUser.uid, alert.id, nextFrequency);
      onNotify?.(
        'success',
        'Frequency Saved',
        `Updated "${alert.label}" to ${nextFrequency}.`
      );
    } catch {
      onNotify?.(
        'error',
        'Update Failed',
        'Could not update alert frequency. Please try again.'
      );
    } finally {
      setAlertBusy(alert.id, false);
    }
  };

  const handleDeleteAlertItem = async (alert: JobSearchAlert) => {
    if (!fbUser?.uid || !isEmailVerified) return;
    setAlertBusy(alert.id, true);
    try {
      await deleteJobSearchAlert(fbUser.uid, alert.id);
      onNotify?.(
        'info',
        'Search Alert Removed',
        `Removed saved email alert for ${alert.label}.`
      );
    } catch {
      onNotify?.(
        'error',
        'Delete Failed',
        'Could not remove this saved alert. Please try again.'
      );
    } finally {
      setAlertBusy(alert.id, false);
    }
  };

  const handleRunSavedSearch = (alert: JobSearchAlert) => {
    const criteria: JobSearchAlertCriteria = {
      search: alert.search,
      location: alert.location,
      workMode: alert.workMode,
      employmentType: alert.employmentType,
      experienceLevel: alert.experienceLevel,
      salaryRange: alert.salaryRange,
      department: alert.department,
      industry: alert.industry,
      selectedSkill: alert.selectedSkill,
      quickMinSalary: alert.quickMinSalary,
    };
    if (onApplyCriteria) {
      onApplyCriteria(criteria);
      setIsListExpanded(false);
    } else {
      stashAlertCriteriaForJobsPage(criteria);
      navigate('/jobs');
    }
  };

  const renderSavedAlertsList = () => {
    if (isLoadingAlerts && alerts.length === 0) {
      return (
        <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-[#102B4E]" />
          <span>Loading your saved search alerts...</span>
        </div>
      );
    }

    if (alertsError) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{alertsError}</span>
        </div>
      );
    }

    if (alerts.length === 0) {
      return (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center space-y-2">
          <p className="text-xs font-semibold text-slate-700">
            No search query alerts saved yet
          </p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Search for roles, locations, or skills on the Jobs page and toggle Email Alerts to save your preferences.
          </p>
          {mode === 'settings-panel' && (
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse Jobs & Create Alert</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2.5">
        {alerts.map((alert) => {
          const isBusy = Boolean(busyAlertIds[alert.id]);
          const isCurrent = mode === 'jobs-bar' && alert.queryKey === currentQueryKey;

          return (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-[#F1F5FA]/80 border-[#102B4E]/30'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#101828] break-words">
                    {alert.label}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      alert.enabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {alert.enabled ? 'Active' : 'Paused'}
                  </span>
                  {isCurrent && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#102B4E] text-white">
                      Current Search
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  <Mail className="w-3 h-3 inline mr-1 -mt-0.5 text-slate-400" />
                  {alert.email}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  aria-label={`Alert frequency for ${alert.label}`}
                  value={alert.frequency}
                  disabled={isBusy || !isEmailVerified}
                  onChange={(e) =>
                    handleFrequencyAlertItem(
                      alert,
                      e.target.value as JobSearchAlertFrequency
                    )
                  }
                  className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-[#102B4E] min-h-[40px] cursor-pointer disabled:opacity-50"
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  role="switch"
                  aria-checked={alert.enabled}
                  aria-label={`Toggle email alerts for ${alert.label}`}
                  disabled={isBusy || !isEmailVerified}
                  onClick={() => handleToggleAlertItem(alert)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#102B4E]/30 disabled:opacity-50 ${
                    alert.enabled ? 'bg-[#102B4E]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                      alert.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => handleRunSavedSearch(alert)}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#102B4E] text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
                  title="Apply this search query"
                >
                  <span>{mode === 'jobs-bar' ? 'Apply' : 'View Jobs'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={isBusy || !isEmailVerified}
                  onClick={() => handleDeleteAlertItem(alert)}
                  className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600 transition-colors cursor-pointer min-h-[40px] min-w-[40px] disabled:opacity-50"
                  aria-label={`Delete alert for ${alert.label}`}
                  title="Delete saved alert"
                >
                  {isBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ===========================================================================
  // SETTINGS PANEL MODE (JobSeekerSettingsPage -> Notifications section)
  // ===========================================================================
  if (mode === 'settings-panel') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#102B4E] shrink-0" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Saved Search Query Email Alerts
              </h3>
              {alerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#102B4E] text-white">
                  {activeAlertsCount} active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Manage per-search Email Alert preferences stored directly in your account.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#102B4E] text-xs font-bold transition-colors cursor-pointer min-h-[44px] shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>New Search Alert</span>
          </button>
        </div>

        {!isSignedIn ? (
          <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              Sign in with your verified job seeker account to sync search query Email Alerts.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-bold min-h-[44px] cursor-pointer shrink-0"
            >
              Sign In
            </button>
          </div>
        ) : !isEmailVerified ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2 text-xs text-amber-900">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
              <span>
                Verify your email address (<strong>{destinationEmail}</strong>) to save or update Email Alerts.
              </span>
            </div>
            <button
              type="button"
              disabled={isResendingVerification}
              onClick={handleResendVerification}
              className="px-3.5 py-2 rounded-xl bg-amber-900 text-white text-xs font-bold hover:bg-amber-950 min-h-[40px] cursor-pointer shrink-0 disabled:opacity-60"
            >
              {isResendingVerification ? 'Sending...' : 'Resend Verification'}
            </button>
          </div>
        ) : null}

        {isSignedIn && renderSavedAlertsList()}
      </div>
    );
  }

  // ===========================================================================
  // JOBS PAGE BAR MODE (Inline beneath search & filters card on /jobs)
  // ===========================================================================
  const isCurrentEnabled = Boolean(matchingAlert?.enabled);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="p-4 sm:px-5 sm:py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Alert description & current search query */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isCurrentEnabled
                ? 'bg-[#102B4E] text-white shadow-2xs'
                : 'bg-[#F1F5FA] text-[#102B4E]'
            }`}
          >
            {isCurrentEnabled ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-bold text-[#101828]">
                Email Alerts for this Search
              </h3>
              {isCurrentEnabled && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Saved · {selectedFrequency}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5 break-words">
              Query:{' '}
              <span className="font-semibold text-[#102B4E]">
                {currentQueryLabel}
              </span>
              {isSignedIn && destinationEmail && (
                <span className="text-slate-400"> · {destinationEmail}</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isSignedIn ? (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-bold transition-colors cursor-pointer min-h-[44px] w-full sm:w-auto"
            >
              <Mail className="w-4 h-4" />
              <span>Sign in to Enable Email Alerts</span>
            </button>
          ) : !isEmailVerified ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                Verify your email to save alerts
              </span>
              <button
                type="button"
                disabled={isResendingVerification}
                onClick={handleResendVerification}
                className="px-3.5 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-bold transition-colors cursor-pointer min-h-[44px] disabled:opacity-60"
              >
                {isResendingVerification ? 'Sending...' : 'Resend Verification'}
              </button>
            </div>
          ) : (
            <>
              <select
                aria-label="Email alert frequency"
                value={selectedFrequency}
                disabled={isSavingCurrent}
                onChange={(e) =>
                  handleChangeCurrentFrequency(e.target.value as JobSearchAlertFrequency)
                }
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#102B4E] min-h-[44px] cursor-pointer disabled:opacity-50"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                role="switch"
                aria-checked={isCurrentEnabled}
                aria-label={`Toggle Email Alerts for ${currentQueryLabel}`}
                disabled={isSavingCurrent}
                onClick={handleToggleCurrentQuery}
                className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] disabled:opacity-60 ${
                  isCurrentEnabled
                    ? 'bg-[#102B4E] text-white border-[#102B4E] shadow-2xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-[#102B4E]/40 hover:bg-slate-50'
                }`}
              >
                {isSavingCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                      isCurrentEnabled ? 'bg-[#F47A24]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                        isCurrentEnabled ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </span>
                )}
                <span>Email Alerts {isCurrentEnabled ? 'On' : 'Off'}</span>
              </button>

              {alerts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsListExpanded((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
                  aria-expanded={isListExpanded}
                >
                  <span>
                    My Alerts ({activeAlertsCount}/{alerts.length})
                  </span>
                  {isListExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expandable Saved Search Alerts Manager */}
      {isSignedIn && isListExpanded && (
        <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">
              Saved Search Query Alerts ({alerts.length})
            </span>
            <button
              type="button"
              onClick={() => navigate('/job-seeker/settings')}
              className="text-xs font-semibold text-[#102B4E] hover:underline cursor-pointer"
            >
              Manage in Notification Settings
            </button>
          </div>
          {renderSavedAlertsList()}
        </div>
      )}
    </div>
  );
};
