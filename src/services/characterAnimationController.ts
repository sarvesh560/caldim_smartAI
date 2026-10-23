/**
 * CALDIM SmartAssist Companion — Character Animation & State Transition Controller
 *
 * Phase 4: Interactive Pet Behaviour and Animation Polish
 *
 * Reusable animation and state transition manager providing:
 * - Intentional Entry, Active, and Exit phases for all 11 character states
 * - Priority-based state retention (preventing workspace navigation from clobbering active tasks)
 * - Safe timer management with sequence tokens (preventing stale timers from overwriting newer states)
 * - Coordinated pointer attention tracking (subtle gaze following)
 * - Direct touch gesture handling: single tap, double tap, press-and-hold petting, and release
 * - Full prefers-reduced-motion support
 */

import type { CharacterState, QuadrupedMotion } from '../types/character3d';
import type { CompanionEventType } from '../types/companionEvents';


export type AnimationPhase = 'entry' | 'active' | 'exit' | 'settled';


export interface CharacterGestureState {
  state: CharacterState;
  phase: AnimationPhase;
  isPetting: boolean;
  tapCount: number;
  lookAt: { x: number; y: number }; // normalized -1 to 1
  transitionSequence: number;
  activeMotion: QuadrupedMotion | null;
}

// State priority ranking: higher priority states cannot be clobbered by lower priority ones
export const STATE_PRIORITIES: Record<CharacterState, number> = {
  needsApproval: 40,   // Critical safety gate
  automationActive: 30, // Ongoing industrial pipeline
  speaking: 28,        // Active speech response (protected against ambient clobbering)
  thinking: 25,        // Active inference / scanning
  listening: 25,       // Voice / audio sensor capture
  error: 20,           // Fault condition
  answerReady: 15,     // Confirmed inspection result
  documentReceived: 10,// Staged file feedback
  happy: 5,            // Playful petting response
  greeting: 5,         // Welcoming gesture
  idle: 0,             // Baseline standby
};

export interface StateTransitionConfig {
  entryDurationMs: number;
  activeDurationMs: number; // 0 = indefinite until explicit event
  exitDurationMs: number;
  canInterruptWithLowerPriority: boolean;
}

export const STATE_TRANSITION_CONFIGS: Record<CharacterState, StateTransitionConfig> = {
  idle: {
    entryDurationMs: 0,
    activeDurationMs: 0,
    exitDurationMs: 0,
    canInterruptWithLowerPriority: true,
  },
  greeting: {
    entryDurationMs: 250,
    activeDurationMs: 3800,
    exitDurationMs: 300,
    canInterruptWithLowerPriority: false,
  },
  happy: {
    entryDurationMs: 200,
    activeDurationMs: 3500,
    exitDurationMs: 300,
    canInterruptWithLowerPriority: false,
  },
  listening: {
    entryDurationMs: 300,
    activeDurationMs: 0, // Persists while sensor standby
    exitDurationMs: 250,
    canInterruptWithLowerPriority: false,
  },
  thinking: {
    entryDurationMs: 300,
    activeDurationMs: 0, // Persists while backend job active
    exitDurationMs: 300,
    canInterruptWithLowerPriority: false,
  },
  speaking: {
    entryDurationMs: 200,
    activeDurationMs: 0, // Governed by speech utterance
    exitDurationMs: 250,
    canInterruptWithLowerPriority: false,
  },
  documentReceived: {
    entryDurationMs: 250,
    activeDurationMs: 3600,
    exitDurationMs: 300,
    canInterruptWithLowerPriority: false,
  },
  answerReady: {
    entryDurationMs: 250,
    activeDurationMs: 4000,
    exitDurationMs: 300,
    canInterruptWithLowerPriority: false,
  },
  automationActive: {
    entryDurationMs: 300,
    activeDurationMs: 0, // Persists during workflow
    exitDurationMs: 350,
    canInterruptWithLowerPriority: false,
  },
  needsApproval: {
    entryDurationMs: 350,
    activeDurationMs: 0, // Persists until operator signoff
    exitDurationMs: 350,
    canInterruptWithLowerPriority: false,
  },
  error: {
    entryDurationMs: 200,
    activeDurationMs: 5000,
    exitDurationMs: 300,
    canInterruptWithLowerPriority: false,
  },
};

