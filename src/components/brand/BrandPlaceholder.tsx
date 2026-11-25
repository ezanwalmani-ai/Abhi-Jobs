import React from 'react';
import { BrandPattern, PatternType, PatternTheme } from './BrandPattern';
import { BRAND_ICONS, BrandIconKey } from './BrandIcons';
import { AbhiFalconMascot } from '../AbhiJobsLogo';

export type PlaceholderVariant =
  | 'company-banner'
  | 'job-cover'
  | 'empty-state'
  | 'avatar-backdrop'
  | 'card-thumbnail';

export interface BrandPlaceholderProps {
  variant?: PlaceholderVariant;
  pattern?: PatternType;
  theme?: PatternTheme;
  icon?: BrandIconKey | 'falcon';
  title?: string;
  subtitle?: string;
  aspectRatio?: '16/9' | '21/9' | '3/1' | '1/1' | '4/3' | 'auto';
  className?: string;
  badgeText?: string;
}

/**
 * Professional Brand Placeholder Component
 * Uses the ABHI JOBS palette (Navy #102B4E, Brand Red #F47A24, Teal #004D40)
 * and geometric textures to render pristine, high-fidelity placeholder imagery.
 */
export const BrandPlaceholder: React.FC<BrandPlaceholderProps> = ({
  variant = 'job-cover',
  pattern = 'faceted-grid',
  theme = 'dark-navy',
  icon = 'falcon',
  title,
  subtitle,
  aspectRatio = 'auto',
  className = '',
  badgeText,
}) => {
  const isDark = theme === 'dark-navy' || theme === 'midnight-teal';

  // Render chosen brand icon
  const renderIcon = () => {
    if (icon === 'falcon') {
      return (
        <AbhiFalconMascot
          theme={isDark ? 'dark' : 'color'}
          className="w-12 h-16 sm:w-16 sm:h-20"
        />
      );
    }
    const IconComponent = BRAND_ICONS[icon] || BRAND_ICONS.beacon;
    return (
      <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/10 border border-white/15' : 'bg-[#102B4E]/5 border border-[#102B4E]/10'}`}>
        <IconComponent size="xl" colorMode={isDark ? 'white' : 'palette'} />
      </div>
    );
  };

  // Base aspect ratio styles
  const aspectStyle: React.CSSProperties =
    aspectRatio !== 'auto'
      ? { aspectRatio: aspectRatio.replace('/', ' / ') }
      : {};

  // Background styling based on theme
  const bgClasses = (() => {
    switch (theme) {
      case 'midnight-teal':
        return 'bg-gradient-to-br from-[#00382F] via-[#102B4E] to-[#0A0F1D] text-white';
      case 'light-slate':
        return 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-900 border border-slate-200';
      case 'pure-white':
        return 'bg-white text-slate-900 border border-slate-200';
      case 'dark-navy':
      default:
        return 'bg-gradient-to-br from-[#102B4E] via-[#0B192C] to-[#0A0F1D] text-white';
    }
  })();

  // 1. Company Banner Placeholder (Wide panoramic ratio)
  if (variant === 'company-banner') {
    return (
      <div
        style={aspectStyle}
        className={`relative w-full min-h-[140px] sm:min-h-[180px] rounded-2xl overflow-hidden flex items-center justify-between px-6 sm:px-10 ${bgClasses} ${className}`}
      >
        <BrandPattern pattern={pattern} theme={theme} opacity={0.9} />
        {/* Subtle radial ambient glows */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#F47A24]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#004D40]/25 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="shrink-0">{renderIcon()}</div>
          {(title || subtitle) && (
            <div className="min-w-0">
              {badgeText && (
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded-md ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                  {badgeText}
                </span>
              )}
              {title && (
                <h3 className={`text-base sm:text-xl font-bold truncate font-sora ${isDark ? 'text-white' : 'text-[#102B4E]'}`}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={`text-xs sm:text-sm truncate mt-0.5 font-inter ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Minimal corner brand hallmark */}
        <div className="relative z-10 hidden sm:flex items-center gap-1.5 opacity-60">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F47A24]" />
          <span className="text-[11px] font-mono tracking-widest uppercase">ABHI JOBS ®</span>
        </div>
      </div>
    );
  }

  // 2. Empty State Placeholder (Centered composition)
  if (variant === 'empty-state') {
    return (
      <div
        style={aspectStyle}
        className={`relative w-full p-6 sm:p-7 rounded-xl overflow-hidden flex flex-col items-center justify-center text-center ${bgClasses} ${className}`}
      >
        <BrandPattern pattern={pattern} theme={theme} opacity={0.8} />
        <div className="relative z-10 flex flex-col items-center max-w-md space-y-3">
          <div className="mb-2 shrink-0">{renderIcon()}</div>
          {badgeText && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isDark ? 'bg-white/10 text-slate-300 border border-white/10' : 'bg-slate-200 text-slate-700'}`}>
              {badgeText}
            </span>
          )}
          {title && (
            <h4 className={`text-lg sm:text-xl font-bold font-sora ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h4>
          )}
          {subtitle && (
            <p className={`text-xs sm:text-sm leading-relaxed font-inter ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 3. Avatar / Square Card Backdrop (Compact 1:1)
  if (variant === 'avatar-backdrop') {
    return (
      <div
        style={aspectStyle}
        className={`relative rounded-2xl overflow-hidden flex items-center justify-center p-3 ${bgClasses} ${className}`}
      >
        <BrandPattern pattern={pattern} theme={theme} opacity={0.8} />
        <div className="relative z-10 shrink-0">{renderIcon()}</div>
      </div>
    );
  }

  // 4. Default: Job Cover / Card Thumbnail
  return (
    <div
      style={aspectStyle}
      className={`relative w-full min-h-[110px] sm:min-h-[130px] rounded-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-5 ${bgClasses} ${className}`}
    >
      <BrandPattern pattern={pattern} theme={theme} opacity={0.85} />
      {/* Top row */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="shrink-0 scale-90 sm:scale-100">{renderIcon()}</div>
        {badgeText && (
          <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-800'}`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Bottom text */}
      {(title || subtitle) && (
        <div className="relative z-10 pt-3">
          {title && (
            <h5 className={`text-sm sm:text-base font-bold truncate font-sora ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h5>
          )}
          {subtitle && (
            <p className={`text-xs truncate font-inter ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandPlaceholder;
