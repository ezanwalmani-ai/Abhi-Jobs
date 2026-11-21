import React, { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EASE_PREMIUM } from '../lib/motion';

export type LogoVariant = 'primary' | 'horizontal' | 'vertical' | 'icon' | 'badge' | 'text' | 'full' | 'mark';
export type LogoTheme = 'color' | 'dark' | 'light' | 'emerald' | 'monochrome' | 'inverted' | 'red' | 'white';
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
  motionGraphics?: boolean;
}

/**
 * Official abhi Jobs Wordmark SVG
 * Uses the exact geometric rounded-stroke paths provided by the brand:
 * - "abhi" in Deep Navy (#0A2A73) on light surfaces, Pure White (#FFFFFF) on dark surfaces
 * - "Jobs" in Fire Orange-to-Amber linear gradient (#FF4D00 -> #FFB400)
 * - Transparent background so it sits seamlessly on any header, footer, or card
 */
export const AbhiJobsWordmarkSVG: React.FC<{
  theme?: LogoTheme;
  className?: string;
  height?: number;
}> = ({ theme = 'color', className = '', height }) => {
  const uid = useId().replace(/:/g, '');
  const gradId = `abhi-jobs-fire-${uid}`;
  const isDark = theme === 'inverted' || theme === 'dark' || theme === 'white';
  const isMonochrome = theme === 'monochrome';

  const abhiStroke = isDark ? '#FFFFFF' : '#0A2A73';
  const jobsStroke = isMonochrome ? abhiStroke : `url(#${gradId})`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 5 632 136"
      role="img"
      aria-label="abhi Jobs"
      className={`block shrink-0 select-none ${className}`}
      style={height ? { height: `${height}px`, width: 'auto' } : undefined}
    >
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="330" y1="140" x2="620" y2="10">
          <stop offset="0" stopColor="#FF4D00" />
          <stop offset="1" stopColor="#FFB400" />
        </linearGradient>
      </defs>
      <g fill="none" strokeWidth="21" strokeLinecap="round" strokeLinejoin="round">
        {/* "abhi" */}
        <g stroke={abhiStroke}>
          <circle cx="40" cy="90" r="30" />
          <path d="M70 60V120" />
          <path d="M105 20V120" />
          <circle cx="135" cy="90" r="30" />
          <path d="M185 20V120" />
          <path d="M185 88C185 50 245 50 245 88V120" />
          <path d="M285 60V120" />
        </g>
        {/* "Jobs" */}
        <g stroke={jobsStroke}>
          <path d="M380 20V88C380 118 345 126 332 104" />
          <circle cx="440" cy="90" r="30" />
          <path d="M480 20V120" />
          <circle cx="510" cy="90" r="30" />
          <path d="M612 74C602 52 568 56 568 76C568 96 615 86 615 108C615 130 575 130 564 108" />
        </g>
      </g>
      {/* Dot of "i" */}
      <circle cx="285" cy="26" r="13" fill={abhiStroke} />
    </svg>
  );
};

/**
 * Compact "aJ" Brand Mark derived directly from the official abhi Jobs stroke geometry.
 * Used for square avatars, compact favicons, and icon-only slots.
 */
