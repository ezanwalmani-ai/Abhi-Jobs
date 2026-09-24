import React from 'react';
import { motion, useReducedMotion, Variants } from 'motion/react';
import { EASE_PREMIUM } from '../../lib/motion';

export interface ScrollRevealProps {
  children: React.ReactNode;
  /** Direction of reveal movement. Defaults to 'up' (fade up from translateY 30px to 0) */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Delay in seconds before animation begins (default: 0) */
  delay?: number;
  /** Duration in seconds of the reveal animation (default: 0.55) */
  duration?: number;
  /** Vertical or horizontal distance in pixels. Defaults strictly to 30px */
  distance?: number;
  /** Whether the animation should trigger only once when entering viewport. Defaults to true */
  once?: boolean;
  /** Viewport intersection threshold before triggering (0 to 1). Defaults to 0.15 */
  amount?: number | 'some' | 'all';
  /** Additional CSS classes to apply to container */
  className?: string;
  /** HTML id attribute */
  id?: string;
  /** Semantic container tag (defaults to 'div') */
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'li' | 'span';
}

/**
 * ScrollReveal: Premium viewport-triggered reveal component.
 *
 * Specifications:
 * - Triggers a fade-up animation (opacity 0 -> 1, translateY 30px -> 0) when entering the viewport.
 * - Powered by motion/react `whileInView` with hardware-accelerated GPU transitions.
 * - Respects `prefers-reduced-motion` to ensure full accessibility.
 * - Single-trigger execution (`once: true`) prevents scroll jitter.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.55,
  distance = 30, // Default strictly 30px (translateY 30px -> 0)
  once = true,
  amount = 0.15,
  className = '',
  id,
  as = 'div',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Accessibility: Fallback for users preferring reduced motion
  if (shouldReduceMotion) {
    const Component = as as any;
    return (
      <Component id={id} className={className}>
        {children}
      </Component>
    );
  }

  // Calculate direction offsets
  let initialX = 0;
  let initialY = 0;

  if (direction === 'up') {
    initialY = distance; // translateY(30px) -> 0
  } else if (direction === 'down') {
    initialY = -distance;
  } else if (direction === 'left') {
    initialX = distance;
  } else if (direction === 'right') {
    initialX = -distance;
  }

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: initialX,
      y: initialY,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: EASE_PREMIUM,
      },
    },
  };

  const MotionComponent = (motion as any)[as] || motion.div;

  return (
    <MotionComponent
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
      className={className}
    >
      {children}
    </MotionComponent>
  );
};

export default ScrollReveal;
