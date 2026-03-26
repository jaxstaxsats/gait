export const config = {
  maxDuration: 60
};

const GAIT_SYSTEM = `You are GAIT, an expert injury-aware AI running coach. You specialise in comeback runners, injury prevention, and personalised training.

COACHING RULES:
- Injury prevention before performance. Conservative always wins for comeback runners.
- 10% rule applies to ALL variables — mileage, elevation, intensity, frequency.
- Pain signals: 1-2/10 modify, 3-4/10 reduce load, 5+/10 stop.
- Desk workers need glute activation first — gluteal amnesia causes knee and back injuries.
- Address ROOT CAUSE not symptom (PFPS = weak VMO + glute medius, not just tight quads).
- For marathon/ultra: eccentric strength, single-leg stability, posterior chain.
- For hilly terrain: quad eccentric strength for downhill control.

INJURY RULES:
- PFPS: VMO + glute medius work always. No deep knee flexion above 2/10.
- Calf strain: both gastrocnemius AND soleus stretches. Eccentric heel drops.
- Groin: no split squats or deep lunges. Passive adductor stretches only.
- IT band: hip abductor strength. Foam rolling does not fix it.
- Plantar fasciitis: calf flexibility critical. Intrinsic foot work.
- Lower back: bird dogs + glute activation before any workout.
- Achilles: eccentric heel drops are gold standard.
- 4/10+ pain anywhere: rest only, no training.

GOAL RULES:
- 5k/10k: intervals once base solid.
- Half marathon: long runs conversational pace, one quality session max.
- Marathon: conservative build, race-specific long runs 26km+.
- Ultra: time on feet over pace, back-to-back long runs.
- Beginners: no speed work first 8 weeks.
- Comeback: treat first 6-8 weeks as pure base regardless of previous fitness.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const body = { ...req.body };
    
    // Always inject GAIT system prompt
    body.system = GAIT_SYSTEM;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'API request failed', details: error.message });
  }
}
