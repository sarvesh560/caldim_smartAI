/**
 * CALDIM SmartAssist Companion — 3D Character & Animation Types
 *
 * Phase 2A: Real 3D Character Foundation
 */

export type CharacterState =
  | 'idle'
  | 'greeting'
  | 'happy'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'documentReceived'
  | 'answerReady'
  | 'automationActive'
  | 'needsApproval'
  | 'error';

export type QuadrupedMotion =
  | 'sit'
  | 'stand'
  | 'turnLeft'
  | 'turnRight'
  | 'walkStart'
  | 'walkStop';

export interface CharacterStateConfig {
  state: CharacterState;
  label: string;
  badge?: string;
  collarLedColor?: string;
  speechText: string;
  suggestedClips: string[];
  moodLightColor: string;
  indicatorColor: string;
}

export const CHARACTER_STATE_CONFIGS: Record<CharacterState, CharacterStateConfig> = {
  idle: {
    state: 'idle',
    label: 'Idle / Standby',
    badge: 'Standby',
    collarLedColor: '#4ED2CB',
    speechText: "Hi! I’m CALDIM Smart. How can I help you today?",
    suggestedClips: ['Idle', 'idle', 'Standby', 'Sit_Idle', 'Robot_Idle', 'Default'],
    moodLightColor: '#4ED2CB', // Cyan glow
    indicatorColor: '#0F6B68',
  },
  greeting: {
    state: 'greeting',
    label: 'Greeting',
    badge: 'Greeting',
    collarLedColor: '#4ED2CB',
    speechText: "Hi! I’m CALDIM Smart. How can I help you today?",
    suggestedClips: ['Greeting', 'greeting', 'Wave', 'Bark', 'Bow', 'Hello'],
    moodLightColor: '#4ED2CB',
    indicatorColor: '#3C918C',
  },
  happy: {
    state: 'happy',
    label: 'Happy / Playful',
    badge: 'Playful',
    collarLedColor: '#10B981',
    speechText: 'Woof! Ready to assist you with engineering data and workflows!',
    suggestedClips: ['Happy', 'happy', 'Tail_Wag', 'Excited', 'Jump', 'Play'],
    moodLightColor: '#10B981',
    indicatorColor: '#10B981',
  },
  listening: {
    state: 'listening',
    label: 'Listening',
    badge: 'Listening',
    collarLedColor: '#38BDF8',
    speechText: 'Listening to your request... (Touch/keyboard input active)',
    suggestedClips: ['Listening', 'listening', 'Perk_Ears', 'Head_Tilt', 'Listen'],
    moodLightColor: '#38BDF8',
    indicatorColor: '#0284C7',
  },
  thinking: {
    state: 'thinking',
    label: 'Thinking / Processing',
    badge: 'Processing',
    collarLedColor: '#818CF8',
    speechText: 'Analyzing CAD specifications and indexing technical documents...',
    suggestedClips: ['Thinking', 'thinking', 'Ponder', 'Search', 'Scan', 'Process'],
    moodLightColor: '#818CF8',
    indicatorColor: '#6366F1',
  },
  speaking: {
    state: 'speaking',
    label: 'Speaking / Responding',
    badge: 'Speaking',
    collarLedColor: '#4ED2CB',
    speechText: 'Here is the technical summary from your engineering documentation.',
    suggestedClips: ['Speaking', 'speaking', 'Talk', 'Bark', 'Vocalize'],
    moodLightColor: '#4ED2CB',
    indicatorColor: '#0F6B68',
  },
  documentReceived: {
    state: 'documentReceived',
    label: 'Document Received',
    badge: 'Staged',
    collarLedColor: '#34D399',
    speechText: 'Technical file staged. Document geometry ready for vector processing.',
    suggestedClips: ['DocumentReceived', 'Document_Received', 'Fetch', 'Sniff', 'Inspect', 'Catch'],
    moodLightColor: '#34D399',
    indicatorColor: '#059669',
  },
  answerReady: {
    state: 'answerReady',
    label: 'Answer Ready',
    badge: 'Result Ready',
    collarLedColor: '#10B981',
    speechText: 'Analysis complete. Tolerance check and GD&T report prepared.',
    suggestedClips: ['AnswerReady', 'Answer_Ready', 'Success', 'Nod', 'Alert', 'Affirm'],
    moodLightColor: '#10B981',
    indicatorColor: '#059669',
  },
  automationActive: {
    state: 'automationActive',
    label: 'Automation Active',
    badge: 'Automating',
    collarLedColor: '#F59E0B',
    speechText: 'Executing industrial workflow pipeline across connected nodes...',
    suggestedClips: ['AutomationActive', 'Automation_Active', 'Trot', 'Run', 'Work', 'Walk'],
    moodLightColor: '#F59E0B',
    indicatorColor: '#D97706',
  },
  needsApproval: {
    state: 'needsApproval',
    label: 'Needs Approval',
    badge: 'Approval Required',
    collarLedColor: '#FBBF24',
    speechText: 'Human-in-the-loop safety gate reached. Awaiting engineer signoff.',
    suggestedClips: ['NeedsApproval', 'Needs_Approval', 'Wait', 'Paw_Raise', 'Inquire', 'Sit_Wait'],
    moodLightColor: '#FBBF24',
    indicatorColor: '#B45309',
  },
  error: {
    state: 'error',
    label: 'Error / Anomaly',
    badge: 'Attention',
    collarLedColor: '#F87171',
    speechText: 'Tolerance conflict or connection anomaly detected in workflow.',
    suggestedClips: ['Error', 'error', 'Shake_Head', 'Confused', 'Warning'],
    moodLightColor: '#F87171',
    indicatorColor: '#DC2626',
  },
};

