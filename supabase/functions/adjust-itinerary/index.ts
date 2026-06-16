/**
 * Supabase Edge Function: adjust-itinerary
 *
 * Accepts the user's current itinerary + a free-text adjustment request,
 * calls OpenRouter to reshape the plan, and returns structured JSON.
 *
 * Key design decisions:
 *  - response_format is NOT sent; it can cause 400s on some OpenRouter models.
 *    We rely on strict prompt instructions + cleanJsonResponse() instead.
 *  - OpenRouter response is consumed as text() first, then JSON.parse()d —
 *    avoids the "body already consumed" error when we need to log on failure.
 *  - max_tokens set to 4500; adequate for a 10-day trip with compact detailSections.
 *  - costLevel is normalised after parsing (model may return "low"/"medium"/"high").
 *  - detailSections are optional — accepted/sanitised when present, skipped otherwise.
 *  - Top-level try/catch ensures the function never crashes into a Supabase 502.
 *
 * Required Supabase secrets:
 *   OPENROUTER_API_KEY   — OpenRouter API key
 *   OPENROUTER_MODEL     — model slug, e.g. "openai/gpt-4o-mini"
 *
 * Deploy:
 *   supabase functions deploy adjust-itinerary --no-verify-jwt
 */

// deno-lint-ignore-file no-explicit-any
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response>): void;
};

/* ── CORS / response helpers ── */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/* ── Cost level normaliser ──────────────────────────────────────────────────
 * The model may return "low"/"medium"/"high" or "budget"/"moderate"/"premium".
 * Both are accepted; output is always normalised to budget/moderate/premium. */

const COST_NORM: Record<string, string> = {
  low: 'budget',    budget: 'budget',
  medium: 'moderate', moderate: 'moderate',
  high: 'premium',  premium: 'premium', higher: 'premium',
};

function normalizeCostLevel(value: any): string {
  if (typeof value !== 'string') return 'moderate';
  return COST_NORM[value.toLowerCase()] ?? 'moderate';
}

/* ── JSON extraction ────────────────────────────────────────────────────────
 * Strips markdown fences and leading/trailing prose before parsing. */

function cleanJsonResponse(raw: string): string {
  let s = raw.trim();
  // Remove ALL markdown code fence occurrences (g flag)
  s = s.replace(/```(?:json|JSON)?\s*/g, '');
  s = s.replace(/\s*```/g, '');
  s = s.trim();
  // If prose was prepended before the JSON object, jump to first {
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace > 0 && lastBrace > firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1);
  }
  return s;
}

function tryParseJson(
  rawContent: string
): { parsed: any; cleaned: string; parseError: string | null } {
  const cleaned = cleanJsonResponse(rawContent);
  try {
    return { parsed: JSON.parse(cleaned), cleaned, parseError: null };
  } catch (err) {
    return { parsed: null, cleaned, parseError: String(err) };
  }
}

/* ── Post-parse sanitiser ───────────────────────────────────────────────────
 * Normalises costLevel values in-place so validation never fails on vocab. */

function sanitizeParsed(data: any): any {
  if (!data || !Array.isArray(data.days)) return data;
  data.days = data.days.map((day: any) => {
    day.costLevel = normalizeCostLevel(day.costLevel);
    if (day.detailSections && typeof day.detailSections === 'object') {
      for (const slot of ['morning', 'afternoon', 'evening']) {
        if (Array.isArray(day.detailSections[slot])) {
          day.detailSections[slot] = day.detailSections[slot].map((item: any) => ({
            ...item,
            costLevel: normalizeCostLevel(item.costLevel),
          }));
        }
      }
    }
    return day;
  });
  return data;
}

/* ── Validation ──────────────────────────────────────────────────────────── */

type FailReason =
  | 'not_object'
  | 'missing_days'
  | 'wrong_day_count'
  | 'invalid_day_shape';

interface ValidationResult {
  reason: FailReason | null;
  detail: string | null;
}

