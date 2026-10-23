import React, { useEffect } from 'react';
import { X, AlertCircle, MicOff, CheckCircle2, Info } from 'lucide-react';
import { THEME } from '../../theme/theme';
import { TouchButton } from './TouchButton';
import { Badge } from './Badge';

export interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  type?: 'voice' | 'query' | 'file' | 'info';
  details?: {
    label: string;
    value: string;
  }[];
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  type = 'info',
  details = [],
  actionLabel = 'Understood',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getHeaderIcon = () => {
    switch (type) {
      case 'voice':
        return <MicOff size={26} color={THEME.colors.primary} />;
      case 'file':
        return <CheckCircle2 size={26} color={THEME.colors.primary} />;
      case 'query':
        return <Info size={26} color={THEME.colors.primary} />;
      default:
        return <AlertCircle size={26} color={THEME.colors.accentTeal} />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: THEME.colors.bgOverlay,
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: THEME.colors.bgWhite,
          borderRadius: THEME.radii.xl,
          boxShadow: '0 24px 60px rgba(8, 76, 74, 0.25)',
          border: `1px solid ${THEME.colors.panelBorder}`,
          padding: '32px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: THEME.radii.lg,
                backgroundColor: 'rgba(15, 107, 104, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(15, 107, 104, 0.16)',
              }}
            >
              {getHeaderIcon()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  id="modal-title"
                  style={{
                    fontFamily: THEME.typography.fontDisplay,
                    fontSize: '20px',
                    fontWeight: THEME.typography.weights.bold,
                    color: THEME.colors.textPrimary,
                  }}
                >
                  {title}
                </h3>
                <Badge variant="teal" size="sm">Phase 1 UI Notice</Badge>
              </div>
              {subtitle && (
                <p style={{ fontSize: '14px', color: THEME.colors.textSecondary, marginTop: '4px' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: THEME.colors.textMuted,
              padding: '8px',
              borderRadius: THEME.radii.pill,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Content Details */}
        {details.length > 0 && (
          <div
            style={{
              backgroundColor: THEME.colors.bgSubtle,
              borderRadius: THEME.radii.md,
              padding: '16px',
              border: '1px solid rgba(15, 107, 104, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {details.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: THEME.colors.textSecondary }}>{item.label}</span>
                <span
                  style={{
                    fontFamily: item.label.toLowerCase().includes('size') || item.label.toLowerCase().includes('hash')
                      ? THEME.typography.fontMono
                      : THEME.typography.fontBody,
                    fontWeight: THEME.typography.weights.semibold,
                    color: THEME.colors.textPrimary,
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Phase Roadmap Note */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: THEME.radii.md,
            backgroundColor: 'rgba(60, 145, 140, 0.08)',
            borderLeft: `4px solid ${THEME.colors.accentTeal}`,
            fontSize: '13px',
            color: THEME.colors.deepTeal,
            lineHeight: 1.5,
          }}
        >
          {type === 'voice' && (
            <p>
              <strong>Voice & ASR Integration (Phase 9):</strong> Real-time Web Speech recognition and vocal synthesis are active. If microphone permission is denied or unsupported, touch "Simulate Voice Recognition" or use the physical keyboard and stage buttons.
            </p>
          )}
          {type === 'query' && (
            <p>
              <strong>Inference Pipeline (Phase 9):</strong> Connected to endpoint registry at <code>/api/v1/companion/query</code> with automatic character state synchronization (listening → thinking → speaking → answerReady).
            </p>
          )}
          {type === 'file' && (
            <p>
              <strong>Processing Pipeline:</strong> The selected file has been validated and staged locally. Companion reacts immediately with document inspection gestures and status captions.
            </p>
          )}
          {type === 'info' && (
            <p>
              <strong>Exhibition Kiosk Mode:</strong> All UI controls, capability workspaces, touch interactions, and character reaction states are fully operational.
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          {secondaryActionLabel && (
            <TouchButton
              variant="secondary"
              size="md"
              onClick={() => {
                if (onSecondaryAction) onSecondaryAction();
                onClose();
              }}
            >
              {secondaryActionLabel}
            </TouchButton>
          )}
          <TouchButton
            variant="primary"
            size="md"
            onClick={() => {
              if (onAction) onAction();
              onClose();
            }}
          >
            {actionLabel}
          </TouchButton>
        </div>
      </div>
    </div>
  );
};