export const AbhiJobsMarkSVG: React.FC<{
  theme?: LogoTheme;
  className?: string;
  size?: number | string;
}> = ({ theme = 'color', className = '', size }) => {
  const uid = useId().replace(/:/g, '');
  const gradId = `abhi-mark-fire-${uid}`;
  const isDark = theme === 'inverted' || theme === 'dark' || theme === 'white';
  const isMonochrome = theme === 'monochrome';

  const abhiStroke = isDark ? '#FFFFFF' : '#0A2A73';
  const jobsStroke = isMonochrome ? abhiStroke : `url(#${gradId})`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 180 140"
      role="img"
      aria-label="abhi Jobs Mark"
      className={`block shrink-0 select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="100" y1="125" x2="165" y2="15">
          <stop offset="0" stopColor="#FF4D00" />
          <stop offset="1" stopColor="#FFB400" />
        </linearGradient>
      </defs>
      <g fill="none" strokeWidth="21" strokeLinecap="round" strokeLinejoin="round">
        {/* "a" */}
        <g stroke={abhiStroke}>
          <circle cx="48" cy="86" r="30" />
          <path d="M78 56V116" />
        </g>
        {/* "J" */}
        <g stroke={jobsStroke}>
          <path d="M150 22V86C150 116 116 124 104 102" />
        </g>
      </g>
    </svg>
  );
};

/**
 * Official ABHI JOBS Brand Logo Component
 * Renders the exact "abhi Jobs" rounded geometric vector wordmark across
 * Header, Footer, Authentication screens, Dashboard, and Mobile viewports.
 */
export const AbhiJobsLogo: React.FC<AbhiJobsLogoProps> = ({
  variant = 'horizontal',
  theme = 'color',
  size = 'md',
  showTagline = false,
  taglineClassName = '',
  className = '',
  animate = false,
  motionGraphics = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const isDark = theme === 'inverted' || theme === 'dark' || theme === 'white';
  const isIconOnly = variant === 'icon' || variant === 'mark' || variant === 'badge';
  const isVertical = variant === 'vertical';

  const sizeMap = {
    xs: {
      svgClass: 'h-4.5 sm:h-5 w-auto',
      markClass: 'h-5 w-auto',
      tagline: 'text-[8px] mt-0.5',
      taglineSpacing: '0.8px',
    },
    sm: {
      svgClass: 'h-6 sm:h-6.5 w-auto',
      markClass: 'h-6.5 w-auto',
      tagline: 'text-[9px] mt-1',
      taglineSpacing: '1px',
    },
    md: {
      svgClass: 'h-7 sm:h-8 md:h-8.5 w-auto',
      markClass: 'h-8 w-auto',
      tagline: 'text-[10px] sm:text-[10.5px] mt-1',
      taglineSpacing: '1.2px',
    },
    lg: {
      svgClass: 'h-9 sm:h-10.5 md:h-11 w-auto',
      markClass: 'h-10 w-auto',
      tagline: 'text-[11px] sm:text-xs mt-1.5',
      taglineSpacing: '1.4px',
    },
    xl: {
      svgClass: 'h-11 sm:h-13 md:h-14 w-auto',
      markClass: 'h-13 w-auto',
      tagline: 'text-xs sm:text-sm mt-2',
      taglineSpacing: '1.5px',
    },
    '2xl': {
      svgClass: 'h-14 sm:h-16 md:h-18 w-auto',
      markClass: 'h-16 w-auto',
      tagline: 'text-sm sm:text-base mt-2.5',
      taglineSpacing: '1.6px',
    },
  };

  const resolvedSizeKey: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = (() => {
    if (typeof size === 'number') {
      if (size <= 22) return 'xs';
      if (size <= 28) return 'sm';
      if (size <= 40) return 'md';
      if (size <= 56) return 'lg';
      if (size <= 76) return 'xl';
      return '2xl';
    }
    if (size && (size as string) in sizeMap) {
      return size as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    }
    return 'md';
  })();

  const sizeConfig = sizeMap[resolvedSizeKey] || sizeMap.md;

  if (isIconOnly) {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}>
        <AbhiJobsMarkSVG theme={theme} className={sizeConfig.markClass} />
      </div>
    );
  }

  const taglineTextColor = isDark ? 'text-slate-300' : 'text-[#778397]';
  const shouldAnimate = (animate || motionGraphics) && !shouldReduceMotion;
  const Wrapper = shouldAnimate ? motion.div : 'div';
  const motionProps = shouldAnimate
    ? {
        initial: { opacity: 0, y: -3 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.38, ease: EASE_PREMIUM },
      }
    : {};

  return (
    <Wrapper
      {...(motionProps as any)}
      className={`inline-flex flex-col ${isVertical ? 'items-center text-center' : 'items-start text-left'} justify-center shrink-0 select-none ${className}`}
    >
      <AbhiJobsWordmarkSVG theme={theme} className={sizeConfig.svgClass} />
      {showTagline && (
        <span
          className={`font-medium ${sizeConfig.tagline} ${taglineTextColor} select-none whitespace-nowrap leading-none ${taglineClassName}`}
          style={{ letterSpacing: sizeConfig.taglineSpacing }}
        >
          Discover. Apply. Grow.
        </span>
      )}
    </Wrapper>
  );
};

// Backwards-compatible exports (ensuring no broken imports anywhere)
export const AbhiFalconMascot: React.FC<{
  theme?: LogoTheme;
  className?: string;
  motionGraphics?: boolean;
  size?: number | string;
}> = ({ theme = 'color', className = '', size }) => (
  <AbhiJobsMarkSVG theme={theme} className={className} size={size} />
);

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
