import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { AbhiJobsLogo } from '../AbhiJobsLogo';
import {
  auth,
  signInWithFirebaseGoogle,
  signInWithFirebaseEmail,
  resendFirebaseEmailVerification,
  requestFirebasePasswordReset,
  firebaseSignOut,
} from '../../lib/firebase';
import type { ResolvedAdminSession } from '../../services/adminRbacService';

interface AdminAccessGateProps {
  adminSession: ResolvedAdminSession | null;
  loading?: boolean;
  onRefreshSession: () => Promise<ResolvedAdminSession>;
  onNavigateHome: () => void;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const AdminAccessGate: React.FC<AdminAccessGateProps> = ({
  adminSession,
  loading = false,
  onRefreshSession,
  onNavigateHome,
  onNotify,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      await signInWithFirebaseGoogle();
      const resolved = await onRefreshSession();
      if (resolved.authorized) {
        onNotify(
          'success',
          'Admin Control Center Unlocked',
          `Signed in as ${resolved.permissions?.label || resolved.role} (${resolved.email}).`
        );
      } else {
        setErrorMessage(
          resolved.denialReason === 'email_unverified'
            ? 'Your email address is not verified yet. Please verify your email and click Refresh Access.'
            : resolved.denialReason === 'account_suspended'
            ? 'This account is currently suspended and cannot access the Admin Control Center.'
            : 'This verified Firebase account does not have an active administrator role in /admin_roles.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to sign in with Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Enter both your administrator email and password.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      await signInWithFirebaseEmail(email.trim(), password);
      const resolved = await onRefreshSession();
      if (resolved.authorized) {
        onNotify(
          'success',
          'Admin Control Center Unlocked',
          `Authenticated as ${resolved.permissions?.label || resolved.role}.`
        );
      } else if (resolved.denialReason === 'email_unverified') {
        setErrorMessage('Please verify your email address before accessing administrator tools.');
      } else if (resolved.denialReason === 'account_suspended') {
        setErrorMessage('This administrator account is suspended.');
      } else {
        setErrorMessage('No active administrator role is assigned to this Firebase account.');
      }
    } catch (err: any) {
      const code = String(err?.code || '');
      if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
        setErrorMessage('Invalid email or password. If you migrated from Supabase, reset your password below.');
      } else {
        setErrorMessage(err?.message || 'Sign-in failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    setErrorMessage('');
    try {
      await resendFirebaseEmailVerification();
      onNotify(
        'info',
        'Verification Email Sent',
        'Check your inbox, confirm the verification link, then click Refresh Access.'
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not send verification email.');
    } finally {
      setResendingVerification(false);
    }
  };

  const handlePasswordReset = async () => {
    const targetEmail = email.trim() || adminSession?.email || '';
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMessage('Enter your administrator email address above to receive a password reset link.');
      return;
    }
    setSendingReset(true);
    setErrorMessage('');
    try {
      await requestFirebasePasswordReset(targetEmail);
      onNotify('success', 'Password Reset Sent', `A Firebase password reset link was emailed to ${targetEmail}.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not send password reset email.');
    } finally {
      setSendingReset(false);
    }
  };

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    await onRefreshSession();
    setErrorMessage('');
  };

  const denialReason = adminSession?.denialReason || 'unauthenticated';
  const isSignedInButDenied =
    Boolean(adminSession?.uid) &&
    (denialReason === 'email_unverified' ||
      denialReason === 'account_suspended' ||
      denialReason === 'role_missing_or_revoked');

  return (
    <div className="min-h-[80vh] bg-[#F6F8FB] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-[min(480px,calc(100vw-2rem))] bg-white rounded-2xl border border-[#E5EAF0] shadow-sm overflow-hidden">
        <div className="bg-[#081D36] text-white px-5 sm:px-6 py-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <AbhiJobsLogo variant="horizontal" theme="white" size="sm" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[11px] font-semibold text-white shrink-0">
              <Shield className="w-3.5 h-3.5 text-[#F47A24]" />
              RBAC Protected
            </span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              ABHI JOBS Admin Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed">
              Verified Firebase Authentication and an active Firestore administrator role are required.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {loading && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] text-sm text-[#253449]">
              <Loader2 className="w-4 h-4 animate-spin text-[#102B4E] shrink-0" />
              <span>Verifying Firebase Authentication and Firestore RBAC role...</span>
            </div>
          )}

          {isSignedInButDenied && (
            <div
              className={`rounded-xl border p-4 space-y-3 ${
                denialReason === 'email_unverified'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {denialReason === 'email_unverified' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 text-xs sm:text-sm space-y-1">
                  <p className="font-bold">
                    {denialReason === 'email_unverified'
                      ? 'Email Verification Required'
                      : denialReason === 'account_suspended'
                      ? 'Administrator Account Suspended'
                      : 'Administrator Role Required'}
                  </p>
                  <p className="opacity-90 leading-relaxed break-words">
                    Signed in as <span className="font-semibold">{adminSession?.email}</span>.{' '}
                    {denialReason === 'email_unverified'
                      ? 'Firestore security rules require a verified email address before granting admin permissions.'
                      : denialReason === 'account_suspended'
                      ? 'Your user account status is marked suspended in Firestore.'
                      : 'No active administrator role exists for this UID in /admin_roles. Contact the Super Admin to assign a role.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {denialReason === 'email_unverified' && (
                  <button
                    type="button"
                    disabled={resendingVerification}
                    onClick={handleResendVerification}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{resendingVerification ? 'Sending...' : 'Resend Verification Email'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRefreshSession()}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-[#102B4E] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Access</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch Account</span>
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-2">
              <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isSignedInButDenied && (
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogleSignIn}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#F47A24]" />
                )}
                <span>Sign in with Authorized Google Account</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#E5EAF0] w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-[#778397] shrink-0">
                  Or Email &amp; Password
                </span>
                <div className="border-t border-[#E5EAF0] w-full" />
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#778397] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@abhijobs.careers"
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:border-[#102B4E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#778397] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Firebase password"
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:border-[#102B4E]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={sendingReset}
                    onClick={handlePasswordReset}
                    className="text-xs font-semibold text-[#102B4E] hover:text-[#F47A24] cursor-pointer min-h-[36px]"
                  >
                    {sendingReset ? 'Sending reset link...' : 'Forgot password?'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {submitting ? 'Authenticating...' : 'Sign In to Admin Control Center'}
                </button>
              </form>
            </>
          )}

          <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] hover:bg-[#F6F8FB] text-[#253449] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to ABHI JOBS</span>
            </button>
            <span className="text-[11px] text-[#778397] text-right">
              Protected by Firestore Security Rules
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
