/**
 * Service for unsupported-destination actions.
 *
 * Architecture:
 *   React Native → this service
 *     → Supabase Edge Function  (DB cache → OpenRouter, key stays server-side)
 *     → Formspree               (email notifications)
 *
 * Security rules:
 *   - OpenRouter API key is NEVER in the app.
 *   - Supabase service role key is NEVER in the app.
 *   - Only EXPO_PUBLIC_ vars are bundled in the mobile app.
 */

import { Platform } from 'react-native';
import type { BasicDraftResult, DestinationNotificationPayload } from '../types';

/* ── Config (Expo public env only) ────────────────────────── */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Formspree public endpoint. Falls back to the project endpoint so
 *  notifications work in development without extra env setup. */
const FORMSPREE_ENDPOINT =
  process.env.EXPO_PUBLIC_FORMSPREE_ENDPOINT ?? 'https://formspree.io/f/mrevkwel';

/* ── Slug helper (mirrors the Edge Function logic) ─────────── */

/**
 * Normalise a free-text destination name to a URL-safe slug.
 *   "Japan"       → "japan"
 *   "New York"    → "new-york"
 *   "UAE"         → "uae"
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ── Mock fallback draft (no Supabase configured) ──────────── */

function buildMockDraft(destination: string): BasicDraftResult {
  const slug = toSlug(destination);
  const id = `mock_${slug}_${Date.now()}`;
  return {
    id,
    draftId: id,
    destination,
    destinationSlug: slug,
    status: 'basic_draft',
    verified: false,
    generatedAt: new Date().toISOString(),
    confidence: 'low',
    provider: 'mock',
    disclaimer:
      'This is a basic AI-assisted planning draft, not a verified ArrivePack Pack. ' +
      'Confidence is low. Confirm all critical details with official sources before travel.',
    sections: [
      {
        title: 'Entry & Documents',
        summary: `Visa requirements for ${destination} vary by nationality. Confirm passport validity requirements with your embassy before booking.`,
        confidence: 'low',
        sourceReminder: 'Check your government travel advisory and the official embassy website.',
      },
      {
        title: 'Phone & Internet',
        summary: `Mobile coverage is generally available in ${destination}. eSIM and local SIM cards are typical options. Compare current plans before departure.`,
        confidence: 'low',
        sourceReminder: 'Confirm current eSIM and local SIM availability and pricing before you travel.',
      },
      {
        title: 'Arrival & Transport',
        summary: `Major airports in ${destination} typically have taxis, ride-hailing apps, and public transport. Research your specific arrival airport options in advance.`,
        confidence: 'low',
        sourceReminder: 'Verify current transport options from your arrival airport before travelling.',
      },
      {
        title: 'Accommodation',
        summary: `${destination} has a wide range of accommodation from budget to luxury. Research areas based on your planned activities and budget.`,
        confidence: 'low',
        sourceReminder: 'Check current prices and availability on major booking platforms.',
      },
      {
        title: 'Safety & Local Tips',
        summary: `Check your government's official travel advisory for ${destination} before booking. Standard travel precautions apply.`,
        confidence: 'low',
        sourceReminder: 'Consult your government travel advisory for current safety information.',
      },
      {
        title: 'Simple Itinerary Idea',
        summary: `A typical short trip to ${destination} might focus on key cultural, historical, or natural highlights. Adjust based on your duration and interests.`,
        confidence: 'low',
        sourceReminder: 'Confirm opening times and entry requirements for attractions before travel.',
      },
      {
        title: 'Official Sources to Check',
        summary: `Consult your government travel advisory, official tourism board, and embassy websites for verified ${destination} information.`,
        confidence: 'low',
        sourceReminder: 'Always verify critical information from official sources before departure.',
      },
    ],
  };
}

/* ── Formspree notification ────────────────────────────────── */

