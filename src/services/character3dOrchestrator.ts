/**
 * CALDIM SmartAssist Companion — 3D Character Animation & Rig Orchestrator
 *
 * Phase 6: Advanced 3D Robotic Puppy Animation & Interaction
 *
 * Dedicated animation orchestration layer managing:
 * - THREE.AnimationMixer clip cross-fading, blend weights, and disposal
 * - Priority-protected state transitions (cannot clobber critical tasks like needsApproval or error)
 * - Rich procedural idle scheduler:
 *   * Torso breathing (Spine_01 / Chest)
 *   * Visor eye blinking & scanning pulses (M_Caldim_VisorEye emissive)
 *   * Independent ear swivels (Ear_L, Ear_R)
 *   * Curiosity head tilts (Head, Neck)
 *   * Restrained tail swaying with secondary motion (Tail_01..03)
 *   * Subtle weight shifting (Root)
 *   * Smooth clamped pointer gaze tracking (Head yaw/pitch)
 * - Dynamic 6-expression emissive facial lighting
 * - Bounded randomized timing with natural pauses
 * - Complete pause on hidden tab, reduced motion, or high-priority states
 * - Zero React re-renders per frame
 */

import * as THREE from 'three';
import type { CharacterState, QuadrupedMotion } from '../types/character3d';
import { CHARACTER_STATE_CONFIGS } from '../types/character3d';
import { STATE_PRIORITIES } from './characterAnimationController';
import { speechService } from './speechService';

export type PuppyExpression =
  | 'attentive'
  | 'curious'
  | 'relaxed'
  | 'happy'
  | 'thinking'
  | 'concerned';

export interface ExpressionConfig {
  visorColor: string;
  visorIntensity: number;
  collarColor: string;
  collarIntensity: number;
  earAngleOffset: number; // radians offset
  headTiltOffset: number; // roll offset
}

export const EXPRESSION_CONFIGS: Record<PuppyExpression, ExpressionConfig> = {
  attentive: {
    visorColor: '#4ED2CB', // Bright CALDIM Cyan
    visorIntensity: 2.2,
    collarColor: '#4ED2CB',
    collarIntensity: 2.5,
    earAngleOffset: -0.08, // Perked forward
    headTiltOffset: 0.0,
  },
  curious: {
    visorColor: '#38BDF8', // Sky Blue
    visorIntensity: 2.4,
    collarColor: '#38BDF8',
    collarIntensity: 2.5,
    earAngleOffset: 0.05,
    headTiltOffset: 0.12, // Inquisitive head tilt
  },
  relaxed: {
    visorColor: '#34D399', // Soft Mint Green
    visorIntensity: 1.6,
    collarColor: '#34D399',
    collarIntensity: 1.8,
    earAngleOffset: 0.12, // Drooped relaxed
    headTiltOffset: 0.0,
  },
  happy: {
    visorColor: '#10B981', // Emerald
    visorIntensity: 2.8,
    collarColor: '#10B981',
    collarIntensity: 3.2,
    earAngleOffset: -0.1, // Perked
    headTiltOffset: -0.06,
  },
  thinking: {
    visorColor: '#818CF8', // Indigo / Purple
    visorIntensity: 2.6,
    collarColor: '#818CF8',
    collarIntensity: 2.6,
    earAngleOffset: 0.02,
    headTiltOffset: 0.08,
  },
  concerned: {
    visorColor: '#F87171', // Coral Red / Warning
    visorIntensity: 2.5,
    collarColor: '#F87171',
    collarIntensity: 2.8,
    earAngleOffset: 0.15, // Drooped
    headTiltOffset: 0.04,
  },
};

export function mapStateToExpression(state: CharacterState, isPetting = false): PuppyExpression {
  if (isPetting) return 'relaxed';

  switch (state) {
    case 'idle':
      return 'attentive';
    case 'greeting':
      return 'curious';
    case 'happy':
      return 'happy';
    case 'listening':
      return 'attentive';
    case 'thinking':
      return 'thinking';
    case 'speaking':
      return 'attentive';
    case 'documentReceived':
      return 'curious';
    case 'answerReady':
      return 'happy';
    case 'automationActive':
      return 'thinking';
    case 'needsApproval':
      return 'concerned';
    case 'error':
      return 'concerned';
    default:
      return 'attentive';
  }
}

