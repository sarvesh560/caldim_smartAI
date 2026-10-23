import React, { useState, useEffect, useRef, useCallback } from 'react';
import { THEME } from '../../theme/theme';
import { GreetingBubble } from './GreetingBubble';
import { Companion3DScene } from './Companion3DScene';
import { ModelStatusModal } from './ModelStatusModal';
import { PuppyVectorArt } from './PuppyVectorArt';
import { useCompanion } from './CompanionContext';
import { Badge } from '../ui/Badge';
import type { CharacterState, ModelMetadata } from '../../types/character3d';
import { CHARACTER_STATE_CONFIGS } from '../../types/character3d';
import { Sparkles, Box, Info, Volume2, VolumeX, MessageSquare, MessageSquareOff, Heart, Mic, MicOff, Square } from 'lucide-react';

interface CompanionStageProps {
  modelUrl?: string | null;
  characterState?: CharacterState;
  onCharacterStateChange?: (state: CharacterState) => void;
  greetingMessage?: string;
  onCharacterInteract?: () => void;
  reducedMotion?: boolean;
}

export const CompanionStage: React.FC<CompanionStageProps> = ({
  modelUrl = '/models/caldim_dog.glb',
  characterState: propCharacterState,
  onCharacterStateChange,
  greetingMessage,
  onCharacterInteract,
  reducedMotion = false,
}) => {
  const companion = useCompanion();
  const [internalState, setInternalState] = useState<CharacterState>(propCharacterState || companion.characterState || 'idle');
  const activeState = propCharacterState || companion.characterState || internalState;

  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const activeModelUrl = customModelUrl || modelUrl;

  const [mode, setMode] = useState<'3d' | '2d'>('2d');
  const [fallbackReason, setFallbackReason] = useState<string | null>(
    'Asset public/models/caldim_dog.glb not detected. 2D vector companion fallback engaged.'
  );
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const [isReacting, setIsReacting] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef<boolean>(false);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const lastHitPartRef = useRef<'head' | 'ears' | 'body' | 'paw' | 'general'>('general');

  const stateConfig = CHARACTER_STATE_CONFIGS[activeState] || CHARACTER_STATE_CONFIGS.idle;
  const currentSpeech = greetingMessage || companion.caption || stateConfig.speechText;

  // Clean preflight check for model availability without throwing uncaught console errors
  useEffect(() => {
    let isMounted = true;

    const verifyModelAvailability = async () => {
      if (!activeModelUrl) {
        if (isMounted) {
          setMode('2d');
          setFallbackReason('No 3D model asset path specified.');
        }
        return;
      }

      // If user uploaded a local GLB via the inspector, it's immediately accessible
      if (activeModelUrl.startsWith('blob:')) {
        if (isMounted) {
          setMode('3d');
          setFallbackReason(null);
        }
        return;
      }

      try {
        const response = await fetch(activeModelUrl, { method: 'HEAD' });
        if (isMounted) {
          const contentType = response.headers.get('content-type') || '';
          // Avoid mistaking SPA index.html fallback for real binary model
          if (response.ok && !contentType.includes('text/html')) {
            setMode('3d');
            setFallbackReason(null);
          } else {
            setMode('2d');
            setFallbackReason(
              `Asset ${activeModelUrl} not found on server (HTTP ${response.status}). 2D vector companion fallback engaged.`
            );
          }
        }
      } catch {
        if (isMounted) {
          setMode('2d');
          setFallbackReason(
            `Unable to load ${activeModelUrl}. 2D vector companion fallback engaged.`
          );
        }
      }
    };

    verifyModelAvailability();

    return () => {
      isMounted = false;
    };
  }, [activeModelUrl]);

  const handleFallback = useCallback((reason: string) => {
    console.info(`[CALDIM Companion Stage] 3D fallback engaged: ${reason}`);
    setFallbackReason(reason);
    setMode('2d');
  }, []);

  const handleModelMetadataLoaded = useCallback((meta: ModelMetadata) => {
    setModelMetadata((prev) => {
      if (
        prev &&
        prev.url === meta.url &&
        prev.status === meta.status &&
        prev.meshCount === meta.meshCount &&
        prev.boneCount === meta.boneCount
      ) {
        return prev;
      }
      return meta;
    });
  }, []);

  const handleStateChange = (nextState: CharacterState) => {
    setInternalState(nextState);
    if (onCharacterStateChange) {
      onCharacterStateChange(nextState);
    }
  };

  const handleStageClick = (part: 'head' | 'ears' | 'body' | 'paw' | 'general' = 'general') => {
    setIsReacting(true);
    companion.petPart(part);

    if (onCharacterInteract) {
      onCharacterInteract();
    }

    setTimeout(() => {
      setIsReacting(false);
    }, 2000);
  };

  // Keyboard accessibility: Allow kiosk users / operators to trigger part interactions via number keys & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.key === '1') {
        handleStageClick('head');
      } else if (e.key === '2') {
        handleStageClick('ears');
      } else if (e.key === '3') {
        handleStageClick('body');
      } else if (e.key === '4') {
        handleStageClick('paw');
      } else if (e.key === 'p' || e.key === 'P') {
        if (companion.isPetting) {
          companion.stopPetting();
        } else {
          companion.startPetting();
        }
      } else if (e.key === 'v' || e.key === 'V') {
        if (companion.isListening) {
          companion.stopVoiceInput();
        } else {
          companion.startVoiceInput();
        }
      } else if (e.key === 'Escape') {
        companion.cancelVoiceAndSpeech();
      } else if (e.key === 'm' || e.key === 'M') {
        companion.setSoundEnabled(!companion.soundEnabled);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [companion]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isLongPressRef.current = false;
    hasMovedRef.current = false;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };

    longPressTimerRef.current = window.setTimeout(() => {
      if (!hasMovedRef.current) {
        isLongPressRef.current = true;
        companion.startPetting();
        if (onCharacterInteract) {
          onCharacterInteract();
        }
      }
    }, 380);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    pointerStartPosRef.current = null;

    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      companion.stopPetting();
    } else if (!hasMovedRef.current) {
      const targetPart = lastHitPartRef.current || 'general';
      handleStageClick(targetPart);
      lastHitPartRef.current = 'general';
    }
  };

  const handlePointerCancel = () => {
    pointerStartPosRef.current = null;
    hasMovedRef.current = false;
    lastHitPartRef.current = 'general';
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      companion.stopPetting();
    }
    companion.resetPointerLookAt();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartPosRef.current) {
      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
      if (dx > 8 || dy > 8) {
        hasMovedRef.current = true;
        if (longPressTimerRef.current !== null) {
          window.clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }

    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    companion.setPointerLookAt(nx, ny);
  };

  const handleToggleMode = () => {
    if (mode === '3d') {
      setMode('2d');
      setFallbackReason('Manual operator toggle to 2D vector mode');
    } else {
      setMode('3d');
      setFallbackReason(null);
    }
  };

  const handleLoadCustomGlb = (url: string) => {
    setCustomModelUrl(url);
    setMode('3d');
    setFallbackReason(null);
  };

  const handleResetToDefault = () => {
    if (customModelUrl && customModelUrl.startsWith('blob:')) {
      URL.revokeObjectURL(customModelUrl);
    }
    setCustomModelUrl(null);
  };

  return (
    <section
      aria-label="CALDIM Robotic Dog Companion Stage"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
        maxWidth: '840px',
        margin: '0 auto',
        padding: '8px 0 16px 0',
      }}
    >
      {/* 1. Friendly Greeting Speech Bubble & Audio/Captions Controls */}
      <div
        style={{
          marginBottom: '14px',
          zIndex: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {companion.captionsEnabled && (
          <GreetingBubble
            message={currentSpeech}
            isReactionActive={isReacting}
            onBubbleClick={handleStageClick}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
          {/* Voice Input Button */}
          <button
            type="button"
            title={companion.isListening ? 'Stop Listening' : 'Start Voice Recognition (V)'}
            onClick={(e) => {
              e.stopPropagation();
              if (companion.isListening) {
                companion.stopVoiceInput();
              } else {
                companion.startVoiceInput();
              }
            }}
            style={{
              background: companion.isListening ? 'rgba(78, 210, 203, 0.2)' : 'rgba(255, 255, 255, 0.85)',
              border: `1.5px solid ${companion.isListening ? THEME.colors.primary : 'rgba(15, 107, 104, 0.2)'}`,
              borderRadius: THEME.radii.pill,
              padding: '3px 12px',
              fontSize: '11px',
              fontFamily: THEME.typography.fontBody,
              color: companion.isListening ? THEME.colors.primary : THEME.colors.textPrimary,
              fontWeight: companion.isListening ? THEME.typography.weights.bold : THEME.typography.weights.medium,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              boxShadow: companion.isListening ? '0 0 12px rgba(78, 210, 203, 0.5)' : '0 2px 6px rgba(8, 76, 74, 0.06)',
              transition: 'all 0.2s ease',
            }}
          >
            {companion.isListening ? <Mic size={13} color="#0F6B68" /> : <MicOff size={13} color="#64748B" />}
            <span>{companion.isListening ? 'Listening...' : 'Voice Input (V)'}</span>
          </button>

          {/* Active Speaking / Processing Cancel Button */}
          {(companion.isSpeaking || companion.voiceStatus === 'processing' || companion.isListening) && (
            <button
              type="button"
              title="Cancel speech or voice recognition (Escape)"
              onClick={(e) => {
                e.stopPropagation();
                companion.cancelVoiceAndSpeech();
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: THEME.radii.pill,
                padding: '3px 10px',
                fontSize: '11px',
                fontFamily: THEME.typography.fontBody,
                color: '#B91C1C',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <Square size={11} fill="#B91C1C" />
              <span>Cancel (Esc)</span>
            </button>
          )}

          <button
            type="button"
            title={companion.soundEnabled ? 'Mute Speech (M)' : 'Unmute Speech (M)'}
            onClick={(e) => {
              e.stopPropagation();
              companion.setSoundEnabled(!companion.soundEnabled);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(15, 107, 104, 0.2)',
              borderRadius: THEME.radii.pill,
              padding: '3px 10px',
              fontSize: '11px',
              fontFamily: THEME.typography.fontBody,
              color: companion.soundEnabled ? THEME.colors.primary : THEME.colors.textMuted,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(8, 76, 74, 0.06)',
            }}
          >
            {companion.soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>{companion.soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          <button
            type="button"
            title={companion.captionsEnabled ? 'Hide Captions' : 'Show Captions'}
            onClick={(e) => {
              e.stopPropagation();
              companion.setCaptionsEnabled(!companion.captionsEnabled);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(15, 107, 104, 0.2)',
              borderRadius: THEME.radii.pill,
              padding: '3px 10px',
              fontSize: '11px',
              fontFamily: THEME.typography.fontBody,
              color: companion.captionsEnabled ? THEME.colors.primary : THEME.colors.textMuted,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(8, 76, 74, 0.06)',
            }}
          >
            {companion.captionsEnabled ? <MessageSquare size={13} /> : <MessageSquareOff size={13} />}
            <span>{companion.captionsEnabled ? 'Captions' : 'Captions Off'}</span>
          </button>
        </div>
      </div>

      {/* 2. Central Character Staging Mount (Expanded Dimensions for Visual Prominence) */}
      <div
        id="companion-3d-stage-mount"
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
            handleStageClick();
          }
        }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '540px',
          height: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: companion.isPetting ? 'grabbing' : 'pointer',
          outline: 'none',
          touchAction: 'none',
        }}
      >
        {/* Floating Heart / Petting Feedback */}
        {(companion.isPetting || isReacting) && (
          <div
            style={{
              position: 'absolute',
              top: '24px',
              right: '25%',
              zIndex: 15,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              padding: '4px 12px',
              borderRadius: THEME.radii.pill,
              border: '1.5px solid #4ED2CB',
              boxShadow: '0 6px 18px rgba(78, 210, 203, 0.35)',
              animation: !reducedMotion ? 'floatGentle 1.2s ease-out infinite alternate' : 'none',
            }}
          >
            <Heart size={15} color="#0F6B68" fill="#4ED2CB" />
            <span style={{ fontSize: '12px', fontWeight: THEME.typography.weights.bold, color: THEME.colors.primary }}>
              {companion.isPetting ? '*purring happily*' : '*happy wag*'}
            </span>
          </div>
        )}

        {/* Pedestal Ambient Light & Concentric Holographic Rings */}
        <div
          style={{
            position: 'absolute',
            bottom: '22px',
            width: '460px',
            height: '140px',
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, rgba(78, 210, 203, ${isReacting || companion.isPetting ? '0.55' : '0.24'}) 0%, rgba(15, 107, 104, 0.12) 50%, transparent 80%)`,
            filter: 'blur(12px)',
            transition: 'all 0.5s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Concentric Pedestal Rings */}
        <div
          style={{
            position: 'absolute',
            bottom: '26px',
            width: '420px',
            height: '96px',
            borderRadius: '50%',
            border: `2px solid ${isReacting || companion.isPetting ? THEME.colors.glowTeal : 'rgba(15, 107, 104, 0.35)'}`,
            boxShadow: isReacting || companion.isPetting ? '0 0 24px rgba(78, 210, 203, 0.6)' : 'none',
            transition: 'all 0.4s ease',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: '38px',
            width: '320px',
            height: '72px',
            borderRadius: '50%',
            border: `1.5px dashed ${isReacting || companion.isPetting ? THEME.colors.primary : 'rgba(60, 145, 140, 0.4)'}`,
            animation: reducedMotion ? 'none' : 'radarSpin 24s linear infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Inner Solid Pedestal Platform */}
        <div
          style={{
            position: 'absolute',
            bottom: '42px',
            width: '220px',
            height: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #D8EAE9 100%)',
            border: '1.5px solid rgba(15, 107, 104, 0.25)',
            boxShadow: '0 8px 18px rgba(8, 76, 74, 0.12)',
            pointerEvents: 'none',
          }}
        />

        {/* 3. Character Viewport: 3D Scene vs 2D Fallback */}
        <div
          style={{
            position: 'relative',
            zIndex: 5,
            width: '100%',
            height: '460px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mode === '3d' && activeModelUrl ? (
            <Companion3DScene
              modelUrl={activeModelUrl}
              characterState={activeState}
              activeMotion={companion.activeMotion}
              reducedMotion={reducedMotion}
              isPetting={companion.isPetting}
              lookAt={companion.lookAt}
              interactiveOrbit={true}
              onFallbackTriggered={handleFallback}
              onModelMetadataLoaded={handleModelMetadataLoaded}
              onPartPointerDown={(part) => {
                lastHitPartRef.current = part;
              }}
            />
          ) : (
            /* 2D Vector/CSS Character Fallback with Coordinated Element Articulations */
            <div
              style={{
                position: 'relative',
                width: '300px',
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: isReacting || companion.isPetting || reducedMotion ? 'none' : 'floatGentle 4s ease-in-out infinite',
                transform: isReacting || companion.isPetting ? 'scale(1.06) translateY(-6px)' : 'scale(1)',
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <PuppyVectorArt
                characterState={activeState}
                animationPhase={companion.animationPhase}
                isPetting={companion.isPetting}
                lookAt={companion.lookAt}
                isReacting={isReacting || companion.isPetting}
                reducedMotion={reducedMotion}
                size={300}
              />
            </div>
          )}
        </div>

        {/* Mode Indicator & Telemetry Badge */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsInspectorOpen(true);
          }}
          style={{
            position: 'absolute',
            bottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 8,
            cursor: 'pointer',
          }}
          title="Click to view 3D character diagnostics & test states"
        >
          <Badge variant={mode === '3d' ? 'teal' : 'neutral'} size="sm">
            {mode === '3d' ? <Box size={11} /> : <Sparkles size={11} />}
            {mode === '3d' ? 'Three.js 3D Viewport Active' : '2D Fallback Active (Model Slot Ready)'}
          </Badge>
          <span style={{ fontSize: '11px', color: THEME.colors.textMuted, display: 'flex', alignItems: 'center' }}>
            <Info size={12} />
          </span>
        </div>
      </div>

      {/* Interaction Hint */}
      <p
        style={{
          marginTop: '12px',
          fontSize: '13px',
          color: THEME.colors.textMuted,
          textAlign: 'center',
          fontFamily: THEME.typography.fontBody,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Sparkles size={14} color={THEME.colors.accentTeal} />
        Tap companion or pedestal for friendly interaction • State: <strong>{stateConfig.label}</strong>
      </p>

      {/* 3D Model Diagnostics & State Inspector Modal */}
      <ModelStatusModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        mode={mode}
        modelUrl={activeModelUrl}
        fallbackReason={fallbackReason}
        metadata={modelMetadata}
        currentState={activeState}
        onSelectState={handleStateChange}
        onToggleMode={handleToggleMode}
        onLoadCustomModel={handleLoadCustomGlb}
        onResetToDefault={handleResetToDefault}
        reducedMotion={reducedMotion}
      />
    </section>
  );
};
