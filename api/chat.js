// api/chat.js - Vercel Serverless Function (CommonJS)
// Grok API プロキシ + Supabase データ永続化

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  const GROK_KEY    = process.env.GROK_API_KEY;

  // ── Supabase ヘルパー ──
  const sbHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };

  async function sbGet(table, params = '') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: sbHeaders });
    if (!r.ok) throw new Error(`Supabase GET error: ${r.status}`);
    return r.json();
  }

  async function sbInsert(table, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message || `Supabase INSERT error: ${r.status}`);
    }
    return r.json();
  }

  async function sbDelete(table, id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: sbHeaders,
    });
    if (!r.ok) throw new Error(`Supabase DELETE error: ${r.status}`);
    return true;
  }

  try {
    const { action } = req.query || {};

    // ══════════════════════════════
    //  GET: レコード取得
    // ══════════════════════════════
    if (req.method === 'GET') {
      if (action === 'records') {
        const data = await sbGet('records', 'order=created_at.desc&limit=500');
        return res.status(200).json(data);
      }
      if (action === 'diagnoses') {
        const data = await sbGet('diagnoses', 'order=created_at.desc&limit=50');
        return res.status(200).json(data);
      }
      return res.status(400).json({ error: 'action パラメータが必要です' });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const body = req.body || {};

    // ══════════════════════════════
    //  POST: AI コメント生成
    // ══════════════════════════════
    if (action === 'chat' || (!action && body.userMessage)) {
      if (!GROK_KEY) return res.status(500).json({ error: 'GROK_API_KEY が未設定です' });
      const { system, userMessage } = body;
      if (!userMessage) return res.status(400).json({ error: 'userMessage は必須です' });

      const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROK_KEY}` },
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
        const e = await grokRes.json().catch(() => ({}));
        return res.status(grokRes.status).json({ error: e.error?.message || `Grok API Error: ${grokRes.status}` });
      }
      const data = await grokRes.json();
      return res.status(200).json({ text: data.choices?.[0]?.message?.content ?? '（取得失敗）' });
    }

    // ══════════════════════════════
    //  POST: カルテ記録保存
    // ══════════════════════════════
    if (action === 'save_record') {
      const r = body.record;
      if (!r) return res.status(400).json({ error: 'record が必要です' });
      const inserted = await sbInsert('records', {
        method:         r.method || null,
        onahole:        r.onahole || null,
        onahole_name:   r.onaholeName || null,
        duration:       r.duration || null,
        sits:           r.sits || [],
        meds:           r.meds || [],
        satisfaction:   r.sat || null,
        volume:         r.vol || null,
        interval_hours: r.interval || null,
        memo:           r.memo || null,
        comments:       r.comments || null,
      });
      return res.status(200).json(inserted[0] || inserted);
    }

    // ══════════════════════════════
    //  POST: カルテ記録削除
    // ══════════════════════════════
    if (action === 'delete_record') {
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'id が必要です' });
      await sbDelete('records', id);
      return res.status(200).json({ ok: true });
    }

    // ══════════════════════════════
    //  POST: 診断保存
    // ══════════════════════════════
    if (action === 'save_diagnosis') {
      const d = body.diagnosis;
      if (!d) return res.status(400).json({ error: 'diagnosis が必要です' });
      const inserted = await sbInsert('diagnoses', {
        type:       d.type || null,
        scores:     d.scores || {},
        answers:    d.answers || {},
        ai_comment: d.aiComment || null,
      });
      return res.status(200).json(inserted[0] || inserted);
    }

    return res.status(400).json({ error: '不明なアクションです' });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message || '内部エラー' });
  }
};
