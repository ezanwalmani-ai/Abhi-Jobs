import React, { useEffect, useState } from 'react';
import {
  Activity,
  Database,
  Download,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { AdminCmsAndSettingsPanel } from '../AdminCmsAndSettingsPanel';
import { AdminRoleManagementPanel } from '../AdminRoleManagementPanel';
import {
  runSystemHealthCheck,
  type AdminActivityLogRecord,
  type SystemHealthReport,
} from '../../../services/adminPanelService';
import type { AdminModuleId } from '../adminNavConfig';
import type { ResolvedAdminSession } from '../../../services/adminRbacService';
import type { AdminCsvDataset } from '../../../utils/csvExport';

export interface PlatformSectionProps {
  activeModule: AdminModuleId;
  adminSession: ResolvedAdminSession;
  activityLogs: AdminActivityLogRecord[];
  onRefresh: () => Promise<void>;
  onOpenCsvExport: (dataset?: AdminCsvDataset) => void;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const PlatformSection: React.FC<PlatformSectionProps> = ({
  activeModule,
  adminSession,
  activityLogs,
  onRefresh,
  onOpenCsvExport,
  onNotify,
}) => {
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const report = await runSystemHealthCheck();
      setHealth(report);
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    if (activeModule === 'platform-system-health') {
      checkHealth();
    }
  }, [activeModule]);

  // Website Settings & CMS
  if (activeModule === 'platform-website-settings') {
    return (
      <AdminCmsAndSettingsPanel
        adminUid={adminSession.uid || ''}
        onNotify={onNotify}
      />
    );
  }

  // Admin Roles & Permissions
  if (activeModule === 'platform-admin-roles') {
    return <AdminRoleManagementPanel adminSession={adminSession} onNotify={onNotify} />;
  }

  // Admin Activity (Read-only /admin_activity_logs)
  if (activeModule === 'platform-admin-activity') {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-amber-950">
          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Tamper-Proof Audit Log Integrity Enforced</p>
            <p className="text-amber-900 leading-relaxed">
              <code className="font-mono text-xs">/admin_activity_logs</code> strictly enforces{' '}
              <code className="font-mono text-xs">allow write: if false</code> in{' '}
              <code className="font-mono text-xs">firestore.rules</code> so no browser client can forge or delete audit history. On the current Firebase Starter tier, automated audit log writing awaits Blaze Cloud Functions deployment.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#081D36] flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-[#102B4E]" />
              <span>Server-Written Activity Logs ({activityLogs.length})</span>
            </h3>
            <button
              type="button"
              onClick={onRefresh}
              className="min-h-[36px] px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#081D36] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-[#081D36]">
                    {log.action}{' '}
                    <span className="font-normal text-slate-500">
                      on {log.targetCollection}/{log.targetId}
                    </span>
                  </div>
                  <div className="text-slate-700">{log.summary}</div>
                  <div className="text-[11px] text-slate-500">
                    Actor: {log.actorEmail} ({log.actorRole})
                  </div>
                </div>
                <span className="font-mono text-[11px] text-slate-400 shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No server-written audit entries in <code className="font-mono">/admin_activity_logs</code> yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Data Management
  if (activeModule === 'platform-data-management') {
    const dataSources = [
      {
        name: 'Cloud Firestore (Primary Backend)',
        status: 'Active',
        detail:
          'Named database ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d · Users, Candidates, Employers, Jobs, Applications, Interviews, Enquiries, CMS, RBAC, Learn with ABHI.',
      },
      {
        name: 'Firebase Authentication',
        status: 'Active',
        detail:
          'Google Sign-In & Email/Password with email verification enforcement on privileged admin and recruitment rules.',
      },
      {
        name: 'Legacy Supabase Files',
        status: 'Dormant (Preserved)',
        detail:
          'Retained untouched in repository until explicit production Firebase cutover approval is granted.',
      },
      {
        name: 'Browser LocalStorage',
        status: 'UI Preferences & Legacy Fallback',
        detail:
          'Never trusted for admin authentication or RBAC authorization. Legacy recruitment records remain importable via localMigrationService.',
      },
      {
        name: 'Firebase Storage & Cloud Functions',
        status: 'Starter Tier Deferred (Blaze)',
        detail:
          'Binary resume uploads, automated audit log triggers, and server-side HMAC quiz grading activate upon explicit Blaze upgrade approval.',
      },
    ];

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#081D36] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#102B4E]" />
              <span>Backend Data Architecture &amp; Exports</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent status of every data layer in ABHI JOBS.
            </p>
          </div>
          {adminSession.permissions?.canExportCsv && (
            <button
              type="button"
              onClick={() => onOpenCsvExport('jobs')}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Datasets</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {dataSources.map((src) => (
            <div key={src.name} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-1 max-w-2xl">
                <div className="text-sm font-bold text-[#081D36]">{src.name}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{src.detail}</p>
              </div>
              <span className="text-xs font-mono font-semibold text-[#102B4E] shrink-0">
                {src.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // System Health
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#081D36] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#102B4E]" />
            <span>System Health &amp; Firebase Diagnostics</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Live authenticated server probe against <code className="font-mono">/test/connection</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={checkHealth}
          disabled={checkingHealth}
          className="min-h-[40px] px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#081D36] inline-flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
          <span>Run Health Check</span>
        </button>
      </div>

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#081D36]">
              {health.firestoreReachable ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              )}
              <span>
                Firestore Connectivity: {health.firestoreReachable ? 'Reachable' : 'Offline'}
              </span>
            </div>
            <dl className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex justify-between gap-3">
                <dt className="text-slate-500">Firebase Project ID</dt>
                <dd className="font-mono font-semibold text-[#081D36]">{health.projectId}</dd>
              </div>
              <div className="py-2 flex justify-between gap-3">
                <dt className="text-slate-500">Named Database ID</dt>
                <dd className="font-mono text-[#081D36] text-right break-all">{health.databaseId}</dd>
              </div>
              <div className="py-2 flex justify-between gap-3">
                <dt className="text-slate-500">Roundtrip Latency</dt>
                <dd className="font-mono tabular-nums text-[#081D36]">{health.latencyMs} ms</dd>
              </div>
              <div className="py-2 flex justify-between gap-3">
                <dt className="text-slate-500">Billing Tier</dt>
                <dd className="font-semibold text-[#081D36]">{health.billingTier}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#081D36]">
              <ShieldCheck className="w-5 h-5 text-[#102B4E]" />
              <span>Active Administrator Session</span>
            </div>
            <dl className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex justify-between gap-3">
                <dt className="text-slate-500">Firebase Auth UID</dt>
                <dd className="font-mono text-[#081D36] break-all text-right">{health.authUid || '—'}</dd>
              </div>
              <div className="py-2 flex justify-between gap-3">
                <dt className="text-slate-500">Verified Email</dt>
                <dd className="font-semibold text-[#081D36] text-right">
                  {health.authEmail || '—'} ({health.emailVerified ? 'Verified' : 'Unverified'})
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-3">
                <dt className="text-slate-500">RBAC Role &amp; Source</dt>
                <dd className="font-mono text-[#081D36] text-right">
                  {adminSession.role} ({adminSession.source})
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-3">
                <dt className="text-slate-500">App Check Site Key</dt>
                <dd className="font-semibold text-[#081D36]">
                  {health.appCheckConfigured ? 'Configured' : 'Not Enforced (Opt-in Ready)'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};
