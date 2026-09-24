import React from 'react';
import { ShieldAlert, ArrowRight, LogIn } from 'lucide-react';
import { UserRole } from '../types';

interface RouteProtectionNoticeProps {
  attemptedRoute?: string;
  attemptedRoleText?: string;
  requiredRole: 'job_seeker' | 'employer';
  currentRole: UserRole;
  onRedirectToAllowed: () => void;
  onSignOut?: () => void;
}

export const RouteProtectionNotice: React.FC<RouteProtectionNoticeProps> = ({
  attemptedRoleText = 'Authorized Users',
  requiredRole,
  currentRole,
  onRedirectToAllowed,
  onSignOut,
}) => {
  const isJobSeekerTryingEmployer = requiredRole === 'employer';
  const requiredRoleLabel = requiredRole === 'employer' ? 'Employer' : 'Job Seeker';
  const currentRoleLabel = currentRole === 'job_seeker' ? 'Job Seeker' : currentRole === 'employer' ? 'Employer' : 'Administrator';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {requiredRoleLabel} Access Required
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            This section of ABHI JOBS is reserved specifically for{' '}
            <strong className="text-slate-900">{requiredRoleLabel}s</strong>. You are currently browsing as a{' '}
            <strong className="text-slate-900">{currentRoleLabel}</strong>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
          <div className="font-semibold text-slate-800">Security &amp; Role Isolation:</div>
          <p>
            ABHI JOBS isolates candidate profiles, applications, and recruiter workspaces to ensure strict privacy and role separation. You cannot access {requiredRoleLabel} pages while logged in as a {currentRoleLabel}.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onRedirectToAllowed}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#061226] hover:bg-[#0d1e3d] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Go to My {currentRole === 'employer' ? 'Employer Portal' : 'Job Seeker Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-[#E4E7EC] hover:border-slate-300 text-[#101828] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#667085]" />
              <span>Sign In with Another Account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

