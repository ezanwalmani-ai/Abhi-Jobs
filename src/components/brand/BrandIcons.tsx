import React from 'react';

export type BrandColorMode = 'palette' | 'navy' | 'red' | 'teal' | 'white' | 'dark';
export type BrandIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface BrandIconProps {
  size?: BrandIconSize;
  colorMode?: BrandColorMode;
  className?: string;
  title?: string;
}

// Resolution map for icon sizes in pixels
const sizeMap: Record<string, number> = {
  xs: 16,
  sm: 20,
  md: 28,
  lg: 40,
  xl: 56,
};

const resolveSize = (size?: BrandIconSize | string): number => {
  if (typeof size === 'number') return size;
  if (size && size in sizeMap) return sizeMap[size];
  return 28;
};

/**
 * 1. Falcon Beacon Icon
 * Represents vigilance, opportunity detection, and precision job matching.
 * Angular predatory eye, faceted crest line, and beacon rays.
 */
export const FalconBeaconIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  colorMode = 'palette',
  className = '',
  title = 'Falcon Beacon',
}) => {
  const px = resolveSize(size);
  const navy = colorMode === 'white' ? '#FFFFFF' : '#061226';
  const red = colorMode === 'white' ? '#FF4D3D' : '#FF2B1A';
  const teal = colorMode === 'white' ? '#14B8A6' : '#004D40';

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label={title}
    >
      {/* Outer faceted eye shield */}
      <polygon
        points="16,3 27,9 29,21 16,29 3,21 5,9"
        stroke={navy}
        strokeWidth="1.8"
        strokeLinejoin="bevel"
        fill="none"
      />
      {/* Angular beak & brow cut */}
      <path
        d="M 5,9 L 16,15 L 27,9"
        stroke={teal}
        strokeWidth="1.6"
        strokeLinejoin="miter"
      />
      {/* Inner beacon pupil */}
      <polygon
        points="16,11 20,15 16,19 12,15"
        fill={red}
      />
      {/* Lower focal ray */}
      <line
        x1="16"
        y1="19"
        x2="16"
        y2="25"
        stroke={teal}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * 2. Verified Skill Crest Icon
 * Represents authentic skills, human verification, and validated talent credentials.
 * Hexagonal faceted shield with sharp precision verification mark.
 */
export const VerifiedSkillIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  colorMode = 'palette',
  className = '',
  title = 'Verified Skill',
}) => {
  const px = resolveSize(size);
  const navy = colorMode === 'white' ? '#FFFFFF' : '#061226';
  const red = colorMode === 'white' ? '#FF4D3D' : '#FF2B1A';
  const teal = colorMode === 'white' ? '#14B8A6' : '#004D40';

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label={title}
    >
      {/* Hexagonal shield border */}
      <polygon
        points="16,2 28,8 28,22 16,29 4,22 4,8"
        stroke={navy}
        strokeWidth="1.8"
        strokeLinejoin="bevel"
        fill="none"
      />
      {/* Inner faceted geometric accents */}
      <polygon
        points="16,6 24,10.5 24,20 16,25 8,20 8,10.5"
        stroke={teal}
        strokeWidth="1.2"
        strokeDasharray="2 1"
        fill="none"
      />
      {/* Sharp verification checkmark */}
      <path
        d="M 11,16 L 15,20 L 22,12"
        stroke={red}
        strokeWidth="2.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
};

/**
 * 3. Career Apex Icon
 * Represents upward career mobility, promotion ladders, and mastery ascent.
 * Geometric stepped chevrons converging into a sharp zenith star.
 */
export const CareerApexIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  colorMode = 'palette',
  className = '',
  title = 'Career Apex',
}) => {
  const px = resolveSize(size);
  const navy = colorMode === 'white' ? '#FFFFFF' : '#061226';
  const red = colorMode === 'white' ? '#FF4D3D' : '#FF2B1A';
  const teal = colorMode === 'white' ? '#14B8A6' : '#004D40';

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label={title}
    >
      {/* Base foundation tier */}
      <path
        d="M 6,26 L 16,19 L 26,26"
        stroke={navy}
        strokeWidth="1.8"
        strokeLinecap="square"
      />
      {/* Mid acceleration tier */}
      <path
        d="M 9,20 L 16,15 L 23,20"
        stroke={teal}
        strokeWidth="1.8"
        strokeLinecap="square"
      />
      {/* Apex zenith chevron */}
      <path
        d="M 12,14 L 16,11 L 20,14"
        stroke={red}
        strokeWidth="2"
        strokeLinecap="square"
      />
      {/* Top beacon star */}
      <polygon
        points="16,3 17.5,6.5 21,8 17.5,9.5 16,13 14.5,9.5 11,8 14.5,6.5"
        fill={red}
      />
    </svg>
  );
};

