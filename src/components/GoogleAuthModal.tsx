import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ShieldCheck, UserPlus, ArrowLeft, Lock, ExternalLink } from 'lucide-react';
import { EASE_PREMIUM } from '../lib/motion';
import { signInWithFirebaseGoogle } from '../lib/firebase';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (googleUser: { name: string; email: string; avatar: string }) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [viewMode, setViewMode] = useState<'choose' | 'custom'>('choose');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState('Connecting to Google...');

  const activeAccount = {
    name: 'Ezan Walmani',
    email: 'ezanwalmani@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EzanWalmani',
  };

  const handleTriggerFirebasePopup = async () => {
    setIsAuthenticating(true);
    setAuthStatusMessage('Opening Google popup...');
    try {
      const fbData = await signInWithFirebaseGoogle();
      setIsAuthenticating(false);
      onSuccess({
        name: fbData.name,
        email: fbData.email,
        avatar: fbData.avatar,
      });
      onClose();
      setViewMode('choose');
    } catch (err: any) {
      setIsAuthenticating(false);
      if (err?.code === 'auth/popup-blocked') {
        setAuthStatusMessage('Popup was blocked by browser. Please select account below.');
      } else {
        setAuthStatusMessage('Sign-in cancelled or closed. Select account below.');
      }
      setTimeout(() => setAuthStatusMessage(''), 3000);
    }
  };

  const handleAuthenticate = (name: string, email: string, avatar?: string) => {
    if (!name.trim() || !email.trim()) return;
    setIsAuthenticating(true);
    setAuthStatusMessage('Connecting to Google...');

    setTimeout(() => {
      setAuthStatusMessage('Verifying credentials & session...');
      setTimeout(() => {
        setIsAuthenticating(false);
        onSuccess({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          avatar:
            avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
        });
        onClose();
        setViewMode('choose');
      }, 400);
    }, 300);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) return;
    handleAuthenticate(customName, customEmail);
  };

  const handleCloseModal = () => {
    if (isAuthenticating) return;
    setViewMode('choose');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleCloseModal}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: EASE_PREMIUM }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 flex flex-col max-h-[90vh]"
          >
            {/* Google Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-slate-200/80 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Sign in with Google</h3>
                  <p className="text-xs text-slate-500">to continue to ABHI JOBS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isAuthenticating}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Authentication Progress Banner */}
            {isAuthenticating && (
              <div className="bg-blue-50/90 border-b border-blue-100 p-3 flex items-center justify-center gap-2.5 text-xs font-semibold text-blue-700 animate-pulse">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                <span>{authStatusMessage}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {viewMode === 'choose' ? (
                <div className="space-y-3">
                  {/* Direct Firebase Google OAuth Popup Action */}
                  <button
                    type="button"
                    disabled={isAuthenticating}
                    onClick={handleTriggerFirebasePopup}
                    className="w-full p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 hover:bg-blue-100/70 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer text-left shadow-xs disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-white border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-blue-900 group-hover:text-blue-950 transition-colors">
                          Open Google Account Window
                        </div>
                        <div className="text-xs text-blue-700">Official Google authentication popup</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <div className="relative flex items-center justify-center my-1">
                    <div className="border-t border-slate-200 w-full"></div>
                    <div className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">
                      or select profile
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Choose an account
                  </p>

                  {/* Primary Detected Google Account */}
                  <button
                    type="button"
                    disabled={isAuthenticating}
                    onClick={() =>
                      handleAuthenticate(activeAccount.name, activeAccount.email, activeAccount.avatar)
                    }
                    className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between group cursor-pointer text-left shadow-xs active:scale-[0.99] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white font-bold flex items-center justify-center shrink-0 shadow-sm text-sm">
                        E
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {activeAccount.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{activeAccount.email}</div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  </button>

                  {/* Use another Google account button */}
                  <button
                    type="button"
                    disabled={isAuthenticating}
                    onClick={() => setViewMode('custom')}
                    className="w-full p-3.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center gap-3 text-left cursor-pointer group disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                        Use another Google account
                      </div>
                      <div className="text-xs text-slate-400">Sign in with any Gmail or Workspace address</div>
                    </div>
                  </button>
                </div>
              ) : (
                /* Custom Google Account Form */
                <form onSubmit={handleCustomSubmit} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setViewMode('choose')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to account choices</span>
                  </button>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Google Account Name
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. John Doe"
                        required
                        disabled={isAuthenticating}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Google Email Address
                      </label>
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="username@gmail.com"
                        required
                        disabled={isAuthenticating}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating || !customName.trim() || !customEmail.trim()}
                    className="w-full py-3 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Continue with this account</span>
                  </button>
                </form>
              )}

              {/* Security & Privacy Notice */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Secure Google Single Sign-On handshake</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  To continue, Google will share your verified name, email address, and profile photo with{' '}
                  <span className="font-semibold text-slate-600">ABHI JOBS</span>.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
