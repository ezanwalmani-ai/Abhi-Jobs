import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EASE_PREMIUM } from '../../lib/motion';

export interface HeroTextRevealProps {
  /** The text string to animate word-by-word */
  text: string;
  /** Semantic HTML heading or container tag, defaults to 'h1' for major landing headings */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span';
  /** Custom CSS classes for font styling, sizing, alignment, and spacing */
  className?: string;
  /** Optional alignment of words in the flex container: 'start' | 'center' | 'end' */
  justify?: 'start' | 'center' | 'end' | 'between';
  /** Optional array of words to highlight with special accent styling */
  highlightWords?: string[];
  /** Styling class applied to highlighted words (defaults to '#FF2B1A' brand red) */
  highlightClassName?: string;
  /**
   * Word-by-word stagger delay in seconds.
   * Specified between 60ms and 100ms (0.06s - 0.10s).
   * Defaults to 0.08s (80ms).
   */
  stagger?: number;
  /** Alternative alias for stagger in milliseconds (e.g. 60 to 100) */
  staggerMs?: number;
  /** Legacy alias for backwards compatibility */
  wordDelay?: number;
  /** Initial delay before starting the word-by-word animation sequence in seconds (defaults to 0.1s) */
  delay?: number;
  /** Duration of each individual word animation in seconds (defaults to 0.6s) */
  duration?: number;
  /** Vertical displacement in pixels (translateY), strictly defaults to 30px */
  distance?: number;
  /** Cubic-bezier easing curve, defaults to EASE_PREMIUM [0.22, 1, 0.36, 1] */
  ease?: [number, number, number, number];
  /** Whether to trigger upon scrolling into view instead of on component mount */
  inView?: boolean;
  /** Optional HTML id for the heading element */
  id?: string;
}

/**
 * HeroTextReveal: Premium, reusable word-by-word headline reveal component specifically
 * engineered for major landing page headings.
 *
 * Core Animation Specifications:
 * - Accepts a `text` string and splits it into individual words.
 * - Staggers each word sequentially with a 60–100ms delay (default: 80ms / 0.08s).
 * - Transforms each word from translateY(30px) -> translateY(0) and opacity 0 -> 1.
 * - Masked inside overflow-hidden span wrappers for a crisp editorial entrance.
 * - Fully accessible: provides root `aria-label` with `aria-hidden` word children.
 * - Respects user's `prefers-reduced-motion` settings without layout shifts.
 */
export const HeroTextReveal: React.FC<HeroTextRevealProps> = ({
  text,
  as = 'h1',
  className = '',
  justify,
  highlightWords = [],
  highlightClassName = 'text-[#FF2B1A]',
  stagger,
  staggerMs,
  wordDelay,
  delay = 0.1,
  duration = 0.6,
  distance = 30, // translateY(30px) to 0
  ease = EASE_PREMIUM,
  inView = false,
  id,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Compute stagger duration (guaranteeing 60–100ms default, e.g. 80ms)
  const computedStagger =
    staggerMs !== undefined
      ? staggerMs / 1000
      : stagger !== undefined
      ? stagger
      : wordDelay !== undefined
      ? wordDelay
      : 0.08; // 80ms (within the 60-100ms requirement)

  // Return non-animated semantic heading when prefers-reduced-motion is active
  if (shouldReduceMotion) {
    const Component = as as any;
    return (
      <Component id={id} className={className}>
        {text}
      </Component>
    );
  }

  // Parse text into individual words while preserving whitespace logic
  const words = text.split(/\s+/).filter(Boolean);

  // Helper to test if a word matches any highlight term (case and punctuation agnostic)
  const cleanTerm = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/gi, '');
  const isWordHighlighted = (word: string) => {
    const cleanCurrent = cleanTerm(word);
    return highlightWords.some((hw) => cleanTerm(hw) === cleanCurrent);
  };

  // Determine flex justification class
  const getJustifyClass = () => {
    if (justify === 'center') return 'justify-center';
    if (justify === 'start') return 'justify-start';
    if (justify === 'end') return 'justify-end';
    if (justify === 'between') return 'justify-between';
    if (className.includes('text-center') || className.includes('justify-center')) {
      return 'justify-center';
    }
    return '';
  };

  // Motion container variants (word-by-word stagger orchestration)
  const containerVariants = {
    hidden: {
      opacity: 1,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: computedStagger,
        delayChildren: delay,
      },
    },
  };

  // Word item variants: translateY(30px) -> translateY(0) and opacity 0 -> 1
  const wordVariants = {
    hidden: {
      opacity: 0,
      y: distance, // translateY(30px)
    },
    visible: {
      opacity: 1,
      y: 0, // translateY(0)
      transition: {
        duration,
        ease,
      },
    },
  };

  const MotionComponent = (motion as any)[as] || motion.h1;

  const motionProps = inView
    ? {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once: true, amount: 0.2 },
      }
    : {
        initial: 'hidden',
        animate: 'visible',
      };

  return (
    <MotionComponent
      id={id}
      variants={containerVariants}
      {...motionProps}
      className={`inline-flex flex-wrap items-baseline ${getJustifyClass()} ${className}`}
      aria-label={text}
    >
      {words.map((word, idx) => {
        const highlighted = isWordHighlighted(word);
        const isLastWord = idx === words.length - 1;

        return (
          <span
            key={`${word}-${idx}`}
            className={`overflow-hidden inline-block align-bottom leading-[inherit] ${
              !isLastWord ? 'mr-[0.28em]' : ''
            }`}
            aria-hidden="true"
          >
            <motion.span
              variants={wordVariants}
              className={`inline-block will-change-transform ${
                highlighted ? highlightClassName : ''
              }`}
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </MotionComponent>
  );
};

export default HeroTextReveal;
