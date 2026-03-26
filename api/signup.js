export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, newsletter, goal, injuries, terrain } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/appYB6RXdFVOpFSwk/tblCiXzb05zec7XrO`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`
        },
        body: JSON.stringify({
          fields: {
            Name: name || '',
            Email: email,
            Newsletter: newsletter || false,
            Goal: goal || '',
            Injuries: injuries || '',
            Terrain: terrain || '',
            Date: new Date().toISOString().split('T')[0]
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Airtable error', details: data });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
