import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EASE_PREMIUM } from '../../lib/motion';

export interface TextMaskRevealProps {
  children?: React.ReactNode;
  text?: string;
  className?: string;
  delay?: number;
  duration?: number;
  as?: 'h1' | 'h2' | 'h3' | 'div' | 'span';
}

/**
 * TextMaskReveal: Displays heading content revealed smoothly from behind an overflow mask.
 * translateY(100%) -> translateY(0) with opacity 0 -> 1 using EASE_PREMIUM.
 * Respects prefers-reduced-motion.
 */
export const TextMaskReveal: React.FC<TextMaskRevealProps> = ({
  children,
  text,
  className = '',
  delay = 0.1,
  duration = 0.7,
  as = 'h1',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const content = text || children;

  const Component = as as any;

  if (shouldReduceMotion) {
    return <Component className={className}>{content}</Component>;
  }

  const MotionWrapper = (motion as any)[as] || motion.h1;

  return (
    <div className="overflow-hidden inline-block align-bottom max-w-full">
      <MotionWrapper
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{
          duration,
          delay,
          ease: EASE_PREMIUM,
        }}
        className={className}
      >
        {content}
      </MotionWrapper>
    </div>
  );
};

export default TextMaskReveal;
