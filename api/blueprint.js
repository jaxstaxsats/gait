// api/blueprint.js — Server-side blueprint generation
// Handles both initial generation and daily refresh
// All prompts live here — nothing exposed to the client

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://gait.run');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { runnerContext, recentLogs, mode } = req.body;
  // mode: 'generate' (initial) | 'refresh' (daily evening update)

  if (!runnerContext) return res.status(400).json({ error: 'runnerContext required' });

  const isRefresh = mode === 'refresh';
  const prefix = isRefresh
    ? 'Generate part {n} of an updated GAIT Blueprint for this runner. This is a DAILY REFRESH — use the recent log data to adapt the weekly plan and injury guidance based on how they\'ve actually been feeling. Respond ONLY with valid JSON — no backticks, no text outside the JSON.'
    : 'Generate part {n} of a GAIT Blueprint for this runner. Respond ONLY with valid JSON — no backticks, no text outside the JSON.';

  const logContext = recentLogs
    ? `\nRECENT LOG DATA (last 14 days):\n${recentLogs}\n`
    : '';

  const prompt1 = `${prefix.replace('{n}', '1')}

${runnerContext}
${logContext}
Return ONLY this JSON:
{
  "name": "first name",
  "tagline": "one sentence about who this runner is",
  "primaryFocus": "the #1 thing to protect in one sentence",
  "injuryAlert": {
    "title": "main injury name",
    "level": "high/medium/low",
    "description": "2 sentences specific to this runner",
    "rules": ["rule 1", "rule 2", "rule 3"]
  },
  "weeklyPlan": [
    {"day": "MON", "type": "session type", "detail": "km and pace", "purpose": "one word purpose", "icon": "🏃", "color": "green", "zone": "Z2 — Zone 2 easy run | Z3 — moderate | Z4 — hard/tempo | strength — strength session | rest — rest or mobility"},
    {"day": "TUE", "type": "session type", "detail": "detail", "purpose": "purpose", "icon": "💪", "color": "blue", "zone": "strength"},
    {"day": "WED", "type": "session type", "detail": "km and pace", "purpose": "purpose", "icon": "🏃", "color": "yellow", "zone": "Z3"},
    {"day": "THU", "type": "Rest", "detail": "Mobility only", "purpose": "Recovery", "icon": "🧘", "color": "gray", "zone": "rest"},
    {"day": "FRI", "type": "session type", "detail": "detail", "purpose": "purpose", "icon": "💪", "color": "blue"},
    {"day": "SAT", "type": "Long Run", "detail": "km and pace", "purpose": "Endurance", "icon": "🏃", "color": "orange", "zone": "Z2"},
    {"day": "SUN", "type": "Full Rest", "detail": "NSDR + stretch", "purpose": "Recovery", "icon": "😴", "color": "gray", "zone": "rest"}
  ],
  "shoeAlert": "ONLY include if shoe age is Over 12 months — 2-sentence recommendation. Leave OUT if shoes are under 12 months old.",
  "strengthCircuit": {
    "upperBody": [
      {"name": "name", "sets": "3 × 12", "icon": "💪", "why": "why for this runner in one sentence", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"},
      {"name": "name", "sets": "3 × 10", "icon": "💪", "why": "why", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"},
      {"name": "name", "sets": "3 × 12", "icon": "💪", "why": "why", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"},
      {"name": "name", "sets": "3 × 10", "icon": "💪", "why": "why", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"}
    ],
    "legs": [
      {"name": "name", "sets": "3 × 15", "icon": "🦵", "why": "why", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"},
      {"name": "name", "sets": "3 × 12", "icon": "🦵", "why": "why", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"},
      {"name": "name", "sets": "3 × 10", "icon": "🦵", "why": "why", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"},
      {"name": "name", "sets": "3 × 12", "icon": "🦵", "why": "why", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"}
    ],
    "core": [
      {"name": "name", "sets": "3 × 10", "icon": "🔥", "why": "why", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"},
      {"name": "name", "sets": "30 sec", "icon": "🔥", "why": "why", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"},
      {"name": "name", "sets": "3 × 12", "icon": "🔥", "why": "why", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"},
      {"name": "name", "sets": "45 sec", "icon": "🔥", "why": "why", "steps": ["step 1", "step 2", "step 3"], "cue": "cue"}
    ]
  }
}`;

  const prompt2 = `${prefix.replace('{n}', '2')}

${runnerContext}
${logContext}
Return ONLY this JSON:
{
  "morningRoutine": {
    "note": "injury note or empty string",
    "spineSection": [
      {"name": "name", "duration": "1 min", "icon": "🌅", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "30 sec each side", "icon": "🌅", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "45 sec", "icon": "🌅", "instruction": "how to do it", "why": "why"}
    ],
    "hipSection": [
      {"name": "name", "duration": "10 reps each side", "icon": "🔄", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "60 sec", "icon": "🔄", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "20 sec each side", "icon": "🔄", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "30 sec each side", "icon": "🔄", "instruction": "how to do it", "why": "why"}
    ],
    "activationSection": [
      {"name": "name", "duration": "2 × 12 reps", "icon": "⚡", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "10 reps each side", "icon": "⚡", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "15 reps each side", "icon": "⚡", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "12 reps each side", "icon": "⚡", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "10 reps each foot", "icon": "⚡", "instruction": "how to do it", "why": "why"}
    ]
  },
  "eveningRoutine": {
    "note": "injury note or empty string",
    "stretches": [
      {"name": "name", "duration": "60-90 sec each side", "icon": "🌙", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "60 sec", "icon": "🌙", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "90 sec each side", "icon": "🌙", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "60 sec each leg", "icon": "🌙", "instruction": "how to do it", "why": "why"},
      {"name": "name", "duration": "60 sec", "icon": "🌙", "instruction": "how to do it", "why": "why"}
    ]
  },
  "mileageRules": [
    {"rule": "rule 1", "type": "green"},
    {"rule": "rule 2", "type": "amber"},
    {"rule": "rule 3", "type": "red"},
    {"rule": "rule 4", "type": "amber"},
    {"rule": "rule 5", "type": "green"},
    {"rule": "rule 6", "type": "red"}
  ],
  "milestones": [
    {"period": "Month 1", "target": "target", "focus": "focus"},
    {"period": "Month 2", "target": "target", "focus": "focus"},
    {"period": "Month 3", "target": "target", "focus": "focus"},
    {"period": "6 Months", "target": "target", "focus": "focus"},
    {"period": "Big Vision", "target": "target", "focus": "focus"}
  ],
  "dailyHabit": {
    "title": "habit name",
    "duration": "X min daily",
    "description": "what to do",
    "why": "why this prevents their injury"
  },
  "sleepCoaching": "ONLY include if sleep quality is Poor or Average — 3-4 sentences on why sleep matters for injury-prone runners, then 3 specific habits. Leave OUT if sleep is Good or Excellent.",
  "stressNote": "ONLY include if stress is High or Very high — 2-3 sentences connecting stress to injury risk and 2 specific habits. Leave OUT if stress is Low or Moderate."
}`;

  try {
    const [res1, res2] = await Promise.all([
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt1 }] })
      }),
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt2 }] })
      })
    ]);

    const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
    res.status(200).json({ part1: data1, part2: data2 });
  } catch (e) {
    res.status(500).json({ error: 'Blueprint API error', detail: e.message });
  }
}
