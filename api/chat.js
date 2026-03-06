// api/chat.js  –  Vercel Serverless Function

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROK_API_KEY が未設定です' });

  try {
    const { system, userMessage } = req.body;
    if (!userMessage) return res.status(400).json({ error: 'userMessage は必須です' });

    const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-latest',
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: userMessage },
        ],
        max_tokens: 400,
        temperature: 0.9,
      }),
    });

    if (!grokRes.ok) {
      const err = await grokRes.json().catch(() => ({}));
      return res.status(grokRes.status).json({
        error: err.error?.message || `Grok API Error: ${grokRes.status}`,
      });
    }

    const data = await grokRes.json();
    const text = data.choices?.[0]?.message?.content ?? '（コメント取得失敗）';
    return res.status(200).json({ text });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || '内部エラー' });
  }
}
