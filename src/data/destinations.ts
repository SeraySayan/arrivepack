import type { DestinationRegistryItem } from '../types';

/**
 * Destination registry for the search-first welcome screen.
 *
 * V1: Egypt is the only fully verified, supported pack. Everything else is
 * "coming soon". The `sourceMeta` field is included on every item so future
 * versions can layer in official source tracking, last-checked dates,
 * confidence levels and manual review workflows without a refactor.
 *
 * NOTE: No live freshness monitoring exists yet. These are static samples.
 */
export const DESTINATION_REGISTRY: DestinationRegistryItem[] = [
  /* ── Supported (verified) ── */
  {
    id: 'egypt',
    name: 'Egypt',
    country: 'Egypt',
    emoji: '🇪🇬',
    aliases: ['cairo', 'giza', 'luxor', 'aswan', 'nile', 'pyramids', 'eg'],
    status: 'supported',
    packType: 'verified',
    shortDescription: 'Full verified pack — Cairo, Giza & the Nile.',
    sourceMeta: {
      sourceType: 'sample',
      confidence: 'medium',
      lastCheckedAt: '2026-06-09',
      updateFrequency: 'weekly',
      requiresManualReview: true,
    },
  },

  /* ── Coming soon ── */
  {
    id: 'italy',
    name: 'Italy',
    country: 'Italy',
    emoji: '🇮🇹',
    aliases: ['rome', 'roma', 'milan', 'venice', 'florence', 'naples', 'it'],
    status: 'coming_soon',
    packType: 'coming_soon',
    shortDescription: 'Rome, Florence & the Amalfi coast.',
    sourceMeta: {
      sourceType: 'sample',
      confidence: 'low',
      lastCheckedAt: '2026-06-09',
      updateFrequency: 'monthly',
      requiresManualReview: true,
    },
  },
  {
    id: 'japan',
    name: 'Japan',
    country: 'Japan',
    emoji: '🇯🇵',
    aliases: ['tokyo', 'osaka', 'kyoto', 'jp'],
    status: 'coming_soon',
    packType: 'coming_soon',
    shortDescription: 'Tokyo, Kyoto & beyond.',
    sourceMeta: {
      sourceType: 'sample',
      confidence: 'low',
      lastCheckedAt: '2026-06-09',
      updateFrequency: 'monthly',
      requiresManualReview: true,
    },
  },
  {
    id: 'turkey',
    name: 'Turkey',
    country: 'Turkey',
    emoji: '🇹🇷',
    aliases: ['istanbul', 'ankara', 'antalya', 'cappadocia', 'turkiye', 'tr'],
    status: 'coming_soon',
    packType: 'coming_soon',
    shortDescription: 'Istanbul, Cappadocia & the coast.',
    sourceMeta: {
      sourceType: 'sample',
      confidence: 'low',
      lastCheckedAt: '2026-06-09',
      updateFrequency: 'monthly',
      requiresManualReview: true,
    },
  },
  {
    id: 'thailand',
    name: 'Thailand',
    country: 'Thailand',
    emoji: '🇹🇭',
    aliases: ['bangkok', 'phuket', 'chiang mai', 'th'],
    status: 'coming_soon',
    packType: 'coming_soon',
    shortDescription: 'Bangkok, islands & temples.',
    sourceMeta: {
      sourceType: 'sample',
      confidence: 'low',
      lastCheckedAt: '2026-06-09',
      updateFrequency: 'monthly',
      requiresManualReview: true,
    },
  },
  {
    id: 'france',
    name: 'France',
    country: 'France',
    emoji: '🇫🇷',
    aliases: ['paris', 'nice', 'lyon', 'marseille', 'fr'],
    status: 'coming_soon',
    packType: 'coming_soon',
    shortDescription: 'Paris, the Riviera & wine country.',
    sourceMeta: {
      sourceType: 'sample',
      confidence: 'low',
      lastCheckedAt: '2026-06-09',
      updateFrequency: 'monthly',
      requiresManualReview: true,
    },
  },
  {
    id: 'spain',
    name: 'Spain',
    country: 'Spain',
    emoji: '🇪🇸',
    aliases: ['madrid', 'barcelona', 'seville', 'valencia', 'es'],
    status: 'coming_soon',
    packType: 'coming_soon',
    shortDescription: 'Madrid, Barcelona & the south.',
    sourceMeta: {
      sourceType: 'sample',
      confidence: 'low',
      lastCheckedAt: '2026-06-09',
      updateFrequency: 'monthly',
      requiresManualReview: true,
    },
  },
  {
    id: 'greece',
    name: 'Greece',
    country: 'Greece',
    emoji: '🇬🇷',
    aliases: ['athens', 'santorini', 'mykonos', 'crete', 'gr'],
    status: 'coming_soon',
    packType: 'coming_soon',
    shortDescription: 'Athens & the islands.',
    sourceMeta: {
      sourceType: 'sample',
      confidence: 'low',
      lastCheckedAt: '2026-06-09',
      updateFrequency: 'monthly',
      requiresManualReview: true,
    },
  },
  {
    id: 'united_states',
    name: 'United States',
    country: 'United States',
    emoji: '🇺🇸',
    aliases: ['usa', 'us', 'new york', 'nyc', 'los angeles', 'la', 'miami'],
    status: 'coming_soon',
    packType: 'coming_soon',
    shortDescription: 'New York, LA & national parks.',
    sourceMeta: {
      sourceType: 'sample',
      confidence: 'low',
      lastCheckedAt: '2026-06-09',
      updateFrequency: 'monthly',
      requiresManualReview: true,
    },
  },
  {
    id: 'united_kingdom',
    name: 'United Kingdom',
    country: 'United Kingdom',
    emoji: '🇬🇧',
    aliases: ['uk', 'london', 'england', 'scotland', 'edinburgh'],
    status: 'coming_soon',
    packType: 'coming_soon',
    shortDescription: 'London, Edinburgh & the countryside.',
    sourceMeta: {
      sourceType: 'sample',
      confidence: 'low',
      lastCheckedAt: '2026-06-09',
      updateFrequency: 'monthly',
      requiresManualReview: true,
    },
  },
  {
    id: 'united_arab_emirates',
    name: 'United Arab Emirates',
    country: 'United Arab Emirates',
    emoji: '🇦🇪',
    aliases: ['uae', 'dubai', 'abu dhabi', 'sharjah'],
    status: 'coming_soon',
    packType: 'coming_soon',
    shortDescription: 'Dubai & Abu Dhabi.',
    sourceMeta: {
      sourceType: 'sample',
      confidence: 'low',
      lastCheckedAt: '2026-06-09',
      updateFrequency: 'monthly',
      requiresManualReview: true,
    },
  },
];

/**
 * Search the registry by name, country, or alias (case-insensitive).
 * Supported destinations are ranked first.
 */
export function searchDestinations(query: string): DestinationRegistryItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches = DESTINATION_REGISTRY.filter((d) => {
    if (d.name.toLowerCase().includes(q)) return true;
    if (d.country.toLowerCase().includes(q)) return true;
    return d.aliases.some((a) => a.includes(q));
  });

  return matches.sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === 'supported' ? -1 : 1;
  });
}
