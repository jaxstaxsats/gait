export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    return res.status(500).json({ error: 'Supabase key not configured' });
  }

  return res.status(200).json({ supabaseKey });
}