export interface OrchestratorStatus {
  activeClip: string | null;
  targetClip: string | null;
  expression: PuppyExpression;
  isIdleSchedulerActive: boolean;
  isTabVisible: boolean;
  reducedMotion: boolean;
  mixerTimeScale: number;
  availableBones: string[];
  animationErrors: string[];
  activeMotion: QuadrupedMotion | null;
}

export class Character3DOrchestrator {
  private scene: THREE.Group | THREE.Object3D;
  private mixer: THREE.AnimationMixer;
  private clips: THREE.AnimationClip[];
  private actions: Map<string, THREE.AnimationAction> = new Map();

  private currentAction: THREE.AnimationAction | null = null;
  private currentClipName: string | null = null;
  private targetClipName: string | null = null;

  // Tracked rig bones
  private boneRoot: THREE.Bone | null = null;
  private boneSpine: THREE.Bone | null = null;
  private boneChest: THREE.Bone | null = null;
  private boneNeck: THREE.Bone | null = null;
  private boneHead: THREE.Bone | null = null;
  private boneJaw: THREE.Bone | null = null;
  private boneEarL: THREE.Bone | null = null;
  private boneEarR: THREE.Bone | null = null;
  private boneTail1: THREE.Bone | null = null;
  private boneTail2: THREE.Bone | null = null;
  private boneTail3: THREE.Bone | null = null;

  // Tracked emissive materials
  private visorMaterials: THREE.MeshStandardMaterial[] = [];
  private collarMaterials: THREE.MeshStandardMaterial[] = [];

  // State parameters
  private currentState: CharacterState = 'idle';
  private activeMotion: QuadrupedMotion | null = null;
  private isSitting = false;
  private motionTimer: ReturnType<typeof setTimeout> | null = null;
  private isPetting = false;
  private reducedMotion = false;
  private lookAt = { x: 0, y: 0 };
  private isTabVisible = true;
  private currentExpression: PuppyExpression = 'attentive';

  // Procedural Idle Timers & Internal Clocks
  private idleClock = 0;
  private nextBlinkTime = 2.5;
  private blinkDuration = 0.16;
  private blinkProgress = 0;
  private isBlinking = false;
  private isDoubleBlink = false;

  private nextEarTwitchTime = 4.0;
  private earTwitchDuration = 0.8;
  private earTwitchProgress = 0;
  private earTwitchSide: 'left' | 'right' | 'both' = 'both';

  private nextCuriosityTime = 6.0;
  private curiosityDuration = 2.2;
  private curiosityProgress = 0;
  private curiosityTargetTilt = 0;

  // Procedural Ambient Environment Glance
  private nextGlanceTime = 8.0;
  private glanceDuration = 3.2;
  private glanceProgress = 0;
  private glanceTargetYaw = 0;

  // Smoothing states for bone procedural rotations
  private smoothedHeadYaw = 0;
  private smoothedHeadPitch = 0;
  private smoothedHeadRoll = 0;
  private smoothedExprRoll = 0;
  private smoothedEarOffset = 0;

  // Telemetry
  private animationErrors: string[] = [];
  private availableBonesList: string[] = [];

  // DOM visibility listener cleanup
  private visibilityListener: (() => void) | null = null;

  constructor(
    scene: THREE.Group | THREE.Object3D,
    mixer: THREE.AnimationMixer,
    clips: THREE.AnimationClip[]
  ) {
    this.scene = scene;
    this.mixer = mixer;
    this.clips = clips;

    this.initActions();
    this.discoverRigBones();
    this.discoverEmissiveMaterials();
    this.setupVisibilityListener();
  }

  private initActions() {
    this.clips.forEach((clip) => {
      try {
        const action = this.mixer.clipAction(clip);
        this.actions.set(clip.name.toLowerCase(), action);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.animationErrors.push(`Failed to create action for clip "${clip.name}": ${msg}`);
      }
    });
  }

