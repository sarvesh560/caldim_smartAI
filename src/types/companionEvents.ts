/**
 * CALDIM SmartAssist Companion — Event System Types
 *
 * Phase 3: Persistent Playful Companion Experience
 */

import type { WorkspaceId } from './index';
import type { CharacterState } from './character3d';

export type CompanionEventType =
  | 'COMPANION_TOUCHED'
  | 'COMPANION_PETTED'
  | 'PART_TOUCHED'
  | 'MICROPHONE_ACTIVATED'
  | 'LISTENING_STARTED'
  | 'LISTENING_STOPPED'
  | 'VOICE_RECOGNITION_RESULT'
  | 'VOICE_PERMISSION_DENIED'
  | 'VOICE_CANCELLED'
  | 'SPEAKING_STARTED'
  | 'SPEAKING_COMPLETED'
  | 'DOCUMENT_SELECTED'
  | 'DOCUMENT_UPLOAD_STARTED'
  | 'DOCUMENT_UPLOAD_SUCCEEDED'
  | 'DOCUMENT_UPLOAD_COMPLETED'
  | 'DOCUMENT_UPLOAD_FAILED'
  | 'ANALYSIS_STARTED'
  | 'ANALYSIS_SUCCEEDED'
  | 'ANSWER_READY'
  | 'ANALYSIS_FAILED'
  | 'AUTOMATION_STARTED'
  | 'APPROVAL_REQUIRED'
  | 'AUTOMATION_SUCCEEDED'
  | 'AUTOMATION_FAILED'
  | 'TASK_SUCCEEDED'
  | 'TASK_FAILED'
  | 'WORKSPACE_CHANGED';

export interface CompanionEventPayload {
  workspaceId?: WorkspaceId;
  fileName?: string;
  fileSize?: string;
  query?: string;
  transcript?: string;
  isFinal?: boolean;
  part?: 'head' | 'ears' | 'body' | 'paw' | 'general';
  taskName?: string;
  workflowName?: string;
  useCaseTitle?: string;
  approvalRole?: string;
  role?: string;
  error?: string;
  errorMessage?: string;
  hasUserGesture?: boolean;
}

export interface CompanionEvent {
  type: CompanionEventType;
  payload?: CompanionEventPayload;
}

export interface ReactionDefinition {
  state: CharacterState;
  caption: string;
  speechText?: string;
  durationMs?: number; 
  speakAudio?: boolean;
}
