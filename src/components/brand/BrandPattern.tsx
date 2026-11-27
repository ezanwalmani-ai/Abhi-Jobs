import React from 'react';

export type PatternType = 'faceted-grid' | 'radar-constellation' | 'career-ascent' | 'stencil-grit';
export type PatternTheme = 'dark-navy' | 'light-slate' | 'pure-white' | 'midnight-teal';

export interface BrandPatternProps {
  pattern?: PatternType;
  theme?: PatternTheme;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 1. Faceted Grid Pattern
 * Geometric diamond facets, vertices, and falcon angle motifs.
 */
export const FacetedGridPatternSVG: React.FC<{
  theme?: PatternTheme;
  opacity?: number;
}> = ({ theme = 'dark-navy', opacity = 0.85 }) => {
  const isDark = theme === 'dark-navy' || theme === 'midnight-teal';
  const strokeColor = isDark ? '#FFFFFF' : '#061226';
  const nodeTeal = isDark ? '#14B8A6' : '#102B4E';
  const nodeRed = isDark ? '#FF4D3D' : '#FF2B1A';

  return (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="abhi-faceted-grid"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          {/* Base isometric grid diamonds */}
          <polygon
            points="40,4 76,40 40,76 4,40"
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.8"
            strokeOpacity={isDark ? '0.12' : '0.07'}
          />
          {/* Crosshair intersections */}
          <line
            x1="40"
            y1="0"
            x2="40"
            y2="80"
            stroke={strokeColor}
            strokeWidth="0.5"
            strokeOpacity={isDark ? '0.08' : '0.04'}
          />
          <line
            x1="0"
            y1="40"
            x2="80"
            y2="40"
            stroke={strokeColor}
            strokeWidth="0.5"
            strokeOpacity={isDark ? '0.08' : '0.04'}
          />
          {/* Teal node dot */}
          <circle cx="4" cy="40" r="1.5" fill={nodeTeal} opacity={isDark ? '0.4' : '0.35'} />
          <circle cx="76" cy="40" r="1.5" fill={nodeTeal} opacity={isDark ? '0.4' : '0.35'} />
          {/* Red beacon vertex */}
          <circle cx="40" cy="40" r="2" fill={nodeRed} opacity={isDark ? '0.6' : '0.5'} />
          <polygon points="40,2 42,4 40,6 38,4" fill={nodeRed} opacity={isDark ? '0.5' : '0.4'} />
          {/* Faceted diagonal accents */}
          <line
            x1="16"
            y1="16"
            x2="28"
            y2="28"
            stroke={nodeTeal}
            strokeWidth="0.9"
            strokeOpacity={isDark ? '0.25' : '0.2'}
          />
          <line
            x1="64"
            y1="16"
            x2="52"
            y2="28"
            stroke={nodeTeal}
            strokeWidth="0.9"
            strokeOpacity={isDark ? '0.25' : '0.2'}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#abhi-faceted-grid)" />
    </svg>
  );
};

/**
 * 2. Radar Constellation Pattern
 * Concentric talent radar sweeps, telemetry coordinates, and orbital rings.
 */
export const RadarConstellationPatternSVG: React.FC<{
  theme?: PatternTheme;
  opacity?: number;
}> = ({ theme = 'dark-navy', opacity = 0.85 }) => {
  const isDark = theme === 'dark-navy' || theme === 'midnight-teal';
  const strokeColor = isDark ? '#FFFFFF' : '#061226';
  const red = isDark ? '#FF4D3D' : '#FF2B1A';
  const teal = isDark ? '#14B8A6' : '#102B4E';

  return (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="abhi-radar-constellation"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          {/* Orbital Radar Rings */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.8"
            strokeOpacity={isDark ? '0.1' : '0.06'}
          />
          <circle
            cx="60"
            cy="60"
            r="32"
            fill="none"
            stroke={teal}
            strokeWidth="0.9"
            strokeDasharray="2 4"
            strokeOpacity={isDark ? '0.3' : '0.25'}
          />
          <circle
            cx="60"
            cy="60"
            r="14"
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.8"
            strokeOpacity={isDark ? '0.15' : '0.08'}
          />
          {/* Center axis crosshairs */}
          <line
            x1="60"
            y1="6"
            x2="60"
            y2="114"
            stroke={strokeColor}
            strokeWidth="0.6"
            strokeOpacity={isDark ? '0.1' : '0.05'}
          />
          <line
            x1="6"
            y1="60"
            x2="114"
            y2="60"
            stroke={strokeColor}
            strokeWidth="0.6"
            strokeOpacity={isDark ? '0.1' : '0.05'}
          />
          {/* Opportunity Nodes */}
          <circle cx="60" cy="60" r="2.5" fill={red} opacity={isDark ? '0.7' : '0.6'} />
          <circle cx="82" cy="38" r="2" fill={teal} opacity={isDark ? '0.6' : '0.5'} />
          <line x1="60" y1="60" x2="82" y2="38" stroke={teal} strokeWidth="0.8" strokeOpacity={isDark ? '0.3' : '0.2'} />
          {/* Corner tick marks */}
          <line x1="0" y1="0" x2="6" y2="6" stroke={strokeColor} strokeWidth="0.8" strokeOpacity="0.12" />
          <line x1="120" y1="0" x2="114" y2="6" stroke={strokeColor} strokeWidth="0.8" strokeOpacity="0.12" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#abhi-radar-constellation)" />
    </svg>
  );
};

/**
 * 3. Career Ascent Pattern
 * Stepped chevrons, progression trajectories, and milestone markers.
 */
export const CareerAscentPatternSVG: React.FC<{
  theme?: PatternTheme;
  opacity?: number;
}> = ({ theme = 'dark-navy', opacity = 0.85 }) => {
  const isDark = theme === 'dark-navy' || theme === 'midnight-teal';
  const strokeColor = isDark ? '#FFFFFF' : '#061226';
  const red = isDark ? '#FF4D3D' : '#FF2B1A';
  const teal = isDark ? '#14B8A6' : '#102B4E';

  return (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="abhi-career-ascent"
          width="90"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          {/* Upward chevron tracks */}
          <path
            d="M 5,45 L 45,15 L 85,45"
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.9"
            strokeOpacity={isDark ? '0.1' : '0.06'}
          />
          <path
            d="M 15,48 L 45,26 L 75,48"
            fill="none"
            stroke={teal}
            strokeWidth="0.8"
            strokeDasharray="3 3"
            strokeOpacity={isDark ? '0.25' : '0.2'}
          />
          {/* Apex milestone marker */}
          <polygon points="45,12 48,15 45,18 42,15" fill={red} opacity={isDark ? '0.6' : '0.5'} />
          {/* Stepped guide lines */}
          <line x1="25" y1="30" x2="25" y2="38" stroke={strokeColor} strokeWidth="0.8" strokeOpacity={isDark ? '0.12' : '0.07'} />
          <line x1="65" y1="30" x2="65" y2="38" stroke={strokeColor} strokeWidth="0.8" strokeOpacity={isDark ? '0.12' : '0.07'} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#abhi-career-ascent)" />
    </svg>
  );
};

/**
 * 4. Stencil Grit Texture
 * Organic ink-spray droplets, vector micro-splatters, and stippling.
 */
export const StencilGritTextureSVG: React.FC<{
  theme?: PatternTheme;
  opacity?: number;
}> = ({ theme = 'dark-navy', opacity = 0.85 }) => {
  const isDark = theme === 'dark-navy' || theme === 'midnight-teal';
  const dotColor = isDark ? '#FFFFFF' : '#061226';
  const red = isDark ? '#FF4D3D' : '#FF2B1A';
  const teal = isDark ? '#14B8A6' : '#102B4E';

  return (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="abhi-stencil-grit"
          width="100"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          {/* Micro splatter cluster 1 */}
          <circle cx="12" cy="18" r="1.4" fill={dotColor} opacity={isDark ? '0.18' : '0.1'} />
          <circle cx="16" cy="22" r="0.9" fill={dotColor} opacity={isDark ? '0.15' : '0.08'} />
          <circle cx="9" cy="25" r="1.1" fill={teal} opacity={isDark ? '0.3' : '0.2'} />
          <circle cx="22" cy="16" r="0.7" fill={dotColor} opacity={isDark ? '0.12' : '0.06'} />

          {/* Micro splatter cluster 2 */}
          <circle cx="78" cy="42" r="1.6" fill={dotColor} opacity={isDark ? '0.2' : '0.12'} />
          <circle cx="83" cy="48" r="1.0" fill={red} opacity={isDark ? '0.45' : '0.35'} />
          <circle cx="74" cy="52" r="1.2" fill={dotColor} opacity={isDark ? '0.16' : '0.09'} />
          <circle cx="88" cy="38" r="0.8" fill={teal} opacity={isDark ? '0.3' : '0.2'} />

          {/* Micro splatter cluster 3 */}
          <circle cx="45" cy="82" r="1.5" fill={dotColor} opacity={isDark ? '0.18' : '0.1'} />
          <circle cx="52" cy="86" r="0.8" fill={red} opacity={isDark ? '0.4' : '0.3'} />
          <circle cx="39" cy="78" r="1.1" fill={dotColor} opacity={isDark ? '0.14' : '0.08'} />
          <circle cx="48" cy="92" r="1.2" fill={teal} opacity={isDark ? '0.25' : '0.18'} />

          {/* Fine grit speckles */}
          <circle cx="30" cy="40" r="0.6" fill={dotColor} opacity="0.1" />
          <circle cx="65" cy="15" r="0.5" fill={dotColor} opacity="0.1" />
          <circle cx="20" cy="70" r="0.6" fill={dotColor} opacity="0.1" />
          <circle cx="85" cy="85" r="0.5" fill={dotColor} opacity="0.1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#abhi-stencil-grit)" />
    </svg>
  );
};

/**
 * Universal Brand Pattern Component
 */
export const BrandPattern: React.FC<BrandPatternProps> = ({
  pattern = 'faceted-grid',
  theme = 'dark-navy',
  opacity = 1,
  className = '',
  style = {},
}) => {
  const patternComponent = (() => {
    switch (pattern) {
      case 'radar-constellation':
        return <RadarConstellationPatternSVG theme={theme} opacity={opacity} />;
      case 'career-ascent':
        return <CareerAscentPatternSVG theme={theme} opacity={opacity} />;
      case 'stencil-grit':
        return <StencilGritTextureSVG theme={theme} opacity={opacity} />;
      case 'faceted-grid':
      default:
        return <FacetedGridPatternSVG theme={theme} opacity={opacity} />;
    }
  })();

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      {patternComponent}
    </div>
  );
};

/**
 * Container wrapper for sections, cards, or hero banners with integrated brand texture
 */
export const BrandPatternContainer: React.FC<{
  pattern?: PatternType;
  theme?: PatternTheme;
  opacity?: number;
  bgGradient?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({
  pattern = 'faceted-grid',
  theme = 'dark-navy',
  opacity = 0.85,
  bgGradient = true,
  className = '',
  children,
}) => {
  const bgClass = (() => {
    switch (theme) {
      case 'midnight-teal':
        return bgGradient
          ? 'bg-gradient-to-br from-[#00382F] via-[#061226] to-[#0A0F1D] text-white'
          : 'bg-[#00382F] text-white';
      case 'light-slate':
        return bgGradient
          ? 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900'
          : 'bg-slate-50 text-slate-900';
      case 'pure-white':
        return 'bg-white text-slate-900';
      case 'dark-navy':
      default:
        return bgGradient
          ? 'bg-gradient-to-br from-[#061226] via-[#0B192C] to-[#061226] text-white'
          : 'bg-[#061226] text-white';
    }
  })();

  return (
    <div className={`relative overflow-hidden ${bgClass} ${className}`}>
      <BrandPattern pattern={pattern} theme={theme} opacity={opacity} />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};

export default BrandPattern;
