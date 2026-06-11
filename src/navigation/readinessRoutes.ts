/**
 * Canonical readiness route map.
 *
 * Single source of truth for where each readiness category navigates.
 * Used by Home (Continue planning / Your next step) and the Before you go hub.
 *
 * Rules:
 *  - One route per category — no drift between entry points.
 *  - Categories with a dedicated page use their clean /trip/<slug> route.
 *  - Categories without a dedicated page fall back to /trip/detail?itemId=<id>.
 *  - Order matches PREPARATION_CHECKLIST order in egypt.ts.
 */
export const READINESS_ROUTE_MAP: Record<string, string> = {
  entry_documents: '/trip/entry_documents',
  connectivity:    '/trip/esim',
  arrival_transport: '/trip/transport',
  accommodation:   '/trip/accommodation',
  budget:          '/trip/money',
  safety:          '/trip/safety',
  packing:         '/trip/packing',
  emergency:       '/trip/emergency',
  itinerary:       '/trip/itinerary',
} as const;

/**
 * Canonical readiness order. Matches PREPARATION_CHECKLIST order.
 * The next-step logic on Home iterates this list in order and skips items
 * whose status is 'ready'. Status priority (needs_review / not_set /
 * suggested) does NOT reorder the sequence — it only affects badges.
 */
export const READINESS_ORDER = [
  'entry_documents',
  'connectivity',
  'arrival_transport',
  'accommodation',
  'budget',
  'safety',
  'packing',
  'emergency',
  'itinerary',
] as const;

export type ReadinessId = typeof READINESS_ORDER[number];
