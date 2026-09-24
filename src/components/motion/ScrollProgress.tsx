import React from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'motion/react';

export interface ScrollProgressProps {
  className?: string;
  color?: string;
}

/**
 * ScrollProgress: An extremely subtle (2px) reading progress indicator pinned to top.
 * Used selectively on public informational & long browsing pages.
 * Respects prefers-reduced-motion.
 */
export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  className = '',
  color = 'bg-[#FF2B1A]',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 35,
    restDelta: 0.001,
  });

  if (shouldReduceMotion) return null;

  return (
    <motion.div
      style={{ scaleX }}
      className={`fixed top-0 left-0 right-0 h-[2.5px] ${color} origin-left z-50 pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
};

export default ScrollProgress;
