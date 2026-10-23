/**
 * CALDIM SmartAssist Companion — Event to Reaction Mapping
 *
 * Phase 3: Persistent Playful Companion Experience
 *
 * Maps business events to character state, visual captions, and optional speech cues.
 * Strictly separates business events from presentation logic.
 */

import type { CompanionEvent, ReactionDefinition } from '../types/companionEvents';

export function mapEventToReaction(
  event: CompanionEvent,
  touchCounter = 0
): ReactionDefinition {
  const { type, payload } = event;

  switch (type) {
    case 'COMPANION_PETTED': {
      return {
        state: 'happy',
        caption: "*Purrs softly and wags tail with joy* Thank you! Ready to assist you across all kiosk workflows.",
        speechText: "Ready to assist you with engineering data and workflows!",
        durationMs: 4000,
        speakAudio: true,
      };
    }

    case 'PART_TOUCHED': {
      const part = payload?.part || 'general';
      if (part === 'ears') {
        return {
          state: 'listening',
          caption: '*Perks ears and swivels alertly to listen* Hearing your inquiry clearly!',
          speechText: 'Ears perked and listening closely.',
          durationMs: 3400,
          speakAudio: true,
        };
      }
      if (part === 'paw') {
        return {
          state: 'needsApproval',
          caption: '*Offers front paw politely in friendly greeting!* Ready to collaborate!',
          speechText: 'Nice to meet you! CALDIM Smart ready to assist.',
          durationMs: 3200,
          speakAudio: true,
        };
      }
      if (part === 'head') {
        return {
          state: 'greeting',
          caption: '*Perks ears and tilts head curiously* Attentive to your inquiry.',
          speechText: "Hello! I'm listening closely.",
          durationMs: 3500,
          speakAudio: true,
        };
      }
      if (part === 'body') {
        return {
          state: 'happy',
          caption: '*Perks up with attention and wags tail* Telemetry optimal across all workspaces!',
          speechText: 'CALDIM Smart is accompanying you across all workspaces.',
          durationMs: 3200,
          speakAudio: true,
        };
      }
      return {
        state: 'greeting',
        caption: 'Hello! CALDIM Smart is attentive and ready to assist.',
        speechText: "Hi! I’m CALDIM Smart. How can I help you today?",
        durationMs: 3200,
        speakAudio: true,
      };
    }

    case 'COMPANION_TOUCHED': {
      const petPhrases = [
        "Hi! I’m CALDIM Smart. How can I help you today?",
        "Woof! Ready to assist you with engineering data and workflows!",
        "Telemetry optimal! I'm accompanying you across all workspaces.",
        "Need a hand with blueprints, documents, or automation?",
        "Ears perked! Tap any capability or ask me anything.",
      ];
      const selected = petPhrases[touchCounter % petPhrases.length];
      return {
        state: 'happy',
        caption: selected,
        speechText: selected,
        durationMs: 4000,
        speakAudio: true,
      };
    }

    case 'MICROPHONE_ACTIVATED':
    case 'LISTENING_STARTED': {
      return {
        state: 'listening',
        caption: 'Listening closely... Speak your question into the microphone.',
        speechText: 'Listening to your request.',
        durationMs: 0,
        speakAudio: true,
      };
    }

    case 'VOICE_RECOGNITION_RESULT': {
      const transcript = payload?.transcript || '';
      return {
        state: 'listening',
        caption: `*Listening* "${transcript}"`,
        speechText: undefined,
        durationMs: 0,
        speakAudio: false,
      };
    }

    case 'VOICE_PERMISSION_DENIED': {
      return {
        state: 'error',
        caption: 'Microphone permission was denied. Touchscreen & keyboard remain fully active.',
        speechText: 'Microphone access denied. Keyboard input active.',
        durationMs: 5000,
        speakAudio: true,
      };
    }

    case 'VOICE_CANCELLED': {
      return {
        state: 'idle',
        caption: "Hi! I’m CALDIM Smart. How can I help you today?",
        durationMs: 0,
        speakAudio: false,
      };
    }

    case 'SPEAKING_STARTED': {
      const text = payload?.query || payload?.errorMessage || 'Here is the summary from your engineering documentation.';
      return {
        state: 'speaking',
        caption: text,
        speechText: text,
        durationMs: 0,
        speakAudio: true,
      };
    }

    case 'SPEAKING_COMPLETED': {
      return {
        state: 'idle',
        caption: "Hi! I’m CALDIM Smart. How can I help you today?",
        durationMs: 0,
        speakAudio: false,
      };
    }

    case 'LISTENING_STOPPED': {
      return {
        state: 'idle',
        caption: "Hi! I’m CALDIM Smart. How can I help you today?",
        durationMs: 0,
        speakAudio: false,
      };
    }

    case 'DOCUMENT_SELECTED': {
      const name = payload?.fileName || 'technical specification';
      return {
        state: 'documentReceived',
        caption: `Inspecting ${name}. Staged ready for document indexer.`,
        speechText: `Received ${name}. Staged for inspection.`,
        durationMs: 5000,
        speakAudio: true,
      };
    }

    case 'DOCUMENT_UPLOAD_STARTED': {
      return {
        state: 'thinking',
        caption: 'Staging file for parsing pipeline...',
        durationMs: 3000,
        speakAudio: false,
      };
    }

    case 'DOCUMENT_UPLOAD_COMPLETED':
    case 'DOCUMENT_UPLOAD_SUCCEEDED': {
      const name = payload?.fileName || 'Document';
      return {
        state: 'answerReady',
        caption: `${name} verified and staged for Phase 2 RAG pipeline.`,
        speechText: `${name} staged successfully.`,
        durationMs: 4500,
        speakAudio: true,
      };
    }

    case 'DOCUMENT_UPLOAD_FAILED': {
      const err = payload?.errorMessage || 'Unsupported format or file read error.';
      return {
        state: 'error',
        caption: `Upload warning: ${err}`,
        speechText: `Upload error: ${err}`,
        durationMs: 5000,
        speakAudio: true,
      };
    }

    case 'ANALYSIS_STARTED': {
      const q = payload?.query ? ` "${payload.query.slice(0, 32)}..."` : '';
      return {
        state: 'thinking',
        caption: `Analyzing engineering query${q}. Scanning knowledge base...`,
        speechText: 'Analyzing engineering specifications.',
        durationMs: 5000,
        speakAudio: true,
      };
    }

    case 'ANSWER_READY':
    case 'ANALYSIS_SUCCEEDED': {
      return {
        state: 'answerReady',
        caption: 'Analysis complete. Specifications and tolerances cross-referenced.',
        speechText: 'Analysis verified.',
        durationMs: 5000,
        speakAudio: true,
      };
    }

    case 'ANALYSIS_FAILED': {
      const err = payload?.errorMessage || 'Analysis engine pending backend connection.';
      return {
        state: 'error',
        caption: `Notice: ${err}`,
        speechText: 'Analysis caution.',
        durationMs: 4500,
        speakAudio: true,
      };
    }

    case 'AUTOMATION_STARTED': {
      const name = payload?.workflowName || 'Industrial task';
      return {
        state: 'automationActive',
        caption: `${name} active. Monitoring telemetry across pipeline nodes...`,
        speechText: `Workflow ${name} active.`,
        durationMs: 6000,
        speakAudio: true,
      };
    }

    case 'APPROVAL_REQUIRED': {
      const name = payload?.workflowName || 'Workflow';
      return {
        state: 'needsApproval',
        caption: `${name} safety gate reached. Awaiting lead engineer authorization.`,
        speechText: 'Human approval required before execution.',
        durationMs: 0, // Persist until user approves or changes state
        speakAudio: true,
      };
    }

    case 'TASK_SUCCEEDED':
    case 'AUTOMATION_SUCCEEDED': {
      return {
        state: 'answerReady',
        caption: 'Task workflow verified and approved.',
        speechText: 'Task workflow approved.',
        durationMs: 4500,
        speakAudio: true,
      };
    }

    case 'TASK_FAILED':
    case 'AUTOMATION_FAILED': {
      return {
        state: 'error',
        caption: 'Workflow execution halted due to safety guardrail or missing connector.',
        speechText: 'Workflow halted for safety.',
        durationMs: 5000,
        speakAudio: true,
      };
    }

    case 'WORKSPACE_CHANGED': {
      const ws = payload?.workspaceId;
      let text = "Hi! I’m CALDIM Smart. How can I help you today?";
      if (ws === 'documents') {
        text = 'DocuSense active. Stage technical manuals or ask questions.';
      } else if (ws === 'drawing') {
        text = 'CAD Vision active. Inspect layers, tolerances, and blueprints.';
      } else if (ws === 'use-case') {
        text = 'Enterprise Matcher active. Explore industry use cases and ROI.';
      } else if (ws === 'automation') {
        text = 'Task Orchestrator active. Configure human-in-the-loop workflows.';
      } else if (ws === 'products') {
        text = 'Product Ecosystem active. Review air-gapped architecture specs.';
      }

      return {
        state: 'idle',
        caption: text,
        speechText: undefined, // Do NOT speak audio on navigation to avoid repetitive spam
        durationMs: 0,
        speakAudio: false,
      };
    }

    default:
      return {
        state: 'idle',
        caption: "Hi! I’m CALDIM Smart. How can I help you today?",
        durationMs: 0,
        speakAudio: false,
      };
  }
}
