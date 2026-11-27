import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import {
  auth as firebaseAuth,
  signInWithFirebaseGoogle,
  signInWithFirebaseEmail,
  resendFirebaseEmailVerification,
  requestFirebasePasswordReset,
  firebaseSignOut,
} from '../../lib/firebase';
import type { ResolvedAdminSession } from '../../services/adminRbacService';

interface AdminLoginPageProps {
  adminSession: ResolvedAdminSession | null;
  checking: boolean;
  onReverify: () => Promise<void>;
  onNavigateHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  adminSession,
  checking,
  onReverify,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [showResetMode, setShowResetMode] = useState(false);

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      await signInWithFirebaseGoogle();
      await onReverify();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed before completion.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMsg(
          `This domain (${window.location.hostname}) is not authorized in Firebase Authentication settings.`
        );
      } else {
        setErrorMsg(err?.message || 'Google authentication failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Enter both your administrator email and password.');
      return;
    }
    setBusy(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      await signInWithFirebaseEmail(email.trim(), password);
      setPassword('');
      await onReverify();
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setErrorMsg('Invalid administrator email or password.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Too many failed attempts. Please wait a few minutes before retrying.');
      } else {
        setErrorMsg(err?.message || 'Unable to authenticate with Firebase.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Enter your administrator email address first.');
      return;
    }
    setBusy(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      await requestFirebasePasswordReset(email.trim());
      setInfoMsg(
        'If an account exists for that email address, a Firebase password reset link has been sent.'
      );
      setShowResetMode(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to dispatch password reset email.');
    } finally {
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    setBusy(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      await resendFirebaseEmailVerification();
      setInfoMsg(
        'Verification email sent. Verify your inbox link, then click Re-check Verification.'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not resend verification email.');
    } finally {
      setBusy(false);
    }
  };

  const handleReloadAndCheck = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      if (firebaseAuth.currentUser) {
        await firebaseAuth.currentUser.reload();
      }
      await onReverify();
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      await firebaseSignOut(firebaseAuth);
      await onReverify();
    } finally {
      setBusy(false);
    }
  };

  const denial = adminSession?.denialReason;

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col justify-between text-[#1E293B]">
      {/* Subtle Top Bar */}
      <header className="w-full px-4 sm:px-8 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#102B4E] hover:text-[#F47A24] transition-colors min-h-[44px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to ABHI JOBS</span>
        </button>
        <div className="text-xs font-medium text-[#64748B]">
          ABHI JOBS · Protected Admin Access
        </div>
      </header>

      {/* Main Centered Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[450px] bg-white rounded-xl border border-[#E5EAF0] shadow-[0_4px_24px_-8px_rgba(16,43,78,0.08)] overflow-hidden">
          {/* Branded Header */}
          <div className="bg-[#081D36] px-6 py-6 text-white border-b border-[#102B4E]">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-white text-[#081D36] font-extrabold text-sm flex items-center justify-center shrink-0 tracking-tight">
                AJ
              </div>
              <div className="min-w-0">
                <h1 className="text-[17px] font-bold tracking-[-0.015em] text-white">
                  ABHI JOBS Admin Portal
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Authorized personnel sign-in · Firebase Auth + Firestore RBAC
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {checking ? (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
                <Loader2 className="w-6 h-6 animate-spin text-[#102B4E]" />
                <span>Verifying Firebase session &amp; administrator permissions...</span>
              </div>
            ) : denial === 'email_unverified' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Mail className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-amber-950 space-y-1">
                    <p className="font-bold">Email Verification Required</p>
                    <p className="text-amber-800 leading-relaxed">
                      Signed in as{' '}
                      <span className="font-mono font-semibold">{adminSession?.email}</span>, but
                      this Firebase email address is not verified. Firestore security rules require
                      a verified email token for all administrator access.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleResendVerification}
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                  >
                    Resend Verification Email
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleReloadAndCheck}
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[#081D36] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
                    <span>Re-check Status</span>
                  </button>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSignOut}
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out &amp; Use Another Account</span>
                </button>
              </div>
            ) : denial === 'account_suspended' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-rose-950 space-y-1">
                    <p className="font-bold">Administrator Account Suspended</p>
                    <p className="text-rose-800 leading-relaxed">
                      Account <span className="font-mono font-semibold">{adminSession?.email}</span>{' '}
                      is currently suspended and cannot access the Admin Portal. Contact a Super
                      Admin to review your status.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSignOut}
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#081D36] hover:bg-[#102B4E] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : denial === 'role_missing_or_revoked' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-rose-950 space-y-1">
                    <p className="font-bold">Access Denied — Not an Authorized Administrator</p>
                    <p className="text-rose-800 leading-relaxed">
                      Signed in as{' '}
                      <span className="font-mono font-semibold">{adminSession?.email}</span>, which
                      does not have an active administrator role in Firestore{' '}
                      <code className="font-mono">/admin_roles</code>. Public accounts cannot
                      self-register for admin access.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleSignOut}
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[#081D36] text-sm font-semibold cursor-pointer"
                  >
                    Return to Website
                  </button>
                </div>
              </div>
            ) : showResetMode ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-[#081D36] flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#102B4E]" />
                    <span>Reset Administrator Password</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enter your registered Firebase email to receive a password reset link.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="admin-reset-email"
                    className="block text-xs font-semibold text-[#081D36] mb-1.5"
                  >
                    Administrator Email
                  </label>
                  <input
                    id="admin-reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@abhijobs.careers"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-[#081D36] focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetMode(false);
                      setErrorMsg('');
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Send Reset Link</span>
                  </button>
                </div>
              </form>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleGoogleSignIn}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#102B4E] hover:bg-[#081D36] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2.5 shadow-2xs transition-colors cursor-pointer"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-[#F47A24]" />
                  )}
                  <span>Sign in with Authorized Google Account</span>
                </button>

                <div className="relative flex items-center py-0.5">
                  <div className="flex-grow border-t border-[#E5EAF0]" />
                  <span className="shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    or email &amp; password
                  </span>
                  <div className="flex-grow border-t border-[#E5EAF0]" />
                </div>

                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div>
                    <label
                      htmlFor="admin-login-email"
                      className="block text-xs font-semibold text-[#102B4E] mb-1.5"
                    >
                      Administrator Email
                    </label>
                    <input
                      id="admin-login-email"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@abhijobs.careers"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-[#D4DCE6] bg-white text-sm text-[#081D36] placeholder:text-[#64748B] focus:outline-none focus:border-[#102B4E]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="admin-login-password"
                        className="block text-xs font-semibold text-[#102B4E]"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetMode(true);
                          setErrorMsg('');
                        }}
                        className="text-xs font-medium text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      id="admin-login-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-[#D4DCE6] bg-white text-sm text-[#081D36] placeholder:text-[#64748B] focus:outline-none focus:border-[#102B4E]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#F47A24] hover:bg-[#DE6816] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Sign In to Admin Portal</span>
                  </button>
                </form>

                <p className="text-[11px] text-[#64748B] leading-relaxed pt-3 border-t border-[#E5EAF0]">
                  Access is restricted to verified Firebase accounts assigned an active role in{' '}
                  <code className="font-mono text-[#102B4E]">/admin_roles</code>. Public admin
                  registration is disabled.
                </p>
              </>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 px-4 text-center text-[11px] text-slate-400">
        ABHI JOBS Administration · Role-Based Access Control enforced by Firestore Security Rules
      </footer>
    </div>
  );
};
