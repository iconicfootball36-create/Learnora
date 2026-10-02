export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { text, voiceId, modelId = 'eleven_multilingual_v2', stability = 0.5, similarityBoost = 0.75 } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required for TTS' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY?.trim() || '';
    if (!apiKey.startsWith('sk_')) {
      return res.status(503).json({
        success: false,
        configured: false,
        error: 'ElevenLabs is not configured on the server. Browser speech remains available as a fallback.',
      });
    }

    const targetVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(targetVoiceId)}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text.slice(0, 4500),
        model_id: modelId,
        voice_settings: {
          stability: Number(stability),
          similarity_boost: Number(similarityBoost),
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `ElevenLabs API error (${response.status}): ${await response.text()}`,
      });
    }

    const audio = Buffer.from(await response.arrayBuffer()).toString('base64');
    return res.json({
      success: true,
      audioUrl: `data:audio/mpeg;base64,${audio}`,
      provider: 'elevenlabs',
      voiceId: targetVoiceId,
    });
  } catch (error: any) {
    console.error('ElevenLabs proxy exception:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to generate ElevenLabs speech' });
  }
}