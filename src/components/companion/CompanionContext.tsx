/**
 * CALDIM SmartAssist Companion — Shared Context & Controller
 *
 * Phase 4: Interactive Pet Behaviour and Animation Polish
 *
 * Provides a single shared state instance across the entire application:
 * - Coherent character animation controller with Entry, Active, Exit lifecycles
 * - Priority-protected state transitions (never clobbers active tasks on route change)
 * - Single-tap greeting, double-tap happy jump, and press-and-hold continuous petting
 * - Subtle pointer attention tracking (gaze & head orientation)
 * - Speech synthesis & caption controls
 * - Cross-workspace state persistence
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { CharacterState, QuadrupedMotion } from '../../types/character3d';
import type { CompanionEvent } from '../../types/companionEvents';
import {
  animationController,
  STATE_PRIORITIES,
  type AnimationPhase,
  type CharacterGestureState,
} from '../../services/characterAnimationController';
import { mapEventToReaction } from '../../services/companionReactions';
import { speechService } from '../../services/speechService';
import { voiceService } from '../../services/voiceService';
import { aiConversationService, type ApiDiagnosticsInfo } from '../../services/aiConversationService';

interface CompanionContextType {
  characterState: CharacterState;
  animationPhase: AnimationPhase;
  isPetting: boolean;
  activeMotion: QuadrupedMotion | null;
  tapCount: number;
  lookAt: { x: number; y: number };
  caption: string;
  isSpeaking: boolean;
  isListening: boolean;
  isSubmittingQuery: boolean;
  lastFailedQuery: string | null;
  apiDiagnostics: ApiDiagnosticsInfo;
  voiceStatus: 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
  soundEnabled: boolean;
  captionsEnabled: boolean;
  isDockCollapsed: boolean;
  lastEvent: CompanionEvent | null;
  emitEvent: (event: CompanionEvent) => void;
  triggerMotion: (motion: QuadrupedMotion) => boolean;
  petCompanion: () => void;
  petPart: (part?: 'head' | 'ears' | 'body' | 'paw' | 'general') => void;
  startPetting: () => boolean;
  stopPetting: () => void;
  startVoiceInput: () => Promise<boolean>;
  stopVoiceInput: () => void;
  cancelVoiceAndSpeech: () => void;
  simulateVoiceInput: (testTranscript: string) => void;
  submitUserQuery: (query: string, workspaceId?: string, stagedFiles?: { name: string; size: number }[]) => Promise<void>;
  retryLastQuery: () => Promise<void>;
  testBackendConnection: () => Promise<{ reachable: boolean; status?: number; error?: string }>;
  setPointerLookAt: (x: number, y: number) => void;
  resetPointerLookAt: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setCaptionsEnabled: (enabled: boolean) => void;
  setIsDockCollapsed: (collapsed: boolean) => void;
  resetToIdle: () => void;
}

const CompanionContext = createContext<CompanionContextType | null>(null);

const TOUCH_COOLDOWN_MS = 800;

export const CompanionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gestureState, setGestureState] = useState<CharacterGestureState>(() =>
    animationController.getSnapshot()
  );
  const [caption, setCaption] = useState<string>("Hi! I’m CALDIM Smart. How can I help you today?");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'error'>('idle');
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isSubmittingQuery, setIsSubmittingQuery] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [apiDiagnostics, setApiDiagnostics] = useState<ApiDiagnosticsInfo>(() =>
    aiConversationService.getDiagnostics()
  );
  const [lastEvent, setLastEvent] = useState<CompanionEvent | null>(null);

  // Subscribe to central animation controller
  useEffect(() => {
    const unsubscribe = animationController.subscribe((updated) => {
      setGestureState(updated);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    speechService.setMuted(!enabled);
    if (!enabled) {
      setIsSpeaking(false);
    }
  }, []);

  const emitEvent = useCallback(
    (event: CompanionEvent) => {
      setLastEvent(event);

      // Register user gesture if applicable
      if (
        event.payload?.hasUserGesture ||
        event.type === 'COMPANION_TOUCHED' ||
        event.type === 'MICROPHONE_ACTIVATED'
      ) {
        speechService.registerUserGesture();
      }

      const reaction = mapEventToReaction(event, gestureState.tapCount);

      // Transition animation state with priority checks
      const transitioned = animationController.transitionTo(
        reaction.state,
        event.type,
        reaction.durationMs
      );

      // Only update caption if the transition was accepted or if event wasn't clobbered
      if (transitioned || event.type !== 'WORKSPACE_CHANGED') {
        setCaption(reaction.caption);
      }

      // Audio speech handling: only speak when intentional user gesture and not muted
      if (
        transitioned &&
        reaction.speakAudio &&
        reaction.speechText &&
        soundEnabled &&
        (event.payload?.hasUserGesture ||
          event.type === 'COMPANION_TOUCHED' ||
          event.type === 'MICROPHONE_ACTIVATED')
      ) {
        speechService.speak(
          reaction.speechText,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    },
    [soundEnabled, gestureState.tapCount]
  );

  // Direct Touch: Anatomical Part Tap / Double Tap
  const petPart = useCallback(
    (part: 'head' | 'ears' | 'body' | 'paw' | 'general' = 'general') => {
      speechService.registerUserGesture();
      const result = animationController.handlePartTap(part, TOUCH_COOLDOWN_MS);
      if (!result.triggered) return;

      let captionText = 'Hello! CALDIM Smart is attentive and ready to assist.';
      let speechText = "Hi! I’m CALDIM Smart. How can I help you today?";

      if (result.isSecondTap) {
        captionText = '*Wags tail enthusiastically!* So glad to work together on your industrial AI goals!';
        speechText = 'Happy to assist you with engineering data and workflows!';
      } else if (part === 'paw') {
        captionText = '*Offers front paw politely in friendly greeting!* Ready to collaborate!';
        speechText = 'Nice to meet you! CALDIM Smart ready to assist.';
      } else if (part === 'ears') {
        captionText = '*Perks ears and swivels alertly to listen* Senses attuned to your voice!';
        speechText = 'Ears perked and listening closely.';
      } else if (part === 'head') {
        captionText = '*Perks ears and tilts head curiously* Attentive to your inquiry.';
        speechText = "Hello! I'm listening closely.";
      } else if (part === 'body') {
        captionText = '*Perks up with attention and wags tail* Telemetry optimal!';
        speechText = 'CALDIM Smart is accompanying you across all workspaces.';
      }

      setCaption(captionText);

      if (soundEnabled && speechText) {
        speechService.speak(
          speechText,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    },
    [soundEnabled]
  );

  const petCompanion = useCallback(() => {
    petPart('general');
  }, [petPart]);

  // Direct Touch: Press and Hold (Petting)
  const startPetting = useCallback((): boolean => {
    speechService.registerUserGesture();
    const accepted = animationController.handlePetStart();
    if (accepted) {
      setCaption('*Purrs softly with delight* Enjoying the petting!');
      setLastEvent({ type: 'COMPANION_PETTED' });
      return true;
    }
    return false;
  }, []);

  // Direct Touch: Release after petting
  const stopPetting = useCallback(() => {
    animationController.handlePetEnd();
    setCaption("Hi! I’m CALDIM Smart. How can I help you today?");
  }, []);

  // Pointer Attention Tracking
  const setPointerLookAt = useCallback((x: number, y: number) => {
    animationController.updatePointerLookAt(x, y);
  }, []);

  const resetPointerLookAt = useCallback(() => {
    animationController.resetPointerLookAt();
  }, []);

  // Phase 10: Production AI Conversation & Voice Integration
  const cancelVoiceAndSpeech = useCallback(() => {
    isSubmittingRef.current = false;
    setIsSubmittingQuery(false);
    voiceService.cancel();
    aiConversationService.cancel();
    speechService.cancel();
    setIsListening(false);
    setIsSpeaking(false);
    setVoiceStatus('idle');
    animationController.transitionTo('idle', 'VOICE_CANCELLED');
    setCaption("Hi! I’m CALDIM Smart. How can I help you today?");
    setApiDiagnostics(aiConversationService.getDiagnostics());
  }, []);

  const submitUserQuery = useCallback(
    async (
      queryText: string,
      workspaceId = 'home',
      stagedFiles?: { name: string; size: number }[]
    ) => {
      const cleanQuery = queryText.trim();
      if (!cleanQuery) return;

      // In-flight guard: prevent concurrent / duplicate submissions
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmittingQuery(true);

      speechService.registerUserGesture();
      speechService.cancel();
      setIsSpeaking(false);

      // 1. Transition to thinking (priority 25)
      animationController.transitionTo('thinking', 'ANALYSIS_STARTED');
      setVoiceStatus('processing');
      setCaption(`Analyzing engineering query: "${cleanQuery}"...`);

      try {
        // 2. Query AI Conversation Service (connected to API_CONFIG.endpoints.query)
        const result = await aiConversationService.sendQuery({
          query: cleanQuery,
          workspaceId,
          stagedFiles,
        });

        setApiDiagnostics(aiConversationService.getDiagnostics());

        if (!result.isSuccess) {
          setLastFailedQuery(cleanQuery);
        } else {
          setLastFailedQuery(null);
        }

        // 3. Transition to speaking (priority 28)
        animationController.transitionTo('speaking', 'SPEAKING_STARTED');
        setVoiceStatus('speaking');
        setCaption(result.answer);

        if (soundEnabled) {
          setIsSpeaking(true);
          speechService.speak(
            result.answer,
            () => setIsSpeaking(true),
            () => {
              setIsSpeaking(false);
              setVoiceStatus('idle');
              animationController.transitionTo(result.isSuccess ? 'answerReady' : 'idle', 'SPEAKING_COMPLETED');
            }
          );
        } else {
          setVoiceStatus('idle');
          setTimeout(() => {
            animationController.transitionTo(result.isSuccess ? 'answerReady' : 'idle', 'SPEAKING_COMPLETED');
          }, 4000);
        }
      } finally {
        isSubmittingRef.current = false;
        setIsSubmittingQuery(false);
      }
    },
    [soundEnabled]
  );

  const retryLastQuery = useCallback(async () => {
    if (lastFailedQuery) {
      await submitUserQuery(lastFailedQuery);
    }
  }, [lastFailedQuery, submitUserQuery]);

  const testBackendConnection = useCallback(async () => {
    const probe = await aiConversationService.probeEndpoint();
    setApiDiagnostics(aiConversationService.getDiagnostics());
    return probe;
  }, []);

  const startVoiceInput = useCallback(async (): Promise<boolean> => {
    speechService.registerUserGesture();
    const currentPriority = STATE_PRIORITIES[gestureState.state] || 0;
    if (currentPriority >= 30 || isSubmittingRef.current) {
      return false; // Protect safety, automation and active queries
    }

    speechService.cancel();
    setIsSpeaking(false);

    const transitioned = animationController.transitionTo('listening', 'LISTENING_STARTED');
    if (!transitioned) return false;

    setIsListening(true);
    setVoiceStatus('listening');
    setCaption('Listening closely... Speak your question into the microphone.');

    const success = await voiceService.startListening({
      onStart: () => {
        setIsListening(true);
        setVoiceStatus('listening');
      },
      onTranscript: (res) => {
        setCaption(`*Listening* "${res.transcript}"`);
        if (res.isFinal) {
          setIsListening(false);
          const finalQuery = res.transcript.trim();
          if (finalQuery) {
            submitUserQuery(finalQuery);
          } else {
            setVoiceStatus('idle');
            animationController.transitionTo('idle', 'LISTENING_STOPPED');
            setCaption("Hi! I’m CALDIM Smart. How can I help you today?");
          }
        }
      },
      onError: (errMsg, isPermissionDenied) => {
        setIsListening(false);
        setVoiceStatus('error');
        animationController.transitionTo('error', isPermissionDenied ? 'VOICE_PERMISSION_DENIED' : 'TASK_FAILED');
        setCaption(errMsg);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!success) {
      setIsListening(false);
      setVoiceStatus('error');
      return false;
    }

    return true;
  }, [gestureState.state, submitUserQuery]);

  const stopVoiceInput = useCallback(() => {
    voiceService.stopListening();
    setIsListening(false);
    if (voiceStatus === 'listening') {
      setVoiceStatus('idle');
      animationController.transitionTo('idle', 'LISTENING_STOPPED');
    }
  }, [voiceStatus]);

  const simulateVoiceInput = useCallback(
    (testTranscript: string) => {
      speechService.registerUserGesture();
      speechService.cancel();
      setIsSpeaking(false);
      animationController.transitionTo('listening', 'LISTENING_STARTED');
      setIsListening(true);
      setVoiceStatus('listening');
      setCaption('Simulating voice capture: listening for utterance...');

      voiceService.simulateTranscript(testTranscript, {
        onStart: () => {
          setIsListening(true);
          setVoiceStatus('listening');
        },
        onTranscript: (res) => {
          setCaption(`*Listening* "${res.transcript}"`);
          if (res.isFinal) {
            setIsListening(false);
            const finalQuery = res.transcript.trim();
            if (finalQuery) {
              submitUserQuery(finalQuery);
            }
          }
        },
        onError: (errMsg) => {
          setIsListening(false);
          setVoiceStatus('error');
          animationController.transitionTo('error', 'TASK_FAILED');
          setCaption(errMsg);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    },
    [submitUserQuery]
  );

  // Phase 8 Quadruped Locomotion & Sitting Transitions
  const triggerMotion = useCallback(
    (motion: QuadrupedMotion) => {
      speechService.registerUserGesture();
      const success = animationController.triggerMotion(motion);
      if (!success) return false;

      let captionText = '';
      let speechText = '';

      switch (motion) {
        case 'sit':
          captionText = '*Lowers smoothly into a natural sit* Sitting comfortably and attentive.';
          speechText = 'Sitting down and ready to assist.';
          break;
        case 'stand':
          captionText = '*Stands up smoothly to neutral quadruped stance* Standing by and alert.';
          speechText = 'Standing up. Ready for action.';
          break;
        case 'turnLeft':
          captionText = '*Pivots 45° to the left with body follow-through* Scanning left sector.';
          speechText = 'Turning left to inspect workspace.';
          break;
        case 'turnRight':
          captionText = '*Pivots 45° to the right with body follow-through* Scanning right sector.';
          speechText = 'Turning right to inspect workspace.';
          break;
        case 'walkStart':
          captionText = '*Transitions smoothly into active quadruped trot* Locomotion initiated.';
          speechText = 'Starting forward locomotion.';
          break;
        case 'walkStop':
          captionText = '*Decelerates smoothly to a stable four-paw stance* Locomotion halted.';
          speechText = 'Halting locomotion.';
          break;
      }

      if (captionText) {
        setCaption(captionText);
      }

      if (soundEnabled && speechText) {
        speechService.speak(
          speechText,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }

      return true;
    },
    [soundEnabled]
  );

  const resetToIdle = useCallback(() => {
    cancelVoiceAndSpeech();
    animationController.resetToIdle();
    setCaption("Hi! I’m CALDIM Smart. How can I help you today?");
  }, [cancelVoiceAndSpeech]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceService.cancel();
      aiConversationService.cancel();
      speechService.cancel();
      animationController.destroy();
    };
  }, []);

  return (
    <CompanionContext.Provider
      value={{
        characterState: gestureState.state,
        animationPhase: gestureState.phase,
        isPetting: gestureState.isPetting,
        activeMotion: gestureState.activeMotion,
        tapCount: gestureState.tapCount,
        lookAt: gestureState.lookAt,
        caption,
        isSpeaking,
        isListening,
        isSubmittingQuery,
        lastFailedQuery,
        apiDiagnostics,
        voiceStatus,
        soundEnabled,
        captionsEnabled,
        isDockCollapsed,
        lastEvent,
        emitEvent,
        triggerMotion,
        petCompanion,
        petPart,
        startPetting,
        stopPetting,
        startVoiceInput,
        stopVoiceInput,
        cancelVoiceAndSpeech,
        simulateVoiceInput,
        submitUserQuery,
        retryLastQuery,
        testBackendConnection,
        setPointerLookAt,
        resetPointerLookAt,
        setSoundEnabled,
        setCaptionsEnabled,
        setIsDockCollapsed,
        resetToIdle,
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
};

export function useCompanion(): CompanionContextType {
  const context = useContext(CompanionContext);
  if (!context) {
    throw new Error('useCompanion must be used within a CompanionProvider');
  }
  return context;
}
