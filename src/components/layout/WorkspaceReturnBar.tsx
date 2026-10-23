import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { THEME } from '../../theme/theme';
import { TouchButton } from '../ui/TouchButton';
import { Badge } from '../ui/Badge';

interface WorkspaceReturnBarProps {
  title: string;
  subtitle: string;
  badgeLabel?: string;
  onReturn: () => void;
  actionNode?: React.ReactNode;
}

export const WorkspaceReturnBar: React.FC<WorkspaceReturnBarProps> = ({
  title,
  subtitle,
  badgeLabel,
  onReturn,
  actionNode,
}) => {
  return (
    <div
      style={{
        position: 'sticky',
        top: '16px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${THEME.colors.panelBorder}`,
        borderRadius: THEME.radii.lg,
        boxShadow: THEME.shadows.panel,
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      {/* Return Touch Control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <TouchButton
          variant="secondary"
          size="md"
          icon={<ArrowLeft size={18} />}
          onClick={onReturn}
          aria-label="Return to Companion Main Screen"
        >
          Return to Companion
        </TouchButton>

        <div style={{ height: '32px', width: '1px', backgroundColor: 'rgba(15, 107, 104, 0.15)' }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2
              style={{
                fontFamily: THEME.typography.fontDisplay,
                fontSize: '20px',
                fontWeight: THEME.typography.weights.bold,
                color: THEME.colors.textPrimary,
                margin: 0,
              }}
            >
              {title}
            </h2>
            {badgeLabel && <Badge variant="teal" size="sm">{badgeLabel}</Badge>}
          </div>
          <p style={{ fontSize: '13px', color: THEME.colors.textSecondary, margin: '2px 0 0 0' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right companion status / actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {actionNode}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: 'rgba(15, 107, 104, 0.06)',
            borderRadius: THEME.radii.pill,
            border: '1px solid rgba(15, 107, 104, 0.12)',
            fontSize: '12px',
            color: THEME.colors.primary,
          }}
        >
          <Sparkles size={14} color={THEME.colors.accentTeal} />
          <span>Companion on Standby</span>
        </div>
      </div>
    </div>
  );
};