function validateAdjustedItinerary(data: any, expectedDays: number): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { reason: 'not_object', detail: 'Response is not an object' };
  }
  if (!Array.isArray(data.days)) {
    return { reason: 'missing_days', detail: 'Missing days array' };
  }
  if (data.days.length !== expectedDays) {
    return {
      reason: 'wrong_day_count',
      detail: `Expected ${expectedDays} days, got ${data.days.length}`,
    };
  }
  for (const day of data.days) {
    if (typeof day.day !== 'number') {
      return { reason: 'invalid_day_shape', detail: 'A day is missing its day number' };
    }
    if (typeof day.title !== 'string' || !day.title) {
      return { reason: 'invalid_day_shape', detail: `Day ${day.day} missing title` };
    }
    if (typeof day.subtitle !== 'string') {
      return { reason: 'invalid_day_shape', detail: `Day ${day.day} missing subtitle` };
    }
    if (!Array.isArray(day.activities) || day.activities.length === 0) {
      return { reason: 'invalid_day_shape', detail: `Day ${day.day} missing activities` };
    }
    if (!Array.isArray(day.chips)) {
      return { reason: 'invalid_day_shape', detail: `Day ${day.day} missing chips` };
    }
    if (!['budget', 'moderate', 'premium'].includes(day.costLevel)) {
      return {
        reason: 'invalid_day_shape',
        detail: `Day ${day.day} unexpected costLevel after normalisation: ${day.costLevel}`,
      };
    }
    // detailSections — optional; strip bad shapes rather than rejecting
    if (day.detailSections != null) {
      if (typeof day.detailSections !== 'object') {
        delete day.detailSections;
      } else {
        for (const slot of ['morning', 'afternoon', 'evening']) {
          if (day.detailSections[slot] !== undefined && !Array.isArray(day.detailSections[slot])) {
            delete day.detailSections[slot];
          }
        }
      }
    }
  }
  return { reason: null, detail: null };
}

/* ── Prompt builder ──────────────────────────────────────────────────────── */

