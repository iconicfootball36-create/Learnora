export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { prompt, model = process.env.GROQ_MODEL || process.env.GROK_MODEL || 'openai/gpt-oss-20b', json = false, inlineData } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || '';
    if (!apiKey) {
      return res.status(503).json({ success: false, error: 'AI provider is not configured on the server' });
    }

    const requestPrompt = inlineData
      ? `${prompt}\n\n[Attached content metadata: ${inlineData.mimeType || 'file'}]`
      : prompt;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: requestPrompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Groq API error (${response.status}): ${await response.text()}`,
      });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    if (!json) return res.json({ success: true, text });

    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    try {
      return res.json({ success: true, data: JSON.parse(cleaned), text });
    } catch {
      return res.json({ success: true, text, data: null });
    }
  } catch (error: any) {
    console.error('Groq proxy error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to generate AI response' });
  }
}