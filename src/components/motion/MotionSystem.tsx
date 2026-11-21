import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EASE_PREMIUM, EASE_OUT } from '../../lib/motion';

/**
 * 1. AnimatedSectionHeading
 * Progressive scroll-triggered section heading with subtle kicker,
 * crisp headline entrance, animated accent underline, and supporting copy.
 * Uses amount: 'some' so important headings are never stuck hidden.
 */
export interface AnimatedSectionHeadingProps {
  kicker?: string;
  title: string;
  highlightWord?: string;
  subtitle?: string;
  align?: 'left' | 'center';
  light?: boolean;
  className?: string;
  rightSlot?: React.ReactNode;
}

export const AnimatedSectionHeading: React.FC<AnimatedSectionHeadingProps> = ({
  kicker,
  title,
  highlightWord,
  subtitle,
  align = 'left',
  light = false,
  className = '',
  rightSlot,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const renderTitle = () => {
    if (!highlightWord) return title;
    const idx = title.toLowerCase().indexOf(highlightWord.toLowerCase());
    if (idx === -1) return title;
    const before = title.slice(0, idx);
    const match = title.slice(idx, idx + highlightWord.length);
    const after = title.slice(idx + highlightWord.length);
    return (
      <>
        {before}
        <span className="text-[#F47A24]">{match}</span>
        {after}
      </>
    );
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 'some' }}
      transition={{ duration: 0.48, ease: EASE_PREMIUM }}
      className={`flex flex-col ${
        rightSlot ? 'sm:flex-row sm:items-end justify-between gap-4' : ''
      } ${align === 'center' ? 'items-center text-center' : ''} ${className}`}
    >
      <div className={align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'}>
        {kicker && (
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="text-xs font-semibold uppercase tracking-[0.13em] text-[#F47A24]"
          >
            {kicker}
          </motion.p>
        )}

        <h2
          className={`font-display text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-balance ${
            light ? 'text-white' : 'text-[#102B4E]'
          }`}
        >
          {renderTitle()}
        </h2>

        {/* Subtle animated accent rule */}
        <motion.div
          initial={shouldReduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 'some' }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE_PREMIUM }}
          style={{ transformOrigin: align === 'center' ? 'center' : 'left' }}
          className={`mt-2.5 h-[2px] w-10 rounded-full bg-[#F47A24]/80 ${
            align === 'center' ? 'mx-auto' : ''
          }`}
        />

        {subtitle && (
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 'some' }}
            transition={{ duration: 0.42, delay: 0.08, ease: EASE_PREMIUM }}
            className={`text-sm sm:text-base mt-3 leading-relaxed ${
              light ? 'text-slate-300' : 'text-[#778397]'
            }`}
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </motion.div>
  );
};

/**
 * 2. AnimatedTextSwap
 * Smooth, readable text-state transition for dynamic labels
 * (e.g., Save -> Saved, Apply Now -> Submitting -> Applied, dynamic filter counts).
 */
export const AnimatedTextSwap: React.FC<{
  stateKey: string | number;
  children: React.ReactNode;
  className?: string;
}> = ({ stateKey, children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={`inline-flex items-center overflow-hidden ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={stateKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: EASE_PREMIUM }}
          className="inline-flex items-center gap-1.5"
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/**
 * 3. AnimatedStatusBadge
 * Functional status indicator that smoothly animates when an application
 * or workflow status changes.
 */
export const AnimatedStatusBadge: React.FC<{
  status: string;
  className?: string;
  icon?: React.ReactNode;
}> = ({ status, className = '', icon }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: 3 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -3 }}
        transition={{ duration: 0.22, ease: EASE_PREMIUM }}
        className={`inline-flex items-center gap-1.5 ${className}`}
      >
        {icon}
        <span>{status}</span>
      </motion.span>
    </AnimatePresence>
  );
};

/**
 * 4. AnimatedFormFeedback
 * Communicates form errors (subtle horizontal shake + clean fade)
 * and successful submissions (gentle scale + check entrance).
 */
export const AnimatedFormFeedback: React.FC<{
  type: 'error' | 'success';
  message: string | null | undefined;
  className?: string;
}> = ({ type, message, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          key={`${type}-${message}`}
          role={type === 'error' ? 'alert' : 'status'}
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : type === 'error'
              ? { opacity: 0, x: -6 }
              : { opacity: 0, y: 6, scale: 0.98 }
          }
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : type === 'error'
              ? { opacity: 1, x: [0, -5, 5, -3, 3, 0] }
              : { opacity: 1, y: 0, scale: 1 }
          }
          exit={{ opacity: 0, y: -4 }}
          transition={{
            duration: type === 'error' ? 0.36 : 0.28,
            ease: EASE_PREMIUM,
          }}
          className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs sm:text-sm font-medium ${
            type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          } ${className}`}
        >
          {type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          )}
          <span className="leading-snug">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 5. InteractiveCheckbox
 * Accessible tactile checkbox with smooth check-draw animation.
 */
export const InteractiveCheckbox: React.FC<{
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  required?: boolean;
  className?: string;
}> = ({ id, checked, onChange, label, required, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-2.5 cursor-pointer select-none group ${className}`}
    >
      <span className="relative flex items-center justify-center mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          required={required}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <motion.span
          whileTap={shouldReduceMotion ? undefined : { scale: 0.88 }}
          transition={{ duration: 0.12 }}
          className={`w-[18px] h-[18px] rounded-md border flex items-center justify-center transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-[#F47A24] peer-focus-visible:ring-offset-2 ${
            checked
              ? 'bg-[#F47A24] border-[#F47A24] text-white shadow-2xs'
              : 'bg-white border-[#CBD5E1] group-hover:border-[#102B4E]'
          }`}
        >
          <AnimatePresence initial={false}>
            {checked && (
              <motion.span
                key="check"
                initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.16, ease: EASE_PREMIUM }}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>
      </span>
      <span className="text-xs text-[#778397] leading-snug">{label}</span>
    </label>
  );
};