function buildPrompt(payload: {
  userRequest: string;
  destination: string;
  durationDays: number;
  budgetStyle: string;
  travelStyle: string;
  stayArea: string;
  currentItinerary: any[];
}): string {
  const {
    userRequest, destination, durationDays, budgetStyle, travelStyle,
    stayArea, currentItinerary,
  } = payload;

  const itineraryJson = JSON.stringify(currentItinerary, null, 2);
  const stayAreaNote = stayArea && stayArea !== 'unknown'
    ? `Traveller stays in: ${stayArea.replace(/_/g, ' ')}.`
    : 'Stay area not selected — use central Cairo assumption.';

  return `You are a careful travel plan editor for ArrivePack, a premium Egypt travel app.

Your job is to make targeted adjustments to the existing itinerary based on the user's request — NOT to rewrite the whole trip.

Return ONLY a valid JSON object. No markdown, no code fences, no explanation text.

━━━ MACRO ROUTE — PRESERVE BY DEFAULT ━━━
The current itinerary has an existing city sequence (e.g. Cairo/Giza → Luxor → Aswan → Abu Simbel → Cairo return).
KEEP that macro route and city sequence UNCHANGED unless the user explicitly asks to remove or replace a region.

Examples of requests that should NOT change the macro route:
- "Make it more relaxed"
- "Reduce walking"
- "Add more local food"
- "Make it more cultural"
- "Slow it down"
- "Make it easier"

Examples of requests that WOULD change the macro route:
- "Remove Luxor"
- "Skip Aswan"
- "Stay only in Cairo"
- "No long-distance travel"
- "Avoid Abu Simbel"

Do NOT turn an Egypt-wide itinerary into a Cairo-only itinerary unless the user explicitly says so.

━━━ COST LEVEL — BE REALISTIC ━━━
Budget style: ${budgetStyle}

- If budget style contains "budget" or "smart": prefer budget or moderate costLevel for most days
- If budget style contains "balanced": most days should be moderate, a few premium only where genuinely justified
- If budget style contains "premium" or "comfort": premium days are acceptable for days involving private logistics or upscale experiences, but not every single day
- Do NOT mark every day as premium just because it is Egypt
- Use costLevel realistically based on what the day actually involves

━━━ HOW TO HANDLE COMMON REQUESTS ━━━
"More relaxed / reduce walking":
- Reduce back-to-back sightseeing within a day
- Add a slower morning or free afternoon
- Replace one walking-heavy activity with a café, rest, or boat moment
- Keep the city/region for that day unchanged

"Add more local food":
- Replace one generic activity with a local market, street food, or local restaurant moment
- Add a food note to an evening
- Keep the day's region and other activities

"More cultural":
- Swap generic activities for museum, temple, or local neighbourhood visits
- Keep the macro route

━━━ CONSTRAINTS ━━━
- Do NOT invent exact opening hours, prices, or official rules
- Max 3 activities per day in the "activities" list
- Return exactly ${durationDays} day objects — no more, no less
- costLevel must be exactly: budget | moderate | premium
- confidence must be: low | medium | high
- Keep descriptions short: max 120 characters each

TRIP CONTEXT:
- Destination: ${destination}
- Duration: ${durationDays} days
- Budget style: ${budgetStyle}
- Travel style: ${travelStyle}
- ${stayAreaNote}

USER REQUEST: "${userRequest}"

CURRENT ITINERARY (edit this, do not replace it wholesale):
${itineraryJson}

RETURN THIS JSON STRUCTURE (nothing else — start with { end with }):
{
  "summary": "One sentence describing what you changed and why.",
  "changesMade": ["change 1", "change 2"],
  "confidence": "medium",
  "days": [
    {
      "day": 1,
      "title": "Day Title",
      "subtitle": "Short theme",
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "chips": ["Tag 1", "Tag 2"],
      "costLevel": "moderate",
      "detailSections": {
        "morning": [{ "title": "Morning activity", "description": "Short note.", "duration": "2 hrs", "costLevel": "moderate" }],
        "afternoon": [{ "title": "Afternoon activity", "description": "Short note.", "duration": "2 hrs", "costLevel": "moderate" }],
        "evening": [{ "title": "Evening activity", "description": "Short note.", "duration": "1 hr", "costLevel": "moderate" }]
      }
    }
  ]
}

OUTPUT RULES:
- detailSections: max 1 item per slot (morning/afternoon/evening); omit entirely if not useful
- Lunch belongs in afternoon, never in evening
- Dinner and evening walks belong in evening
- Early sightseeing belongs in morning
- No trailing commas, no comments inside JSON

Return ONLY the JSON. Start with { and end with }.`;
}

/* ── Main handler ─────────────────────────────────────────────────────────── */

