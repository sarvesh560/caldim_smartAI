import React from 'react';
import { THEME } from '../../theme/theme';
import { Hand, Mic, FileText, Bot, Sparkles } from 'lucide-react';

export const KioskFooter: React.FC = () => {
  return (
    <footer
      role="contentinfo"
      style={{
        marginTop: 'auto',
        padding: '18px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid rgba(15, 107, 104, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(8px)',
        fontSize: '12px',
        color: THEME.colors.textSecondary,
        zIndex: 10,
        width: '100%',
      }}
    >
      {/* 5 Core Modalities Pill Group */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Hand size={14} color={THEME.colors.primary} />
          <strong>Touch</strong>
        </span>

        <span style={{ color: THEME.colors.textMuted }}>•</span>

        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Mic size={14} color={THEME.colors.accentTeal} />
          <strong>Voice</strong>
        </span>

        <span style={{ color: THEME.colors.textMuted }}>•</span>

        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={14} color={THEME.colors.primary} />
          <strong>Documents</strong>
        </span>

        <span style={{ color: THEME.colors.textMuted }}>•</span>

        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bot size={14} color={THEME.colors.deepTeal} />
          <strong>AI Assistance</strong>
        </span>

        <span style={{ color: THEME.colors.textMuted }}>•</span>

        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color={THEME.colors.glowTeal} />
          <strong>Companion</strong>
        </span>
      </div>

      {/* Exhibition & Version Notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ color: THEME.colors.textMuted }}>
          CALDIM Technologies © 2026
        </span>
        <span
          style={{
            fontFamily: THEME.typography.fontMono,
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(15, 107, 104, 0.08)',
            color: THEME.colors.primary,
          }}
        >
          v1.0-phase1-foundation
        </span>
      </div>
    </footer>
  );
};