/**
 * 4. Talent Nexus Icon
 * Represents connecting candidates directly with top employers.
 * Intersecting geometric node matrices and reciprocal vectors.
 */
export const TalentNexusIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  colorMode = 'palette',
  className = '',
  title = 'Talent Nexus',
}) => {
  const px = resolveSize(size);
  const navy = colorMode === 'white' ? '#FFFFFF' : '#061226';
  const red = colorMode === 'white' ? '#FF4D3D' : '#FF2B1A';
  const teal = colorMode === 'white' ? '#14B8A6' : '#004D40';

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label={title}
    >
      {/* Central enterprise hub */}
      <rect
        x="13"
        y="13"
        width="6"
        height="6"
        transform="rotate(45 16 16)"
        fill={red}
      />
      {/* Left talent node */}
      <circle cx="7" cy="16" r="3" stroke={navy} strokeWidth="1.6" />
      {/* Right recruiter node */}
      <circle cx="25" cy="16" r="3" stroke={navy} strokeWidth="1.6" />
      {/* Top mentor node */}
      <circle cx="16" cy="6" r="2.5" stroke={teal} strokeWidth="1.6" />
      {/* Bottom skill node */}
      <circle cx="16" cy="26" r="2.5" stroke={teal} strokeWidth="1.6" />
      {/* Interconnecting dynamic vectors */}
      <line x1="10" y1="16" x2="12" y2="16" stroke={navy} strokeWidth="1.5" />
      <line x1="20" y1="16" x2="22" y2="16" stroke={navy} strokeWidth="1.5" />
      <line x1="16" y1="9" x2="16" y2="12" stroke={teal} strokeWidth="1.5" />
      <line x1="16" y1="20" x2="16" y2="23" stroke={teal} strokeWidth="1.5" />
    </svg>
  );
};

/**
 * 5. Opportunity Radar Icon
 * Represents transparent job search, live radar scanning, and zero ghost listings.
 * Concentric radar circles with 45-degree sweeping aperture beam.
 */
export const OpportunityRadarIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  colorMode = 'palette',
  className = '',
  title = 'Opportunity Radar',
}) => {
  const px = resolveSize(size);
  const navy = colorMode === 'white' ? '#FFFFFF' : '#061226';
  const red = colorMode === 'white' ? '#FF4D3D' : '#FF2B1A';
  const teal = colorMode === 'white' ? '#14B8A6' : '#004D40';

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label={title}
    >
      {/* Outer radar perimeter */}
      <circle cx="16" cy="16" r="13" stroke={navy} strokeWidth="1.6" />
      {/* Mid scanner range */}
      <circle cx="16" cy="16" r="8" stroke={teal} strokeWidth="1.3" strokeDasharray="3 2" />
      {/* Core focus center */}
      <circle cx="16" cy="16" r="3" fill={navy} />
      {/* Radar sweep crosshair */}
      <line x1="16" y1="3" x2="16" y2="29" stroke={navy} strokeWidth="1" opacity="0.4" />
      <line x1="3" y1="16" x2="29" y2="16" stroke={navy} strokeWidth="1" opacity="0.4" />
      {/* Active opportunity blip */}
      <circle cx="21" cy="11" r="2.5" fill={red} />
      <line x1="16" y1="16" x2="21" y2="11" stroke={red} strokeWidth="1.5" />
    </svg>
  );
};

/**
 * 6. Enterprise Monolith Icon
 * Represents vetted companies, hiring institutions, and solid corporate employers.
 * Isometric multifaceted tower with structured skill bays.
 */
