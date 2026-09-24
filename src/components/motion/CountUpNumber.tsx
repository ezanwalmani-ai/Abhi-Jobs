import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export interface CountUpNumberProps {
  value?: number;
  target?: number;
  duration?: number; // ms, default 1000ms
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

// Ease out cubic [0.22, 1, 0.36, 1] approximation function for JS raf
function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  target,
  duration = 1000,
  prefix = '',
  suffix = '',
  className = '',
  decimals = 0,
}) => {
  const numericTarget = target ?? value ?? 0;
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(shouldReduceMotion ? numericTarget : 0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(numericTarget);
      return;
    }

    if (numericTarget === 0) {
      setDisplayValue(0);
      return;
    }

    let animationFrameId: number;

    const startAnimation = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;

      const startTimestamp = performance.now();
      const startVal = 0;
      const endVal = numericTarget;

      const step = (now: number) => {
        const elapsed = now - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const current = startVal + (endVal - startVal) * easedProgress;

        setDisplayValue(current);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setDisplayValue(endVal);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    };

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry && entry.isIntersecting) {
            startAnimation();
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      // Safety fallback: if not triggered within 500ms, start anyway
      const fallbackTimer = setTimeout(() => {
        startAnimation();
      }, 500);

      return () => {
        clearTimeout(fallbackTimer);
        cancelAnimationFrame(animationFrameId);
        observer.disconnect();
      };
    } else {
      startAnimation();
      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [numericTarget, duration, shouldReduceMotion]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString();

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export default CountUpNumber;