export type ModelLoadingStatus =
  | 'uninitialized'
  | 'loading'
  | 'loaded'
  | 'unavailable'
  | 'error';

export interface ModelMetadata {
  url: string;
  status: ModelLoadingStatus;
  error?: string;
  clipNames: string[];
  activeClip: string | null;
  meshCount: number;
  skinnedMeshCount: number;
  boneCount: number;
  hasMorphTargets: boolean;
  boundingBox?: {
    x: number;
    y: number;
    z: number;
  };
  availableBones?: string[];
  expression?: string;
  isIdleSchedulerActive?: boolean;
  activeMotion?: QuadrupedMotion | null;
}

/**
 * Technical Specification Requirements for Compatible 3D Model:
 * Documented per Phase 2A guidelines for artists and 3D riggers.
 */
export interface CompatibleRigSpecification {
  fileFormat: 'GLB' | 'GLTF with embedded buffers';
  recommendedFileSize: '< 15 MB for smooth kiosk loading';
  unitScale: 'Meters (1 unit = 1m)';
  boundingDimensions: 'Height: ~0.8m to 1.1m, Length: ~1.0m to 1.3m';
  materialGuidelines: {
    workflow: 'PBR Metallic-Roughness';
    primaryColor: '#FFFFFF (glossy ceramic/titanium chassis)';
    accentColor: '#0F6B68 / #3C918C (CALDIM Teal trim and collar)';
    emissiveColors: '#4ED2CB (Visor eye glow & collar status LED)';
  };
  requiredBones: {
    root: 'Root / Pelvis';
    spine: 'Spine_01, Spine_02, Chest';
    neckHead: 'Neck, Head, Jaw/Snout';
    ears: 'Ear_L, Ear_R (for attentive ear perk gestures)';
    tail: 'Tail_01, Tail_02, Tail_03 (for tail wagging)';
    legs: 'Leg_Upper_[L/R]_[F/B], Leg_Lower_[L/R]_[F/B], Paw_[L/R]_[F/B]';
  };
  animationClips: {
    framerate: '30 or 60 FPS baked';
    looping: 'Idle, Listening, Thinking, AutomationActive should loop cleanly';
    oneShot: 'Greeting, Happy, DocumentReceived, AnswerReady, Error';
  };
}
