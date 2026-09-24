import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

/**
 * Unified ABHI JOBS Button System
 * Strictly enforces:
 * - Primary: #FF2B1A (Red-Orange)
 * - Secondary: #FFFFFF with #E4E7EC border
 * - Dark: #061226 (Navy)
 * - Ghost: transparent with subtle slate hover
 * - Minimum 44px height for standard touch targets (accessibility)
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  disabled,
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  const baseStyles =
    'group inline-flex items-center justify-center font-bold transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:translate-y-0';

  // Strict Brand Variant Definitions
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#FF2B1A] hover:bg-[#e02213] active:bg-[#c91d0f] text-white border border-[#FF2B1A] hover:border-[#e02213] shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2B1A] focus-visible:ring-offset-2',
    secondary:
      'bg-white hover:bg-[#F7F8FA] active:bg-[#EDF0F2] text-[#101828] border border-[#E4E7EC] hover:border-slate-300 shadow-2xs hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#061226] focus-visible:ring-offset-2',
    ghost:
      'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-[#344054] hover:text-[#101828] border border-transparent hover:-translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2',
    dark:
      'bg-[#061226] hover:bg-[#0c1f3d] active:bg-[#040c1a] text-white border border-[#061226] shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#061226] focus-visible:ring-offset-2',
  };

  // Sizing definitions ensuring accessibility touch targets (>= 44px for md/lg)
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-xl min-h-[36px] gap-1.5 font-semibold',
    md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl min-h-[44px] gap-2 font-bold',
    lg: 'px-6 py-3 text-sm sm:text-base rounded-2xl min-h-[48px] gap-2.5 font-bold',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`.trim()}
      {...rest}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {iconLeft && <span className="shrink-0 flex items-center">{iconLeft}</span>}
          <span>{children}</span>
          {iconRight && (
            <span className="shrink-0 flex items-center transition-transform duration-200 group-hover:translate-x-1">
              {iconRight}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default Button;
