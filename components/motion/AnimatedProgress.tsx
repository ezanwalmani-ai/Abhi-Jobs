import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EASE_PREMIUM } from '../../lib/motion';

export interface AnimatedProgressBarProps {
  percentage: number; // 0 - 100 actual database value
  duration?: number; // ms, default 1000
  showLabel?: boolean;
  label?: string;
  className?: string;
  barColor?: string;
  trackColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  percentage,
  duration = 1000,
  showLabel = true,
  label = 'Profile Completion',
  className = '',
  barColor = 'bg-[#004D40]',
  trackColor = 'bg-slate-100',
  size = 'md',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [currentPercent, setCurrentPercent] = useState<number>(
    shouldReduceMotion ? percentage : 0
  );
  const elementRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef<boolean>(false);

  // Clamp percentage strictly between 0 and 100
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  useEffect(() => {
    if (shouldReduceMotion) {
      setCurrentPercent(clamped);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;

          const startTimestamp = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutQuart(progress);
            const val = Math.round(clamped * eased);

            setCurrentPercent(val);

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setCurrentPercent(clamped);
            }
          };

          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [clamped, duration, shouldReduceMotion]);

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div ref={elementRef} className={`space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>{label}</span>
          <span className="font-bold text-[#004D40]">{currentPercent}%</span>
        </div>
      )}
      <div className={`w-full ${heightClass} ${trackColor} rounded-full overflow-hidden`}>
        <motion.div
          initial={{ width: shouldReduceMotion ? `${clamped}%` : '0%' }}
          animate={{ width: `${currentPercent}%` }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: EASE_PREMIUM }}
          className={`h-full ${barColor} rounded-full`}
        />
      </div>
    </div>
  );
};

export default AnimatedProgressBar;