Deno.serve(async (req: Request): Promise<Response> => {
  // Top-level guard — ensures no uncaught exception causes a Supabase 502
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error('[adjust-itinerary] Unexpected error', {
      reason: 'unexpected_error',
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(
      { error: 'Could not update itinerary', reason: 'unexpected_error' },
      500,
    );
  }
});

async function handleRequest(req: Request): Promise<Response> {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const {
    userRequest,
    destination = 'Egypt',
    durationDays,
    budgetStyle = 'balanced_experience',
    travelStyle = 'first_time_must_sees',
    stayArea = 'unknown',
    currentItinerary,
  } = body;

  if (!userRequest || typeof userRequest !== 'string' || userRequest.trim().length < 3) {
    return jsonResponse({ error: 'userRequest is required' }, 400);
  }

  if (!Array.isArray(currentItinerary) || currentItinerary.length === 0) {
    return jsonResponse({ error: 'currentItinerary is required' }, 400);
  }

  const days = typeof durationDays === 'number' && durationDays > 0
    ? durationDays
    : currentItinerary.length;

  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openrouterKey) {
    console.error('[adjust-itinerary] OPENROUTER_API_KEY not set');
    return jsonResponse({ error: 'Service not configured' }, 503);
  }

  const model = Deno.env.get('OPENROUTER_MODEL') ?? 'openai/gpt-4o-mini';
  const prompt = buildPrompt({
    userRequest: userRequest.trim(),
    destination,
    durationDays: days,
    budgetStyle,
    travelStyle,
    stayArea,
    currentItinerary,
  });

  // ── Call OpenRouter ──────────────────────────────────────────────────────
  // NOTE: response_format is intentionally omitted.
  // OpenRouter may reject it for certain models, causing a 400/422 that
  // surfaces as a 502 to the client. Strict prompt + cleanJsonResponse()
  // handles JSON extraction instead.
  let openrouterResponseText: string;
  try {
    const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://arrivepack.app',
        'X-Title': 'ArrivePack Itinerary Adjustment',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        // 4500 tokens: adequate for 10-day itinerary with compact detailSections.
        // Raising further risks timeouts; lower headroom on detailSections instead.
        max_tokens: 4500,
      }),
    });

    // Always read body as text first — avoids "body already consumed" if we
    // need to log the failure AND parse JSON for success paths.
    openrouterResponseText = await openrouterRes.text();

    if (!openrouterRes.ok) {
      console.error('[adjust-itinerary] OpenRouter request failed', {
        reason: 'openrouter_failed',
        status: openrouterRes.status,
        bodyPreview: openrouterResponseText.slice(0, 500),
      });
      // Include status so client can distinguish auth errors (401) from rate limits (429)
      return jsonResponse(
        { error: 'Could not update itinerary', reason: 'openrouter_failed', detail: `HTTP ${openrouterRes.status}` },
        502,
      );
    }
  } catch (err) {
    console.error('[adjust-itinerary] OpenRouter unreachable', {
      reason: 'openrouter_timeout',
      message: err instanceof Error ? err.message : String(err),
    });
    return jsonResponse(
      { error: 'Could not update itinerary', reason: 'openrouter_timeout' },
      502,
    );
  }

  // ── Parse OpenRouter envelope ────────────────────────────────────────────
  let aiEnvelope: any;
  try {
    aiEnvelope = JSON.parse(openrouterResponseText);
  } catch {
    console.error('[adjust-itinerary] Could not parse OpenRouter envelope', {
      reason: 'openrouter_bad_envelope',
      preview: openrouterResponseText.slice(0, 300),
    });
    return jsonResponse(
      { error: 'Could not update itinerary', reason: 'openrouter_bad_envelope' },
      502,
    );
  }

  const rawContent: string = aiEnvelope?.choices?.[0]?.message?.content ?? '';
  if (!rawContent) {
    console.error('[adjust-itinerary] Empty content from model', {
      reason: 'empty_content',
      envelope: JSON.stringify(aiEnvelope).slice(0, 300),
    });
    return jsonResponse(
      { error: 'Could not update itinerary', reason: 'empty_content' },
      502,
    );
  }

  // ── Parse model content ──────────────────────────────────────────────────
  const { parsed: rawParsed, cleaned, parseError } = tryParseJson(rawContent);

  if (!rawParsed) {
    console.error('[adjust-itinerary] JSON parse failed', {
      reason: 'parse_failed',
      parseError,
      // rawPreview stays server-side only — never sent to client
      rawPreview: rawContent.slice(0, 400),
      cleanedPreview: cleaned.slice(0, 400),
    });
    return jsonResponse(
      { error: 'Could not update itinerary', reason: 'parse_failed' },
      422,
    );
  }

  // ── Normalise and validate ───────────────────────────────────────────────
  const sanitized = sanitizeParsed(rawParsed);
  const { reason: validationReason, detail: validationDetail } = validateAdjustedItinerary(sanitized, days);

  if (validationReason) {
    console.error('[adjust-itinerary] Validation failed', {
      reason: validationReason,
      detail: validationDetail,
      parsedPreview: JSON.stringify(sanitized).slice(0, 400),
    });
    return jsonResponse(
      { error: 'Could not update itinerary', reason: validationReason, detail: validationDetail },
      422,
    );
  }

  return jsonResponse({
    ok: true,
    summary: sanitized.summary ?? '',
    changesMade: Array.isArray(sanitized.changesMade) ? sanitized.changesMade : [],
    days: sanitized.days,
    confidence: sanitized.confidence ?? 'medium',
  });
}
