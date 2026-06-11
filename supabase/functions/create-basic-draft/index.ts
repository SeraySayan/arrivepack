/**
 * Supabase Edge Function: create-basic-draft
 *
 * Cache-first architecture:
 *   1. Normalise destination → slug (e.g. "Japan" → "japan")
 *   2. Check destination_basic_drafts table for an existing draft
 *   3a. Cache HIT  → update last_used_at / usage_count, return cached draft
 *   3b. Cache MISS → call OpenRouter, save to DB, return new draft
 *
 * OpenRouter is ONLY called when no cached draft exists for that slug.
 * This is verifiable from OpenRouter usage logs.
 *
 * Required Supabase secrets (supabase secrets set …):
 *   ARRIVEPACK_SUPABASE_ADMIN_KEY  — privileged service-role key for DB access (never exposed to clients)
 *   OPENROUTER_API_KEY             — OpenRouter API key (never exposed to clients)
 *   OPENROUTER_MODEL               — e.g. "openai/gpt-3.5-turbo"
 *   FORMSPREE_ENDPOINT             — optional, for email notifications
 *
 * Auto-available Supabase env vars (no need to set manually):
 *   SUPABASE_URL
 *
 * Note: SUPABASE_SERVICE_ROLE_KEY is NOT used here because the Supabase CLI
 * does not allow custom secrets with the SUPABASE_ prefix. Use
 * ARRIVEPACK_SUPABASE_ADMIN_KEY instead, set via:
 *   supabase secrets set ARRIVEPACK_SUPABASE_ADMIN_KEY=<your_service_role_key>
 *
 * Deploy:
 *   supabase functions deploy create-basic-draft
 */

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response>): void;
};

/* ── Constants ─────────────────────────────────────────────────── */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

const TABLE_NAME = 'destination_basic_drafts';

const REQUIRED_SECTION_TITLES = [
  'Entry & Documents',
  'Phone & Internet',
  'Arrival & Transport',
  'Accommodation',
  'Safety & Local Tips',
  'Simple Itinerary Idea',
  'Official Sources to Check',
];

/* ── Helpers ───────────────────────────────────────────────────── */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/**
 * Normalise a free-text destination name to a URL-safe slug.
 * "New York"  → "new-york"
 * "Japan"     → "japan"
 * "UAE"       → "uae"
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Try to extract a JSON object from a string that may have surrounding prose or markdown fences. */
function extractJson(text: string): any {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const cleaned = fenceMatch ? fenceMatch[1].trim() : text.trim();

  // Try direct parse first.
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Fall back: find the first complete JSON object in the string.
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {}
  }

  // Last resort: try the original text.
  const rawStart = text.indexOf('{');
  const rawEnd = text.lastIndexOf('}');
  if (rawStart !== -1 && rawEnd !== -1 && rawEnd > rawStart) {
    try {
      return JSON.parse(text.slice(rawStart, rawEnd + 1));
    } catch {}
  }

  return null;
}

/**
 * Resolve the privileged Supabase admin key.
 *
 * Priority:
 *   1. ARRIVEPACK_SUPABASE_ADMIN_KEY  — custom secret set via `supabase secrets set`
 *   2. SUPABASE_SECRET_KEYS['default'] — built-in new-API-key dict, 'default' entry only
 *
 * SUPABASE_ANON_KEY and SUPABASE_PUBLISHABLE_KEYS are never used here —
 * they are public keys and must not be used for privileged DB access.
 *
 * Never logs the full key value — only existence and a short prefix.
 */
function resolvePrivilegedKey(): string | null {
  const adminKey = Deno.env.get('ARRIVEPACK_SUPABASE_ADMIN_KEY');
  console.log('[ArrivePack] ARRIVEPACK_SUPABASE_ADMIN_KEY exists:', !!adminKey);
  if (adminKey) {
    console.log('[ArrivePack] Using ARRIVEPACK_SUPABASE_ADMIN_KEY, prefix:', adminKey.slice(0, 12) + '…');
    return adminKey;
  }

  // Fallback: SUPABASE_SECRET_KEYS is a built-in JSON dict in the new Supabase key system.
  // We only use the 'default' entry — never iterate all keys blindly.
  const secretKeysRaw = Deno.env.get('SUPABASE_SECRET_KEYS');
  console.log('[ArrivePack] SUPABASE_SECRET_KEYS exists:', !!secretKeysRaw);
  if (secretKeysRaw) {
    try {
      const dict = JSON.parse(secretKeysRaw);
      if (dict && typeof dict === 'object') {
        const defaultKey = dict['default'];
        if (typeof defaultKey === 'string' && defaultKey.length > 0) {
          console.log('[ArrivePack] Using SUPABASE_SECRET_KEYS[default], prefix:', defaultKey.slice(0, 12) + '…');
          return defaultKey;
        }
      }
    } catch {
      console.error('[ArrivePack] Failed to parse SUPABASE_SECRET_KEYS as JSON');
    }
  }

  return null;
}

