/**
 * CALDIM SmartAssist Companion — API Client & Integration Service
 *
 * Architecture Note:
 * In Phase 1 Foundation, this service acts as the typed gateway for UI staging
 * and readiness validation. Real backend inference, RAG embeddings, and CAD
 * parsing engines will connect to these contracts in Phase 2.
 */

import type { StagedFile } from '../types';

export interface SystemStatus {
  phase: 'Phase 1: Premium UI Foundation';
  backendConnected: false;
  voiceServiceConfigured: false;
  r3fCanvasMounted: false;
  stageReady: true;
  kioskTouchscreenOptimized: true;
  targetServices: {
    ragInferenceUrl: string;
    cadVisionUrl: string;
    speechEngineUrl: string;
    workflowEngineUrl: string;
  };
}

function getEnvVar(key: string, fallback: string): string {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
      return String(import.meta.env[key]);
    }
  } catch {
    // Ignore in non-vite / testing environments
  }
  return fallback;
}

const rawBaseUrl = getEnvVar('VITE_API_BASE_URL', '').trim();
const rawTimeout = Number(getEnvVar('VITE_API_TIMEOUT_MS', '15000')) || 15000;
const rawKioskId = getEnvVar('VITE_KIOSK_ID', 'CALDIM-EXHIBIT-KIOSK-01').trim();

export const API_CONFIG = {
  version: '1.0.0-phase10',
  baseUrl: rawBaseUrl,
  timeoutMs: rawTimeout,
  kioskId: rawKioskId,
  endpoints: {
    query: '/api/v1/companion/query',
    documents: '/api/v1/documents/process',
    cadVision: '/api/v1/cad/analyze',
    useCases: '/api/v1/usecases/assess',
    workflows: '/api/v1/workflows/dispatch',
    voice: '/api/v1/voice/stream',
  },
};

/**
 * Resolves an API endpoint path against the configured base URL.
 */
export function resolveApiUrl(path: string): string {
  const base = API_CONFIG.baseUrl;
  if (base) {
    return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }
  return path;
}

/**
 * Format raw file size into human-readable string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Process a user-selected file into a structured StagedFile object
 * without pretending to run AI inference.
 */
export function stageUploadedFile(file: File): StagedFile {
  const extension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  
  return {
    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    size: file.size,
    formattedSize: formatBytes(file.size),
    type: file.type || `application/${extension.toLowerCase()}`,
    extension,
    lastModified: file.lastModified,
    status: 'staged',
  };
}

/**
 * Supported file types and their categories
 */
export const SUPPORTED_EXTENSIONS = {
  documents: ['.PDF', '.DOCX', '.TXT', '.MD', '.CSV', '.XLSX'],
  drawings: ['.DWG', '.DXF', '.STEP', '.STP', '.PDF', '.SVG', '.PNG'],
};

/**
 * Validate query submission
 */
export function validateQueryInput(query: string): { isValid: boolean; error?: string } {
  const trimmed = query.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Please enter a question or topic before submitting.' };
  }
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Please enter at least 3 characters for an effective query.' };
  }
  return { isValid: true };
}

/**
 * System telemetry report for kiosk status indicator
 */
export function getKioskTelemetry(): SystemStatus {
  return {
    phase: 'Phase 1: Premium UI Foundation',
    backendConnected: false,
    voiceServiceConfigured: false,
    r3fCanvasMounted: false,
    stageReady: true,
    kioskTouchscreenOptimized: true,
    targetServices: {
      ragInferenceUrl: 'https://api.caldim.ai/v1/smartassist/inference (Phase 2)',
      cadVisionUrl: 'https://api.caldim.ai/v1/smartassist/cadvision (Phase 2)',
      speechEngineUrl: 'https://api.caldim.ai/v1/voice/stream (Phase 2)',
      workflowEngineUrl: 'https://api.caldim.ai/v1/workflows (Phase 2)',
    },
  };
}
