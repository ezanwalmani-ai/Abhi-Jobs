import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EASE_PREMIUM, VIEWPORT_ONCE } from '../../lib/motion';

export interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  id?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 30,
  className = '',
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <motion.div
        id={id}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={VIEWPORT_ONCE}
        transition={{ duration: 0.3, delay }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  // Calculate direction offsets
  let initialX = 0;
  let initialY = 0;

  if (direction === 'up') initialY = distance;
  else if (direction === 'down') initialY = -distance;
  else if (direction === 'left') initialX = distance;
  else if (direction === 'right') initialX = -distance;

  return (
    <motion.div
      id={id}
      initial={{
        opacity: 0,
        x: initialX,
        y: initialY,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={VIEWPORT_ONCE}
      transition={{
        duration,
        delay,
        ease: EASE_PREMIUM,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