/* ── OpenRouter prompt ─────────────────────────────────────────── */

function buildPrompt(destination: string): string {
  return `You are creating a short but useful AI-assisted basic travel planning draft for an unsupported ArrivePack destination.

Destination: ${destination}

Important context:
- This destination does NOT have a verified ArrivePack Pack yet.
- This draft is only a low-confidence starting point.
- Do not claim verified accuracy.
- Do not provide guaranteed visa rules, prices, opening hours, safety claims, or transport availability.
- Always tell the user to confirm critical details from official sources before travel.
- Keep the result concise but practical.
- Make the advice destination-specific where possible.
- Use known practical travel patterns when generally safe, but avoid overclaiming.
- Prefer helpful examples over generic text.
- No markdown.
- Return structured JSON only.

Quality goals:
- The draft should feel useful enough for a traveler to understand the destination at a basic level.
- Avoid vague sentences like "research options before you go" unless paired with useful examples.
- Include practical examples such as airports, common local transport types, common connectivity options, common stay styles, cultural/safety habits, and likely itinerary direction when generally known.
- Keep every section short: 2–4 sentences maximum.
- Each section must include a sourceReminder telling the user what to verify.

Return JSON in this exact shape:

{
  "destination": "${destination}",
  "status": "basic_draft",
  "verified": false,
  "confidence": "low",
  "disclaimer": "This is an AI-assisted basic draft, not a verified ArrivePack Pack. Confirm all critical details with official sources before travel.",
  "sections": [
    {
      "title": "Entry & Documents",
      "summary": "...",
      "confidence": "low",
      "sourceReminder": "Check official immigration, embassy, or government travel advisory websites before booking."
    },
    {
      "title": "Phone & Internet",
      "summary": "...",
      "confidence": "low",
      "sourceReminder": "Confirm current eSIM, roaming, and local SIM availability with providers before travel."
    },
    {
      "title": "Arrival & Transport",
      "summary": "...",
      "confidence": "low",
      "sourceReminder": "Verify current airport transfer and local transport options before arrival."
    },
    {
      "title": "Accommodation",
      "summary": "...",
      "confidence": "low",
      "sourceReminder": "Confirm current prices, areas, and availability on major booking platforms."
    },
    {
      "title": "Safety & Local Tips",
      "summary": "...",
      "confidence": "low",
      "sourceReminder": "Review official travel advisories and local rules before departure."
    },
    {
      "title": "Simple Itinerary Idea",
      "summary": "...",
      "confidence": "low",
      "sourceReminder": "Confirm opening times, booking requirements, routes, and seasonal conditions before travel."
    },
    {
      "title": "Official Sources to Check",
      "summary": "...",
      "confidence": "low",
      "sourceReminder": "Always verify critical information from official sources before booking."
    }
  ]
}

Section guidance:

Entry & Documents:
- Mention that visa/passport rules depend on nationality.
- Suggest checking embassy, immigration, airline, or government travel advisory sources.
- Do not state exact visa eligibility unless verified.

Phone & Internet:
- Mention likely options such as eSIM, roaming, local SIM, hotel Wi-Fi, public Wi-Fi, and messaging apps when relevant.
- Add destination-specific practical notes when generally known.
- Do not claim live prices.

Arrival & Transport:
- Mention likely airport/city arrival patterns, major airports if generally known, ride-hailing/taxi/train/metro/bus/private transfer where relevant.
- Do not claim guaranteed availability or exact fares.

Accommodation:
- Mention common stay styles and area-selection logic.
- Use practical examples when generally known, such as central areas, tourist districts, business districts, resort areas, or local neighborhoods.
- Do not claim current prices.

Safety & Local Tips:
- Include practical cultural etiquette, payments, transport safety, scams, weather/seasonality, or emergency preparation where relevant.
- Avoid alarmist language.

Simple Itinerary Idea:
- Give a simple 2–4 sentence direction for a first draft trip.
- Mention major themes and likely route logic.
- Do not over-plan day-by-day unless destination is simple.

Official Sources to Check:
- Mention categories of official sources, not fake links:
  government travel advisory, embassy/consulate, immigration/e-visa site, airport/transport provider, tourism board, airline travel requirement checker.`;
}

/* ── JSON validation & sanitization ───────────────────────────── */

interface DraftSection {
  title: string;
  summary: string;
  confidence: 'low' | 'medium';
  sourceReminder: string;
}

interface ValidatedDraft {
  destination: string;
  status: 'basic_draft';
  verified: false;
  confidence: 'low' | 'medium';
  disclaimer: string;
  generatedAt: string;
  sections: DraftSection[];
}

