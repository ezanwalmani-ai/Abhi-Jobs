import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, AlertCircle, ArrowRight, Building2, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoogleAuthModal } from '../../components/GoogleAuthModal';
import { AbhiJobsLogo } from '../../components/AbhiJobsLogo';
import { ScrollReveal, EASE_PREMIUM } from '../../lib/motion';
import { supabase } from '../../supabaseClient';

interface LoginPageProps {
  navigate: (route: string) => void;
  redirectMessage?: string;
  initialEmail?: string;
  isSignupSuccess?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  navigate,
  redirectMessage,
  initialEmail = '',
  isSignupSuccess = false,
}) => {
  const { loginWithEmail, registerJobSeeker } = useApp();

  const [email, setEmail] = useState(() => {
    if (initialEmail) return initialEmail;
    try {
      const stored = sessionStorage.getItem('signup_prefill_email');
      if (stored) return stored;
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('email') || '';
    } catch {
      return '';
    }
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(redirectMessage || '');
  const [successMessage, setSuccessMessage] = useState(() => {
    if (isSignupSuccess) {
      return 'Your account has been created. Please check your email and verify your address before logging in.';
    }
    try {
      const storedMsg = sessionStorage.getItem('signup_success_msg');
      if (storedMsg) {
        sessionStorage.removeItem('signup_success_msg');
        return storedMsg;
      }
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('registered') === 'true') {
        return 'Your account has been created. Please check your email and verify your address before logging in.';
      }
    } catch {}
    return '';
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
    if (isSignupSuccess) {
      setSuccessMessage('Your account has been created. Please check your email and verify your address before logging in.');
    }
  }, [initialEmail, isSignupSuccess]);

  const routeUserByRole = (userRole?: string) => {
    if (userRole === 'employer') {
      navigate('/employer/dashboard');
    } else if (userRole === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Supabase Authentication: Sign In
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (sbError) {
        setError(sbError.message);
        setIsSubmitting(false);
        return;
      }

      // Only redirect when a real session exists after login
      if (!data?.session) {
        setError('Check your email and confirm your account before logging in.');
        setIsSubmitting(false);
        return;
      }

      // Sync active session with application state
      await loginWithEmail(email.trim(), password);

      // Redirect user to Home page
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setIsSubmitting(true);
    setError('');
    const res = await loginWithEmail(demoEmail);
    setIsSubmitting(false);
    if (res.success && res.user) {
      routeUserByRole(res.user.role);
    } else {
      setError(res.error || 'Failed to sign in.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        console.error('Error logging in with Google:', error.message);
        setError(error.message);
      }
    } catch (err: any) {
      console.error('Error logging in with Google:', err);
      setError(err?.message || 'Failed to initiate Google sign-in');
    }
  };

  const handleGoogleSuccess = async (googleUser: { name: string; email: string; avatar: string }) => {
    const loginRes = await loginWithEmail(googleUser.email);
    if (loginRes.success && loginRes.user) {
      routeUserByRole(loginRes.user.role);
    } else {
      // Register with google as a job seeker by default
      const regRes = await registerJobSeeker({
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.avatar,
        isGoogle: true,
        experienceType: 'experienced',
        city: 'Bangalore',
        state: 'Karnataka',
      });
      if (regRes.success) {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-8">
        <ScrollReveal direction="up" distance={16}>
          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-block cursor-pointer focus:outline-hidden hover:opacity-90 transition-opacity"
              aria-label="ABHI JOBS Home"
            >
              <AbhiJobsLogo variant="horizontal" theme="color" size="lg" className="mx-auto" />
            </button>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#004D40]" />
              <span>Unified Career Authentication</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign in to ABHI JOBS
            </h1>
            <p className="text-sm text-slate-600">
              Access your applications, company postings, and dashboard.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.06} distance={18}>
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
            {successMessage && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-[#004D40] font-semibold flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-3 shadow-xs cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </motion.button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full"></div>
              <div className="bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-widest absolute">
                OR SIGN IN WITH EMAIL
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061226]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-[#004D40] hover:text-[#061226] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061226]"
                />
              </div>

              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>

              {/* Error message under the form */}
              {error && (
                <p className="text-xs text-red-600 text-center font-medium mt-2">
                  {error}
                </p>
              )}
            </form>

            {/* Quick Demo Test Accounts */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                Quick 1-Click Demo Sign-In
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('jobseeker@abhijobs.careers')}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-red-600 hover:bg-red-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <User className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Job Seeker Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('employer@abhijobs.careers')}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>Employer Demo</span>
                </button>
              </div>
            </div>

            {/* New Account Links */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-center text-xs text-slate-600">
              <div>
                <span>Looking for career opportunities? </span>
                <button
                  type="button"
                  onClick={() => navigate('/register/job-seeker')}
                  className="font-bold text-[#FF2B1A] hover:underline cursor-pointer"
                >
                  Register as Job Seeker
                </button>
              </div>
              <div>
                <span>Hiring talent for your organization? </span>
                <button
                  type="button"
                  onClick={() => navigate('/register/employer')}
                  className="font-bold text-blue-800 hover:underline cursor-pointer"
                >
                  Register as Employer
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
      />
    </div>
  );
};
