process.env.DISABLE_HMR = 'true';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to clean markdown JSON blocks
function cleanJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

const getGroqApiKey = () => process.env.GROQ_API_KEY || process.env.GROK_API_KEY || '';

// API Endpoint: Proxy Groq API calls securely server-side
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt, model = process.env.GROQ_MODEL || process.env.GROK_MODEL || 'openai/gpt-oss-20b', json = false, inlineData } = req.body;
    const apiKey = getGroqApiKey();

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'GROQ_API_KEY is missing. Add it to your environment or .env file.'
      });
    }

    const requestPrompt = inlineData
      ? `${prompt}\n\n[Attached content metadata: ${inlineData.mimeType || 'file'}]`
      : prompt;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: requestPrompt }],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `Groq API error (${response.status}): ${errText}`
      });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';

    if (json) {
      try {
        const parsed = JSON.parse(cleanJson(text));
        return res.json({ success: true, data: parsed, text });
      } catch (err) {
        return res.json({ success: true, text, data: null });
      }
    }

    return res.json({ success: true, text });
  } catch (error: any) {
    console.error('Grok proxy error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to generate AI response' 
    });
  }
});

// API Endpoint: ElevenLabs Text-to-Speech Proxy
app.post('/api/elevenlabs/tts', async (req, res) => {
  try {
    const { text, voiceId, modelId = 'eleven_multilingual_v2', stability = 0.5, similarityBoost = 0.75 } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Text is required for TTS' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY?.trim() || '';
    if (!apiKey.startsWith('sk_')) {
      return res.status(503).json({ 
        success: false, 
        configured: false, 
        error: 'ElevenLabs needs a valid API key beginning with sk_ in the server .env file. Browser speech remains available as a fallback.'
      });
    }

    // Default to Rachel or Sarah if not specified
    const targetVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text.slice(0, 4500),
        model_id: modelId,
        voice_settings: {
          stability: Number(stability),
          similarity_boost: Number(similarityBoost),
          style: 0.15,
          use_speaker_boost: true
        }
      })
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      console.warn('ElevenLabs API error:', elevenRes.status, errText);
      return res.status(elevenRes.status).json({ 
        success: false, 
        error: `ElevenLabs API error (${elevenRes.status}): ${errText}` 
      });
    }

    // Stream or convert audio buffer to base64
    const audioArrayBuffer = await elevenRes.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);
    const base64Audio = audioBuffer.toString('base64');
    const dataUri = `data:audio/mpeg;base64,${base64Audio}`;

    return res.json({ 
      success: true, 
      audioUrl: dataUri,
      provider: 'elevenlabs',
      voiceId: targetVoiceId
    });
  } catch (error: any) {
    console.error('ElevenLabs proxy exception:', error);
    return res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to generate ElevenLabs speech' 
    });
  }
});

// API Endpoint: Check ElevenLabs status and get curated voice list
app.get('/api/elevenlabs/voices', async (_req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim() || '';
  const isConfigured = apiKey.startsWith('sk_');
  const curatedVoices = [
    { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Warm, dynamic, articulate narrator (Recommended for Nora)', gender: 'female' },
    { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Authoritative, grounded, academic', gender: 'male' },
    { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Deep, crisp, narrative guide', gender: 'male' }
  ];

  if (!isConfigured) {
    return res.json({
      configured: false,
      canUseLibraryVoices: false,
      planRestricted: false,
      message: 'ElevenLabs needs a valid API key beginning with sk_ in the server .env file. Browser speech remains available as a fallback.',
      defaultVoiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
      voices: curatedVoices
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const voiceRes = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: { 'xi-api-key': apiKey },
      signal: controller.signal
    });
    clearTimeout(timeout);

    const canUseLibraryVoices = voiceRes.ok;
    const planRestricted = voiceRes.status === 402;

    return res.json({
      configured: true,
      canUseLibraryVoices,
      planRestricted,
      message: planRestricted
        ? 'Your ElevenLabs account does not allow library voice synthesis on the current plan. Browser speech will be used immediately.'
        : undefined,
      defaultVoiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
      voices: curatedVoices
    });
  } catch (error) {
    return res.json({
      configured: true,
      canUseLibraryVoices: false,
      planRestricted: false,
      message: 'ElevenLabs verification timed out; browser speech will be used immediately.',
      defaultVoiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
      voices: curatedVoices
    });
  }
});

// Mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Learnora server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