function validateAndSanitize(
  raw: any,
  destination: string,
  now: string
): ValidatedDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) return null;

  const sectionMap: Record<string, DraftSection> = {};
  for (const s of raw.sections) {
    if (s?.title && typeof s.title === 'string') {
      sectionMap[s.title] = {
        title: s.title,
        summary: typeof s.summary === 'string' ? s.summary : '',
        confidence: s.confidence === 'medium' ? 'medium' : 'low',
        sourceReminder:
          typeof s.sourceReminder === 'string'
            ? s.sourceReminder
            : 'Verify from official sources before travel.',
      };
    }
  }

  // Ensure all required sections are present; pad any missing with a safe placeholder.
  const sections: DraftSection[] = REQUIRED_SECTION_TITLES.map(
    (title) =>
      sectionMap[title] ?? {
        title,
        summary: `No specific information available for ${destination}. Please check official sources.`,
        confidence: 'low',
        sourceReminder: 'Verify from official sources before travel.',
      }
  );

  return {
    destination,
    status: 'basic_draft',
    verified: false,
    confidence: raw.confidence === 'medium' ? 'medium' : 'low',
    disclaimer:
      typeof raw.disclaimer === 'string' && raw.disclaimer.length > 0
        ? raw.disclaimer
        : 'This is an AI-assisted basic draft, not a verified ArrivePack Pack. Confirm all critical details with official sources before travel.',
    generatedAt: now,
    sections,
  };
}

/* ── Formspree notification ────────────────────────────────────── */

async function sendFormspreeNotification(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    console.warn('[ArrivePack] Formspree notification failed (non-fatal)');
  }
}

/* ── Main handler ──────────────────────────────────────────────── */

