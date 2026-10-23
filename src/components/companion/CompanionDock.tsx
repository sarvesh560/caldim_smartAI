/**
 * CALDIM SmartAssist Companion — Persistent Companion Dock
 *
 * Phase 3: Persistent Playful Companion Experience
 *
 * Appears across all capability workspaces as a responsive, non-obstructive
 * companion dock / floating interaction pod.
 * - Coordinated animated robotic puppy (PuppyVectorArt)
 * - Live synchronized speech caption bubble
 * - Touch / petting interaction with tactile visual feedback & cooldown
 * - Audio mute/unmute and captions on/off toggles
 * - Collapsible dock toggle to prevent blocking CAD canvas or task controls
 * - Honest state badge (Idle, Listening, Analyzing, Approval, etc.)
 */

import React, { useState, useRef } from 'react';
import { useCompanion } from './CompanionContext';
import { PuppyVectorArt } from './PuppyVectorArt';
import { THEME } from '../../theme/theme';
import { CHARACTER_STATE_CONFIGS } from '../../types/character3d';
import {
  Volume2,
  VolumeX,
  MessageSquare,
  MessageSquareOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Heart,
  Bot,
} from 'lucide-react';

interface CompanionDockProps {
  reducedMotion?: boolean;
}

export const CompanionDock: React.FC<CompanionDockProps> = ({
  reducedMotion = false,
}) => {
  const {
    characterState,
    animationPhase,
    isPetting,
    lookAt,
    caption,
    isSpeaking,
    soundEnabled,
    captionsEnabled,
    isDockCollapsed,
    petCompanion,
    startPetting,
    stopPetting,
    setPointerLookAt,
    resetPointerLookAt,
    setSoundEnabled,
    setCaptionsEnabled,
    setIsDockCollapsed,
  } = useCompanion();

  const [petHeartVisible, setPetHeartVisible] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef<boolean>(false);
  const stateConfig = CHARACTER_STATE_CONFIGS[characterState] || CHARACTER_STATE_CONFIGS.idle;

  const handlePet = () => {
    petCompanion();
    setPetHeartVisible(true);
    setTimeout(() => setPetHeartVisible(false), 1200);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isLongPressRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      startPetting();
      setPetHeartVisible(true);
    }, 380);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      stopPetting();
      setTimeout(() => setPetHeartVisible(false), 400);
    } else {
      handlePet();
    }
  };

  const handlePointerCancel = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      stopPetting();
      setPetHeartVisible(false);
    }
    resetPointerLookAt();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setPointerLookAt(nx, ny);
  };

  if (isDockCollapsed) {
    return (
      <aside
        aria-label="CALDIM Robotic Companion Minimized Dock"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          border: `1.5px solid ${THEME.colors.primary}`,
          borderRadius: THEME.radii.pill,
          boxShadow: '0 8px 24px rgba(8, 76, 74, 0.2)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={() => setIsDockCollapsed(false)}
      >
        {/* Glowing Status Dot */}
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: stateConfig.collarLedColor || THEME.colors.glowTeal,
            boxShadow: `0 0 10px ${stateConfig.collarLedColor || THEME.colors.glowTeal}`,
            animation: !reducedMotion ? 'pulseSubtle 2s infinite' : 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bot size={16} color={THEME.colors.primary} />
          <span
            style={{
              fontFamily: THEME.typography.fontDisplay,
              fontSize: '13px',
              fontWeight: THEME.typography.weights.bold,
              color: THEME.colors.textPrimary,
              whiteSpace: 'nowrap',
            }}
          >
            CALDIM Smart
          </span>
          <span
            style={{
              fontSize: '11px',
              color: THEME.colors.textMuted,
              fontFamily: THEME.typography.fontMono,
            }}
          >
            ({stateConfig.badge})
          </span>
        </div>

        <button
          type="button"
          aria-label="Expand companion dock"
          onClick={(e) => {
            e.stopPropagation();
            setIsDockCollapsed(false);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: THEME.colors.primary,
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronUp size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="CALDIM Robotic Companion Dock"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 100,
        width: '320px',
        maxWidth: 'calc(100vw - 32px)',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(18px)',
        border: `1.5px solid rgba(15, 107, 104, 0.28)`,
        borderRadius: '20px',
        boxShadow: '0 16px 36px rgba(8, 76, 74, 0.22)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* 1. Header Bar: Identity & Quick Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(15, 107, 104, 0.12)',
          background: 'linear-gradient(90deg, rgba(235, 245, 244, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: stateConfig.collarLedColor || THEME.colors.glowTeal,
              boxShadow: `0 0 8px ${stateConfig.collarLedColor || THEME.colors.glowTeal}`,
            }}
          />
          <span
            style={{
              fontFamily: THEME.typography.fontDisplay,
              fontSize: '13px',
              fontWeight: THEME.typography.weights.bold,
              color: THEME.colors.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            CALDIM Smart
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: THEME.radii.pill,
              backgroundColor: 'rgba(15, 107, 104, 0.1)',
              color: THEME.colors.primary,
              fontWeight: THEME.typography.weights.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {stateConfig.badge}
          </span>
        </div>

        {/* Audio, Captions & Minimize Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Mute/Unmute */}
          <button
            type="button"
            title={soundEnabled ? 'Mute Speech' : 'Unmute Speech'}
            aria-label={soundEnabled ? 'Mute speech' : 'Unmute speech'}
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              borderRadius: THEME.radii.sm,
              color: soundEnabled ? THEME.colors.primary : THEME.colors.textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Captions On/Off */}
          <button
            type="button"
            title={captionsEnabled ? 'Hide Captions' : 'Show Captions'}
            aria-label={captionsEnabled ? 'Hide captions' : 'Show captions'}
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              borderRadius: THEME.radii.sm,
              color: captionsEnabled ? THEME.colors.primary : THEME.colors.textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {captionsEnabled ? <MessageSquare size={15} /> : <MessageSquareOff size={15} />}
          </button>

          {/* Minimize */}
          <button
            type="button"
            title="Minimize companion dock"
            aria-label="Minimize companion dock"
            onClick={() => setIsDockCollapsed(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              borderRadius: THEME.radii.sm,
              color: THEME.colors.textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* 2. Character Display Area: Petting Target & Live Animation */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Tap to interact with robotic companion or press and hold to pet"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerCancel}
        onPointerCancel={handlePointerCancel}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePet();
          }
        }}
        style={{
          position: 'relative',
          height: '140px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isPetting ? 'grabbing' : 'pointer',
          background: isPetting
            ? 'radial-gradient(ellipse at center, rgba(78, 210, 203, 0.3) 0%, rgba(255, 255, 255, 0) 70%)'
            : 'radial-gradient(ellipse at center, rgba(78, 210, 203, 0.14) 0%, rgba(255, 255, 255, 0) 70%)',
          outline: 'none',
          touchAction: 'none',
          transition: 'background 0.3s ease',
        }}
      >
        {/* Heart float animation on pet */}
        {(petHeartVisible || isPetting) && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '25%',
              zIndex: 10,
              pointerEvents: 'none',
              animation: !reducedMotion ? 'floatGentle 0.8s ease-out forwards' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '3px 8px',
              borderRadius: THEME.radii.pill,
              boxShadow: '0 4px 12px rgba(8, 76, 74, 0.18)',
              border: '1px solid #4ED2CB',
            }}
          >
            <Heart size={14} color="#0F6B68" fill="#4ED2CB" />
            <span style={{ fontSize: '11px', fontWeight: THEME.typography.weights.bold, color: THEME.colors.primary }}>
              {isPetting ? '*purring happily*' : '*happy wag*'}
            </span>
          </div>
        )}

        {/* Scaled animated puppy vector art */}
        <div style={{ transform: 'scale(0.85)', transformOrigin: 'center center' }}>
          <PuppyVectorArt
            characterState={characterState}
            animationPhase={animationPhase}
            isPetting={isPetting}
            lookAt={lookAt}
            isReacting={petHeartVisible || isPetting}
            reducedMotion={reducedMotion}
            size={160}
          />
        </div>

        {/* Small Pet hint tag */}
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            color: THEME.colors.textMuted,
            fontFamily: THEME.typography.fontMono,
            pointerEvents: 'none',
          }}
        >
          <Sparkles size={11} color={THEME.colors.accentTeal} />
          <span>{isPetting ? 'Petting...' : 'Tap or hold to pet'}</span>
        </div>
      </div>

      {/* 3. Live Caption Area */}
      {captionsEnabled && (
        <div
          style={{
            padding: '10px 14px 12px',
            backgroundColor: 'rgba(242, 247, 247, 0.85)',
            borderTop: '1px solid rgba(15, 107, 104, 0.1)',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          {isSpeaking && (
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: THEME.colors.glowTeal,
                marginTop: '5px',
                flexShrink: 0,
                boxShadow: `0 0 6px ${THEME.colors.glowTeal}`,
                animation: !reducedMotion ? 'pulseSubtle 0.6s infinite' : 'none',
              }}
            />
          )}
          <p
            style={{
              margin: 0,
              fontSize: '12.5px',
              lineHeight: 1.45,
              color: THEME.colors.textPrimary,
              fontFamily: THEME.typography.fontDisplay,
              fontWeight: THEME.typography.weights.medium,
            }}
          >
            {caption}
          </p>
        </div>
      )}
    </aside>
  );
};
