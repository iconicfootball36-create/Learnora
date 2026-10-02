import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceService } from './voiceService';

test('short-circuits when ElevenLabs library voices are blocked by plan restrictions', () => {
  assert.equal(
    VoiceService.shouldUseElevenLabsForPlayback({
      configured: true,
      defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL',
      canUseLibraryVoices: false,
      planRestricted: true,
      voices: []
    }),
    false
  );
});

test('keeps ElevenLabs enabled when library voices are available', () => {
  assert.equal(
    VoiceService.shouldUseElevenLabsForPlayback({
      configured: true,
      defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL',
      canUseLibraryVoices: true,
      voices: []
    }),
    true
  );
});

test('waits for browser voices to load before choosing the selected Nora voice', async () => {
  const originalWindow = globalThis.window;
  const originalSpeechSynthesis = globalThis.speechSynthesis;

  const voices = [
    { name: 'Microsoft David Desktop', lang: 'en-US' },
    { name: 'Microsoft Aria Desktop', lang: 'en-US' }
  ] as SpeechSynthesisVoice[];

  let voiceList = [] as SpeechSynthesisVoice[];

  globalThis.window = {
    speechSynthesis: {
      getVoices: () => voiceList,
      cancel: () => {},
      onvoiceschanged: null,
      speak: () => {}
    }
  } as any;

  globalThis.speechSynthesis = globalThis.window.speechSynthesis as any;

  const promise = VoiceService.waitForSpeechVoices();
  voiceList = voices;
  globalThis.speechSynthesis.onvoiceschanged?.(new Event('voiceschanged'));

  const resolved = await promise;
  const chosen = VoiceService.pickSpeechSynthesisVoice(resolved, 'EXAVITQu4vr4xnSDxMaL');

  assert.equal(chosen?.name, 'Microsoft Aria Desktop');

  globalThis.window = originalWindow;
  globalThis.speechSynthesis = originalSpeechSynthesis;
});