export async function sendDestinationNotification(
  payload: DestinationNotificationPayload
): Promise<void> {
  if (!FORMSPREE_ENDPOINT) {
    console.warn('[ArrivePack] Formspree endpoint not configured. Skipping notification.');
    return;
  }

  try {
    const subject =
      payload.action === 'request_pack'
        ? `New ArrivePack Pack Request: ${payload.destination}`
        : payload.action === 'basic_draft_used'
        ? `ArrivePack Draft Used (Cached): ${payload.destination}`
        : payload.action === 'basic_draft_created_uncached'
        ? `ArrivePack Draft Created (Unsaved): ${payload.destination}`
        : `New ArrivePack Basic Draft Created: ${payload.destination}`;

    const body: Record<string, unknown> = {
      _subject: subject,
      destination: payload.destination,
      action: payload.action,
      source: payload.source,
      requestedAt: payload.requestedAt,
      status: payload.status,
      platform: Platform.OS,
      ...(payload.draftId && { draftId: payload.draftId }),
      ...(payload.destinationSlug && { destinationSlug: payload.destinationSlug }),
      ...(payload.provider && { provider: payload.provider }),
      ...(payload.model && { model: payload.model }),
      ...(payload.userNote && { userNote: payload.userNote }),
      ...(payload.cacheError && { cacheError: payload.cacheError }),
    };

    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn('[ArrivePack] Formspree notification failed with status:', res.status);
    }
  } catch (err) {
    /* Non-blocking: notification failure must never interrupt the user flow. */
    console.warn('[ArrivePack] Formspree notification error:', err);
  }
}

/* ── createBasicDraft ──────────────────────────────────────── */

export async function createBasicDraft(destinationName: string): Promise<BasicDraftResult> {
  /* If Supabase is not configured, return a clearly-labelled mock draft. */
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[ArrivePack] Supabase env vars not configured. Using mock draft for development.');
    const draft = buildMockDraft(destinationName);
    /* Fire-and-forget notification — does not block draft display. */
    void sendDestinationNotification({
      destination: destinationName,
      destinationSlug: draft.destinationSlug,
      action: 'basic_draft_created',
      source: 'welcome_search',
      requestedAt: new Date().toISOString(),
      status: 'draft_created',
      provider: 'mock',
      draftId: draft.draftId,
    });
    return draft;
  }

  const url = `${SUPABASE_URL}/functions/v1/create-basic-draft`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      destination: destinationName,
      source: 'welcome_search',
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Draft generation failed (${res.status}): ${errText}`);
  }

  const result = (await res.json()) as BasicDraftResult;

  /* The Edge Function sends its own Formspree notification server-side.
   * We send an additional client-side one only for the app-initiated event,
   * distinguished by the correct action based on provider. */
  const provider = result.provider;
  const action =
    provider === 'database_cache'
      ? 'basic_draft_used'
      : provider === 'openrouter_uncached'
      ? 'basic_draft_created_uncached'
      : 'basic_draft_created';
  const status =
    provider === 'database_cache'
      ? 'draft_used'
      : provider === 'openrouter_uncached'
      ? 'draft_created_uncached'
      : 'draft_created';

  void sendDestinationNotification({
    destination: destinationName,
    destinationSlug: result.destinationSlug ?? toSlug(destinationName),
    action,
    source: 'welcome_search',
    requestedAt: new Date().toISOString(),
    status,
    provider: result.provider,
    model: result.model,
    draftId: result.id ?? result.draftId,
    ...(result.cacheError && { cacheError: result.cacheError }),
  });

  return result;
}

/* ── requestDestinationPack ────────────────────────────────── */

export async function requestDestinationPack(destinationName: string): Promise<void> {
  await sendDestinationNotification({
    destination: destinationName,
    destinationSlug: toSlug(destinationName),
    action: 'request_pack',
    source: 'welcome_search',
    requestedAt: new Date().toISOString(),
    status: 'requested',
  });
}
