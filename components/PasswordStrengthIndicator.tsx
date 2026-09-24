import React, { useMemo, useEffect } from 'react';
import {
  Check,
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface PasswordCriteria {
  id: 'length' | 'uppercase' | 'lowercase' | 'number' | 'special';
  label: string;
  detail: string;
  met: boolean;
  example: string;
}

export interface PasswordStrengthDetails {
  score: number; // 0 to 100
  level: 'none' | 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  metCount: number;
  totalCriteria: number;
  isValid: boolean;
  criteria: PasswordCriteria[];
  feedback: string;
  hasRepetitionWarning: boolean;
}

export interface PasswordStrengthIndicatorProps {
  password: string;
  minLength?: number;
  showChecklist?: boolean;
  showTips?: boolean;
  showCharCount?: boolean;
  variant?: 'detailed' | 'compact' | 'minimal';
  className?: string;
  onValidationChange?: (isValid: boolean, details: PasswordStrengthDetails) => void;
}

/**
 * Pure evaluation function for password strength against standard criteria
 */
export function evaluatePasswordStrength(
  password: string = '',
  minLength: number = 8
): PasswordStrengthDetails {
  const cleanPassword = password || '';
  const lengthMet = cleanPassword.length >= minLength;
  const uppercaseMet = /[A-Z]/.test(cleanPassword);
  const lowercaseMet = /[a-z]/.test(cleanPassword);
  const numberMet = /[0-9]/.test(cleanPassword);
  const specialMet = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(cleanPassword);

  const criteria: PasswordCriteria[] = [
    {
      id: 'length',
      label: `At least ${minLength} characters`,
      detail: `Current: ${cleanPassword.length}/${minLength}`,
      met: lengthMet,
      example: `${minLength}+ chars`,
    },
    {
      id: 'uppercase',
      label: '1 uppercase letter',
      detail: 'At least one capital letter',
      met: uppercaseMet,
      example: 'A-Z',
    },
    {
      id: 'lowercase',
      label: '1 lowercase letter',
      detail: 'At least one small letter',
      met: lowercaseMet,
      example: 'a-z',
    },
    {
      id: 'number',
      label: '1 number',
      detail: 'At least one digit',
      met: numberMet,
      example: '0-9',
    },
    {
      id: 'special',
      label: '1 special character',
      detail: 'Symbol like @, #, $, %, etc.',
      met: specialMet,
      example: '!@#$%^&*',
    },
  ];

  const metCount = criteria.filter((c) => c.met).length;
  const totalCriteria = criteria.length;
  const isValid = metCount === totalCriteria;

  // Repetition or trivial sequence warning
  const hasRepetitionWarning =
    cleanPassword.length >= 4 &&
    (/(.)\1{3,}/.test(cleanPassword) || /^(1234|abcd|qwerty|password|admin)/i.test(cleanPassword));

  let score = 0;
  let level: PasswordStrengthDetails['level'] = 'none';
  let label = 'None';
  let color = 'bg-slate-200';
  let bgColor = 'bg-slate-50';
  let borderColor = 'border-slate-200';
  let textColor = 'text-slate-500';
  let feedback = 'Enter a secure password.';

  if (cleanPassword.length === 0) {
    return {
      score: 0,
      level: 'none',
      label: 'No password',
      color: 'bg-slate-200',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-400',
      metCount: 0,
      totalCriteria,
      isValid: false,
      criteria,
      feedback: `Password should contain at least ${minLength} characters including uppercase, lowercase, numbers, and special symbols.`,
      hasRepetitionWarning: false,
    };
  }

  // Base score from criteria met (0 to 100)
  score = Math.round((metCount / totalCriteria) * 85);
  // Bonus if length is >= 12 and all met
  if (cleanPassword.length >= 12 && isValid) {
    score = 100;
  } else if (cleanPassword.length >= 10 && isValid) {
    score = 95;
  }

  if (hasRepetitionWarning && score > 30) {
    score = Math.max(25, score - 20);
  }

  if (metCount <= 1) {
    level = 'very-weak';
    label = 'Very Weak';
    color = 'bg-[#FF2B1A]';
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
    textColor = 'text-[#FF2B1A]';
    feedback = 'Too easy to guess. Add more character types.';
  } else if (metCount === 2) {
    level = 'weak';
    label = 'Weak';
    color = 'bg-orange-500';
    bgColor = 'bg-orange-50';
    borderColor = 'border-orange-200';
    textColor = 'text-orange-600';
    feedback = 'Fair start. Add uppercase, numbers, or symbols.';
  } else if (metCount === 3) {
    level = 'fair';
    label = 'Fair';
    color = 'bg-amber-500';
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-200';
    textColor = 'text-amber-700';
    feedback = 'Getting better! Just need a couple more criteria.';
  } else if (metCount === 4) {
    level = 'good';
    label = 'Good';
    color = 'bg-teal-600';
    bgColor = 'bg-teal-50';
    borderColor = 'border-teal-200';
    textColor = 'text-teal-800';
    feedback = 'Almost there! Add the remaining requirement.';
  } else {
    level = 'strong';
    label = cleanPassword.length >= 12 ? 'Very Strong' : 'Strong';
    color = 'bg-[#004D40]';
    bgColor = 'bg-teal-50';
    borderColor = 'border-teal-200';
    textColor = 'text-[#004D40]';
    feedback = cleanPassword.length >= 12
      ? 'Outstanding! Your password offers enterprise-grade security.'
      : 'Great job! Your password meets all security standards.';
  }

  // Next recommended action if not complete
  if (!isValid) {
    const nextUnmet = criteria.find((c) => !c.met);
    if (nextUnmet) {
      if (nextUnmet.id === 'length') {
        feedback = `Make your password at least ${minLength} characters (need ${minLength - cleanPassword.length} more).`;
      } else if (nextUnmet.id === 'uppercase') {
        feedback = 'Add at least one uppercase letter (e.g. A, B, C).';
      } else if (nextUnmet.id === 'lowercase') {
        feedback = 'Add at least one lowercase letter (e.g. a, b, c).';
      } else if (nextUnmet.id === 'number') {
        feedback = 'Include at least one number (e.g. 1, 2, 3).';
      } else if (nextUnmet.id === 'special') {
        feedback = 'Include a special character (e.g. @, #, $, %, !).';
      }
    }
  }

  return {
    score,
    level,
    label,
    color,
    bgColor,
    borderColor,
    textColor,
    metCount,
    totalCriteria,
    isValid,
    criteria,
    feedback,
    hasRepetitionWarning,
  };
}

/**
 * Hook for consuming password strength evaluation anywhere
 */
export function usePasswordStrength(password: string = '', minLength: number = 8) {
  return useMemo(
    () => evaluatePasswordStrength(password, minLength),
    [password, minLength]
  );
}

/**
 * Real-time Password Strength Visual Indicator Component
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  minLength = 8,
  showChecklist = true,
  showTips = true,
  showCharCount = true,
  variant = 'detailed',
  className = '',
  onValidationChange,
}) => {
  const details = usePasswordStrength(password, minLength);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(details.isValid, details);
    }
  }, [details, onValidationChange]);

  const segments = [1, 2, 3, 4, 5];

  // Helper for segment color based on met criteria count
  const getSegmentColor = (segmentIndex: number) => {
    if (segmentIndex > details.metCount) {
      return 'bg-slate-200';
    }
    if (details.metCount <= 1) return 'bg-[#FF2B1A]';
    if (details.metCount === 2) return 'bg-orange-500';
    if (details.metCount === 3) return 'bg-amber-500';
    if (details.metCount === 4) return 'bg-teal-600';
    return 'bg-[#004D40]';
  };

  // Helper icon for current level
  const renderLevelIcon = () => {
    if (details.level === 'strong') {
      return <ShieldCheck className="w-3.5 h-3.5 text-[#004D40]" />;
    }
    if (details.level === 'good' || details.level === 'fair') {
      return <Shield className="w-3.5 h-3.5 text-amber-600" />;
    }
    if (details.level === 'weak' || details.level === 'very-weak') {
      return <ShieldAlert className="w-3.5 h-3.5 text-[#FF2B1A]" />;
    }
    return <Shield className="w-3.5 h-3.5 text-slate-400" />;
  };

  // Minimal variant: Just the segmented bar and text
  if (variant === 'minimal') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Strength:</span>
          <span className={`font-bold ${details.textColor}`}>{details.label}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
          {segments.map((seg) => (
            <div
              key={seg}
              className={`h-full rounded-full transition-all duration-300 ${getSegmentColor(seg)}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Compact variant: Segments + status badge + 1-line feedback
  if (variant === 'compact') {
    return (
      <div className={`space-y-2 p-2.5 rounded-xl border ${details.bgColor} ${details.borderColor} transition-all duration-300 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {renderLevelIcon()}
            <span className="text-xs font-semibold text-slate-700">Password Strength:</span>
            <span className={`text-xs font-bold ${details.textColor}`}>
              {details.label}
            </span>
          </div>
          {showCharCount && (
            <span className="text-[11px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
              {password.length} chars
            </span>
          )}
        </div>

        {/* 5-segment indicator */}
        <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
          {segments.map((seg) => (
            <div
              key={seg}
              className={`h-full rounded-full transition-all duration-300 ${getSegmentColor(seg)}`}
            />
          ))}
        </div>

        {showTips && details.feedback && (
          <p className="text-[11px] text-slate-600 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{details.feedback}</span>
          </p>
        )}
      </div>
    );
  }

  // Detailed variant (default): Full real-time visual indicator with checklist & live feedback
  return (
    <div
      id="password-strength-indicator"
      className={`space-y-3 p-3.5 rounded-xl border transition-all duration-300 ${
        password ? `${details.bgColor} ${details.borderColor}` : 'bg-slate-50 border-slate-200'
      } ${className}`}
    >
      {/* Top row: Label, icon, progress level, and character count */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-white shadow-2xs border border-slate-200/60">
            {renderLevelIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700">Security:</span>
              <span className={`text-xs font-bold ${details.textColor}`}>
                {details.label}
              </span>
              {details.isValid && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-teal-100 text-[#004D40] text-[10px] font-bold">
                  <Sparkles className="w-2.5 h-2.5 text-[#004D40]" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showCharCount && (
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-colors ${
                password.length >= minLength
                  ? 'bg-teal-50 border-teal-200 text-[#004D40] font-semibold'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {password.length}/{minLength} chars
            </span>
          )}
          <span className="text-xs font-bold text-slate-600">
            {details.metCount}/{details.totalCriteria}
          </span>
        </div>
      </div>

      {/* 5-Segmented Multi-tier Visual Strength Bar */}
      <div className="space-y-1">
        <div className="grid grid-cols-5 gap-1.5 h-2 w-full">
          {segments.map((seg) => {
            const isFilled = seg <= details.metCount;
            return (
              <div
                key={seg}
                className={`h-full rounded-full transition-all duration-300 ${
                  isFilled ? getSegmentColor(seg) : 'bg-slate-200/80'
                }`}
                title={`Requirement ${seg} of 5`}
              />
            );
          })}
        </div>
      </div>

      {/* Repetition / Trivial pattern warning */}
      {details.hasRepetitionWarning && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-100/70 border border-amber-300 text-[11px] text-amber-900 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Warning: Avoid repeating identical characters or common keyboard patterns.</span>
        </div>
      )}

      {/* Real-Time Criteria Checklist Grid */}
      {showChecklist && (
        <div className="pt-1">
          <div className="text-[11px] font-bold text-[#101828] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Password Requirements</span>
            <span className="text-[10px] font-normal text-[#667085] normal-case">
              {details.isValid ? 'All criteria met' : `${details.totalCriteria - details.metCount} left`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {details.criteria.map((criterion) => {
              const isMet = criterion.met;
              return (
                <div
                  key={criterion.id}
                  id={`password-criterion-${criterion.id}`}
                  className={`flex items-center gap-2 p-1.5 rounded-lg text-xs transition-all duration-200 ${
                    isMet
                      ? 'bg-white/90 text-[#101828] font-medium border border-teal-200 shadow-2xs'
                      : 'bg-white/40 text-[#667085] border border-transparent'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isMet
                        ? 'bg-[#004D40] text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isMet ? (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                    <span className={`truncate ${isMet ? 'text-[#101828] font-semibold' : 'text-[#667085]'}`}>
                      {criterion.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono shrink-0 ml-1 px-1 rounded ${
                        isMet
                          ? 'text-[#004D40] bg-teal-50 font-medium border border-teal-200/60'
                          : 'text-[#667085] bg-slate-100'
                      }`}
                    >
                      {criterion.example}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Actionable Guidance Tip */}
      {showTips && (
        <div className="flex items-start gap-1.5 pt-1 text-[11px] text-slate-600">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <span className="font-semibold text-slate-700">Suggestion: </span>
            {details.feedback}
          </p>
        </div>
      )}
    </div>
  );
};

export interface PasswordInputWithStrengthProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  minLength?: number;
  showStrengthIndicator?: boolean;
  indicatorVariant?: 'detailed' | 'compact' | 'minimal';
  className?: string;
  onValidationChange?: (isValid: boolean, details: PasswordStrengthDetails) => void;
}

/**
 * All-in-one Password Input field with Show/Hide toggle and Real-Time Password Strength Visual Indicator
 */
export const PasswordInputWithStrength: React.FC<PasswordInputWithStrengthProps> = ({
  id = 'password-input',
  name = 'password',
  value,
  onChange,
  placeholder = 'Create a secure password',
  label = 'Password',
  required = true,
  error,
  minLength = 8,
  showStrengthIndicator = true,
  indicatorVariant = 'detailed',
  className = '',
  onValidationChange,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="text-xs font-semibold text-[#004D40] hover:text-[#061226] flex items-center gap-1 cursor-pointer transition-colors"
        >
          {showPassword ? (
            <>
              <span className="text-xs">Hide</span>
            </>
          ) : (
            <>
              <span className="text-xs">Show</span>
            </>
          )}
        </button>
      </div>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl border text-sm text-[#101828] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#061226] focus:border-[#061226] transition-all ${
            error ? 'border-red-400 bg-red-50/20' : 'border-[#D0D5DD] bg-white'
          }`}
        />
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      {showStrengthIndicator && (
        <div className="pt-1">
          <PasswordStrengthIndicator
            password={value}
            minLength={minLength}
            variant={indicatorVariant}
            onValidationChange={onValidationChange}
          />
        </div>
      )}
    </div>
  );
};

