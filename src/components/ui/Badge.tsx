import React from 'react';
import { THEME } from '../../theme/theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'accent' | 'neutral' | 'warning' | 'info';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'teal',
  size = 'md',
  pulse = false,
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'teal':
        return {
          background: 'rgba(15, 107, 104, 0.1)',
          color: THEME.colors.primary,
          border: '1px solid rgba(15, 107, 104, 0.25)',
        };
      case 'accent':
        return {
          background: 'rgba(60, 145, 140, 0.12)',
          color: THEME.colors.deepTeal,
          border: '1px solid rgba(60, 145, 140, 0.3)',
        };
      case 'warning':
        return {
          background: 'rgba(245, 158, 11, 0.1)',
          color: '#B45309',
          border: '1px solid rgba(245, 158, 11, 0.25)',
        };
      case 'info':
        return {
          background: 'rgba(2, 132, 199, 0.1)',
          color: '#0369A1',
          border: '1px solid rgba(2, 132, 199, 0.25)',
        };
      default:
        return {
          background: 'rgba(18, 37, 36, 0.05)',
          color: THEME.colors.textSecondary,
          border: '1px solid rgba(18, 37, 36, 0.12)',
        };
    }
  };

  const style = getStyles();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '3px 8px' : '5px 12px',
        borderRadius: THEME.radii.pill,
        fontFamily: THEME.typography.fontBody,
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: THEME.typography.weights.medium,
        letterSpacing: '0.02em',
        transition: `all ${THEME.animations.durations.quick} ease`,
        ...style,
      }}
    >
      {pulse && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            animation: 'pulseSubtle 2s infinite ease-in-out',
          }}
        />
      )}
      {children}
    </span>
  );
};