export const EnterpriseMonolithIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  colorMode = 'palette',
  className = '',
  title = 'Enterprise Monolith',
}) => {
  const px = resolveSize(size);
  const navy = colorMode === 'white' ? '#FFFFFF' : '#061226';
  const red = colorMode === 'white' ? '#FF4D3D' : '#FF2B1A';
  const teal = colorMode === 'white' ? '#14B8A6' : '#004D40';

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label={title}
    >
      {/* Main tower structure */}
      <polygon
        points="16,3 27,9 27,24 16,30 5,24 5,9"
        stroke={navy}
        strokeWidth="1.8"
        strokeLinejoin="bevel"
        fill="none"
      />
      {/* Central architectural spine */}
      <line x1="16" y1="3" x2="16" y2="30" stroke={navy} strokeWidth="1.6" />
      {/* Left corporate facet */}
      <line x1="5" y1="14" x2="16" y2="19" stroke={teal} strokeWidth="1.4" />
      <line x1="5" y1="19" x2="16" y2="24" stroke={teal} strokeWidth="1.4" />
      {/* Right high-priority portal */}
      <polygon
        points="16,19 27,14 27,19 16,24"
        fill={red}
        opacity="0.85"
      />
    </svg>
  );
};

/**
 * 7. Verified Dossier Icon
 * Represents structured candidate portfolios, verified resumes, and smart applications.
 * Clean minimal document card with verified wax seal and structured capability bars.
 */
export const VerifiedDossierIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  colorMode = 'palette',
  className = '',
  title = 'Verified Dossier',
}) => {
  const px = resolveSize(size);
  const navy = colorMode === 'white' ? '#FFFFFF' : '#061226';
  const red = colorMode === 'white' ? '#FF4D3D' : '#FF2B1A';
  const teal = colorMode === 'white' ? '#14B8A6' : '#004D40';

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label={title}
    >
      {/* Document border with folded corner */}
      <path
        d="M 6,4 L 20,4 L 26,10 L 26,28 L 6,28 Z"
        stroke={navy}
        strokeWidth="1.8"
        strokeLinejoin="bevel"
        fill="none"
      />
      {/* Corner fold */}
      <polyline points="20,4 20,10 26,10" stroke={navy} strokeWidth="1.5" />
      {/* Structured data bars */}
      <line x1="10" y1="11" x2="16" y2="11" stroke={teal} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10" y1="16" x2="22" y2="16" stroke={navy} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      <line x1="10" y1="20" x2="18" y2="20" stroke={navy} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      {/* Verified seal on bottom-right */}
      <circle cx="21" cy="23" r="3" fill={red} />
      <path d="M 19.8,23 L 20.7,24 L 22.3,22" stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/**
 * 8. Compass Target Icon
 * Represents intentional career pathing, goal alignment, and objective growth.
 * Precision cross-target with cardinal direction indicators.
 */
export const CompassTargetIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  colorMode = 'palette',
  className = '',
  title = 'Compass Target',
}) => {
  const px = resolveSize(size);
  const navy = colorMode === 'white' ? '#FFFFFF' : '#061226';
  const red = colorMode === 'white' ? '#FF4D3D' : '#FF2B1A';
  const teal = colorMode === 'white' ? '#14B8A6' : '#004D40';

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label={title}
    >
      {/* Compass outer ring */}
      <circle cx="16" cy="16" r="12" stroke={navy} strokeWidth="1.6" strokeDasharray="3 2" />
      {/* Compass crosshairs */}
      <line x1="16" y1="2" x2="16" y2="30" stroke={navy} strokeWidth="1.4" />
      <line x1="2" y1="16" x2="30" y2="16" stroke={navy} strokeWidth="1.4" />
      {/* North pointer (Red) */}
      <polygon points="16,6 19,16 16,14 13,16" fill={red} />
      {/* South pointer (Teal) */}
      <polygon points="16,26 19,16 16,18 13,16" fill={teal} />
      {/* Center pivot */}
      <circle cx="16" cy="16" r="1.5" fill="#FFFFFF" stroke={navy} strokeWidth="1" />
    </svg>
  );
};

// Export icon dictionary for dynamic rendering
export const BRAND_ICONS = {
  beacon: FalconBeaconIcon,
  verified: VerifiedSkillIcon,
  apex: CareerApexIcon,
  nexus: TalentNexusIcon,
  radar: OpportunityRadarIcon,
  enterprise: EnterpriseMonolithIcon,
  dossier: VerifiedDossierIcon,
  compass: CompassTargetIcon,
} as const;

export type BrandIconKey = keyof typeof BRAND_ICONS;
