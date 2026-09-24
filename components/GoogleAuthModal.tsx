import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { EASE_PREMIUM } from '../lib/motion';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSuccess({
        name: name.trim(),
        email: email.trim(),
        avatar: '',
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: EASE_PREMIUM }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800"
          >
        {/* Google Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
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
            <div>
              <h3 className="text-base font-bold text-slate-900">Sign in with Google</h3>
              <p className="text-xs text-slate-500">to continue to ABHI JOBS Career Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Entry Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs font-medium text-slate-500">Sign in with your Google credentials</p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#101828] mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#D0D5DD] rounded-xl focus:outline-hidden focus:border-[#061226]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#101828] mb-1">Google Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                required
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#D0D5DD] rounded-xl focus:outline-hidden focus:border-[#061226]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name || !email}
            className="w-full py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            {isSubmitting ? 'Authenticating...' : 'Continue with Google'}
          </button>

          <div className="pt-2 text-[11px] text-[#667085] text-center leading-relaxed">
            To continue, Google will share your name and email address with ABHI JOBS. See ABHI JOBS's{' '}
            <span className="text-[#004D40] font-semibold underline">Privacy Policy</span>.
          </div>
        </form>

        {isSubmitting && (
          <div className="p-4 bg-teal-50 border-t border-teal-100 flex items-center justify-center gap-2 text-xs font-semibold text-[#004D40]">
            <div className="w-4 h-4 border-2 border-[#004D40] border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting your Google Account...</span>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
