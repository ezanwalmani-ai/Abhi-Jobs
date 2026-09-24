import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import brandSymbolColor from '../assets/abhi-jobs-symbol.png';
import brandSymbolWhite from '../assets/abhi-jobs-symbol-white.png';
import { EASE_PREMIUM } from '../lib/motion';

export type LogoVariant = 'primary' | 'horizontal' | 'vertical' | 'icon' | 'badge' | 'text' | 'full' | 'mark';
export type LogoTheme = 'color' | 'dark' | 'light' | 'emerald' | 'monochrome' | 'inverted' | 'red';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

export interface AbhiJobsLogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
  showTagline?: boolean;
  taglineClassName?: string;
  transparentBg?: boolean;
  className?: string;
  animate?: boolean;
}

/**
 * Official ABHI JOBS Brand Logo Component
 * Combines the existing official symbol (jumping figures) with premium modern corporate typography:
 * - Wordmark "ABHI JOBS": Sora font (ABHI: 800 weight, JOBS: 600 weight)
 * - Tagline "Discover. Apply. Grow.": Inter font (450 weight, letter-spacing: 0.8px)
 * - Brand Color: Signature Red (#F02814) on light surfaces, Pure White on dark surfaces
 */
export const AbhiJobsLogo: React.FC<AbhiJobsLogoProps> = ({
  variant = 'horizontal',
  theme = 'color',
  size = 'md',
  showTagline = true,
  taglineClassName = '',
  className = '',
  animate = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const isDark = theme === 'inverted' || theme === 'dark';
  const isIconOnly = variant === 'icon' || variant === 'mark' || variant === 'badge';
  const isTextOnly = variant === 'text';
  const isVertical = variant === 'vertical';

  // Size configurations calibrated to preserve exact brand proportions
  const sizeMap = {
    xs: {
      icon: 'h-5 sm:h-6 w-auto',
      wordmark: 'text-xs sm:text-[13px]',
      tagline: 'text-[7px] sm:text-[8px] mt-0.5',
      taglineSpacing: '0.5px',
      gap: 'gap-1.5',
    },
    sm: {
      icon: 'h-6 sm:h-7 md:h-8 w-auto',
      wordmark: 'text-sm sm:text-base',
      tagline: 'text-[8px] sm:text-[9.5px] mt-0.5',
      taglineSpacing: '0.6px',
      gap: 'gap-2',
    },
    md: {
      icon: 'h-8 sm:h-9 md:h-10 lg:h-11 w-auto',
      wordmark: 'text-base sm:text-lg md:text-xl lg:text-[22px]',
      tagline: 'text-[9.5px] sm:text-[10.5px] md:text-[11.5px] mt-0.5 sm:mt-1',
      taglineSpacing: '0.8px',
      gap: 'gap-2.5 sm:gap-3',
    },
    lg: {
      icon: 'h-11 sm:h-13 md:h-15 w-auto',
      wordmark: 'text-2xl sm:text-3xl md:text-[32px]',
      tagline: 'text-xs sm:text-[13.5px] md:text-sm mt-1 sm:mt-1.5',
      taglineSpacing: '0.9px',
      gap: 'gap-3 sm:gap-3.5',
    },
    xl: {
      icon: 'h-14 sm:h-16 md:h-18 w-auto',
      wordmark: 'text-3xl sm:text-4xl md:text-5xl',
      tagline: 'text-sm sm:text-base md:text-lg mt-1.5 sm:mt-2',
      taglineSpacing: '1.1px',
      gap: 'gap-4 sm:gap-4.5',
    },
    '2xl': {
      icon: 'h-18 sm:h-22 md:h-26 w-auto',
      wordmark: 'text-4xl sm:text-5xl md:text-6xl',
      tagline: 'text-base sm:text-lg md:text-xl mt-2 sm:mt-2.5',
      taglineSpacing: '1.2px',
      gap: 'gap-5 sm:gap-6',
    },
  };

  // Safe size resolution supporting numbers and string keys with fallback
  const resolvedSizeKey: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = (() => {
    if (typeof size === 'number') {
      if (size <= 24) return 'xs';
      if (size <= 32) return 'sm';
      if (size <= 44) return 'md';
      if (size <= 60) return 'lg';
      if (size <= 80) return 'xl';
      return '2xl';
    }
    if (size && (size as string) in sizeMap) {
      return size as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    }
    return 'md';
  })();

  const sizeConfig = sizeMap[resolvedSizeKey] || sizeMap.md;

  const symbolSrc = isDark
    ? (brandSymbolWhite || '/abhi-jobs-symbol-white.png')
    : (brandSymbolColor || '/abhi-jobs-symbol.png');

  // Standalone Icon Variant
  if (isIconOnly) {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}>
        <img
          src={symbolSrc}
          alt="ABHI JOBS"
          style={{ aspectRatio: '149 / 144' }}
          className={`${sizeConfig.icon} object-contain block select-none`}
          loading="eager"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src.indexOf('/abhi-jobs-symbol.png') === -1) {
              target.src = '/abhi-jobs-symbol.png';
            }
          }}
        />
      </div>
    );
  }

  // Color mappings
  const wordmarkTextColor = isDark ? 'text-white' : 'text-[#FF2B1A]';
  const taglineTextColor = isDark ? 'text-white/85' : 'text-[#FF2B1A]';

  const shouldAnimate = animate && !shouldReduceMotion;
  const Wrapper = shouldAnimate ? motion.div : 'div';
  const motionProps = shouldAnimate
    ? {
        initial: { opacity: 0, y: -5 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: EASE_PREMIUM },
      }
    : {};

  return (
    <Wrapper
      {...(motionProps as any)}
      className={`inline-flex ${isVertical ? 'flex-col items-center text-center' : 'items-center text-left'} ${sizeConfig.gap} shrink-0 select-none ${className}`}
    >
      {/* Existing official symbol - unchanged */}
      {!isTextOnly && (
        <img
          src={symbolSrc}
          alt="ABHI JOBS Icon"
          style={{ aspectRatio: '149 / 144' }}
          className={`${sizeConfig.icon} shrink-0 object-contain block select-none`}
          loading="eager"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src.indexOf('/abhi-jobs-symbol.png') === -1) {
              target.src = '/abhi-jobs-symbol.png';
            }
          }}
        />
      )}

      {/* Typography container: Premium Sora wordmark & Inter tagline */}
      <div className={`flex flex-col justify-center leading-none ${isVertical ? 'items-center' : 'items-start'}`}>
        {/* ABHI JOBS Wordmark in Sora */}
        <div
          className={`font-sora ${sizeConfig.wordmark} ${wordmarkTextColor} tracking-[-0.01em] uppercase flex items-baseline leading-none select-none whitespace-nowrap`}
          style={{
            fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            letterSpacing: '-0.01em',
          }}
        >
          <span className="font-[800]">ABHI</span>
          <span className="inline-block w-[0.25em]" />
          <span className="font-[600]">JOBS</span>
        </div>

        {/* Tagline in Inter */}
        {showTagline && (
          <span
            className={`font-inter font-[450] ${sizeConfig.tagline} ${taglineTextColor} select-none whitespace-nowrap ${taglineClassName}`}
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              letterSpacing: sizeConfig.taglineSpacing,
            }}
          >
            Discover. Apply. Grow.
          </span>
        )}
      </div>
    </Wrapper>
  );
};

// Aliases ensuring complete backwards compatibility across the platform
export const AbhiJobsSymbol: React.FC<AbhiJobsLogoProps> = (props) => (
  <AbhiJobsLogo {...props} variant="icon" />
);
export const AbhiJobsBadge: React.FC<AbhiJobsLogoProps> = (props) => (
  <AbhiJobsLogo {...props} variant="badge" />
);
export const HunarLogo = AbhiJobsLogo;
export const HunarEmblem = AbhiJobsSymbol;
export const HunarSimplifiedIcon = AbhiJobsSymbol;
export const HunarBadgeCrest = AbhiJobsBadge;
export default AbhiJobsLogo;
