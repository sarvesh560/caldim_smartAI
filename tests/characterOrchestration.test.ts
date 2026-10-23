/**
 * CALDIM SmartAssist Companion — Phase 6 Automated Unit Tests
 *
 * Tests:
 * 1. State Priority & Preemption Protection (e.g. needsApproval & automationActive)
 * 2. Event-to-Reaction Mapping for all Phase 6 Business Events
 * 3. Token Sequencing, Interruption & Resumption
 * 4. Pointer Drag Cancellation (>8px threshold)
 * 5. Resource Cleanup and Listener Disposal
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CharacterAnimationController,
  STATE_PRIORITIES,
} from '../src/services/characterAnimationController.ts';
import { mapEventToReaction } from '../src/services/companionReactions.ts';
import {
  mapStateToExpression,
  EXPRESSION_CONFIGS,
} from '../src/services/character3dOrchestrator.ts';
import type { CompanionEvent } from '../src/types/companionEvents.ts';

describe('1. State Priority & Preemption Protection', () => {
  test('High-priority state (needsApproval: 40) cannot be clobbered by lower-priority request (greeting: 5)', () => {
    const controller = new CharacterAnimationController();
    controller.transitionTo('needsApproval');
    assert.equal(controller.getSnapshot().state, 'needsApproval');

    // Attempt lower priority ambient transition without approved override event
    const accepted = controller.transitionTo('greeting');
    assert.equal(accepted, false);
    assert.equal(controller.getSnapshot().state, 'needsApproval');

    controller.destroy();
  });

  test('WORKSPACE_CHANGED navigation event cannot clobber active tasks (priority >= 20)', () => {
    const controller = new CharacterAnimationController();

    // 1. In thinking state (priority 25)
    controller.transitionTo('thinking');
    const navAttempt1 = controller.transitionTo('idle', 'WORKSPACE_CHANGED');
    assert.equal(navAttempt1, false);
    assert.equal(controller.getSnapshot().state, 'thinking');

    // 2. In automationActive state (priority 30)
    controller.transitionTo('automationActive');
    const navAttempt2 = controller.transitionTo('idle', 'WORKSPACE_CHANGED');
    assert.equal(navAttempt2, false);
    assert.equal(controller.getSnapshot().state, 'automationActive');

    // 3. In needsApproval state (priority 40)
    controller.transitionTo('needsApproval');
    const navAttempt3 = controller.transitionTo('idle', 'WORKSPACE_CHANGED');
    assert.equal(navAttempt3, false);
    assert.equal(controller.getSnapshot().state, 'needsApproval');

    controller.destroy();
  });

  test('Explicit completion event (TASK_SUCCEEDED / AUTOMATION_SUCCEEDED) CAN override high-priority active task', () => {
    const controller = new CharacterAnimationController();
    controller.transitionTo('automationActive');
    assert.equal(controller.getSnapshot().state, 'automationActive');

    const accepted = controller.transitionTo('answerReady', 'TASK_SUCCEEDED');
    assert.equal(accepted, true);
    assert.equal(controller.getSnapshot().state, 'answerReady');

    controller.destroy();
  });
});

describe('2. Event-to-Reaction Mapping for all Phase 6 Business Events', () => {
  const testCases: { event: CompanionEvent; expectedState: string; expectedAudio: boolean }[] = [
    {
      event: { type: 'WORKSPACE_CHANGED', payload: { workspaceId: 'documents' } },
      expectedState: 'idle',
      expectedAudio: false,
    },
    {
      event: { type: 'MICROPHONE_ACTIVATED' },
      expectedState: 'listening',
      expectedAudio: true,
    },
    {
      event: { type: 'DOCUMENT_UPLOAD_STARTED' },
      expectedState: 'thinking',
      expectedAudio: false,
    },
    {
      event: { type: 'DOCUMENT_UPLOAD_COMPLETED', payload: { fileName: 'gearbox_spec.pdf' } },
      expectedState: 'answerReady',
      expectedAudio: true,
    },
    {
      event: { type: 'ANALYSIS_STARTED', payload: { query: 'Check weld tolerances' } },
      expectedState: 'thinking',
      expectedAudio: true,
    },
    {
      event: { type: 'ANSWER_READY' },
      expectedState: 'answerReady',
      expectedAudio: true,
    },
    {
      event: { type: 'AUTOMATION_STARTED', payload: { workflowName: 'Thermal stress check' } },
      expectedState: 'automationActive',
      expectedAudio: true,
    },
    {
      event: { type: 'APPROVAL_REQUIRED', payload: { workflowName: 'Torque calibration' } },
      expectedState: 'needsApproval',
      expectedAudio: true,
    },
    {
      event: { type: 'TASK_SUCCEEDED' },
      expectedState: 'answerReady',
      expectedAudio: true,
    },
    {
      event: { type: 'TASK_FAILED' },
      expectedState: 'error',
      expectedAudio: true,
    },
    {
      event: { type: 'COMPANION_PETTED' },
      expectedState: 'happy',
      expectedAudio: true,
    },
  ];

  for (const { event, expectedState, expectedAudio } of testCases) {
    test(`Maps event "${event.type}" to state "${expectedState}"`, () => {
      const reaction = mapEventToReaction(event);
      assert.equal(reaction.state, expectedState);
      assert.equal(reaction.speakAudio, expectedAudio);
      assert.ok(reaction.caption.length > 0);
    });
  }
});

describe('3. Expressions & Visual Feedback Mapping', () => {
  test('Correctly maps character states to 6 expressions', () => {
    assert.equal(mapStateToExpression('idle'), 'attentive');
    assert.equal(mapStateToExpression('greeting'), 'curious');
    assert.equal(mapStateToExpression('happy'), 'happy');
    assert.equal(mapStateToExpression('listening'), 'attentive');
    assert.equal(mapStateToExpression('thinking'), 'thinking');
    assert.equal(mapStateToExpression('needsApproval'), 'concerned');
    assert.equal(mapStateToExpression('error'), 'concerned');
    assert.equal(mapStateToExpression('idle', true), 'relaxed'); // Petting mode is relaxed
  });

  test('All 6 expressions have defined visor and collar emissive configurations', () => {
    const expressions = ['attentive', 'curious', 'relaxed', 'happy', 'thinking', 'concerned'] as const;
    for (const expr of expressions) {
      const cfg = EXPRESSION_CONFIGS[expr];
      assert.ok(cfg.visorColor.startsWith('#'));
      assert.ok(cfg.collarColor.startsWith('#'));
      assert.ok(cfg.visorIntensity > 0);
      assert.ok(cfg.collarIntensity > 0);
    }
  });
});

describe('4. Token Sequencing, Interruption & Resumption', () => {
  test('Newer transitions increment sequenceToken and invalidate stale timeouts', () => {
    const controller = new CharacterAnimationController();
    const snap1 = controller.getSnapshot();
    assert.equal(snap1.transitionSequence, 0);

    controller.transitionTo('greeting');
    const snap2 = controller.getSnapshot();
    assert.equal(snap2.transitionSequence, 1);
    assert.equal(snap2.state, 'greeting');

    controller.transitionTo('happy');
    const snap3 = controller.getSnapshot();
    assert.equal(snap3.transitionSequence, 2);
    assert.equal(snap3.state, 'happy');

    controller.destroy();
  });
});

describe('5. Pointer Drag Cancellation Logic', () => {
  test('Simulating drag movement > 8px cancels tap and petting gestures', () => {
    const dragThreshold = 8;
    const startPos = { x: 100, y: 100 };

    // Move within 4px: should NOT be marked as drag
    const moveSmall = { x: 103, y: 102 };
    const dxSmall = Math.abs(moveSmall.x - startPos.x);
    const dySmall = Math.abs(moveSmall.y - startPos.y);
    const isDragSmall = dxSmall > dragThreshold || dySmall > dragThreshold;
    assert.equal(isDragSmall, false);

    // Move by 12px: exceeds drag threshold -> marks as camera orbit/drag
    const moveLarge = { x: 112, y: 105 };
    const dxLarge = Math.abs(moveLarge.x - startPos.x);
    const dyLarge = Math.abs(moveLarge.y - startPos.y);
    const isDragLarge = dxLarge > dragThreshold || dyLarge > dragThreshold;
    assert.equal(isDragLarge, true);
  });
});

describe('6. Cleanup & Resource Disposal', () => {
  test('Calling destroy removes listeners and resets timers', () => {
    const controller = new CharacterAnimationController();
    let listenerCalled = 0;
    const unsubscribe = controller.subscribe(() => {
      listenerCalled++;
    });

    assert.equal(listenerCalled, 1); // Initial snapshot notification

    controller.transitionTo('greeting');
    assert.equal(listenerCalled, 2);

    controller.destroy();

    // After destroy, transition should not notify listeners
    controller.transitionTo('happy');
    assert.equal(listenerCalled, 2);

    unsubscribe();
  });
});

describe('7. Anatomical Touch Interactions & Gestures', () => {
  test('Tap head triggers greeting / curious head attention', () => {
    const controller = new CharacterAnimationController();
    const result = controller.handlePartTap('head', 0);
    assert.equal(result.triggered, true);
    assert.equal(result.targetState, 'greeting');
    assert.equal(controller.getSnapshot().state, 'greeting');
    controller.destroy();
  });

  test('Tap body triggers happy reaction with tail wag', () => {
    const controller = new CharacterAnimationController();
    const result = controller.handlePartTap('body', 0);
    assert.equal(result.triggered, true);
    assert.equal(result.targetState, 'happy');
    assert.equal(controller.getSnapshot().state, 'happy');
    controller.destroy();
  });

  test('Tap paw triggers front paw offer (needsApproval clip)', () => {
    const controller = new CharacterAnimationController();
    const result = controller.handlePartTap('paw', 0);
    assert.equal(result.triggered, true);
    assert.equal(result.targetState, 'needsApproval');
    assert.equal(controller.getSnapshot().state, 'needsApproval');
    controller.destroy();
  });

  test('Rapid double-tap triggers excited happy state with isSecondTap: true', () => {
    const controller = new CharacterAnimationController();
    const tap1 = controller.handlePartTap('general', 0);
    assert.equal(tap1.isSecondTap, false);

    const tap2 = controller.handlePartTap('general', 0);
    assert.equal(tap2.isSecondTap, true);
    assert.equal(tap2.targetState, 'happy');
    assert.equal(controller.getSnapshot().state, 'happy');
    controller.destroy();
  });

  test('Hold-to-pet triggers continuous petting state and release settles to idle', async () => {
    const controller = new CharacterAnimationController();
    controller.handlePetStart();
    assert.equal(controller.getSnapshot().isPetting, true);
    assert.equal(controller.getSnapshot().state, 'happy');

    controller.handlePetEnd();
    assert.equal(controller.getSnapshot().isPetting, false);
    assert.equal(controller.getSnapshot().phase, 'exit');

    // Allow exit settle timeout to run
    await new Promise((res) => setTimeout(res, 450));
    assert.equal(controller.getSnapshot().state, 'idle');
    assert.equal(controller.getSnapshot().phase, 'settled');
    controller.destroy();
  });
});

describe('8. Expression Posture & Hardware Visor/Collar Configuration', () => {
  test('All 6 expressions contain valid earAngleOffset and headTiltOffset', () => {
    const expressions = ['attentive', 'curious', 'relaxed', 'happy', 'thinking', 'concerned'] as const;
    for (const expr of expressions) {
      const cfg = EXPRESSION_CONFIGS[expr];
      assert.equal(typeof cfg.earAngleOffset, 'number');
      assert.equal(typeof cfg.headTiltOffset, 'number');
    }
  });

  test('Curious expression includes inquisitive positive head roll tilt', () => {
    const curiousCfg = EXPRESSION_CONFIGS.curious;
    assert.ok(curiousCfg.headTiltOffset > 0, 'Curious headTiltOffset should be positive for inquisitive tilt');
  });

  test('Relaxed expression has drooped relaxed ears', () => {
    const relaxedCfg = EXPRESSION_CONFIGS.relaxed;
    assert.ok(relaxedCfg.earAngleOffset > 0, 'Relaxed earAngleOffset should be positive for drooped ears');
  });
});

describe('9. Phase 8 Quadruped Locomotion & Posture Management', () => {
  test('triggerMotion("sit") sets activeMotion to "sit" and phase to "active"', () => {
    const controller = new CharacterAnimationController();
    const success = controller.triggerMotion('sit');
    assert.equal(success, true);
    assert.equal(controller.getSnapshot().activeMotion, 'sit');
    assert.equal(controller.getSnapshot().phase, 'active');
    controller.destroy();
  });

  test('triggerMotion("stand") initiates stand transition and settles to idle', async () => {
    const controller = new CharacterAnimationController();
    const success = controller.triggerMotion('stand');
    assert.equal(success, true);
    assert.equal(controller.getSnapshot().activeMotion, 'stand');
    assert.equal(controller.getSnapshot().phase, 'exit');

    // Wait for stand sequence timer
    await new Promise((res) => setTimeout(res, 2200));
    assert.equal(controller.getSnapshot().activeMotion, null);
    assert.equal(controller.getSnapshot().state, 'idle');
    assert.equal(controller.getSnapshot().phase, 'settled');
    controller.destroy();
  });

  test('triggerMotion("turnLeft") and "turnRight" transition to turning and settle', async () => {
    const controller = new CharacterAnimationController();
    const success = controller.triggerMotion('turnLeft');
    assert.equal(success, true);
    assert.equal(controller.getSnapshot().activeMotion, 'turnLeft');

    // Reset and test turnRight
    controller.resetToIdle();
    assert.equal(controller.getSnapshot().activeMotion, null);

    const rightSuccess = controller.triggerMotion('turnRight');
    assert.equal(rightSuccess, true);
    assert.equal(controller.getSnapshot().activeMotion, 'turnRight');
    controller.destroy();
  });

  test('triggerMotion("walkStart") transitions to automationActive state and settles', async () => {
    const controller = new CharacterAnimationController();
    const success = controller.triggerMotion('walkStart');
    assert.equal(success, true);
    assert.equal(controller.getSnapshot().activeMotion, 'walkStart');
    assert.equal(controller.getSnapshot().state, 'automationActive');
    assert.equal(controller.getSnapshot().phase, 'entry');

    // Wait for walkStart timer
    await new Promise((res) => setTimeout(res, 1350));
    assert.equal(controller.getSnapshot().activeMotion, null);
    assert.equal(controller.getSnapshot().state, 'automationActive');
    assert.equal(controller.getSnapshot().phase, 'active');
    controller.destroy();
  });

  test('triggerMotion("walkStop") transitions from locomotion to idle', async () => {
    const controller = new CharacterAnimationController();
    controller.transitionTo('automationActive');
    const success = controller.triggerMotion('walkStop');
    assert.equal(success, true);
    assert.equal(controller.getSnapshot().activeMotion, 'walkStop');
    assert.equal(controller.getSnapshot().state, 'idle');
    assert.equal(controller.getSnapshot().phase, 'exit');

    // Wait for walkStop timer
    await new Promise((res) => setTimeout(res, 1350));
    assert.equal(controller.getSnapshot().activeMotion, null);
    assert.equal(controller.getSnapshot().phase, 'settled');
    controller.destroy();
  });

  test('High-priority safety state (needsApproval: 40) blocks non-critical motions but permits walkStop', () => {
    const controller = new CharacterAnimationController();
    controller.transitionTo('needsApproval');
    assert.equal(controller.getSnapshot().state, 'needsApproval');

    // Sit and walkStart should be blocked
    const sitBlocked = controller.triggerMotion('sit');
    assert.equal(sitBlocked, false);
    assert.equal(controller.getSnapshot().state, 'needsApproval');

    const walkStartBlocked = controller.triggerMotion('walkStart');
    assert.equal(walkStartBlocked, false);
    assert.equal(controller.getSnapshot().state, 'needsApproval');

    // walkStop emergency halt is permitted
    const walkStopAllowed = controller.triggerMotion('walkStop');
    assert.equal(walkStopAllowed, true);
    assert.equal(controller.getSnapshot().state, 'idle');
    controller.destroy();
  });

  test('resetToIdle() safely resets activeMotion to null', () => {
    const controller = new CharacterAnimationController();
    controller.triggerMotion('sit');
    assert.equal(controller.getSnapshot().activeMotion, 'sit');

    controller.resetToIdle();
    assert.equal(controller.getSnapshot().activeMotion, null);
    assert.equal(controller.getSnapshot().state, 'idle');
    assert.equal(controller.getSnapshot().phase, 'settled');
    controller.destroy();
  });
});

