import React from 'react';
import { THEME } from '../../theme/theme';
import { Badge } from '../ui/Badge';
import { Cpu, ShieldCheck } from 'lucide-react';

interface KioskHeaderProps {
  onResetToHome?: () => void;
}

export const KioskHeader: React.FC<KioskHeaderProps> = ({ onResetToHome }) => {
  return (
    <header
      role="banner"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        width: '100%',
        zIndex: 20,
      }}
    >
      {/* 1. CALDIM Brand Identity */}
      <div
        onClick={onResetToHome}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          cursor: onResetToHome ? 'pointer' : 'default',
        }}
      >
        {/* Custom CALDIM AI Geometric Emblem */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: THEME.radii.md,
            background: `linear-gradient(135deg, ${THEME.colors.primary} 0%, ${THEME.colors.deepTeal} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(15, 107, 104, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            position: 'relative',
          }}
        >
          <Cpu size={22} color="#FFFFFF" />
          <div
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: THEME.colors.glowTeal,
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 6px #4ED2CB',
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                fontFamily: THEME.typography.fontDisplay,
                fontSize: '22px',
                fontWeight: THEME.typography.weights.extrabold,
                color: THEME.colors.textPrimary,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              CALDIM
            </h1>
            <span
              style={{
                fontFamily: THEME.typography.fontDisplay,
                fontSize: '22px',
                fontWeight: THEME.typography.weights.light,
                color: THEME.colors.accentTeal,
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}
            >
              SmartAssist
            </span>
          </div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: THEME.typography.weights.semibold,
              color: THEME.colors.textSecondary,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            Robotic AI Companion • Exhibition Kiosk
          </p>
        </div>
      </div>

      {/* 2. System Status & Kiosk Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: THEME.radii.pill,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: `1px solid ${THEME.colors.panelBorder}`,
            boxShadow: THEME.shadows.subtle,
            fontSize: '12px',
            color: THEME.colors.textSecondary,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: THEME.colors.statusReady,
              boxShadow: '0 0 8px #10B981',
            }}
          />
          <span style={{ fontWeight: THEME.typography.weights.medium }}>Touch Kiosk Active</span>
          <span style={{ color: THEME.colors.textMuted }}>•</span>
          <span style={{ fontFamily: THEME.typography.fontMono, fontSize: '11px' }}>12ms</span>
        </div>

        <Badge variant="teal" size="sm">
          <ShieldCheck size={12} />
          Phase 1 Foundation
        </Badge>
      </div>
    </header>
  );
};