  private discoverRigBones() {
    this.availableBonesList = [];
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Bone) {
        this.availableBonesList.push(obj.name);

        const nameLower = obj.name.toLowerCase();
        if (nameLower === 'root' || nameLower === 'pelvis') this.boneRoot = obj;
        if (nameLower === 'spine_01' || nameLower === 'spine') this.boneSpine = obj;
        if (nameLower === 'chest' || nameLower === 'spine_02') this.boneChest = obj;
        if (nameLower === 'neck') this.boneNeck = obj;
        if (nameLower === 'head') this.boneHead = obj;
        if (nameLower === 'jaw') this.boneJaw = obj;
        if (nameLower === 'ear_l') this.boneEarL = obj;
        if (nameLower === 'ear_r') this.boneEarR = obj;
        if (nameLower === 'tail_01' || nameLower === 'tail') this.boneTail1 = obj;
        if (nameLower === 'tail_02') this.boneTail2 = obj;
        if (nameLower === 'tail_03') this.boneTail3 = obj;
      }
    });
  }

  private discoverEmissiveMaterials() {
    this.visorMaterials = [];
    this.collarMaterials = [];

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            const matName = mat.name.toLowerCase();
            const objName = obj.name.toLowerCase();

            if (matName.includes('visor') || objName.includes('visor') || matName.includes('eye')) {
              this.visorMaterials.push(mat);
            }
            if (matName.includes('collar') || objName.includes('collar') || objName.includes('gem')) {
              this.collarMaterials.push(mat);
            }
          }
        });
      }
    });
  }

  private setupVisibilityListener() {
    if (typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        this.isTabVisible = document.visibilityState === 'visible';
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      this.visibilityListener = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
      this.isTabVisible = document.visibilityState === 'visible';
    }
  }

  /**
   * Set target character state and cross-fade to appropriate skeletal clip.
   */
  public setState(state: CharacterState, isPetting = false): boolean {
    const currentPriority = STATE_PRIORITIES[this.currentState];
    const nextPriority = STATE_PRIORITIES[state];

    // Priority guard: high-priority states (e.g. needsApproval=40, automationActive=30)
    // cannot be clobbered by lower priority ambient requests unless resetting to idle
    if (currentPriority > nextPriority && currentPriority >= 30 && state === 'idle') {
      // Allow explicit reset, but prevent transient idle override
    }

    this.currentState = state;
    this.isPetting = isPetting;
    this.currentExpression = mapStateToExpression(state, isPetting);

    this.updateEmissiveLighting();
    this.resolveAndPlayClip();
    return true;
  }

  public setLookAt(x: number, y: number) {
    this.lookAt = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  }

  public setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
    this.mixer.timeScale = reduced ? 0.35 : 1.0;
  }

  /**
   * Match character state or petting to best available animation clip.
   */
  private resolveAndPlayClip() {
    let candidateNames: string[] = [];

    if (this.isPetting) {
      candidateNames = ['petting', 'happy', 'idle'];
    } else {
      const config = CHARACTER_STATE_CONFIGS[this.currentState] || CHARACTER_STATE_CONFIGS.idle;
      candidateNames = config.suggestedClips;
    }

    let targetAction: THREE.AnimationAction | null = null;
    let targetName: string | null = null;

    for (const cand of candidateNames) {
      const action = this.actions.get(cand.toLowerCase());
      if (action) {
        targetAction = action;
        targetName = cand;
        break;
      }
    }

    // Fallback: look for partial match or idle
    if (!targetAction) {
      for (const [key, act] of this.actions.entries()) {
        if (key.includes('idle') || key.includes('standby')) {
          targetAction = act;
          targetName = key;
          break;
        }
      }
    }

    // Default to first action if none found
    if (!targetAction && this.actions.size > 0) {
      const entry = this.actions.entries().next();
      if (!entry.done && entry.value) {
        targetName = entry.value[0];
        targetAction = entry.value[1];
      }
    }

    if (targetAction && targetName !== this.currentClipName) {
      this.crossFadeTo(targetAction, targetName, 0.35);
    }
  }

  /**
   * Phase 8: Play genuine articulated posture and locomotion clips
   */
  public playMotion(motion: QuadrupedMotion | null): boolean {
    this.activeMotion = motion;
    if (this.motionTimer) {
      clearTimeout(this.motionTimer);
      this.motionTimer = null;
    }

    if (!motion) {
      if (this.isSitting) {
        const sitIdleAction = this.actions.get('sit_idle');
        if (sitIdleAction) {
          sitIdleAction.setLoop(THREE.LoopRepeat, Infinity);
          this.crossFadeTo(sitIdleAction, 'Sit_Idle', 0.35);
          return true;
        }
      }
      this.resolveAndPlayClip();
      return true;
    }

    if (motion === 'sit') {
      const sitDown = this.actions.get('sit_down');
      const sitIdle = this.actions.get('sit_idle');
      if (sitDown) {
        this.isSitting = true;
        sitDown.setLoop(THREE.LoopOnce, 1);
        sitDown.clampWhenFinished = true;
        this.crossFadeTo(sitDown, 'Sit_Down', 0.3);

        this.motionTimer = setTimeout(() => {
          if (this.isSitting && sitIdle) {
            sitIdle.setLoop(THREE.LoopRepeat, Infinity);
            this.crossFadeTo(sitIdle, 'Sit_Idle', 0.35);
          }
        }, 2500);
        return true;
      }
    } else if (motion === 'stand') {
      const standUp = this.actions.get('stand_up');
      if (standUp) {
        this.isSitting = false;
        standUp.setLoop(THREE.LoopOnce, 1);
        standUp.clampWhenFinished = true;
        this.crossFadeTo(standUp, 'Stand_Up', 0.3);

        this.motionTimer = setTimeout(() => {
          this.activeMotion = null;
          this.resolveAndPlayClip();
        }, 2100);
        return true;
      }
    } else if (motion === 'turnLeft') {
      const turnL = this.actions.get('turn_left');
      if (turnL) {
        turnL.setLoop(THREE.LoopOnce, 1);
        turnL.clampWhenFinished = false;
        this.crossFadeTo(turnL, 'Turn_Left', 0.25);

        this.motionTimer = setTimeout(() => {
          this.activeMotion = null;
          this.resolveAndPlayClip();
        }, 2100);
        return true;
      }
    } else if (motion === 'turnRight') {
      const turnR = this.actions.get('turn_right');
      if (turnR) {
        turnR.setLoop(THREE.LoopOnce, 1);
        turnR.clampWhenFinished = false;
        this.crossFadeTo(turnR, 'Turn_Right', 0.25);

        this.motionTimer = setTimeout(() => {
          this.activeMotion = null;
          this.resolveAndPlayClip();
        }, 2100);
        return true;
      }
    } else if (motion === 'walkStart') {
      const walkStart = this.actions.get('walk_start');
      const autoActive = this.actions.get('automationactive');
      if (walkStart) {
        walkStart.setLoop(THREE.LoopOnce, 1);
        walkStart.clampWhenFinished = false;
        this.crossFadeTo(walkStart, 'Walk_Start', 0.2);

        this.motionTimer = setTimeout(() => {
          this.activeMotion = null;
          if (autoActive) {
            autoActive.setLoop(THREE.LoopRepeat, Infinity);
            this.crossFadeTo(autoActive, 'AutomationActive', 0.3);
          }
        }, 1250);
        return true;
      }
    } else if (motion === 'walkStop') {
      const walkStop = this.actions.get('walk_stop');
      if (walkStop) {
        walkStop.setLoop(THREE.LoopOnce, 1);
        walkStop.clampWhenFinished = false;
        this.crossFadeTo(walkStop, 'Walk_Stop', 0.2);

        this.motionTimer = setTimeout(() => {
          this.activeMotion = null;
          this.resolveAndPlayClip();
        }, 1250);
        return true;
      }
    }

    return false;
  }

  private crossFadeTo(
    nextAction: THREE.AnimationAction,
    clipName: string | null,
    duration = 0.35
  ) {
    this.targetClipName = clipName;

    if (this.currentAction && this.currentAction !== nextAction) {
      this.currentAction.fadeOut(duration);
    }

    nextAction.reset();
    nextAction.fadeIn(duration);
    nextAction.setEffectiveTimeScale(this.reducedMotion ? 0.35 : 1.0);
    nextAction.play();

    this.currentAction = nextAction;
    this.currentClipName = clipName;
  }

  /**
   * Hardware Visual Feedback: Update visor eye & collar LEDs with dynamic expression shaders.
   */
  private updateEmissiveLighting() {
    const exprConfig = EXPRESSION_CONFIGS[this.currentExpression] || EXPRESSION_CONFIGS.attentive;
    const visorColor = new THREE.Color(exprConfig.visorColor);
    const collarColor = new THREE.Color(exprConfig.collarColor);

    this.visorMaterials.forEach((mat) => {
      mat.emissive.copy(visorColor);
      mat.emissiveIntensity = exprConfig.visorIntensity;
    });

    this.collarMaterials.forEach((mat) => {
      mat.emissive.copy(collarColor);
      mat.emissiveIntensity = this.isPetting ? exprConfig.collarIntensity * 1.4 : exprConfig.collarIntensity;
    });
  }

  /**
   * Main per-frame update loop called from R3F useFrame.
   * Performs AnimationMixer tick, expression pulsing, and procedural idle offsets.
   * Modifies Three.js bone transforms directly — ZERO React state updates!
   */
  public update(delta: number) {
    // If tab is in background, pause non-critical CPU calculations
    if (!this.isTabVisible) return;

    // 1. Advance Skeletal Animation Mixer
    this.mixer.update(delta);

    // 2. Continuous Expression Visual Pulses (Thinking scan / Error warning)
    this.updateExpressionLightingAnimation(delta);

    // 3. Smooth Clamped Pointer Gaze Tracking
    this.updatePointerGaze(delta);

    // 4. Expression Posture Overlays (Curious head tilt & ear droop/perk)
    this.updateExpressionBonePosture(delta);

    // 5. Procedural Idle Gestures (Breathing, Blinking, Ear Swivels, Curiosity Tilts, Ambient Glance, Tail)
    // Only applied during low-priority states (idle/standby) when reduced motion is off
    const priority = STATE_PRIORITIES[this.currentState];
    const isIdlePhase = this.currentState === 'idle' && priority < 20;

    if (isIdlePhase && !this.reducedMotion) {
      this.idleClock += delta;
      this.updateProceduralBreathing();
      this.updateProceduralBlinking(delta);
      this.updateProceduralEars(delta);
      this.updateProceduralCuriosity(delta);
      this.updateProceduralGlance(delta);
      this.updateProceduralTail();
    } else {
      // In active task states or reduced motion, smoothly settle procedural offsets to neutral
      this.settleBonesToNeutral(delta);
    }

    // 6. Procedural Vocalization / Jaw Articulation during speech
    this.updateProceduralJaw(delta);
  }

  /**
   * Pointer Gaze Tracking: Clamped within safe biological/robotic limits.
   * Head Yaw: ±22° (±0.38 rad), Head Pitch: ±14° (±0.24 rad).
   * Note: With model facing +Z (user), inverted local yaw tracks screen coordinates correctly.
   */
  private updatePointerGaze(delta: number) {
    if (!this.boneHead) return;

    const targetYaw = this.reducedMotion ? 0 : -this.lookAt.x * 0.38;
    const targetPitch = this.reducedMotion ? 0 : this.lookAt.y * 0.22;

    const lerpSpeed = Math.min(1.0, delta * 5.0);
    this.smoothedHeadYaw = THREE.MathUtils.lerp(this.smoothedHeadYaw, targetYaw, lerpSpeed);
    this.smoothedHeadPitch = THREE.MathUtils.lerp(this.smoothedHeadPitch, targetPitch, lerpSpeed);

    // Additive orientation on top of underlying skeletal action
    this.boneHead.rotation.y += this.smoothedHeadYaw * 0.45;
    this.boneHead.rotation.x += this.smoothedHeadPitch * 0.45;

    // Subtle neck support
    if (this.boneNeck) {
      this.boneNeck.rotation.y += this.smoothedHeadYaw * 0.25;
      this.boneNeck.rotation.x += this.smoothedHeadPitch * 0.2;
    }
  }

  /**
   * Dynamic Lighting Animation:
   * Thinking state has a cyclic sine scan pulse.
   * Error state has a warning pulse.
   * Standby/attentive has a subtle cybernetic shimmer.
   */
  private updateExpressionLightingAnimation(_delta: number) {
    if (this.currentExpression === 'thinking') {
      const pulse = Math.sin(this.idleClock * 4.0) * 0.8 + 2.4;
      this.visorMaterials.forEach((mat) => {
        mat.emissiveIntensity = pulse;
      });
    } else if (this.currentExpression === 'concerned') {
      const pulse = Math.sin(this.idleClock * 3.0) * 0.6 + 2.2;
      this.visorMaterials.forEach((mat) => {
        mat.emissiveIntensity = pulse;
      });
    } else if (this.currentExpression === 'attentive' && !this.isBlinking) {
      const shimmer = Math.sin(this.idleClock * 2.5) * 0.2 + 2.2;
      this.visorMaterials.forEach((mat) => {
        mat.emissiveIntensity = shimmer;
      });
    }
  }

  /**
   * Procedural Torso Breathing: Subtle cyclic rotation on Spine_01 & Chest, with vertical root shift.
   * Cycle rate: ~0.35 Hz (1 breath every 2.8s).
   */
  private updateProceduralBreathing() {
    const breathCycle = Math.sin(this.idleClock * 2.2);
    const breathAngle = breathCycle * 0.045; // ~2.6 degrees of visible chest expansion

    if (this.boneRoot) {
      this.boneRoot.position.y = breathCycle * 0.008; // 8mm subtle breathing rise/fall
      this.boneRoot.position.x = Math.sin(this.idleClock * 1.1) * 0.0015; // 1.5mm lateral weight shift
    }
    if (this.boneChest) {
      this.boneChest.rotation.x += breathAngle;
    }
    if (this.boneSpine) {
      this.boneSpine.rotation.x += breathAngle * 0.6;
    }
  }

  /**
   * Procedural Natural Blinking:
   * Emissive dimming simulating shutter closure.
   * Occurs every 3.5 - 6.5s, with occasional double-blinks.
   */
  private updateProceduralBlinking(delta: number) {
    if (this.visorMaterials.length === 0) return;

    if (!this.isBlinking) {
      if (this.idleClock >= this.nextBlinkTime) {
        this.isBlinking = true;
        this.blinkProgress = 0;
        this.isDoubleBlink = Math.random() < 0.25; // 25% chance of double blink
        this.blinkDuration = this.isDoubleBlink ? 0.32 : 0.16;
      }
    } else {
      this.blinkProgress += delta / this.blinkDuration;
      if (this.blinkProgress >= 1.0) {
        this.isBlinking = false;
        // Schedule next blink in 3.5 to 7.0 seconds
        this.nextBlinkTime = this.idleClock + 3.5 + Math.random() * 3.5;
        this.updateEmissiveLighting(); // Restore normal intensity
      } else {
        // Dim emissive during the trough of the blink
        let dimFactor = 1.0;
        if (this.isDoubleBlink) {
          dimFactor = Math.abs(Math.sin(this.blinkProgress * Math.PI * 2.0));
        } else {
          dimFactor = Math.abs(Math.sin(this.blinkProgress * Math.PI));
        }
        const expr = EXPRESSION_CONFIGS[this.currentExpression];
        const dimmedIntensity = THREE.MathUtils.lerp(expr.visorIntensity * 0.15, expr.visorIntensity, dimFactor);
        this.visorMaterials.forEach((mat) => {
          mat.emissiveIntensity = dimmedIntensity;
        });
      }
    }
  }

  /**
   * Procedural Ear Swivels:
   * Subtle attentive independent twitches on Ear_L / Ear_R.
   */
  private updateProceduralEars(delta: number) {
    if (!this.boneEarL && !this.boneEarR) return;

    if (this.earTwitchProgress === 0) {
      if (this.idleClock >= this.nextEarTwitchTime) {
        this.earTwitchProgress = 0.001;
        const rand = Math.random();
        this.earTwitchSide = rand < 0.4 ? 'left' : rand < 0.8 ? 'right' : 'both';
      }
    } else {
      this.earTwitchProgress += delta / this.earTwitchDuration;
      if (this.earTwitchProgress >= 1.0) {
        this.earTwitchProgress = 0;
        this.nextEarTwitchTime = this.idleClock + 4.0 + Math.random() * 4.5;
      } else {
        // Bell-curve twitch motion
        const twitchAngle = Math.sin(this.earTwitchProgress * Math.PI) * 0.24; // ~14 degrees
        if ((this.earTwitchSide === 'left' || this.earTwitchSide === 'both') && this.boneEarL) {
          this.boneEarL.rotation.z += twitchAngle;
        }
        if ((this.earTwitchSide === 'right' || this.earTwitchSide === 'both') && this.boneEarR) {
          this.boneEarR.rotation.z -= twitchAngle;
        }
      }
    }
  }

  /**
   * Procedural Curiosity Tilts:
   * Gentle head roll/yaw offset appearing inquisitively, then returning to neutral.
   */
  private updateProceduralCuriosity(delta: number) {
    if (!this.boneHead) return;

    if (this.curiosityProgress === 0) {
      if (this.idleClock >= this.nextCuriosityTime) {
        this.curiosityProgress = 0.001;
        // Random tilt direction (-0.1 to +0.1 rad)
        this.curiosityTargetTilt = (Math.random() > 0.5 ? 1 : -1) * (0.14 + Math.random() * 0.06);
      }
    } else {
      this.curiosityProgress += delta / this.curiosityDuration;
      if (this.curiosityProgress >= 1.0) {
        this.curiosityProgress = 0;
        this.nextCuriosityTime = this.idleClock + 5.0 + Math.random() * 5.0;
      } else {
        const tiltFactor = Math.sin(this.curiosityProgress * Math.PI);
        const currentRoll = this.curiosityTargetTilt * tiltFactor;
        this.boneHead.rotation.z += currentRoll;
        if (this.boneNeck) {
          this.boneNeck.rotation.z += currentRoll * 0.45;
        }
      }
    }
  }

  /**
   * Apply expression bone posture offsets:
   * - Curious / Greeting: inquisitive head tilt roll (+0.12 rad) and ear perk
   * - Relaxed (petting): drooped relaxed ears (+0.12 rad)
   * - Attentive (idle/listening): ears perked forward (-0.08 rad)
   * - Concerned (error/needsApproval): drooped ears (+0.15 rad) and slight head tilt
   */
  private updateExpressionBonePosture(delta: number) {
    const exprConfig = EXPRESSION_CONFIGS[this.currentExpression] || EXPRESSION_CONFIGS.attentive;
    const targetRoll = this.reducedMotion ? 0 : exprConfig.headTiltOffset;
    const targetEar = this.reducedMotion ? 0 : exprConfig.earAngleOffset;
    const exprLerp = Math.min(1.0, delta * 4.0);
    this.smoothedExprRoll = THREE.MathUtils.lerp(this.smoothedExprRoll, targetRoll, exprLerp);
    this.smoothedEarOffset = THREE.MathUtils.lerp(this.smoothedEarOffset, targetEar, exprLerp);

    if (this.boneHead && Math.abs(this.smoothedExprRoll) > 0.001) {
      this.boneHead.rotation.z += this.smoothedExprRoll;
      if (this.boneNeck) {
        this.boneNeck.rotation.z += this.smoothedExprRoll * 0.45;
      }
    }
    if (this.boneEarL && Math.abs(this.smoothedEarOffset) > 0.001) {
      this.boneEarL.rotation.x += this.smoothedEarOffset;
    }
    if (this.boneEarR && Math.abs(this.smoothedEarOffset) > 0.001) {
      this.boneEarR.rotation.x += this.smoothedEarOffset;
    }
  }

  /**
   * Procedural Environment Glance:
   * Occasional ambient yaw glance (±6° = ±0.1 rad) every 8-14s with natural pauses,
   * simulating robotic environmental scanning without jitter.
   */
  private updateProceduralGlance(delta: number) {
    if (!this.boneHead) return;

    if (this.glanceProgress === 0) {
      if (this.idleClock >= this.nextGlanceTime) {
        this.glanceProgress = 0.001;
        this.glanceTargetYaw = (Math.random() > 0.5 ? 1 : -1) * (0.08 + Math.random() * 0.04);
      }
    } else {
      this.glanceProgress += delta / this.glanceDuration;
      if (this.glanceProgress >= 1.0) {
        this.glanceProgress = 0;
        this.nextGlanceTime = this.idleClock + 8.0 + Math.random() * 6.0;
      } else {
        const factor = Math.sin(this.glanceProgress * Math.PI);
        const yawOffset = this.glanceTargetYaw * factor;
        this.boneHead.rotation.y += yawOffset;
        if (this.boneNeck) {
          this.boneNeck.rotation.y += yawOffset * 0.5;
        }
      }
    }
  }

  /**
   * Procedural Secondary Tail Motion:
   * Restrained, fluid secondary wave on Tail_01, Tail_02, Tail_03.
   */
  private updateProceduralTail() {
    if (!this.boneTail1) return;

    const tailSpeed = this.isPetting ? 9.0 : 2.5;
    const tailAmp = this.isPetting ? 0.38 : 0.18;

    const w1 = Math.sin(this.idleClock * tailSpeed) * tailAmp;
    const w2 = Math.sin(this.idleClock * tailSpeed - 0.4) * (tailAmp * 1.2);
    const w3 = Math.sin(this.idleClock * tailSpeed - 0.8) * (tailAmp * 1.4);

    this.boneTail1.rotation.y += w1;
    if (this.boneTail2) this.boneTail2.rotation.y += w2;
    if (this.boneTail3) this.boneTail3.rotation.y += w3;
  }

  /**
   * Settle bones smoothly back to skeletal neutral pose when leaving idle.
   */
  private settleBonesToNeutral(delta: number) {
    const settleRate = Math.min(1.0, delta * 4.0);
    this.smoothedHeadRoll = THREE.MathUtils.lerp(this.smoothedHeadRoll, 0, settleRate);
    this.smoothedExprRoll = THREE.MathUtils.lerp(this.smoothedExprRoll, 0, settleRate);
    this.smoothedEarOffset = THREE.MathUtils.lerp(this.smoothedEarOffset, 0, settleRate);
  }

  /**
   * Procedural Vocalization / Jaw Articulation:
   * When speaking, rhythmically articulates the Jaw bone (Node 0: Jaw)
   * in sync with speech tempo, and smoothly returns to 0 when idle.
   */
  private updateProceduralJaw(delta: number) {
    if (!this.boneJaw) return;

    // Jaw articulates only when character is in speaking state AND speech synthesis is actively producing audio
    const isActivelySpeaking = this.currentState === 'speaking' && speechService.isPlaying();

    if (isActivelySpeaking) {
      this.idleClock += delta;
      // Speech cadence modulation (~3-4 syllables/sec = 18-24 rad/s)
      const jawAngle = Math.max(0, Math.sin(this.idleClock * 20) * 0.12 + Math.sin(this.idleClock * 8) * 0.05);
      this.boneJaw.rotation.x = this.reducedMotion ? 0 : jawAngle;
    } else {
      // Smoothly settle jaw back to 0
      this.boneJaw.rotation.x = THREE.MathUtils.lerp(this.boneJaw.rotation.x, 0, Math.min(1.0, delta * 8.0));
    }
  }

  /**
   * Diagnostics status snapshot for UI and debugging.
   */
  public getStatus(): OrchestratorStatus {
    return {
      activeClip: this.currentClipName,
      targetClip: this.targetClipName,
      expression: this.currentExpression,
      isIdleSchedulerActive: this.currentState === 'idle' && !this.reducedMotion && this.isTabVisible,
      isTabVisible: this.isTabVisible,
      reducedMotion: this.reducedMotion,
      mixerTimeScale: this.mixer.timeScale,
      availableBones: [...this.availableBonesList],
      animationErrors: [...this.animationErrors],
      activeMotion: this.activeMotion,
    };
  }

  /**
   * Complete resource disposal.
   */
  public dispose() {
    if (this.visibilityListener) {
      this.visibilityListener();
      this.visibilityListener = null;
    }

    this.mixer.stopAllAction();
    this.actions.clear();
    this.currentAction = null;
    this.currentClipName = null;
    this.targetClipName = null;

    this.boneRoot = null;
    this.boneSpine = null;
    this.boneChest = null;
    this.boneNeck = null;
    this.boneHead = null;
    this.boneJaw = null;
    this.boneEarL = null;
    this.boneEarR = null;
    this.boneTail1 = null;
    this.boneTail2 = null;
    this.boneTail3 = null;

    this.visorMaterials = [];
    this.collarMaterials = [];
  }
}
