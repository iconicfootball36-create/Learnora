// ElevenLabs Voice & Speech Service for Learnora & Nora AI Tutor
export interface ElevenLabsVoice {
  voiceId: string;
  name: string;
  description: string;
  gender: 'female' | 'male';
}

export interface VoiceStatus {
  configured: boolean;
  defaultVoiceId: string;
  canUseLibraryVoices?: boolean;
  planRestricted?: boolean;
  message?: string;
  voices: ElevenLabsVoice[];
}

export class VoiceService {
  private static cachedStatus: VoiceStatus | null = null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static selectedVoiceId: string = 'EXAVITQu4vr4xnSDxMaL'; // Sarah default for Nora
  private static activePlayToken: number = 0;
  private static isSpeakingFallback: boolean = false;

  static getPlaybackRate(): number {
    const saved = Number(localStorage.getItem('learnora_voice_rate') || '1');
    return Number.isFinite(saved) && saved > 0 ? saved : 1;
  }

  static setPlaybackRate(rate: number) {
    const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1;
    localStorage.setItem('learnora_voice_rate', String(safeRate));
  }

  static getSelectedVoiceId(): string {
    const savedVoiceId = localStorage.getItem('learnora_voice_id');
    if (savedVoiceId && ['21m00Tcm4TlvDq8ikWAM', 'AZnzlk1XvdvUeBnXmlld', 'TxGEqnHWrfWFTfGW9XjX'].includes(savedVoiceId)) {
      this.setSelectedVoiceId('EXAVITQu4vr4xnSDxMaL');
      return 'EXAVITQu4vr4xnSDxMaL';
    }
    return savedVoiceId || this.selectedVoiceId;
  }

  static setSelectedVoiceId(voiceId: string) {
    this.selectedVoiceId = voiceId;
    localStorage.setItem('learnora_voice_id', voiceId);
  }

  static getUserKeyOverride(): string {
    return localStorage.getItem('learnora_elevenlabs_user_key') || '';
  }

  static setUserKeyOverride(key: string) {
    if (key) {
      localStorage.setItem('learnora_elevenlabs_user_key', key);
    } else {
      localStorage.removeItem('learnora_elevenlabs_user_key');
    }
  }