const safeSetTimeout = (fn: () => void, ms: number): ReturnType<typeof setTimeout> => {
  return (typeof window !== 'undefined' ? window.setTimeout : setTimeout)(fn, ms);
};

const safeClearTimeout = (id: ReturnType<typeof setTimeout>): void => {
  (typeof window !== 'undefined' ? window.clearTimeout : clearTimeout)(id);
};

export class CharacterAnimationController {
  private currentState: CharacterState = 'idle';
  private currentPhase: AnimationPhase = 'settled';
  private isPetting = false;
  private tapCount = 0;
  private lastTapTimestamp = 0;
  private lookAt = { x: 0, y: 0 };
  private sequenceToken = 0;
  private activeMotion: QuadrupedMotion | null = null;
  private activeTimers: ReturnType<typeof setTimeout>[] = [];
  private listeners: Set<(state: CharacterGestureState) => void> = new Set();

  public subscribe(listener: (state: CharacterGestureState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): CharacterGestureState {
    return {
      state: this.currentState,
      phase: this.currentPhase,
      isPetting: this.isPetting,
      tapCount: this.tapCount,
      lookAt: { ...this.lookAt },
      transitionSequence: this.sequenceToken,
      activeMotion: this.activeMotion,
    };
  }

  private notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  private clearAllTimers() {
    this.activeTimers.forEach((timerId) => safeClearTimeout(timerId));
    this.activeTimers = [];
  }

  /**
   * Transition to a new character state with safe priority checking
   * and staged Entry -> Active -> Exit lifecycles.
   */
  public transitionTo(
    nextState: CharacterState,
    sourceEvent?: CompanionEventType,
    customDurationMs?: number
  ): boolean {
    const currentPriority = STATE_PRIORITIES[this.currentState];
    const nextPriority = STATE_PRIORITIES[nextState];

    // CRITICAL RULE: If navigation (WORKSPACE_CHANGED) occurs while an active task
    // or safety gate (needsApproval, automationActive, listening, thinking) is running,
    // DO NOT override or clobber the active state!
    if (sourceEvent === 'WORKSPACE_CHANGED' && currentPriority >= 20) {
      return false; // Preserve critical task state
    }

    // Guard high-priority critical states (e.g. needsApproval = 40, automationActive = 30, speaking = 28, listening/thinking = 25, error = 20)
    // against lower-priority ambient events unless explicitly completed
    if (currentPriority > nextPriority) {
      if (currentPriority >= 28) {
        const allowedOverrides: (CompanionEventType | undefined)[] = [
          'AUTOMATION_SUCCEEDED',
          'AUTOMATION_FAILED',
          'ANALYSIS_SUCCEEDED',
          'ANALYSIS_FAILED',
          'DOCUMENT_UPLOAD_SUCCEEDED',
          'DOCUMENT_UPLOAD_FAILED',
          'DOCUMENT_UPLOAD_COMPLETED',
          'ANSWER_READY',
          'TASK_SUCCEEDED',
          'TASK_FAILED',
          'SPEAKING_COMPLETED',
          'VOICE_CANCELLED',
        ];
        if (!sourceEvent || !allowedOverrides.includes(sourceEvent)) {
          return false;
        }
      } else if (currentPriority >= 20 && nextState === 'idle') {
        const allowedIdleOverrides: (CompanionEventType | undefined)[] = [
          'LISTENING_STOPPED',
          'VOICE_CANCELLED',
          'ANALYSIS_SUCCEEDED',
          'TASK_SUCCEEDED',
        ];
        if (!sourceEvent || !allowedIdleOverrides.includes(sourceEvent)) {
          return false;
        }
      }
    }

    // Clear any pending timers from previous state
    this.clearAllTimers();

    const seq = ++this.sequenceToken;
    this.currentState = nextState;
    this.currentPhase = 'entry';
    this.notify();

    const config = STATE_TRANSITION_CONFIGS[nextState];
    const duration = customDurationMs !== undefined ? customDurationMs : config.activeDurationMs;

    // Transition Entry -> Active
    if (config.entryDurationMs > 0) {
      const entryTimer = safeSetTimeout(() => {
        if (this.sequenceToken === seq) {
          this.currentPhase = 'active';
          this.notify();
        }
      }, config.entryDurationMs);
      this.activeTimers.push(entryTimer);
    } else {
      this.currentPhase = 'active';
      this.notify();
    }

    // If state has an active duration, schedule transition Active -> Exit -> Idle
    if (duration > 0) {
      const exitScheduleTimer = safeSetTimeout(() => {
        if (this.sequenceToken === seq) {
          this.currentPhase = 'exit';
          this.notify();

          const settleTimer = safeSetTimeout(() => {
            if (this.sequenceToken === seq) {
              this.currentState = 'idle';
              this.currentPhase = 'settled';
              this.isPetting = false;
              this.notify();
            }
          }, config.exitDurationMs || 250);

          this.activeTimers.push(settleTimer);
        }
      }, config.entryDurationMs + duration);

      this.activeTimers.push(exitScheduleTimer);
    }

    return true;
  }

  /**
   * Anatomical Touch: Target-specific interaction based on raycast body part
   */
  public handlePartTap(
    part: 'head' | 'ears' | 'body' | 'paw' | 'general' = 'general',
    cooldownMs = 600
  ): {
    targetState: CharacterState;
    isSecondTap: boolean;
    triggered: boolean;
    part: 'head' | 'ears' | 'body' | 'paw' | 'general';
  } {
    const now = Date.now();
    const elapsed = now - this.lastTapTimestamp;

    if (elapsed < cooldownMs) {
      return { targetState: this.currentState, isSecondTap: false, triggered: false, part };
    }

    const currentPriority = STATE_PRIORITIES[this.currentState] || 0;
    // Protected high-priority states (speaking, automationActive, needsApproval) cannot be clobbered by ambient touch
    if (currentPriority >= 28) {
      return { targetState: this.currentState, isSecondTap: false, triggered: false, part };
    }

    this.lastTapTimestamp = now;
    const isSecondTap = elapsed < 3000 && this.tapCount > 0;
    this.tapCount = isSecondTap ? this.tapCount + 1 : 1;

    let targetState: CharacterState = 'greeting';
    let duration = 3600;

    if (isSecondTap) {
      targetState = 'happy';
      duration = 3200;
    } else if (part === 'paw') {
      targetState = 'needsApproval'; // Raises front paw to greet / offer paw
      duration = 3200;
    } else if (part === 'ears') {
      targetState = 'listening'; // Swivels ears and tilts head attentively
      duration = 3400;
    } else if (part === 'head') {
      targetState = 'greeting'; // Curious head tilt and eye contact
      duration = 3500;
    } else if (part === 'body') {
      targetState = 'happy'; // Body attention and happy tail wag
      duration = 3200;
    }

    const accepted = this.transitionTo(targetState, 'COMPANION_TOUCHED', duration);
    return { targetState, isSecondTap, triggered: accepted, part };
  }

  /**
   * Direct Touch: Single Tap / Double Tap
   */
  public handleTap(cooldownMs = 800): { isSecondTap: boolean; triggered: boolean } {
    const res = this.handlePartTap('general', cooldownMs);
    return { isSecondTap: res.isSecondTap, triggered: res.triggered };
  }

  /**
   * Direct Touch: Press and Hold (Petting gesture)
   */
  public handlePetStart(): boolean {
    const currentPriority = STATE_PRIORITIES[this.currentState] || 0;
    // Do not allow petting to override safety, approval, speech, or active tasks
    if (currentPriority >= 20) {
      return false;
    }
    this.isPetting = true;
    return this.transitionTo('happy', 'COMPANION_PETTED', 0); // Active continuous petting
  }

  /**
   * Direct Touch: Release after petting
   */
  public handlePetEnd() {
    if (this.isPetting) {
      this.isPetting = false;
      const seq = ++this.sequenceToken;
      this.currentPhase = 'exit';
      this.notify();

      const timer = safeSetTimeout(() => {
        if (this.sequenceToken === seq) {
          this.currentState = 'idle';
          this.currentPhase = 'settled';
          this.notify();
        }
      }, 400);

      this.activeTimers.push(timer);
    }
  }

  /**
   * Pointer Tracking: Subtle visual attention tracking
   */
  public updatePointerLookAt(x: number, y: number) {
    // Clamp to -1 .. 1
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));
    this.lookAt = { x: clampedX, y: clampedY };
    this.notify();
  }

  public resetPointerLookAt() {
    this.lookAt = { x: 0, y: 0 };
    this.notify();
  }

  /**
   * Phase 8: Trigger genuine articulated locomotion and posture clips
   */
  public triggerMotion(motion: QuadrupedMotion): boolean {
    const currentPriority = STATE_PRIORITIES[this.currentState];
    if (currentPriority >= 30 && motion !== 'walkStop' && this.currentState !== 'automationActive') {
      return false; // Protect high-priority safety gates
    }

    this.clearAllTimers();
    const seq = ++this.sequenceToken;
    this.activeMotion = motion;

    if (motion === 'walkStart') {
      this.currentState = 'automationActive';
      this.currentPhase = 'entry';
      this.notify();

      const timer = safeSetTimeout(() => {
        if (this.sequenceToken === seq) {
          this.activeMotion = null;
          this.currentPhase = 'active';
          this.notify();
        }
      }, 1250);
      this.activeTimers.push(timer);
    } else if (motion === 'walkStop') {
      this.currentState = 'idle';
      this.currentPhase = 'exit';
      this.notify();

      const timer = safeSetTimeout(() => {
        if (this.sequenceToken === seq) {
          this.activeMotion = null;
          this.currentPhase = 'settled';
          this.notify();
        }
      }, 1250);
      this.activeTimers.push(timer);
    } else if (motion === 'sit') {
      this.currentPhase = 'active';
      this.notify();
    } else if (motion === 'stand') {
      this.currentPhase = 'exit';
      this.notify();

      const timer = safeSetTimeout(() => {
        if (this.sequenceToken === seq) {
          this.activeMotion = null;
          this.currentState = 'idle';
          this.currentPhase = 'settled';
          this.notify();
        }
      }, 2100);
      this.activeTimers.push(timer);
    } else if (motion === 'turnLeft' || motion === 'turnRight') {
      this.currentPhase = 'active';
      this.notify();

      const timer = safeSetTimeout(() => {
        if (this.sequenceToken === seq) {
          this.activeMotion = null;
          this.currentState = 'idle';
          this.currentPhase = 'settled';
          this.notify();
        }
      }, 2100);
      this.activeTimers.push(timer);
    }

    return true;
  }

  public resetToIdle() {
    this.clearAllTimers();
    this.sequenceToken++;
    this.currentState = 'idle';
    this.currentPhase = 'settled';
    this.isPetting = false;
    this.activeMotion = null;
    this.tapCount = 0;
    this.lookAt = { x: 0, y: 0 };
    this.notify();
  }

  public destroy() {
    this.clearAllTimers();
    this.listeners.clear();
  }
}

export const animationController = new CharacterAnimationController();
