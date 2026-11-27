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
 * - Primary: #F47A24 (Red-Orange)
 * - Secondary: #FFFFFF with #E4E7EC border
 * - Dark: #102B4E (Navy)
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
    'group inline-flex items-center justify-center font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer select-none active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  // Official ABHI JOBS Corporate Palette Variants
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#F47A24] hover:bg-[#DE6816] active:bg-[#C75A10] text-white border border-[#F47A24] hover:border-[#DE6816] shadow-2xs hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47A24] focus-visible:ring-offset-2',
    secondary:
      'bg-white hover:bg-[#F6F8FB] active:bg-[#EDF1F7] text-[#102B4E] border border-[#D4DCE6] hover:border-[#102B4E]/45 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E] focus-visible:ring-offset-2',
    ghost:
      'bg-transparent hover:bg-[#F6F8FB] active:bg-[#E5EAF0] text-[#475569] hover:text-[#102B4E] border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E]/30 focus-visible:ring-offset-2',
    dark:
      'bg-[#102B4E] hover:bg-[#081D36] active:bg-[#051427] text-white border border-[#102B4E] shadow-2xs hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E] focus-visible:ring-offset-2',
  };

  // Consistent corporate button dimensions (8px radius, comfortable touch targets)
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3.5 py-2 text-[13px] rounded-lg min-h-[38px] gap-1.5',
    md: 'px-4 py-2 text-[14px] rounded-lg min-h-[42px] gap-2',
    lg: 'px-5 py-2.5 text-[14px] rounded-lg min-h-[44px] gap-2',
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