  /**
   * Fetch configured status and curated voice presets from backend
   */
  static async getVoiceStatus(): Promise<VoiceStatus> {
    if (this.cachedStatus) return this.cachedStatus;

    try {
      const res = await fetch('/api/elevenlabs/voices');
      if (res.ok) {
        const data = await res.json();
        const nextStatus: VoiceStatus = {
          ...data,
          canUseLibraryVoices: data.canUseLibraryVoices ?? data.configured ?? true,
          planRestricted: !!data.planRestricted,
          message: data.message || undefined,
          voices: data.voices || []
        };
        this.cachedStatus = nextStatus;
        if (data.defaultVoiceId && !localStorage.getItem('learnora_voice_id')) {
          this.selectedVoiceId = data.defaultVoiceId;
        }
        return nextStatus;
      }
    } catch (e) {
      console.warn('Could not fetch ElevenLabs status:', e);
    }

    const fallback: VoiceStatus = {
      configured: false,
      defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL',
      canUseLibraryVoices: false,
      planRestricted: false,
      message: 'ElevenLabs is not available right now; browser speech will be used instead.',
      voices: [
        { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Warm, dynamic, articulate narrator (Recommended for Nora)', gender: 'female' },
        { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Authoritative, grounded, academic', gender: 'male' }
      ]
    };
    this.cachedStatus = fallback;
    return fallback;
  }

  static shouldUseElevenLabsForPlayback(status?: Partial<VoiceStatus>): boolean {
    if (!status) return true;
    if (!status.configured) return false;
    if (status.planRestricted || status.canUseLibraryVoices === false) return false;
    return true;
  }

  private static markQuotaExceeded(voiceId: string, message: string) {
    this.cachedStatus = {
      ...(this.cachedStatus || { configured: true, defaultVoiceId: voiceId, voices: [] }),
      configured: true,
      canUseLibraryVoices: false,
      planRestricted: true,
      message,
    };
  }

  private static async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  /**
   * Cleans formatting markdown and emojis for clean, uninterrupted speech reading
   */
  static cleanForSpeech(raw: string): string {
    return raw
      .replace(/```[\s\S]*?```/g, '') // remove code blocks
      .replace(/`([^`]+)`/g, '$1') // remove inline code marks
      .replace(/[*#_~>]/g, '') // strip markdown markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown links
      .replace(/[-*+]\s+/g, '') // strip bullet dashes
      .replace(/\n{2,}/g, '. ') // turn paragraph breaks into natural pauses
      .replace(/\n/g, ' ')
      .trim();
  }

  /**
   * Splits a long text into natural sentence-sized audio chunks (<= 200 chars)
   * This guarantees that browser speech synthesis never times out or hits the 15-second speech limit.
   */
  static splitIntoSentences(text: string): string[] {
    const rawSentences = text.match(/[^.!?]+[.!?]+|\S+/g) || [text];
    const chunks: string[] = [];
    let current = '';

    for (const s of rawSentences) {
      const sentence = s.trim();
      if (!sentence) continue;

      if ((current + ' ' + sentence).length <= 200) {
        current = current ? `${current} ${sentence}` : sentence;
      } else {
        if (current) chunks.push(current);
        if (sentence.length > 200) {
          // split on commas or spaces if an individual sentence is unusually long
          const words = sentence.split(' ');
          let sub = '';
          for (const w of words) {
            if ((sub + ' ' + w).length <= 200) {
              sub = sub ? `${sub} ${w}` : w;
            } else {
              if (sub) chunks.push(sub);
              sub = w;
            }
          }
          if (sub) current = sub;
          else current = '';
        } else {
          current = sentence;
        }
      }
    }

    if (current) chunks.push(current);
    return chunks.length > 0 ? chunks : [text];
  }

  /**
   * Generate and stream speech using ElevenLabs (with robust, uninterrupted Web Speech fallback)
   */
  static async speak(params: {
    text: string;
    voiceId?: string;
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }): Promise<{ provider: 'elevenlabs' | 'webspeech'; audioUrl?: string; error?: string }> {
    this.stop();

    const cleanText = this.cleanForSpeech(params.text);
    if (!cleanText) return { provider: 'webspeech' };

    const token = ++this.activePlayToken;
    const targetVoiceId = params.voiceId || this.getSelectedVoiceId();
    const playbackRate = params.rate ?? this.getPlaybackRate();
    let providerError: string | undefined;

    try {
      const status = await this.getVoiceStatus();
      const shouldUseElevenLabs = this.shouldUseElevenLabsForPlayback(status);
      if (!shouldUseElevenLabs) {
        if (this.activePlayToken === token) {
          this.fallbackWebSpeech(cleanText, token, params.onStart, params.onEnd);
        }
        return { provider: 'webspeech', error: status.message || 'ElevenLabs library voices are unavailable on this account.' };
      }

      const userKey = this.getUserKeyOverride();
      let audioUri: string | null = null;

      if (userKey) {
        // Direct browser call with user's personal key
        const directRes = await this.fetchWithTimeout(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': userKey
          },
          body: JSON.stringify({
            text: cleanText.slice(0, 4500),
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        }, 2000);

        if (directRes.ok) {
          const blob = await directRes.blob();
          audioUri = URL.createObjectURL(blob);
        } else {
          const data = await directRes.json().catch(() => ({}));
          providerError = data?.detail?.message || data?.message || `ElevenLabs API error (${directRes.status})`;
          if (data?.detail?.code === 'quota_exceeded') {
            providerError = 'ElevenLabs quota is exhausted. Browser speech will be used instead.';
            this.markQuotaExceeded(targetVoiceId, providerError);
          }
        }
      }

      if (!audioUri && !providerError?.includes('quota is exhausted')) {
        // Request through secure server proxy
        const res = await this.fetchWithTimeout('/api/elevenlabs/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            voiceId: targetVoiceId
          })
        }, 2000);

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.audioUrl) {
            audioUri = data.audioUrl;
          } else if (data.code === 'quota_exceeded') {
            providerError = data.error || 'ElevenLabs quota is exhausted. Browser speech will be used instead.';
            this.markQuotaExceeded(targetVoiceId, providerError);
          }
        } else {
          const data = await res.json().catch(() => ({}));
          providerError = data.error || `ElevenLabs API error (${res.status})`;
        }
      }

      if (audioUri && this.activePlayToken === token) {
        const audio = new Audio(audioUri);
        this.currentAudio = audio;

        audio.onplay = () => params.onStart?.();
        audio.onended = () => {
          if (this.activePlayToken === token) {
            params.onEnd?.();
            this.currentAudio = null;
          }
        };
        audio.onerror = (e) => {
          console.warn('Audio element error, falling back to seamless chunked speech:', e);
          if (this.activePlayToken === token) {
            this.fallbackWebSpeech(cleanText, token, params.onStart, params.onEnd);
          }
        };

        await audio.play();
        return { provider: 'elevenlabs', audioUrl: audioUri };
      }
    } catch (err) {
      console.warn('ElevenLabs request failed, falling back to chunked Web Speech:', err);
      providerError = err instanceof Error ? err.message : 'ElevenLabs speech generation failed.';
    }

    if (providerError?.toLowerCase().includes('paid_plan_required') || providerError?.includes('402')) {
      this.cachedStatus = {
        ...(this.cachedStatus || { configured: true, defaultVoiceId: targetVoiceId, voices: [] }),
        configured: true,
        canUseLibraryVoices: false,
        planRestricted: true,
        message: 'Your ElevenLabs plan does not allow library voice synthesis. Browser speech is being used instead.'
      };
    }

    // High quality chunked fallback: avoids Chrome 15-second speech cut-off
    if (this.activePlayToken === token) {
      this.fallbackWebSpeech(cleanText, token, params.onStart, params.onEnd, playbackRate);
    }
    return { provider: 'webspeech', error: providerError };
  }

  /**
   * Stop all active voice audio (both ElevenLabs audio element and browser speech synthesis)
   */
  static stop() {
    this.activePlayToken++;
    this.isSpeakingFallback = false;

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Robust chunked queue execution for Web Speech API.
   * Browsers (Chrome, Edge, Safari) cut off speech synthesis if a single utterance exceeds ~15 seconds.
   * Playing short chunks sequentially with keep-alive guarantees complete, uninterrupted lecture playback.
   */
  private static fallbackWebSpeech(
    text: string,
    token: number,
    onStart?: () => void,
    onEnd?: () => void,
    rate: number = 1
  ) {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    const chunks = this.splitIntoSentences(text);
    if (chunks.length === 0) {
      onEnd?.();
      return;
    }

    let currentIndex = 0;
    this.isSpeakingFallback = true;
    onStart?.();

    const playNextChunk = (preferredVoice: SpeechSynthesisVoice | null) => {
      if (this.activePlayToken !== token || !this.isSpeakingFallback) {
        return;
      }

      if (currentIndex >= chunks.length) {
        this.isSpeakingFallback = false;
        onEnd?.();
        return;
      }

      const chunkText = chunks[currentIndex];
      currentIndex++;

      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.rate = Math.max(0.5, Math.min(2, rate));
      utterance.pitch = 1.02;
      utterance.volume = 1;
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        if (this.activePlayToken === token && this.isSpeakingFallback) {
          playNextChunk(preferredVoice);
        }
      };

      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') {
          if (this.activePlayToken === token && this.isSpeakingFallback) {
            this.isSpeakingFallback = false;
            onEnd?.();
          }
          return;
        }
        console.warn('Speech chunk error:', e);
        if (this.activePlayToken === token && this.isSpeakingFallback) {
          playNextChunk(preferredVoice);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    void this.resolvePreferredSpeechVoice().then((preferredVoice) => {
      if (this.activePlayToken !== token || !this.isSpeakingFallback) {
        return;
      }
      playNextChunk(preferredVoice);
    }).catch(() => {
      if (this.activePlayToken === token && this.isSpeakingFallback) {
        playNextChunk(null);
      }
    });
  }

  static async waitForSpeechVoices(timeoutMs: number = 2000): Promise<SpeechSynthesisVoice[]> {
    if (!('speechSynthesis' in window)) {
      return [];
    }

    const currentVoices = window.speechSynthesis.getVoices();
    if (currentVoices.length > 0) {
      return currentVoices;
    }

    return await new Promise((resolve) => {
      const previousHandler = window.speechSynthesis.onvoiceschanged;
      let settled = false;

      const finish = (voices: SpeechSynthesisVoice[]) => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        window.speechSynthesis.onvoiceschanged = previousHandler || null;
        resolve(voices);
      };

      const onVoicesReady = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          finish(voices);
        }
      };

      const timer = globalThis.setTimeout(() => {
        finish(window.speechSynthesis.getVoices());
      }, timeoutMs);

      window.speechSynthesis.onvoiceschanged = onVoicesReady;
    });
  }

  static pickSpeechSynthesisVoice(voices: SpeechSynthesisVoice[], selectedVoiceId: string): SpeechSynthesisVoice | null {
    if (!voices.length) return null;

    const labelMap = voices.map((voice) => ({
      voice,
      label: voice.name.toLowerCase(),
      lang: voice.lang.toLowerCase()
    }));

    const femaleHints = ['zira', 'aria', 'samantha', 'susan', 'hazel', 'victoria', 'jenny', 'rachel', 'female', 'woman', 'girl'];
    const maleHints = ['david', 'mark', 'daniel', 'male', 'man', 'guy', 'harry', 'john', 'adam', 'antoni'];

    const preferredHints =
      selectedVoiceId === 'EXAVITQu4vr4xnSDxMaL'
        ? femaleHints
        : selectedVoiceId === 'ErXwobaYiN019PkySvjV' || selectedVoiceId === 'pNInz6obpgDQGcFmaJgB'
          ? maleHints
          : [...femaleHints, ...maleHints];

    const scored = labelMap
      .map(({ voice, label, lang }) => {
        let score = 0;

        if (/english/i.test(lang)) score += 12;
        if (preferredHints.some((hint) => label.includes(hint))) score += 55;
        if (selectedVoiceId === 'EXAVITQu4vr4xnSDxMaL' && femaleHints.some((hint) => label.includes(hint))) score += 30;
        if ((selectedVoiceId === 'ErXwobaYiN019PkySvjV' || selectedVoiceId === 'pNInz6obpgDQGcFmaJgB') && maleHints.some((hint) => label.includes(hint))) score += 30;

        if ((!selectedVoiceId || selectedVoiceId === 'EXAVITQu4vr4xnSDxMaL') && /female|woman|girl/i.test(label)) score += 20;
        if ((selectedVoiceId === 'ErXwobaYiN019PkySvjV' || selectedVoiceId === 'pNInz6obpgDQGcFmaJgB') && /male|man|boy/i.test(label)) score += 20;

        return { voice, score };
      })
      .sort((a, b) => b.score - a.score || a.voice.name.localeCompare(b.voice.name));

    return scored[0]?.voice || voices.find((voice) => /english/i.test(voice.lang)) || voices[0] || null;
  }

  private static async resolvePreferredSpeechVoice(): Promise<SpeechSynthesisVoice | null> {
    if (!('speechSynthesis' in window)) return null;
    const voices = await this.waitForSpeechVoices();
    if (!voices.length) return null;
    return this.pickSpeechSynthesisVoice(voices, this.getSelectedVoiceId());
  }

  private static findPreferredSpeechVoice(): SpeechSynthesisVoice | null {
    if (!('speechSynthesis' in window)) return null;

    const selectedVoiceId = this.getSelectedVoiceId();
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    return this.pickSpeechSynthesisVoice(voices, selectedVoiceId);
  }
}
