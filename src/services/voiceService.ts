/**
 * CALDIM SmartAssist Companion — Voice & Microphone Service
 *
 * Phase 9: Touch, Facial Expression and Voice Integration
 *
 * Requirements:
 * - Typed, replaceable service interface (IVoiceService)
 * - Microphone capture & speech recognition using Web Speech API with fallback checks
 * - Graceful handling of permission denial, lack of hardware, or unsupported browser
 * - Prevents duplicate microphone sessions
 * - Supports cancellation, stopping, and transcript streaming
 * - Provides simulation capabilities for headless/testing environments
 */

export type VoicePermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export interface VoiceServiceCallbacks {
  onTranscript?: (result: VoiceRecognitionResult) => void;
  onError?: (errorMessage: string, isPermissionDenied?: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface IVoiceService {
  isSupported(): boolean;
  isListening(): boolean;
  getPermissionStatus(): Promise<VoicePermissionStatus>;
  startListening(callbacks: VoiceServiceCallbacks): Promise<boolean>;
  stopListening(): void;
  cancel(): void;
  simulateTranscript(transcript: string, callbacks?: VoiceServiceCallbacks, immediate?: boolean): void;
}

// Window typing for Web Speech API
interface IWindowSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

class VoiceServiceImpl implements IVoiceService {
  private activeRecognition: any = null;
  private listening = false;
  private lastPermissionStatus: VoicePermissionStatus = 'prompt';
  private simulationTimer: ReturnType<typeof setTimeout> | null = null;
  private isExplicitlyCancelled = false;
  private activeCallbacks: VoiceServiceCallbacks | null = null;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as IWindowSpeech;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public isListening(): boolean {
    return this.listening;
  }

  public async getPermissionStatus(): Promise<VoicePermissionStatus> {
    if (typeof window === 'undefined' || !navigator) {
      return 'unsupported';
    }

    if (this.lastPermissionStatus === 'denied') {
      return 'denied';
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        this.lastPermissionStatus = status.state as VoicePermissionStatus;
        return this.lastPermissionStatus;
      } catch {
        // Querying microphone permission directly is not supported in all browsers
      }
    }

    if (!this.isSupported() && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
      return 'unsupported';
    }

    return this.lastPermissionStatus;
  }

  public async startListening(callbacks: VoiceServiceCallbacks): Promise<boolean> {
    // 1. Cancel any active session to prevent duplicate microphone sessions
    this.cancel();
    this.isExplicitlyCancelled = false;
    this.activeCallbacks = callbacks;

    if (!this.isSupported()) {
      const msg = 'Speech recognition (Web Speech API) is not supported in this browser. Please use keyboard input.';
      if (callbacks.onError) {
        callbacks.onError(msg, false);
      }
      return false;
    }

    const win = window as IWindowSpeech;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        this.listening = true;
        this.lastPermissionStatus = 'granted';
        if (callbacks.onStart) {
          callbacks.onStart();
        }
      };

      recognition.onresult = (event: any) => {
        if (this.isExplicitlyCancelled) return;

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const transcript = (finalTranscript || interimTranscript).trim();
        const isFinal = Boolean(finalTranscript);

        if (callbacks.onTranscript && transcript) {
          callbacks.onTranscript({
            transcript,
            isFinal,
            confidence: event.results[0]?.[0]?.confidence,
          });
        }
      };

      recognition.onerror = (event: any) => {
        if (this.isExplicitlyCancelled) return;

        this.listening = false;
        const errType = event?.error || 'unknown';
        let friendlyMessage = `Speech recognition error: ${errType}`;
        let isPermissionDenied = false;

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          this.lastPermissionStatus = 'denied';
          isPermissionDenied = true;
          friendlyMessage = 'Microphone permission was denied. Please allow microphone access in your browser settings or use keyboard input.';
        } else if (errType === 'no-speech') {
          friendlyMessage = 'No speech was detected. Tap the microphone and try speaking again.';
        } else if (errType === 'network') {
          friendlyMessage = 'Speech recognition network connection error.';
        }

        if (callbacks.onError) {
          callbacks.onError(friendlyMessage, isPermissionDenied);
        }
      };

      recognition.onend = () => {
        this.listening = false;
        this.activeRecognition = null;
        if (callbacks.onEnd && !this.isExplicitlyCancelled) {
          callbacks.onEnd();
        }
      };

      this.activeRecognition = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      this.listening = false;
      this.activeRecognition = null;
      const isDenied = err?.name === 'NotAllowedError';
      if (isDenied) {
        this.lastPermissionStatus = 'denied';
      }
      const msg = isDenied
        ? 'Microphone permission was denied. Please enable microphone permissions in your browser.'
        : `Unable to activate audio sensor: ${err?.message || 'Initialization failed'}`;

      if (callbacks.onError) {
        callbacks.onError(msg, isDenied);
      }
      return false;
    }
  }

  public stopListening(): void {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {
        // Ignore stop errors if already stopped
      }
    }
    this.listening = false;
  }

  public cancel(): void {
    this.isExplicitlyCancelled = true;
    if (this.simulationTimer !== null) {
      clearTimeout(this.simulationTimer);
      this.simulationTimer = null;
    }
    if (this.activeRecognition) {
      try {
        this.activeRecognition.abort();
      } catch {
        // Ignore abort errors
      }
      this.activeRecognition = null;
    }
    this.listening = false;
  }

  /**
   * Safe simulation for environments without physical microphone access or testing
   */
  public simulateTranscript(
    transcript: string,
    callbacks?: VoiceServiceCallbacks,
    immediate = false
  ): void {
    const cb = callbacks || this.activeCallbacks || {};
    this.cancel();
    this.isExplicitlyCancelled = false;
    this.listening = true;

    if (cb.onStart) {
      cb.onStart();
    }

    if (immediate || typeof window === 'undefined') {
      if (cb.onTranscript) {
        cb.onTranscript({
          transcript,
          isFinal: true,
          confidence: 0.98,
        });
      }
      this.listening = false;
      if (cb.onEnd) {
        cb.onEnd();
      }
      return;
    }

    // Step 1: Interim partial transcript
    const words = transcript.split(' ');
    const half = words.slice(0, Math.max(1, Math.floor(words.length / 2))).join(' ');

    this.simulationTimer = setTimeout(() => {
      if (this.isExplicitlyCancelled) return;
      if (cb.onTranscript) {
        cb.onTranscript({
          transcript: half,
          isFinal: false,
          confidence: 0.88,
        });
      }

      // Step 2: Final full transcript
      this.simulationTimer = setTimeout(() => {
        if (this.isExplicitlyCancelled) return;
        this.listening = false;
        if (cb.onTranscript) {
          cb.onTranscript({
            transcript,
            isFinal: true,
            confidence: 0.98,
          });
        }
        if (cb.onEnd) {
          cb.onEnd();
        }
      }, 700);
    }, 500);
  }
}

export const voiceService: IVoiceService = new VoiceServiceImpl();
