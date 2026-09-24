import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EASE_PREMIUM, VIEWPORT_CARD_ONCE } from '../../lib/motion';

export interface StaggerGroupProps {
  children: React.ReactNode;
  stagger?: number;
  delay?: number;
  className?: string;
  id?: string;
}

export const StaggerGroup: React.FC<StaggerGroupProps> = ({
  children,
  stagger = 0.07, // 70ms per card
  delay = 0.04,
  className = '',
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      id={id}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_CARD_ONCE}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 18,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: EASE_PREMIUM,
      },
    },
  };

  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default StaggerGroup;
