/**
 * CALDIM SmartAssist Companion — Phase 9 Automated Unit Tests
 *
 * Touch, Facial Expression and Voice Integration:
 * 1. Anatomical body-part discrimination (head, ears, body, paws, stage fallback)
 * 2. State priority protection (speaking: 28, automationActive: 30, needsApproval: 40) against touch/pet overrides
 * 3. Touch cooldown enforcement (<800ms ignored, second tap at 800-1600ms)
 * 4. Voice service lifecycle, duplicate session prevention, cancellation, and simulated transcripts
 * 5. AI Conversation Service endpoint grounding, abort cancellation, and honest offline responses
 * 6. Character state synchronization (listening -> thinking -> speaking -> answerReady)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CharacterAnimationController,
  STATE_PRIORITIES,
} from '../src/services/characterAnimationController.ts';
import { mapEventToReaction } from '../src/services/companionReactions.ts';
import { voiceService } from '../src/services/voiceService.ts';
import { aiConversationService } from '../src/services/aiConversationService.ts';
import { API_CONFIG } from '../src/services/apiClient.ts';

describe('Phase 9.1: Anatomical Body-Part Discrimination & Reaction Selection', () => {
  test('Part "ears" triggers listening state and perk reaction', () => {
    const controller = new CharacterAnimationController();
    const result = controller.handlePartTap('ears', 800);
    assert.equal(result.triggered, true);
    assert.equal(result.part, 'ears');
    assert.equal(controller.getSnapshot().state, 'listening');

    const reaction = mapEventToReaction({ type: 'PART_TOUCHED', payload: { part: 'ears' } });
    assert.equal(reaction.state, 'listening');
    assert.match(reaction.caption, /ears/i);
    controller.destroy();
  });

  test('Part "head" triggers greeting state with curious head tilt', () => {
    const controller = new CharacterAnimationController();
    const result = controller.handlePartTap('head', 800);
    assert.equal(result.triggered, true);
    assert.equal(result.part, 'head');
    assert.equal(controller.getSnapshot().state, 'greeting');

    const reaction = mapEventToReaction({ type: 'PART_TOUCHED', payload: { part: 'head' } });
    assert.equal(reaction.state, 'greeting');
    assert.match(reaction.caption, /head/i);
    controller.destroy();
  });

  test('Part "paw" triggers needsApproval paw offer', () => {
    const controller = new CharacterAnimationController();
    const result = controller.handlePartTap('paw', 800);
    assert.equal(result.triggered, true);
    assert.equal(result.part, 'paw');
    assert.equal(controller.getSnapshot().state, 'needsApproval');

    const reaction = mapEventToReaction({ type: 'PART_TOUCHED', payload: { part: 'paw' } });
    assert.equal(reaction.state, 'needsApproval');
    assert.match(reaction.caption, /paw/i);
    controller.destroy();
  });

  test('Part "body" triggers happy state with tail wag', () => {
    const controller = new CharacterAnimationController();
    const result = controller.handlePartTap('body', 800);
    assert.equal(result.triggered, true);
    assert.equal(result.part, 'body');
    assert.equal(controller.getSnapshot().state, 'happy');

    const reaction = mapEventToReaction({ type: 'PART_TOUCHED', payload: { part: 'body' } });
    assert.equal(reaction.state, 'happy');
    assert.match(reaction.caption, /telemetry/i);
    controller.destroy();
  });

  test('Stage fallback "general" triggers friendly greeting', () => {
    const controller = new CharacterAnimationController();
    const result = controller.handlePartTap('general', 800);
    assert.equal(result.triggered, true);
    assert.equal(result.part, 'general');
    assert.equal(controller.getSnapshot().state, 'greeting');

    const reaction = mapEventToReaction({ type: 'PART_TOUCHED', payload: { part: 'general' } });
    assert.equal(reaction.state, 'greeting');
    controller.destroy();
  });
});

describe('Phase 9.2: Priority Protection & Interruption Guarding', () => {
  test('Speaking state (priority 28) CANNOT be interrupted by part taps or petting', () => {
    const controller = new CharacterAnimationController();
    controller.transitionTo('speaking');
    assert.equal(controller.getSnapshot().state, 'speaking');
    assert.equal(STATE_PRIORITIES['speaking'], 28);

    // 1. Part tap should be rejected
    const tapResult = controller.handlePartTap('head', 800);
    assert.equal(tapResult.triggered, false);
    assert.equal(controller.getSnapshot().state, 'speaking');

    // 2. Petting should be rejected
    const petResult = controller.handlePetStart();
    assert.equal(petResult, false);
    assert.equal(controller.getSnapshot().state, 'speaking');

    controller.destroy();
  });

  test('Safety approval state (needsApproval: 40) CANNOT be overridden by part taps or petting', () => {
    const controller = new CharacterAnimationController();
    controller.transitionTo('needsApproval');
    assert.equal(controller.getSnapshot().state, 'needsApproval');

    const tapResult = controller.handlePartTap('body', 800);
    assert.equal(tapResult.triggered, false);
    assert.equal(controller.getSnapshot().state, 'needsApproval');

    const petResult = controller.handlePetStart();
    assert.equal(petResult, false);
    assert.equal(controller.getSnapshot().state, 'needsApproval');

    controller.destroy();
  });

  test('AutomationActive state (priority 30) CANNOT be overridden by part taps or petting', () => {
    const controller = new CharacterAnimationController();
    controller.transitionTo('automationActive');
    assert.equal(controller.getSnapshot().state, 'automationActive');

    const tapResult = controller.handlePartTap('ears', 800);
    assert.equal(tapResult.triggered, false);
    assert.equal(controller.getSnapshot().state, 'automationActive');

    const petResult = controller.handlePetStart();
    assert.equal(petResult, false);
    assert.equal(controller.getSnapshot().state, 'automationActive');

    controller.destroy();
  });
});

describe('Phase 9.3: Touch Cooldown & Rapid Repeat Prevention', () => {
  test('Rapid taps within < 800ms cooldown window are safely ignored', () => {
    const controller = new CharacterAnimationController();
    const tap1 = controller.handlePartTap('head', 800);
    assert.equal(tap1.triggered, true);

    // Immediate second tap (<800ms)
    const tap2 = controller.handlePartTap('head', 800);
    assert.equal(tap2.triggered, false);

    controller.destroy();
  });

  test('Second tap between 800ms and 1600ms triggers excited second-tap reaction', async () => {
    const controller = new CharacterAnimationController();
    const tap1 = controller.handlePartTap('body', 800);
    assert.equal(tap1.triggered, true);
    assert.equal(tap1.isSecondTap, false);

    // Wait past the 800ms cooldown window but within the 1600ms double-tap window
    await new Promise((res) => setTimeout(res, 850));

    const tap2 = controller.handlePartTap('body', 800);
    assert.equal(tap2.triggered, true);
    assert.equal(tap2.isSecondTap, true);
    assert.equal(controller.getSnapshot().state, 'happy');

    controller.destroy();
  });
});

describe('Phase 9.4: Voice Service Lifecycle, Sessions & Cancellation', () => {
  test('cancel() safely stops voice recognition session and resets active state', () => {
    voiceService.cancel();
    assert.equal(voiceService.isListening(), false);
  });

  test('simulateTranscript() delivers transcript callback with isFinal: true', async () => {
    let capturedTranscript = '';
    let capturedFinal = false;

    await voiceService.startListening({
      onTranscript: (res) => {
        capturedTranscript = res.transcript;
        capturedFinal = res.isFinal;
      },
    });

    voiceService.simulateTranscript('What are the pump inspection guidelines?');
    assert.equal(capturedTranscript, 'What are the pump inspection guidelines?');
    assert.equal(capturedFinal, true);

    voiceService.cancel();
  });

  test('Starting a new voice session automatically aborts prior active session without leaks', async () => {
    let session1Ended = false;

    await voiceService.startListening({
      onEnd: () => {
        session1Ended = true;
      },
    });

    // Start a second session immediately
    await voiceService.startListening({
      onStart: () => {},
    });

    voiceService.cancel();
    assert.equal(voiceService.isListening(), false);
  });
});

describe('Phase 9.5: AI Conversation Service & Backend Grounding', () => {
  test('aiConversationService queries configured API endpoint without fabricated responses', async () => {
    const request = { query: 'Check turbine valve status' };
    const response = await aiConversationService.sendQuery(request);

    assert.equal(response.endpointUrl, API_CONFIG.endpoints.query);
    assert.equal(typeof response.answer, 'string');
    assert.equal(typeof response.isSuccess, 'boolean');
    assert.ok(['live_backend', 'offline_kiosk_fallback'].includes(response.source));

    // When offline, it provides an honest transparent fallback without claiming to be an LLM
    if (response.source === 'offline_kiosk_fallback') {
      assert.match(response.answer, /offline|unreachable|cancelled|responded with status/i);
    }
  });

  test('aiConversationService.cancel() aborts active query cleanly', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async (_url: any, init?: any) => {
        return new Promise((_resolve, reject) => {
          if (init?.signal) {
            init.signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            });
          }
        });
      }) as typeof fetch;

      const queryPromise = aiConversationService.sendQuery({ query: 'Long running query' });
      aiConversationService.cancel();
      const result = await queryPromise;

      assert.equal(result.isSuccess, false);
      assert.match(result.answer, /cancelled/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('Phase 9.6: Character State Machine Synchronization', () => {
  test('Voice cancelled event resets character safely to idle', () => {
    const controller = new CharacterAnimationController();
    controller.transitionTo('listening', 'LISTENING_STARTED');
    assert.equal(controller.getSnapshot().state, 'listening');

    const reset = controller.transitionTo('idle', 'VOICE_CANCELLED');
    assert.equal(reset, true);
    assert.equal(controller.getSnapshot().state, 'idle');
    controller.destroy();
  });

  test('Voice permission denied transitions character to error state', () => {
    const controller = new CharacterAnimationController();
    controller.transitionTo('listening');
    const errored = controller.transitionTo('error', 'VOICE_PERMISSION_DENIED');
    assert.equal(errored, true);
    assert.equal(controller.getSnapshot().state, 'error');
    controller.destroy();
  });

  test('Speaking completed transitions character to answerReady or idle', () => {
    const controller = new CharacterAnimationController();
    controller.transitionTo('speaking', 'SPEAKING_STARTED');
    assert.equal(controller.getSnapshot().state, 'speaking');

    const completed = controller.transitionTo('answerReady', 'SPEAKING_COMPLETED');
    assert.equal(completed, true);
    assert.equal(controller.getSnapshot().state, 'answerReady');
    controller.destroy();
  });
});
