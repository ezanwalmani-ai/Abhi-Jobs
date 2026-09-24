import React, { useState } from 'react';
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import {
  PasswordStrengthIndicator,
  evaluatePasswordStrength,
} from '../components/PasswordStrengthIndicator';

interface PasswordCheckerDemoPageProps {
  navigate: (route: string) => void;
}

const PRESET_TEST_PASSWORDS = [
  { label: 'Too Short (< 8)', value: 'P@ss1', description: 'Missing length' },
  { label: 'Missing Uppercase', value: 'abhijobs#secure123', description: 'No capital letters' },
  { label: 'Missing Lowercase', value: 'ABHIJOBS#SECURE123', description: 'No small letters' },
  { label: 'Missing Number', value: 'AbhiJobsSecure@Pass', description: 'No digits' },
  { label: 'Missing Special Char', value: 'AbhiJobsSecure1234', description: 'No symbols' },
  { label: 'Common / Repetitive', value: 'aaaa1111AA!!', description: 'Repetitive pattern' },
  { label: 'Standard Strong', value: 'AbhiJobs#Pro2026', description: 'All 5 criteria satisfied' },
  { label: 'Very Strong (16+)', value: 'AbhiJobs#Enterprise99@Scale', description: 'Enterprise-grade entropy' },
];

export const PasswordCheckerDemoPage: React.FC<PasswordCheckerDemoPageProps> = ({ navigate }) => {
  const [password, setPassword] = useState('AbhiJobs#Pro2026');
  const [showPassword, setShowPassword] = useState(true);
  const [variant, setVariant] = useState<'detailed' | 'compact' | 'minimal'>('detailed');
  const [minLength, setMinLength] = useState(8);
  const [showChecklist, setShowChecklist] = useState(true);
  const [showTips, setShowTips] = useState(true);
  const [copied, setCopied] = useState(false);

  const evaluation = evaluatePasswordStrength(password, minLength);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateRandomStrong = () => {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const specials = '!@#$%^&*()_+';
    let res = '';
    res += uppers[Math.floor(Math.random() * uppers.length)];
    res += lowers[Math.floor(Math.random() * lowers.length)];
    res += lowers[Math.floor(Math.random() * lowers.length)];
    res += numbers[Math.floor(Math.random() * numbers.length)];
    res += specials[Math.floor(Math.random() * specials.length)];
    const all = uppers + lowers + numbers + specials;
    for (let i = 0; i < 7; i++) {
      res += all[Math.floor(Math.random() * all.length)];
    }
    setPassword(res);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-[#061226] text-white border-b border-slate-800 pt-10 pb-12 sm:pt-12 sm:pb-14 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between gap-4 mb-6">
            <button
              onClick={() => navigate('/register/job-seeker')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl border border-white/20 transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Job Seeker Registration</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-teal-200 hover:text-white transition-colors"
            >
              Home
            </button>
          </div>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-teal-200 text-xs font-semibold mb-3">
              <KeyRound className="w-3.5 h-3.5 text-[#FF2B1A]" />
              <span>Real-Time Security Component</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              Password Strength Visual Indicator
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Tests password complexity in real-time across uppercase, lowercase, number, special character, and length requirements as you type.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Interactive Input & Component Output */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-50 text-[#004D40]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Live Typing Preview</h2>
                    <p className="text-xs text-slate-500">Type or select presets to test real-time validation</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={generateRandomStrong}
                    title="Generate secure random password"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#004D40] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate</span>
                  </button>
                  {password && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      title="Copy password"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#004D40]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password Input
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-semibold text-[#004D40] hover:text-[#061226] transition-colors cursor-pointer"
                  >
                    {showPassword ? 'Hide plain text' : 'Show plain text'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Type a password here to test..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#061226] transition-all"
                />
              </div>

              {/* The Live Real-Time Component */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Live Component Render
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    variant: {variant}
                  </span>
                </div>
                
                <PasswordStrengthIndicator
                  password={password}
                  minLength={minLength}
                  variant={variant}
                  showChecklist={showChecklist}
                  showTips={showTips}
                  showCharCount={true}
                />
              </div>

              {/* Evaluation Status Banner */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  evaluation.isValid
                    ? 'bg-teal-50 border-teal-200 text-[#004D40]'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">Form Submission Status:</span>
                  <span>
                    {evaluation.isValid
                      ? 'Ready to Submit (Valid)'
                      : `Incomplete (${evaluation.totalCriteria - evaluation.metCount} criteria remaining)`}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/register/job-seeker')}
                  className="inline-flex items-center gap-1 font-bold text-[#004D40] hover:underline cursor-pointer"
                >
                  <span>Go to Registration</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Presets & Display Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Component Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-[#004D40]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Component Props Configuration
                </h3>
              </div>

              {/* Variant Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Display Variant</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['detailed', 'compact', 'minimal'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVariant(v)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        variant === v
                          ? 'bg-[#061226] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Length */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Minimum Length:</span>
                  <span className="font-bold text-[#004D40]">{minLength} characters</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="16"
                  value={minLength}
                  onChange={(e) => setMinLength(Number(e.target.value))}
                  className="w-full accent-[#004D40] cursor-pointer"
                />
              </div>

              {/* Checklist & Tips Toggles */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                  <span>Show Criteria Checklist</span>
                  <input
                    type="checkbox"
                    checked={showChecklist}
                    onChange={(e) => setShowChecklist(e.target.checked)}
                    className="rounded text-[#004D40] focus:ring-[#004D40] h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                  <span>Show Suggestion Tip</span>
                  <input
                    type="checkbox"
                    checked={showTips}
                    onChange={(e) => setShowTips(e.target.checked)}
                    className="rounded text-[#004D40] focus:ring-[#004D40] h-4 w-4"
                  />
                </label>
              </div>
            </div>

            {/* Presets List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Test Presets
                </h3>
                <span className="text-[10px] text-slate-400">Click to apply</span>
              </div>

              <div className="space-y-1.5">
                {PRESET_TEST_PASSWORDS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPassword(preset.value)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                      password === preset.value
                        ? 'bg-teal-50 border-teal-300 text-[#061226] font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{preset.label}</div>
                      <div className="text-[11px] text-slate-500">{preset.description}</div>
                    </div>
                    <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                      {preset.value}
                    </code>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};
