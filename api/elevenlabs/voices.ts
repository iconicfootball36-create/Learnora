const defaultVoiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
const voices = [
  { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Warm, dynamic, articulate narrator (Recommended for Nora)', gender: 'female' },
  { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Authoritative, grounded, academic', gender: 'male' },
  { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Deep, crisp, narrative guide', gender: 'male' },
];

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ configured: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim() || '';
  if (!apiKey.startsWith('sk_')) {
    return res.json({
      configured: false,
      canUseLibraryVoices: false,
      planRestricted: false,
      message: 'ElevenLabs is not configured on the server. Browser speech remains available as a fallback.',
      defaultVoiceId,
      voices,
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
      signal: controller.signal,
    });
    return res.json({
      configured: true,
      canUseLibraryVoices: response.ok,
      planRestricted: response.status === 402,
      message: response.status === 402
        ? 'Your ElevenLabs plan does not allow library voice synthesis; browser speech will be used.'
        : undefined,
      defaultVoiceId,
      voices,
    });
  } catch {
    return res.json({
      configured: true,
      canUseLibraryVoices: false,
      planRestricted: false,
      message: 'ElevenLabs verification timed out; browser speech will be used immediately.',
      defaultVoiceId,
      voices,
    });
  } finally {
    clearTimeout(timeout);
  }
}