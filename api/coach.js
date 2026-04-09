// api/coach.js — Server-side coaching prompt construction
// Client sends structured data, server builds the prompt and calls Claude
// This keeps all prompt logic and runner context off the client

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://gait.run');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const {
    blueprint,      // runner's current blueprint object
    recentLogs,     // last 7 log entries (pre-serialised strings)
    todayContext,   // structured today data
    dayMode,        // run | cross | walk | rest | morning | evening | body
    sleep, stress, notes,
    pushModeActive,
    // run-specific
    crossActivity, crossDistance, bodyDayType,
    morningPlan, morningDuration, eveningDuration, eveningSleepTarget
  } = req.body;

  if (!dayMode) return res.status(400).json({ error: 'dayMode required' });

  // Build context — use blueprint if available, otherwise empty fallback
  const bibleContext = blueprint
    ? JSON.stringify(blueprint)
    : 'No blueprint yet — coach based on the log data provided.';

  const prompt = buildCoachingPrompt({
    bibleContext, recentLogs, todayContext, dayMode,
    sleep, stress, notes, pushModeActive,
    crossActivity, crossDistance, bodyDayType,
    morningPlan, morningDuration, eveningDuration, eveningSleepTarget
  });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1600,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Claude API error', detail: e.message });
  }
}

function buildCoachingPrompt({
  bibleContext, recentLogs, todayContext, dayMode,
  sleep, stress, notes, pushModeActive,
  crossActivity, bodyDayType, morningPlan, morningDuration,
  eveningDuration, eveningSleepTarget
}) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const modeInstructions = {
    walk: `This is a walk or hike session. Consider how the terrain, elevation and pace affect load relative to the runner's injury history. Advise on recovery appropriate to the effort and how it influences tomorrow's plan.`,
    cross: `This is a cross training session. Consider how ${crossActivity} affects the runner's overall training load and recovery needs relative to their running plan and injury history. Advise on recovery specific to cross training and how it should influence tomorrow's run plan.`,
    body: `This is a mid-day body check — the runner has NOT run yet today. Their plan for today is: ${bodyDayType}.
For the "recovery" array: give 3-4 PRE-SESSION preparation movements they should do BEFORE their session today — warmup, activation drills, or mobility work specific to what they are doing (${bodyDayType}) and their injury history. NOT an evening routine.
For "tomorrowPlan": use type "Today's Plan" and give exactly what they should do in today's session, with specific details adjusted based on how they feel right now.`,
    morning: `This is a MORNING CHECK-IN at the start of the day.
Always give 7-8 morning exercises ordered from shortest/easiest to longest — the runner will pick 15/30/45 min on the response page which filters how many they see. So order matters: put the 3 most essential exercises first (spine, glute activation, one hip mobility), then add more for 30 min, then the full set for 45 min.
For "tomorrowPlan": use type "Today's Session" and give exactly what they should do in their planned session today (${morningPlan}), adjusted to their pain score and energy level this morning.`,
    evening: `This is an EVENING CHECK-IN at the end of the day.
Always give 7-8 evening recovery movements ordered from most essential to least — the runner will pick 15/30/45 min on the response page. Order matters: put the 3 most essential first (parasympathetic reset, one long-hold stretch, one gentle mobility), then build to the full set for 45 min.
Include sleep hygiene tips in the tomorrowPlan based on their target sleep time (${eveningSleepTarget}).
For "tomorrowPlan": give a specific plan for tomorrow based on how they felt today and their injury history.`
  };

  return `RUNNER'S BLUEPRINT & HISTORY:
${bibleContext}

RECENT LOG HISTORY (last 7 entries):
${recentLogs || 'No previous logs yet'}

TODAY — ${today}:
${todayContext}
Sleep last night: ${sleep || 'Not specified'}
Stress: ${stress || 'Not specified'}
Notes: ${notes || 'None'}
${pushModeActive ? '\nMODE: PUSH — runner has been pain-free 28+ days. Apply Push Mode rules.' : ''}

${modeInstructions[dayMode] || ''}

Respond with ONLY a raw JSON object. No backticks. No markdown. No text before or after the JSON. Start your response with { and end with }. Nothing else.
Optional field: include "zone2Nudge" (string) when the run pace or HR data suggests the runner was above Zone 2 on what should have been an easy day. Keep it warm, specific, and encouraging — reference their actual pace if provided.
{
  "assessment": {
    "emoji": "one emoji",
    "headline": "one punchy sentence",
    "detail": "2-3 sentences specific to their data and injury history"
  },
  "recovery": [
    {
      "name": "exercise or stretch name",
      "duration": "time or reps",
      "icon": "emoji",
      "instruction": "exactly how in one sentence",
      "why": "why this helps their specific situation today"
    }
  ],
  "tomorrowPlan": {
    "type": "Run / Strength / Rest / Active Recovery / Today's Plan",
    "icon": "emoji",
    "detail": "specific detail — km and pace if run, exercises if strength, movements if recovery",
    "reason": "one sentence why based on today's data"
  },
  "watchThis": {
    "pattern": "specific thing to watch",
    "action": "one concrete action"
  },
  "acuteProtocol": {
    "ice": "ice protocol instruction or null if no acute injury",
    "compression": "compression guidance or null",
    "avoidances": ["thing to avoid 1", "thing to avoid 2"],
    "dayByDay": [
      {"day": "Day 1 — Today", "plan": "exactly what to do"},
      {"day": "Days 2–3", "plan": "what changes"},
      {"day": "Days 4–5", "plan": "when to ease back in"}
    ],
    "redFlags": ["flag 1", "flag 2"],
    "recoverySupport": "sleep, protein, hydration notes or null",
    "professionalAdvice": "strong recommendation to see physio/doctor if moderate or severe — or null if minor"
  }
}

Only populate acuteProtocol if today's log describes a new or acute injury (fresh strain, pull, new pain above 2/10, or symptoms that feel like the start of an injury). Otherwise set acuteProtocol to null or empty object.`;
}
