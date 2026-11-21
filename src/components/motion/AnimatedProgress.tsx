import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EASE_PREMIUM } from '../../lib/motion';

export interface AnimatedProgressBarProps {
  percentage: number; // 0 - 100 actual database/form value
  duration?: number; // ms, default 650
  showLabel?: boolean;
  label?: string;
  className?: string;
  barColor?: string;
  trackColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

/**
 * AnimatedProgressBar
 * Smoothly animates both on initial entry AND live whenever `percentage`
 * updates (e.g., completing profile fields or resume sections).
 */
export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  percentage,
  duration = 650,
  showLabel = true,
  label = 'Profile Completion',
  className = '',
  barColor = 'bg-gradient-to-r from-[#102B4E] to-[#F47A24]',
  trackColor = 'bg-[#E5EAF0]',
  size = 'md',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  const [displayPercent, setDisplayPercent] = useState<number>(
    shouldReduceMotion ? clamped : clamped
  );
  const prevValueRef = useRef<number>(shouldReduceMotion ? clamped : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayPercent(clamped);
      prevValueRef.current = clamped;
      return;
    }

    const from = prevValueRef.current;
    const to = clamped;
    if (from === to) {
      setDisplayPercent(to);
      return;
    }

    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const val = Math.round(from + (to - from) * easeOutCubic(progress));
      setDisplayPercent(val);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayPercent(to);
        prevValueRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      prevValueRef.current = clamped;
    };
  }, [clamped, duration, shouldReduceMotion]);

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2.5';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold text-[#253449]">
          <span>{label}</span>
          <span className="font-bold font-mono tabular-nums text-[#102B4E]">
            {displayPercent}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={`w-full ${heightClass} ${trackColor} rounded-full overflow-hidden`}
      >
        <motion.div
          initial={{ width: shouldReduceMotion ? `${clamped}%` : '0%' }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: EASE_PREMIUM }}
          className={`h-full ${barColor} rounded-full`}
        />
      </div>
    </div>
  );
};

export default AnimatedProgressBar;