Deno.serve(async (req: Request): Promise<Response> => {
  console.log('[ArrivePack] Function invoked:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  /* ── Parse body ── */
  let destination: string;
  let source: string;
  try {
    const body = await req.json();
    destination = (body.destination ?? '').trim();
    source = body.source ?? 'welcome_search';
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!destination) {
    return jsonResponse({ error: 'destination is required' }, 400);
  }

  console.log(`[ArrivePack] Destination received: "${destination}"`);

  const destinationSlug = toSlug(destination);
  console.log(`[ArrivePack] Normalized slug: "${destinationSlug}"`);

  /* ── Secrets & config ── */
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  console.log('[ArrivePack] SUPABASE_URL exists:', !!supabaseUrl);

  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY') ?? '';
  const model = Deno.env.get('OPENROUTER_MODEL') ?? 'openai/gpt-3.5-turbo';
  const formspreeEndpoint = Deno.env.get('FORMSPREE_ENDPOINT') ?? '';

  const now = new Date().toISOString();

  /* ── Resolve privileged Supabase key ── */
  const privilegedKey = resolvePrivilegedKey();
  console.log('[ArrivePack] Privileged key resolved:', !!privilegedKey);

  if (!supabaseUrl || !privilegedKey) {
    console.error('[ArrivePack] Supabase privileged key or URL not configured — aborting before OpenRouter');
    return jsonResponse(
      { error: 'Supabase privileged key is not configured', provider: 'function_error' },
      500
    );
  }

  /* ── Supabase admin client (privileged, no session persistence) ── */
  const supabase = createClient(supabaseUrl, privilegedKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  /* ── 1. Cache check ── */
  {
    console.log(`[ArrivePack] Cache lookup start for slug: "${destinationSlug}"`);
    const { data: existingRow, error: selectError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('destination_slug', destinationSlug)
      .maybeSingle();

    if (selectError) {
      console.error('[ArrivePack] DB select error:', selectError.message);
      // Fall through to OpenRouter — a select error must not block generation.
    } else if (existingRow) {
      /* ── Cache HIT ── */
      console.log(`[ArrivePack] Cache hit for slug: "${destinationSlug}" (id: ${existingRow.id})`);

      // Update usage stats (non-blocking).
      supabase
        .from(TABLE_NAME)
        .update({
          last_used_at: now,
          usage_count: (existingRow.usage_count ?? 1) + 1,
        })
        .eq('id', existingRow.id)
        .then(({ error }: any) => {
          if (error) console.warn('[ArrivePack] usage_count update failed:', error.message);
        });

      const cachedDraft = {
        ...existingRow.draft_json,
        id: existingRow.id,
        destinationSlug,
        provider: 'database_cache',
        updatedAt: existingRow.updated_at,
        lastUsedAt: now,
        usageCount: (existingRow.usage_count ?? 1) + 1,
        verified: false,
        status: 'basic_draft',
      };

      if (formspreeEndpoint) {
        void sendFormspreeNotification(formspreeEndpoint, {
          _subject: `ArrivePack Draft Used (Cached): ${destination}`,
          destination,
          destinationSlug,
          action: 'basic_draft_used',
          source,
          requestedAt: now,
          status: 'draft_used',
          provider: 'database_cache',
          draftId: existingRow.id,
        });
      }

      console.log('[ArrivePack] Final provider returned: database_cache');
      return jsonResponse(cachedDraft, 200);
    } else {
      console.log(`[ArrivePack] Cache miss for slug: "${destinationSlug}"`);
    }
  }

  /* ── 2. Cache MISS: call OpenRouter ── */
  if (!openrouterKey) {
    return jsonResponse(
      { error: 'OpenRouter not configured. Set OPENROUTER_API_KEY secret.' },
      503
    );
  }

  console.log(`[ArrivePack] OpenRouter call start — model: ${model}, destination: "${destination}"`);

  let rawContent: string;
  try {
    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://arrivepack.app',
        'X-Title': 'ArrivePack',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: buildPrompt(destination) }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    if (!orRes.ok) {
      const errText = await orRes.text().catch(() => 'unknown');
      console.error('[ArrivePack] OpenRouter error:', orRes.status, errText);
      return jsonResponse({ error: `OpenRouter returned ${orRes.status}` }, 502);
    }

    const orJson = await orRes.json();
    rawContent = orJson?.choices?.[0]?.message?.content ?? '';
    console.log(`[ArrivePack] OpenRouter success — content length: ${rawContent.length}`);
  } catch (err: any) {
    console.error('[ArrivePack] OpenRouter fetch error:', err?.message);
    return jsonResponse({ error: 'Failed to reach OpenRouter' }, 502);
  }

  /* ── 3. Parse & validate OpenRouter response ── */
  const parsed = extractJson(rawContent);
  if (!parsed) {
    console.error('[ArrivePack] Could not parse OpenRouter JSON:', rawContent.slice(0, 300));
    return jsonResponse({ error: 'Invalid draft JSON from model' }, 502);
  }

  const validatedDraft = validateAndSanitize(parsed, destination, now);
  if (!validatedDraft) {
    console.error(
      '[ArrivePack] Draft JSON failed validation:',
      JSON.stringify(parsed).slice(0, 300)
    );
    return jsonResponse({ error: 'Draft JSON failed validation — missing required fields' }, 502);
  }

  const normalizedDraftJson = {
    ...validatedDraft,
    destinationSlug,
    provider: 'openrouter',
    model,
  };

  /* ── 4. Save to DB ── */
  let savedId: string | undefined;
  let cacheError: string | undefined;
  let finalProvider: 'openrouter' | 'openrouter_uncached' = 'openrouter';

  console.log(`[ArrivePack] DB insert start for slug: "${destinationSlug}"`);
  const { data: inserted, error: insertError } = await supabase
    .from(TABLE_NAME)
    .insert({
      destination_name: destination,
      destination_slug: destinationSlug,
      status: 'basic_draft',
      verified: false,
      confidence: validatedDraft.confidence,
      draft_json: normalizedDraftJson,
      provider: 'openrouter',
      model,
      source,
      usage_count: 1,
      last_used_at: now,
      requires_manual_review: true,
      review_status: 'unreviewed',
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[ArrivePack] DB insert error:', JSON.stringify(insertError));
    cacheError = insertError.message;
    finalProvider = 'openrouter_uncached';
  } else {
    savedId = inserted?.id;
    console.log(`[ArrivePack] DB insert success — id: ${savedId}`);
  }

  /* ── 5. Build response ── */
  const response: Record<string, unknown> = {
    ...normalizedDraftJson,
    id: savedId,
    provider: finalProvider,
    draftId: savedId ?? `draft_${destinationSlug}_${Date.now()}`,
    ...(cacheError !== undefined && { cacheError }),
  };

  /* ── 6. Formspree notification ── */
  if (formspreeEndpoint) {
    if (finalProvider === 'openrouter_uncached') {
      void sendFormspreeNotification(formspreeEndpoint, {
        _subject: `ArrivePack Draft Created (Unsaved): ${destination}`,
        destination,
        destinationSlug,
        action: 'basic_draft_created_uncached',
        source,
        requestedAt: now,
        status: 'draft_created_uncached',
        provider: 'openrouter_uncached',
        cacheError: cacheError ?? 'unknown',
      });
    } else {
      void sendFormspreeNotification(formspreeEndpoint, {
        _subject: `New ArrivePack Basic Draft Created: ${destination}`,
        destination,
        destinationSlug,
        action: 'basic_draft_created',
        source,
        requestedAt: now,
        status: 'draft_created',
        provider: 'openrouter',
        model,
        draftId: savedId,
      });
    }
  }

  console.log(`[ArrivePack] Final provider returned: ${finalProvider}`);
  return jsonResponse(response, 200);
});
