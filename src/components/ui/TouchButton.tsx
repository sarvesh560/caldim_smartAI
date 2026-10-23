import React from 'react';
import { THEME } from '../../theme/theme';


export interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const [isPressed, setIsPressed] = React.useState(false);

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(135deg, ${THEME.colors.primary} 0%, ${THEME.colors.deepTeal} 100%)`,
          color: THEME.colors.textInverse,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 14px rgba(15, 107, 104, 0.25)',
        };
      case 'accent':
        return {
          background: `linear-gradient(135deg, ${THEME.colors.accentTeal} 0%, ${THEME.colors.primary} 100%)`,
          color: THEME.colors.textInverse,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 14px rgba(60, 145, 140, 0.3)',
        };
      case 'secondary':
        return {
          background: 'rgba(15, 107, 104, 0.08)',
          color: THEME.colors.primary,
          border: '1px solid rgba(15, 107, 104, 0.2)',
          boxShadow: 'none',
        };
      case 'glass':
        return {
          background: THEME.colors.panelBg,
          color: THEME.colors.textPrimary,
          border: `1px solid ${THEME.colors.panelBorder}`,
          boxShadow: THEME.shadows.subtle,
          backdropFilter: 'blur(12px)',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: THEME.colors.textSecondary,
          border: '1px solid transparent',
          boxShadow: 'none',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          minHeight: '40px',
          padding: '8px 16px',
          fontSize: '13px',
          borderRadius: THEME.radii.md,
        };
      case 'lg':
        return {
          minHeight: '56px',
          padding: '14px 28px',
          fontSize: '16px',
          borderRadius: THEME.radii.lg,
          fontWeight: THEME.typography.weights.semibold,
        };
      case 'md':
      default:
        return {
          minHeight: '48px', // Touch-target minimum
          padding: '10px 20px',
          fontSize: '14px',
          borderRadius: THEME.radii.md,
          fontWeight: THEME.typography.weights.medium,
        };
    }
  };

  return (
    <button
      {...props}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        fontFamily: THEME.typography.fontBody,
        transition: `all ${THEME.animations.durations.quick} ${THEME.animations.easings.standard}`,
        transform: isPressed && !disabled ? 'scale(0.97)' : 'scale(1)',
        width: fullWidth ? '100%' : 'auto',
        ...getSizeStyles(),
        ...getVariantStyles(),
        ...style,
      }}
    >
      {icon && iconPosition === 'left' && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
    </button>
  );
};
