/**
 * CALDIM SmartAssist Companion — Type Definitions
 */

export * from './character3d';
export * from './companionEvents';

export type WorkspaceId =
  | 'home'
  | 'documents'
  | 'drawing'
  | 'use-case'
  | 'automation'
  | 'products';

export type CompanionReactionState =
  | 'idle'
  | 'greeting'
  | 'listening'
  | 'analyzing'
  | 'playful'
  | 'focused';

export interface CapabilityItem {
  id: WorkspaceId;
  title: string;
  shortDesc: string;
  badge: string;
  iconName: 'FileText' | 'Compass' | 'Sparkles' | 'Workflow' | 'Layers';
  accentColor: string;
  readyStatus: 'Phase 1 Ready' | 'Preview' | 'Architecture Ready';
}

export interface StagedFile {
  id: string;
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  extension: string;
  lastModified: number;
  status: 'staged' | 'ready_for_pipeline' | 'preview_only';
  previewUrl?: string;
}

export interface DrawingLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  elementCount: number;
  description: string;
}

export interface AIUseCase {
  id: string;
  title: string;
  sector: 'Manufacturing' | 'Aerospace' | 'Energy' | 'Automotive' | 'Robotics';
  problem: string;
  solution: string;
  estimatedRoi: string;
  complexity: 'Low' | 'Medium' | 'High';
  dataRequired: string[];
}

export interface AutomationWorkflow {
  id: string;
  title: string;
  trigger: string;
  actions: string[];
  requiresApproval: boolean;
  approvalRole: string;
  estimatedTimeSaved: string;
  status: 'Ready to Configure' | 'Requires Integration' | 'Template';
}

export interface CaldimProduct {
  id: string;
  name: string;
  pillar: 'Core AI' | 'Vision & CAD' | 'Knowledge & Docs' | 'Edge & Ops';
  tagline: string;
  description: string;
  keyFeatures: string[];
  deploymentOptions: string[];
  status: 'Active Suite' | 'Enterprise Ready' | 'Preview';
}

export interface CompanionNotification {
  id: string;
  type: 'info' | 'warning' | 'phase-notice' | 'file-staged';
  title: string;
  message: string;
  timestamp: number;
}
