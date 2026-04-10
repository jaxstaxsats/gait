// api/config.js — serves Supabase anon key to the client
// CORS restricted to gait.run origins only

export default function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://gait.run', 'https://www.gait.run'];

  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.SUPABASE_ANON_KEY;
  if (!key) return res.status(500).json({ error: 'Key not configured' });

  res.status(200).json({ supabaseKey: key });
}
