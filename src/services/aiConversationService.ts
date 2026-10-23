/**
 * CALDIM SmartAssist Companion — AI Conversation Service
 *
 * Phase 10: Production AI Backend Integration & Voice Conversation
 *
 * Requirements:
 * - Centralized API endpoint registry with configurable base URL (resolveApiUrl)
 * - Strict schema validation and runtime sanitization (strips untrusted HTML/scripts)
 * - Request timeout handling (default 15s configurable via VITE_API_TIMEOUT_MS)
 * - Typed status discrimination (network_offline, timeout, unauthorized, rate_limited, server_error, malformed_response, cancelled)
 * - Honest error reporting without fabricating false AI answers
 * - Clean cancellation support via AbortController
 * - Preserves telemetry diagnostics for live kiosk auditing
 */

import { API_CONFIG, resolveApiUrl } from './apiClient';

export interface AIQueryRequest {
  query: string;
  workspaceId?: string;
  stagedFiles?: { name: string; size: number }[];
}

export type QueryErrorType =
  | 'network_offline'
  | 'timeout'
  | 'unauthorized'
  | 'rate_limited'
  | 'server_error'
  | 'malformed_response'
  | 'cancelled';

export interface AIQueryResponse {
  answer: string;
  caption: string;
  source: 'live_backend' | 'offline_kiosk_fallback';
  isSuccess: boolean;
  endpointUrl: string;
  statusCode?: number;
  errorType?: QueryErrorType;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
  sources?: Array<{ title?: string; documentId?: string; pageNumber?: number }>;
}

export interface ApiDiagnosticsInfo {
  endpointUrl: string;
  resolvedUrl: string;
  lastRequestTimestamp?: string;
  lastHttpStatus?: number;
  lastLatencyMs?: number;
  lastErrorType?: QueryErrorType;
  lastResponseValid?: boolean;
  lastQueryText?: string;
}

export interface IAIConversationService {
  sendQuery(request: AIQueryRequest): Promise<AIQueryResponse>;
  cancel(): void;
  getDiagnostics(): ApiDiagnosticsInfo;
  probeEndpoint(): Promise<{ reachable: boolean; status?: number; error?: string }>;
}

/**
 * Strips HTML tags and normalizes entities so untrusted HTML cannot be injected or rendered.
 */
export function sanitizePlainText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags and content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Strip style tags and content
    .replace(/<[^>]*>/g, '') // Strip remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates and normalizes incoming response payload at runtime.
 */
export function validateAndNormalizeBackendResponse(raw: unknown): {
  isValid: boolean;
  answer?: string;
  caption?: string;
  sources?: Array<{ title?: string; documentId?: string; pageNumber?: number }>;
  metadata?: Record<string, unknown>;
  error?: string;
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { isValid: false, error: 'Response body is not a JSON object' };
  }

  const obj = raw as Record<string, unknown>;
  const rawText = obj.answer ?? obj.message ?? obj.response ?? obj.text ?? obj.output;

  if (typeof rawText !== 'string' || !rawText.trim()) {
    return { isValid: false, error: 'Response missing recognizable text answer field' };
  }

  const answer = sanitizePlainText(rawText);
  const rawCaption = typeof obj.caption === 'string' ? obj.caption : undefined;
  const caption = rawCaption ? sanitizePlainText(rawCaption) : answer.slice(0, 110) + (answer.length > 110 ? '...' : '');

  const sources = Array.isArray(obj.sources)
    ? (obj.sources as Array<{ title?: string; documentId?: string; pageNumber?: number }>)
    : undefined;

  return {
    isValid: true,
    answer,
    caption,
    sources,
    metadata: obj,
  };
}

class AIConversationServiceImpl implements IAIConversationService {
  private activeAbortController: AbortController | null = null;
  private activeTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private diagnostics: ApiDiagnosticsInfo = {
    endpointUrl: API_CONFIG.endpoints.query,
    resolvedUrl: resolveApiUrl(API_CONFIG.endpoints.query),
  };

  public getDiagnostics(): ApiDiagnosticsInfo {
    return { ...this.diagnostics };
  }

