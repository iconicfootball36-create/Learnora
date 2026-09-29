process.env.DISABLE_HMR = 'true';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

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

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

// API Endpoint: Proxy Gemini API calls securely server-side
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt, model = 'gemini-3.8-flash', json = false, inlineData } = req.body;
    const client = getGeminiClient();

    let contents: any = prompt;
    if (inlineData) {
      contents = [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: inlineData.data,
                mimeType: inlineData.mimeType
              }
            },
            { text: prompt }
          ]
        }
      ];
    }

    const config: any = {};
    if (json) {
      config.responseMimeType = 'application/json';
    }

    const response = await client.models.generateContent({
      model,
      contents,
      config
    });

    const text = response.text || '';
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
    console.error('Gemini proxy error:', error);
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

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ 
        success: false, 
        configured: false, 
        error: 'ELEVENLABS_API_KEY is not configured on server. Fallback to Web Speech Synthesis.' 
      });
    }

    // Default to Rachel or Sarah if not specified
    const targetVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

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
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.length > 5);

  const curatedVoices = [
    { voiceId: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm, clear, empathetic lecturer (Recommended for Nora)', gender: 'female' },
    { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Warm, dynamic, articulate narrator', gender: 'female' },
    { voiceId: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Energetic, engaging, enthusiastic', gender: 'female' },
    { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Authoritative, grounded, academic', gender: 'male' },
    { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Deep, crisp, narrative guide', gender: 'male' },
    { voiceId: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', description: 'Young, relatable, conversational peer', gender: 'male' }
  ];

  return res.json({
    configured: isConfigured,
    defaultVoiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
    voices: curatedVoices
  });
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
