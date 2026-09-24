import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ScrollReveal, EASE_PREMIUM, TextMaskReveal, ScrollProgress } from '../../lib/motion';
import {
  Building2,
  Briefcase,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Globe,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AbhiJobsLogo } from '../../components/AbhiJobsLogo';
import { PasswordStrengthIndicator, usePasswordStrength } from '../../components/PasswordStrengthIndicator';
import { supabase } from '../../supabaseClient';

interface EmployerRegisterPageProps {
  navigate: (route: string) => void;
}

export const EmployerRegisterPage: React.FC<EmployerRegisterPageProps> = ({ navigate }) => {
  const { registerEmployer } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('Technology & IT Services');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [companySize, setCompanySize] = useState('11-50 employees');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const passwordStrength = usePasswordStrength(password, 8);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid work email address.';
    }
    if (!companyName.trim()) {
      errs.companyName = 'Please enter your company or organization name.';
    }
    if (!passwordStrength.isValid) {
      errs.password = 'Password must meet all security requirements.';
    }
    if (!termsAccepted) {
      errs.terms = 'You must agree to the Terms of Service & Privacy Policy.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});
    setConfirmationMessage('');

    try {
      // Supabase Authentication: Sign Up
      const { data, error: sbError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (sbError) {
        setErrors({ form: sbError.message });
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

      // Cache registration details locally without logging in
      try {
        await registerEmployer({
          name: fullName.trim(),
          email: email.trim(),
          companyName: companyName.trim(),
          phone: phone.trim(),
          password,
          industry,
          location: location.trim() || 'India',
          website: website.trim(),
          companySize,
        });
      } catch {}

      // Do NOT auto-login. Redirect user to Sign In page with email parameter
      navigate(`/login?email=${encodeURIComponent(email.trim())}&registered=true`);
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to register employer account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <ScrollProgress />
      <div className="max-w-2xl w-full mx-auto space-y-8">
        
        {/* Header Branding */}
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-[#FF2B1A]" />
              <span>Employer &amp; Recruiter Registration</span>
            </div>
            <TextMaskReveal
              as="h1"
              className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
              delay={0.1}
              duration={0.65}
            >
              Register Your Company on ABHI JOBS
            </TextMaskReveal>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              Create an organization account to post verified job openings, review qualified applicants, and access skilled talent.
            </p>
          </div>
        </ScrollReveal>

        {/* Form Card */}
        <ScrollReveal direction="up" delay={0.06} distance={18}>
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          {errors.form && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errors.form}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Recruiter Details */}
            <div className="border-b border-slate-100 pb-4 space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recruiter / Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Mehta"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061226]"
                  />
                  {errors.fullName && <p className="text-[11px] text-red-600 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Work Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@company.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061226]"
                  />
                  {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061226]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Website
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061226]"
                  />
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div className="border-b border-slate-100 pb-4 space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Organization Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Technologies Pvt Ltd"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061226]"
                  />
                  {errors.companyName && <p className="text-[11px] text-red-600 mt-1">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Industry Domain
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#061226] cursor-pointer"
                  >
                    <option value="Technology & IT Services">Technology &amp; IT Services</option>
                    <option value="Banking & Financial Services">Banking &amp; Financial Services</option>
                    <option value="Healthcare & Life Sciences">Healthcare &amp; Life Sciences</option>
                    <option value="Manufacturing & Logistics">Manufacturing &amp; Logistics</option>
                    <option value="E-Commerce & Retail">E-Commerce &amp; Retail</option>
                    <option value="EdTech & Education">EdTech &amp; Education</option>
                    <option value="Other">Other Industry</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Headquarters / Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bangalore, Karnataka"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061226]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Size
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#061226] cursor-pointer"
                  >
                    <option value="1-10 employees">1-10 employees</option>
                    <option value="11-50 employees">11-50 employees</option>
                    <option value="51-200 employees">51-200 employees</option>
                    <option value="201-500 employees">201-500 employees</option>
                    <option value="500+ employees">500+ employees</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Set Portal Password <span className="text-red-500">*</span>
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
                  placeholder="Create a strong password"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061226]"
                />
                {errors.password && <p className="text-[11px] text-red-600 mt-1">{errors.password}</p>}
              </div>

              {password && (
                <PasswordStrengthIndicator
                  result={passwordStrength}
                  showCriteriaList={true}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200"
                />
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#004D40] focus:ring-[#061226] border-slate-300 cursor-pointer"
                />
                <span>
                  I confirm that I represent this organization and agree to ABHI JOBS's{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/terms')}
                    className="text-[#004D40] font-semibold underline hover:text-black"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/privacy')}
                    className="text-[#004D40] font-semibold underline hover:text-black"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>
              {errors.terms && <p className="text-[11px] text-red-600 mt-1">{errors.terms}</p>}
            </div>

            {/* Submit */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Registering organization...</span>
                  </>
                ) : (
                  <>
                    <span>Create Employer Account</span>
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

            {errors.form && (
              <p className="text-xs text-red-600 text-center font-medium mt-2">
                {errors.form}
              </p>
            )}
          </form>

          {/* Links */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              <span>Already registered? </span>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-bold text-[#004D40] hover:underline cursor-pointer"
              >
                Sign In here
              </button>
            </div>
            <div>
              <span>Looking for a job? </span>
              <button
                type="button"
                onClick={() => navigate('/register/job-seeker')}
                className="font-bold text-[#004D40] hover:underline cursor-pointer"
              >
                Register as Job Seeker
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </div>
);
};