  public async probeEndpoint(): Promise<{ reachable: boolean; status?: number; error?: string }> {
    const targetUrl = resolveApiUrl(API_CONFIG.endpoints.query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(targetUrl, {
        method: 'OPTIONS',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      this.diagnostics.lastHttpStatus = response.status;
      return { reachable: response.ok || response.status < 500, status: response.status };
    } catch (err: any) {
      clearTimeout(timeout);
      return { reachable: false, error: err.message || 'Probe failed' };
    }
  }

  public async sendQuery(request: AIQueryRequest): Promise<AIQueryResponse> {
    this.cancel();
    const controller = new AbortController();
    this.activeAbortController = controller;

    const endpointPath = API_CONFIG.endpoints.query;
    const resolvedUrl = resolveApiUrl(endpointPath);
    const startTime = Date.now();
    let isTimedOut = false;

    const timeoutMs = API_CONFIG.timeoutMs || 15000;
    this.activeTimeoutTimer = setTimeout(() => {
      isTimedOut = true;
      controller.abort();
    }, timeoutMs);

    this.diagnostics = {
      endpointUrl: endpointPath,
      resolvedUrl,
      lastRequestTimestamp: new Date().toISOString(),
      lastQueryText: request.query,
    };

    try {
      const response = await fetch(resolvedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Kiosk-Id': API_CONFIG.kioskId,
        },
        body: JSON.stringify({
          query: request.query.trim(),
          workspaceId: request.workspaceId || 'home',
          stagedFiles: request.stagedFiles || [],
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;
      this.diagnostics.lastLatencyMs = latencyMs;
      this.diagnostics.lastHttpStatus = response.status;

      // 1. Handle HTTP 200 Success
      if (response.ok) {
        let rawData: unknown;
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          rawData = await response.json();
        } else {
          const rawText = await response.text();
          try {
            rawData = JSON.parse(rawText);
          } catch {
            rawData = { answer: sanitizePlainText(rawText) };
          }
        }

        const validation = validateAndNormalizeBackendResponse(rawData);
        this.diagnostics.lastResponseValid = validation.isValid;

        if (validation.isValid && validation.answer) {
          return {
            answer: validation.answer,
            caption: validation.caption || validation.answer.slice(0, 100),
            source: 'live_backend',
            isSuccess: true,
            endpointUrl: resolvedUrl,
            statusCode: response.status,
            latencyMs,
            metadata: validation.metadata,
            sources: validation.sources,
          };
        }

        // Malformed payload structure despite 200 OK
        this.diagnostics.lastErrorType = 'malformed_response';
        return {
          answer: `The CALDIM AI backend returned an invalid response structure (${validation.error || 'unrecognized format'}). Your question was preserved for retry.`,
          caption: 'Backend returned an unparseable response structure.',
          source: 'offline_kiosk_fallback',
          isSuccess: false,
          endpointUrl: resolvedUrl,
          statusCode: response.status,
          errorType: 'malformed_response',
          latencyMs,
        };
      }

      // 2. Handle specific HTTP error status codes
      let errorType: QueryErrorType = 'server_error';
      let userMessage = `Backend service at ${resolvedUrl} responded with status ${response.status} (${response.statusText}).`;

      if (response.status === 401 || response.status === 403) {
        errorType = 'unauthorized';
        userMessage = `Authentication refused by CALDIM AI backend (HTTP ${response.status}). Verify kiosk authorization credentials.`;
      } else if (response.status === 429) {
        errorType = 'rate_limited';
        userMessage = `The AI inference engine is temporarily rate limited (HTTP 429). Please wait a moment before resubmitting.`;
      } else if (response.status >= 500) {
        errorType = 'server_error';
        userMessage = `CALDIM backend service encountered an internal error (HTTP ${response.status}). The service may be restarting.`;
      }

      this.diagnostics.lastErrorType = errorType;
      this.diagnostics.lastResponseValid = false;

      return {
        answer: `${userMessage} Query recorded: "${request.query}".`,
        caption: `Notice: Backend endpoint returned HTTP ${response.status}.`,
        source: 'offline_kiosk_fallback',
        isSuccess: false,
        endpointUrl: resolvedUrl,
        statusCode: response.status,
        errorType,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      this.diagnostics.lastLatencyMs = latencyMs;

      // Handle Timeout
      if (isTimedOut) {
        this.diagnostics.lastErrorType = 'timeout';
        this.diagnostics.lastResponseValid = false;
        return {
          answer: `Request to ${resolvedUrl} timed out after ${Math.round(timeoutMs / 1000)} seconds. The AI backend did not respond in time.`,
          caption: 'Request timed out waiting for backend response.',
          source: 'offline_kiosk_fallback',
          isSuccess: false,
          endpointUrl: resolvedUrl,
          errorType: 'timeout',
          latencyMs,
        };
      }

      // Handle User / Explicit Cancellation
      if (controller.signal.aborted || err.name === 'AbortError' || err.cause?.name === 'AbortError') {
        this.diagnostics.lastErrorType = 'cancelled';
        return {
          answer: 'Query was cancelled by user.',
          caption: 'Query cancelled.',
          source: 'offline_kiosk_fallback',
          isSuccess: false,
          endpointUrl: resolvedUrl,
          errorType: 'cancelled',
          latencyMs,
        };
      }

      // Handle Network Offline / Unreachable
      this.diagnostics.lastErrorType = 'network_offline';
      this.diagnostics.lastResponseValid = false;
      return {
        answer: `Inquiry received: "${request.query}". Live inference engine at ${resolvedUrl} is currently unreachable. Operating in standalone exhibition mode.`,
        caption: `Live engine at ${resolvedUrl} is offline. Standby mode active.`,
        source: 'offline_kiosk_fallback',
        isSuccess: false,
        endpointUrl: resolvedUrl,
        statusCode: 0,
        errorType: 'network_offline',
        latencyMs,
      };
    } finally {
      if (this.activeTimeoutTimer) {
        clearTimeout(this.activeTimeoutTimer);
        this.activeTimeoutTimer = null;
      }
      if (this.activeAbortController === controller) {
        this.activeAbortController = null;
      }
    }
  }

  public cancel(): void {
    if (this.activeTimeoutTimer) {
      clearTimeout(this.activeTimeoutTimer);
      this.activeTimeoutTimer = null;
    }
    if (this.activeAbortController) {
      try {
        this.activeAbortController.abort();
      } catch {
        // Ignore abort errors
      }
      this.activeAbortController = null;
    }
  }
}

export const aiConversationService: IAIConversationService = new AIConversationServiceImpl();
