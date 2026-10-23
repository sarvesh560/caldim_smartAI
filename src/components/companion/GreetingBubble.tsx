import React from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import { THEME } from '../../theme/theme';

interface GreetingBubbleProps {
  message: string;
  isReactionActive?: boolean;
  onBubbleClick?: () => void;
}

export const GreetingBubble: React.FC<GreetingBubbleProps> = ({
  message,
  isReactionActive = false,
  onBubbleClick,
}) => {
  return (
    <div
      onClick={onBubbleClick}
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 22px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        border: `1.5px solid ${isReactionActive ? THEME.colors.accentTeal : THEME.colors.panelBorder}`,
        borderRadius: THEME.radii.pill,
        boxShadow: isReactionActive ? THEME.shadows.glowTeal : THEME.shadows.panel,
        cursor: 'pointer',
        transition: `all ${THEME.animations.durations.smooth} ${THEME.animations.easings.bounce}`,
        transform: isReactionActive ? 'scale(1.03) translateY(-4px)' : 'scale(1) translateY(0)',
        maxWidth: '540px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Speech Bubble Tail Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: '14px',
          height: '14px',
          backgroundColor: '#FFFFFF',
          borderRight: `1.5px solid ${isReactionActive ? THEME.colors.accentTeal : THEME.colors.panelBorder}`,
          borderBottom: `1.5px solid ${isReactionActive ? THEME.colors.accentTeal : THEME.colors.panelBorder}`,
          zIndex: 1,
        }}
      />

      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: isReactionActive ? THEME.colors.primary : 'rgba(15, 107, 104, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isReactionActive ? THEME.colors.textInverse : THEME.colors.primary,
          flexShrink: 0,
          transition: 'all 0.25s ease',
        }}
      >
        {isReactionActive ? <Sparkles size={16} /> : <MessageSquare size={16} />}
      </div>

      <p
        style={{
          fontFamily: THEME.typography.fontBody,
          fontSize: '15px',
          fontWeight: THEME.typography.weights.medium,
          color: THEME.colors.textPrimary,
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  );
};
