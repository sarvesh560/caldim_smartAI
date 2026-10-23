/**
 * CALDIM SmartAssist Companion — Browser Speech & Audio Service
 *
 * Requirements:
 * - Uses browser speechSynthesis where supported
 * - Only speaks following a user gesture (never autoplay on mount)
 * - Prevents overlapping utterances
 * - Gracefully handles unsupported browsers and speech errors
 * - Provides cancel, mute, and voice selection
 */

class SpeechService {
  private hasUserInteracted = false;
  private isMuted = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private preferredVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Load voices when available
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoice();
        };
      }
      this.initVoice();
    }
  }

  private initVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const voices = window.speechSynthesis.getVoices();
      // Look for a pleasant English voice (e.g. Google US English, Samantha, Microsoft Zira, natural voice)
      this.preferredVoice =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0] ||
        null;
    } catch {
      this.preferredVoice = null;
    }
  }

  /**
   * Mark that the user has performed a gesture (touch/click)
   */
  public registerUserGesture() {
    this.hasUserInteracted = true;
  }

  private isSpeakingAudio = false;
  private lastSpokenText = '';
  private lastSpokenTimestamp = 0;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getVoicesCount(): number {
    if (!this.isSupported()) return 0;
    try {
      return window.speechSynthesis.getVoices().length;
    } catch {
      return 0;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.cancel();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public isPlaying(): boolean {
    return this.isSpeakingAudio && this.currentUtterance !== null;
  }

  public cancel() {
    this.isSpeakingAudio = false;
    this.currentUtterance = null;
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Silently ignore
      }
    }
  }

  /**
   * Speak a phrase if user has interacted and audio is not muted.
   * Avoids repeating the exact same utterance within 1.5 seconds.
   */
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (!this.isSupported()) return false;
    if (this.isMuted) return false;
    if (!this.hasUserInteracted) return false;

    const trimmed = text.trim();
    if (!trimmed) return false;

    const now = Date.now();
    if (trimmed === this.lastSpokenText && now - this.lastSpokenTimestamp < 1500) {
      return false; // Prevent duplicate immediate speech
    }

    this.lastSpokenText = trimmed;
    this.lastSpokenTimestamp = now;

    try {
      // Cancel any ongoing speech to prevent overlapping
      this.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmed);
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }
      utterance.pitch = 1.2; // Slightly higher pitch for friendly companion
      utterance.rate = 1.05; // Slightly brisk, intelligent tempo
      utterance.volume = 0.9;

      utterance.onstart = () => {
        this.isSpeakingAudio = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isSpeakingAudio = false;
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.isSpeakingAudio = false;
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      this.isSpeakingAudio = false;
      this.currentUtterance = null;
      console.warn('[CALDIM Speech Service] Speech synthesis error:', err);
      return false;
    }
  }
}

export const speechService = new SpeechService();
