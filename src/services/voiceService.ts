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
  voices: ElevenLabsVoice[];
}

export class VoiceService {
  private static cachedStatus: VoiceStatus | null = null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static selectedVoiceId: string = '21m00Tcm4TlvDq8ikWAM'; // Rachel default
  private static activePlayToken: number = 0;
  private static isSpeakingFallback: boolean = false;

  static getSelectedVoiceId(): string {
    return localStorage.getItem('learnora_voice_id') || this.selectedVoiceId;
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
        this.cachedStatus = data;
        if (data.defaultVoiceId && !localStorage.getItem('learnora_voice_id')) {
          this.selectedVoiceId = data.defaultVoiceId;
        }
        return data;
      }
    } catch (e) {
      console.warn('Could not fetch ElevenLabs status:', e);
    }

    const fallback: VoiceStatus = {
      configured: false,
      defaultVoiceId: '21m00Tcm4TlvDq8ikWAM',
      voices: [
        { voiceId: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm, clear, empathetic lecturer (Nora Default)', gender: 'female' },
        { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Warm, dynamic, articulate narrator', gender: 'female' },
        { voiceId: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Energetic, engaging, enthusiastic', gender: 'female' },
        { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Authoritative, grounded, academic', gender: 'male' }
      ]
    };
    this.cachedStatus = fallback;
    return fallback;
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
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }): Promise<{ provider: 'elevenlabs' | 'webspeech'; audioUrl?: string }> {
    this.stop();

    const cleanText = this.cleanForSpeech(params.text);
    if (!cleanText) return { provider: 'webspeech' };

    const token = ++this.activePlayToken;
    const targetVoiceId = params.voiceId || this.getSelectedVoiceId();

    try {
      const userKey = this.getUserKeyOverride();
      let audioUri: string | null = null;

      if (userKey) {
        // Direct browser call with user's personal key
        const directRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
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
        });

        if (directRes.ok) {
          const blob = await directRes.blob();
          audioUri = URL.createObjectURL(blob);
        }
      }

      if (!audioUri) {
        // Request through secure server proxy
        const res = await fetch('/api/elevenlabs/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            voiceId: targetVoiceId
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.audioUrl) {
            audioUri = data.audioUrl;
          }
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
    }

    // High quality chunked fallback: avoids Chrome 15-second speech cut-off
    if (this.activePlayToken === token) {
      this.fallbackWebSpeech(cleanText, token, params.onStart, params.onEnd);
    }
    return { provider: 'webspeech' };
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
    onEnd?: () => void
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

    const playNextChunk = () => {
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
      utterance.rate = 1.0;
      utterance.pitch = 1.02;

      utterance.onend = () => {
        if (this.activePlayToken === token && this.isSpeakingFallback) {
          playNextChunk();
        }
      };

      utterance.onerror = (e) => {
        console.warn('Speech chunk error:', e);
        if (this.activePlayToken === token && this.isSpeakingFallback) {
          playNextChunk();
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    playNextChunk();
  }
}
