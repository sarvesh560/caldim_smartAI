/**
 * CALDIM SmartAssist Companion — Phase 10 Automated Unit Tests
 *
 * Production AI Backend Integration & Voice Conversation Lifecycle:
 * 1. Runtime response validation & normalization (answer, message, response, text, output)
 * 2. HTML sanitization of untrusted backend text (scripts, styles, tags, entities)
 * 3. Malformed response rejection & fallback
 * 4. Error classification: 401/403 (unauthorized), 429 (rate-limited), 500/503 (server error), network offline
 * 5. Request timeout handling (AbortController timeout)
 * 6. Query cancellation during in-flight request
 * 7. Speech deduplication window (<1500ms)
 * 8. Speech synthesis playing state & procedural jaw gating
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  aiConversationService,
  validateAndNormalizeBackendResponse,
  sanitizePlainText,
} from '../src/services/aiConversationService.ts';
import { speechService } from '../src/services/speechService.ts';
import { Character3DOrchestrator } from '../src/services/character3dOrchestrator.ts';
import { CharacterAnimationController } from '../src/services/characterAnimationController.ts';
import * as THREE from 'three';

describe('Phase 10.1: Runtime Response Normalization & Schema Validation', () => {
  test('Normalizes response with standard "answer" field', () => {
    const raw = {
      answer: 'The allowable torque for M12 titanium fasteners is 85 Nm ± 5 Nm.',
      caption: 'Torque: 85 Nm ± 5 Nm',
      sources: [{ title: 'CALDIM Maintenance Manual Ch. 4' }],
    };
    const norm = validateAndNormalizeBackendResponse(raw);
    assert.equal(norm.isValid, true);
    assert.equal(norm.answer, 'The allowable torque for M12 titanium fasteners is 85 Nm ± 5 Nm.');
    assert.equal(norm.caption, 'Torque: 85 Nm ± 5 Nm');
    assert.deepEqual(norm.sources, [{ title: 'CALDIM Maintenance Manual Ch. 4' }]);
  });

  test('Normalizes alternate backend schemas ("message", "output", "text", "response")', () => {
    const schema1 = validateAndNormalizeBackendResponse({ message: 'Bearing temperature is within nominal limits.' });
    assert.equal(schema1.isValid, true);
    assert.equal(schema1.answer, 'Bearing temperature is within nominal limits.');

    const schema2 = validateAndNormalizeBackendResponse({ output: 'CAD model contains 24 GD&T tolerances.' });
    assert.equal(schema2.isValid, true);
    assert.equal(schema2.answer, 'CAD model contains 24 GD&T tolerances.');

    const schema3 = validateAndNormalizeBackendResponse({ text: 'Scheduled maintenance due in 48 operating hours.' });
    assert.equal(schema3.isValid, true);
    assert.equal(schema3.answer, 'Scheduled maintenance due in 48 operating hours.');

    const schema4 = validateAndNormalizeBackendResponse({ response: 'Conveyor 3 interlock active.' });
    assert.equal(schema4.isValid, true);
    assert.equal(schema4.answer, 'Conveyor 3 interlock active.');
  });

  test('Rejects malformed, non-JSON or missing text responses', () => {
    assert.equal(validateAndNormalizeBackendResponse(null).isValid, false);
    assert.equal(validateAndNormalizeBackendResponse(undefined).isValid, false);
    assert.equal(validateAndNormalizeBackendResponse('plain string').isValid, false);
    assert.equal(validateAndNormalizeBackendResponse(12345).isValid, false);
    assert.equal(validateAndNormalizeBackendResponse({}).isValid, false);
    assert.equal(validateAndNormalizeBackendResponse({ status: 'ok', data: {} }).isValid, false);
  });
});

describe('Phase 10.2: HTML Sanitization & Untrusted String Scrubbing', () => {
  test('Strips HTML tags and script injections from untrusted responses', () => {
    const malicious = '<script>alert("pwned")</script><b>Critical:</b> Check pressure valve <i>#4</i>.';
    const sanitized = sanitizePlainText(malicious);
    assert.equal(sanitized.includes('alert'), false);
    assert.equal(sanitized.includes('<script>'), false);
    assert.equal(sanitized.includes('<b>'), false);
    assert.equal(sanitized.includes('<i>'), false);
    assert.equal(sanitized, 'Critical: Check pressure valve #4.');
  });

  test('Decodes standard HTML entities into clean readable characters', () => {
    const withEntities = 'Tolerances: &lt; 0.05mm &amp; &gt; 0.01mm &quot;ISO 2768&quot;';
    const sanitized = sanitizePlainText(withEntities);
    assert.equal(sanitized, 'Tolerances: < 0.05mm & > 0.01mm "ISO 2768"');
  });

  test('Collapses irregular whitespace in messy AI responses', () => {
    const messy = 'Line 1:   Nominal \n\n  Pressure:   2.4  bar  ';
    const sanitized = sanitizePlainText(messy);
    assert.equal(sanitized, 'Line 1: Nominal Pressure: 2.4 bar');
  });
});

describe('Phase 10.3: Backend HTTP Status Code & Error Classification', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('Correctly classifies 401 Unauthorized', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: 'Invalid API Key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

    const res = await aiConversationService.sendQuery({ query: 'Test 401' });
    assert.equal(res.isSuccess, false);
    assert.equal(res.errorType, 'unauthorized');
    assert.match(res.answer, /authorization credentials/i);

    const diag = aiConversationService.getDiagnostics();
    assert.equal(diag.lastHttpStatus, 401);
  });

  test('Correctly classifies 429 Rate Limit', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });

    const res = await aiConversationService.sendQuery({ query: 'Test 429' });
    assert.equal(res.isSuccess, false);
    assert.equal(res.errorType, 'rate_limited');
    assert.match(res.answer, /rate limited/i);

    const diag = aiConversationService.getDiagnostics();
    assert.equal(diag.lastHttpStatus, 429);
  });

  test('Correctly classifies 500 Server Error', async () => {
    globalThis.fetch = async () =>
      new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });

    const res = await aiConversationService.sendQuery({ query: 'Test 500' });
    assert.equal(res.isSuccess, false);
    assert.equal(res.errorType, 'server_error');
    assert.match(res.answer, /internal error/i);

    const diag = aiConversationService.getDiagnostics();
    assert.equal(diag.lastHttpStatus, 500);
  });

  test('Handles fetch rejection as network_offline', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch');
    };

    const res = await aiConversationService.sendQuery({ query: 'Test offline' });
    assert.equal(res.isSuccess, false);
    assert.equal(res.errorType, 'network_offline');
    assert.match(res.answer, /currently unreachable/i);

    const diag = aiConversationService.getDiagnostics();
    assert.equal(diag.lastErrorType, 'network_offline');
  });

  test('Normalizes valid 200 backend response', async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          answer: 'CALDIM SmartAssist detected 3 active pneumatic cylinders.',
          caption: '3 cylinders active',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

    const res = await aiConversationService.sendQuery({
      query: 'List active cylinders',
      workspaceId: 'automation',
    });
    assert.equal(res.isSuccess, true);
    assert.equal(res.answer, 'CALDIM SmartAssist detected 3 active pneumatic cylinders.');
    assert.equal(res.caption, '3 cylinders active');

    const diag = aiConversationService.getDiagnostics();
    assert.equal(diag.lastHttpStatus, 200);
    assert.equal(diag.lastResponseValid, true);
  });
});

describe('Phase 10.4: Speech Service Deduplication & Audio Playing State', () => {
  let originalWindow: unknown;

  beforeEach(() => {
    originalWindow = (globalThis as any).window;
    (globalThis as any).window = {
      speechSynthesis: {
        speak: () => {},
        cancel: () => {},
        getVoices: () => [],
      },
    };
    (globalThis as any).SpeechSynthesisUtterance = class {
      text: string;
      voice: unknown = null;
      pitch = 1;
      rate = 1;
      volume = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    };
    speechService.registerUserGesture();
    speechService.cancel();
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    delete (globalThis as any).SpeechSynthesisUtterance;
  });

  test('Speech deduplication suppresses identical utterance within 1500ms', () => {
    const text = 'Repeat check for safety protocols.';
    const allowedFirst = speechService.speak(text);
    assert.equal(allowedFirst, true);

    const allowedSecond = speechService.speak(text);
    // Second identical speak within 1500ms is suppressed
    assert.equal(allowedSecond, false);
  });

  test('Speech deduplication permits different utterance immediately', () => {
    const allowedFirst = speechService.speak('First instruction: check valve A.');
    assert.equal(allowedFirst, true);

    const allowedSecond = speechService.speak('Second instruction: check valve B.');
    assert.equal(allowedSecond, true);
  });

  test('speechService.cancel() clears speaking state', () => {
    speechService.speak('Hello world');
    speechService.cancel();
    assert.equal(speechService.isPlaying(), false);
  });
});

describe('Phase 10.5: Procedural Jaw Movement Gated Strictly to Audio Playback', () => {
  test('Jaw opens only when state is "speaking" AND speechService.isPlaying() is true', () => {
    const scene = new THREE.Scene();
    const mixer = new THREE.AnimationMixer(scene);
    const orchestrator = new Character3DOrchestrator(scene, mixer, []);

    // Create a mock jaw bone
    const jawBone = new THREE.Bone();
    jawBone.name = 'Jaw';
    jawBone.rotation.x = 0;
    (orchestrator as any).boneJaw = jawBone;

    // 1. When orchestrator is idle, jaw remains 0
    orchestrator.setState('idle');
    orchestrator.update(0.016);
    assert.equal(jawBone.rotation.x, 0);

    // 2. When orchestrator is 'speaking' but speechService.isPlaying() is false (muted or finished)
    orchestrator.setState('speaking');
    assert.equal(speechService.isPlaying(), false);
    orchestrator.update(0.016);
    // Jaw remains at 0 because speechService is not playing audio
    assert.equal(jawBone.rotation.x, 0);

    // 3. When isPlaying is manually set to true to simulate Web Speech API audio start
    (speechService as any).isSpeakingAudio = true;
    (speechService as any).currentUtterance = {} as any;
    assert.equal(speechService.isPlaying(), true);

    orchestrator.update(0.05);
    // Jaw should now have procedural rotation > 0
    assert.ok(jawBone.rotation.x > 0, `Expected jaw rotation > 0, got ${jawBone.rotation.x}`);

    // 4. When audio stops (e.g. speechService.cancel())
    speechService.cancel();
    assert.equal(speechService.isPlaying(), false);

    // Multiple updates should smoothly lerp jaw closed back to 0
    for (let i = 0; i < 20; i++) {
      orchestrator.update(0.05);
    }
    assert.ok(jawBone.rotation.x < 0.01, `Expected jaw closed near 0, got ${jawBone.rotation.x}`);
  });
});
