import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ScrollReveal, EASE_PREMIUM, TextMaskReveal, ScrollProgress } from '../../lib/motion';
import {
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  X,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INDIAN_STATES_AND_UTS, POPULAR_CITIES } from '../../data/locations';
import { GoogleAuthModal } from '../../components/GoogleAuthModal';
import { AbhiJobsLogo } from '../../components/AbhiJobsLogo';
import { PasswordStrengthIndicator, usePasswordStrength } from '../../components/PasswordStrengthIndicator';
import { supabase } from '../../supabaseClient';

interface JobSeekerRegisterPageProps {
  navigate: (route: string) => void;
}

export const JobSeekerRegisterPage: React.FC<JobSeekerRegisterPageProps> = ({ navigate }) => {
  const { registerJobSeeker, showToast } = useApp();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [workStatus, setWorkStatus] = useState('Looking for a job');
  const [experienceLevel, setExperienceLevel] = useState<'experienced' | 'fresher'>('experienced');
  const [currentCity, setCurrentCity] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);

  // Consents
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Form submission & Google modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{ name: string; email: string } | null>(null);
  const [supabaseError, setSupabaseError] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time password strength and criteria evaluation
  const passwordStrength = usePasswordStrength(password, 8);

  const filteredStates = useMemo(() => {
    if (!stateSearchQuery.trim()) return INDIAN_STATES_AND_UTS;
    return INDIAN_STATES_AND_UTS.filter((st) =>
      st.toLowerCase().includes(stateSearchQuery.toLowerCase())
    );
  }, [stateSearchQuery]);

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name (at least 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!passwordStrength.isValid) {
      errs.password = 'Password must meet all 5 security requirements.';
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      errs.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }

    if (!currentCity.trim()) {
      errs.currentCity = 'Please enter your current city.';
    }

    if (!currentState) {
      errs.currentState = 'Please select your current state / UT.';
    }

    if (!termsAccepted) {
      errs.terms = 'You must accept the Terms and Conditions & Privacy Policy to register.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setSupabaseError('');
    setConfirmationMessage('');

    try {
      // Supabase Authentication: Sign Up
      const { data, error: sbError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (sbError) {
        setSupabaseError(sbError.message);
        setIsSubmitting(false);
        return;
      }

      // Pre-fill email and set message for the Sign In page
      try {
        sessionStorage.setItem('signup_prefill_email', email.trim());
        sessionStorage.setItem(
          'signup_success_msg',
          'Your account has been created. Please check your email and verify your address before logging in.'
        );
      } catch {}

      // Optional sync in local context without auto-logging in
      try {
        await registerJobSeeker({
          name: fullName.trim(),
          email: email.trim(),
          phone: `${countryCode} ${mobileNumber.trim()}`,
          password,
          workStatus,
          experienceLevel: experienceLevel === 'fresher' ? 'Fresher' : 'Experienced',
          experienceType: experienceLevel,
          city: currentCity.trim(),
          state: currentState,
          marketingConsent,
        });
      } catch {}

      // Do NOT auto-login. Redirect user to Sign In page with email parameter
      navigate(`/login?email=${encodeURIComponent(email.trim())}&registered=true`);
    } catch (err: any) {
      setSupabaseError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (googleUser: { name: string; email: string; avatar: string }) => {
    setIsSubmitting(true);
    try {
      const result = await registerJobSeeker({
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.avatar,
        isGoogle: true,
        experienceType: 'experienced',
        experienceLevel: 'Experienced',
        workStatus: 'Looking for a job',
        city: 'Bangalore',
        state: 'Karnataka',
        marketingConsent: true,
      });

      if (!result.success) {
        setErrors((prev) => ({ ...prev, general: result.error || 'Google registration failed' }));
        showToast('error', 'Registration Notice', result.error);
        setIsSubmitting(false);
        return;
      }

      setRegisteredUser({
        name: googleUser.name,
        email: googleUser.email,
      });
    } catch (err) {
      showToast('error', 'Google Registration Error', 'Unable to complete sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Successful Registration Screen
  if (registeredUser) {
    const firstName = registeredUser.name.split(' ')[0] || 'there';

    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-2xl bg-teal-50 border border-teal-200 text-[#061226] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-[#004D40]" />
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 text-[#004D40] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#004D40]" />
              Account Created Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome to ABHI JOBS, {firstName}!
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your account is ready. Now let's build your professional profile so we can show you more relevant opportunities.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-[#004D40]" />
              <span>Job Seeker Credentials Registered</span>
            </div>
            <p className="text-slate-500">
              Signed in as <strong className="text-slate-800">{registeredUser.email}</strong>. Registration takes 1-2 minutes, and completing your profile unlocks AI-powered job matching.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/job-seeker/onboarding')}
              className="w-full py-3.5 px-6 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Complete My Profile</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/jobs')}
              className="w-full py-3 px-6 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm transition-all cursor-pointer"
            >
              Explore Jobs First
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-14 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <ScrollProgress />
      <div className="max-w-xl w-full mx-auto space-y-8">
        {/* Header Title Section */}
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-[#061226] text-xs font-semibold">
              <span>Job Seeker Sign Up</span>
            </div>
            <TextMaskReveal
              as="h1"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight"
              delay={0.1}
              duration={0.65}
            >
              Create your ABHI JOBS account
            </TextMaskReveal>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
              Create your account in minutes and discover opportunities matched to your skills and career goals.
            </p>
          </div>
        </ScrollReveal>

        {/* Card Container */}
        <ScrollReveal direction="up" delay={0.06} distance={18}>
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          {/* General Error Banner */}
          {errors.general && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* 1. Continue with Google */}
          <div>
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <div className="bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-widest absolute">
              OR
            </div>
          </div>

          {/* Manual Registration Form */}
          <form onSubmit={handleManualRegister} className="space-y-5">
            <h2 className="text-base font-bold text-slate-900">Create account with email</h2>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#061226] transition-all ${
                  errors.fullName ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                }`}
              />
              {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
            </div>

            {/* Email ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Email ID <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="Enter your email address"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#061226] transition-all ${
                  errors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                }`}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password with Show/Hide & Strength */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-semibold text-[#004D40] hover:text-[#061226] flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide password</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show password</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="Create a password"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#061226] transition-all ${
                    errors.password ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                  }`}
                />
              </div>

              {/* Real-time Password Strength Visual Indicator */}
              <div className="pt-1">
                <PasswordStrengthIndicator
                  password={password}
                  minLength={8}
                  showChecklist={true}
                  showTips={true}
                  showCharCount={true}
                />
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-[#061226] transition-all">
                <div className="bg-slate-100 border-r border-slate-300 px-3 py-3 flex items-center text-xs sm:text-sm font-semibold text-slate-700">
                  {countryCode}
                </div>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                    if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: '' }));
                  }}
                  placeholder="Enter mobile number"
                  className="w-full px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400">Example: +91 | 9876543210 (10 digits)</p>
              {errors.mobileNumber && <p className="text-xs text-red-600">{errors.mobileNumber}</p>}
            </div>

            {/* Work Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Work Status
              </label>
              <select
                value={workStatus}
                onChange={(e) => setWorkStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#061226] cursor-pointer"
              >
                <option value="Working">Working</option>
                <option value="Looking for a job">Looking for a job</option>
                <option value="Currently not working">Currently not working</option>
                <option value="Student">Student</option>
              </select>
            </div>

            {/* Experience Level - Two Large Selectable Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Experience Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExperienceLevel('experienced')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                    experienceLevel === 'experienced'
                      ? 'border-[#FF2B1A] bg-red-50/30 ring-2 ring-[#FF2B1A]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      experienceLevel === 'experienced'
                        ? 'bg-[#061226] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">I'm Experienced</div>
                    <div className="text-xs text-slate-500 mt-0.5">I have worked in a corporate or professional role</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExperienceLevel('fresher')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                    experienceLevel === 'fresher'
                      ? 'border-[#FF2B1A] bg-red-50/30 ring-2 ring-[#FF2B1A]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      experienceLevel === 'fresher'
                        ? 'bg-[#061226] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">I'm a Fresher</div>
                    <div className="text-xs text-slate-500 mt-0.5">I am a student or recent graduate seeking first job</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Location: Current City & Current State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current City */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Current City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentCity}
                  onChange={(e) => {
                    setCurrentCity(e.target.value);
                    if (errors.currentCity) setErrors((prev) => ({ ...prev, currentCity: '' }));
                  }}
                  placeholder="Enter your current city"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#061226] transition-all ${
                    errors.currentCity ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                  }`}
                />
                {errors.currentCity && <p className="text-xs text-red-600">{errors.currentCity}</p>}
              </div>

              {/* Current State - Searchable Dropdown */}
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Current State <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm flex items-center justify-between cursor-pointer bg-white ${
                    errors.currentState ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                  }`}
                >
                  <span className={currentState ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                    {currentState || 'Select State / UT'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                {isStateDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-64 flex flex-col animate-in fade-in-50 duration-150">
                    <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                      <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={stateSearchQuery}
                        onChange={(e) => setStateSearchQuery(e.target.value)}
                        placeholder="Search state or union territory..."
                        className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                      {filteredStates.map((st) => (
                        <button
                          type="button"
                          key={st}
                          onClick={() => {
                            setCurrentState(st);
                            setIsStateDropdownOpen(false);
                            setStateSearchQuery('');
                            if (errors.currentState) setErrors((prev) => ({ ...prev, currentState: '' }));
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs hover:bg-teal-50 hover:text-[#061226] transition-colors flex items-center justify-between cursor-pointer ${
                            currentState === st ? 'bg-teal-50 font-bold text-[#004D40]' : 'text-slate-700'
                          }`}
                        >
                          <span>{st}</span>
                          {currentState === st && <Check className="w-3.5 h-3.5 text-[#004D40]" />}
                        </button>
                      ))}
                      {filteredStates.length === 0 && (
                        <div className="p-4 text-center text-xs text-slate-400">No states found</div>
                      )}
                    </div>
                  </div>
                )}
                {errors.currentState && <p className="text-xs text-red-600">{errors.currentState}</p>}
              </div>
            </div>

            {/* 3. Communication Preferences */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#004D40] focus:ring-[#004D40] cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  Send me important updates &amp; promotions via SMS, email, and{' '}
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                    <svg className="w-3.5 h-3.5 text-[#25D366] inline-block" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                    WhatsApp
                  </span>
                </span>
              </label>
              <p className="text-[11px] text-slate-400 pl-7">
                Optional. You can manage notification settings at any time in your account.
              </p>
            </div>

            {/* 4. Terms & Privacy Consent */}
            <div className="space-y-1.5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: '' }));
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#061226] focus:ring-[#061226] cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  By clicking Register, you agree to ABHI JOBS's{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/terms')}
                    className="font-bold text-[#061226] hover:underline cursor-pointer"
                  >
                    Terms and Conditions
                  </button>{' '}
                  &amp;{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/privacy')}
                    className="font-bold text-[#061226] hover:underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  . <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.terms && <p className="text-xs text-red-600 pl-7">{errors.terms}</p>}
            </div>

            {/* 5. Register Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!termsAccepted || isSubmitting}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 ${
                  termsAccepted && !isSubmitting
                    ? 'bg-[#FF2B1A] hover:bg-[#e02213] text-white hover:shadow-lg active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <>
                    <span>Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Status & Error messages under the form */}
            {confirmationMessage && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] text-sm font-semibold text-center mt-3 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#004D40] shrink-0" />
                <span>{confirmationMessage}</span>
              </div>
            )}

            {supabaseError && (
              <p className="text-xs text-red-600 text-center font-medium mt-2">
                {supabaseError}
              </p>
            )}
          </form>

          {/* 6. Existing Account */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs sm:text-sm text-slate-600">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-bold text-[#061226] hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </ScrollReveal>
    </div>

    {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
      />
    </div>
  );
};
