/**
 * Cairo stay-area context helpers.
 *
 * These helpers translate a user's selected stay area into display names and
 * Cairo/Giza-specific copy strings. They are the single source of truth for
 * stay-area-aware text so no other file needs to hardcode "Zamalek" copy.
 *
 * Important product rule:
 *  - Stay area only modifies Cairo/Giza local planning copy.
 *  - It does NOT change the Egypt-wide route (Luxor, Aswan, Abu Simbel).
 *  - If stayArea is null/undefined, neutral copy is used.
 */

import type { StayAreaId } from '../types';

export interface CairoContext {
  /** Formatted display name, e.g. "Downtown Cairo". Null when no area selected. */
  displayName: string | null;
  /** Short sentence shown at the top of the itinerary page. */
  planningNote: string;
  /** Arrival evening activity title. */
  arrivalEveningTitle: string;
  /** Arrival evening activity description. */
  arrivalEveningDescription: string;
  /** Day 2 Giza transport note — reflects where the user is actually staying. */
  gizaTransportNote: string;
  /** Cairo evening title for Day 2 and final-Cairo-day evenings. */
  eveningTitle: string;
  /** Cairo evening description. */
  eveningDescription: string;
  /** From-airport transport note used on Day 1 and Return-to-Cairo days. */
  arrivalTransportNote: string;
}

export function getStayAreaDisplayName(stayArea: StayAreaId | null | undefined): string | null {
  if (!stayArea) return null;
  const names: Record<StayAreaId, string> = {
    zamalek: 'Zamalek',
    downtown: 'Downtown Cairo',
    garden_city: 'Garden City',
    giza: 'Giza',
    new_cairo: 'New Cairo',
  };
  return names[stayArea] ?? null;
}

export function getCairoBaseContext(stayArea: StayAreaId | null | undefined): CairoContext {
  switch (stayArea) {
    case 'zamalek':
      return {
        displayName: 'Zamalek',
        planningNote: 'Using Zamalek as your Cairo base.',
        arrivalEveningTitle: 'Zamalek Stroll & First Dinner',
        arrivalEveningDescription:
          'Walk around Zamalek Island, find a local café, and settle in for your first Cairo evening.',
        gizaTransportNote: 'Uber/Careem to Giza from Zamalek — approximately 30–40 min.',
        eveningTitle: 'Zamalek Evening — Cafes & Dinner',
        eveningDescription:
          'Explore Zamalek Island at its best: sunset views, café culture, and dinner at a local restaurant.',
        arrivalTransportNote: 'Uber/Careem from Cairo Airport to Zamalek.',
      };

    case 'downtown':
      return {
        displayName: 'Downtown Cairo',
        planningNote: 'Using Downtown Cairo as your Cairo base.',
        arrivalEveningTitle: 'Easy Dinner Near Downtown Cairo',
        arrivalEveningDescription:
          'Settle in and find a local spot near Downtown Cairo for your first evening.',
        gizaTransportNote: 'Uber/Careem to Giza from Downtown Cairo — approximately 30 min.',
        eveningTitle: 'Downtown Cairo Evening',
        eveningDescription:
          "Explore Downtown Cairo's cafes and local restaurants for a relaxed evening.",
        arrivalTransportNote: 'Uber/Careem from Cairo Airport to Downtown Cairo.',
      };

    case 'garden_city':
      return {
        displayName: 'Garden City',
        planningNote: 'Using Garden City as your Cairo base.',
        arrivalEveningTitle: 'Easy Nile-side Dinner Near Garden City',
        arrivalEveningDescription:
          'Find a calm Nile-side dinner spot near your Garden City stay for a relaxed first evening.',
        gizaTransportNote: 'Uber/Careem to Giza from Garden City / central Cairo.',
        eveningTitle: 'Garden City / Nile-side Evening',
        eveningDescription:
          'A calm Nile-side evening near Garden City — great for a quiet first dinner in Cairo.',
        arrivalTransportNote: 'Uber/Careem from Cairo Airport to Garden City.',
      };

    case 'giza':
      return {
        displayName: 'Giza',
        planningNote: 'Using Giza as your Cairo base.',
        arrivalEveningTitle: 'Easy Dinner Near Your Giza Stay',
        arrivalEveningDescription:
          'Settle in and find a local dinner spot near your Giza accommodation. The pyramids wait for tomorrow.',
        gizaTransportNote:
          'Short taxi or walk to the pyramids entrance depending on where you stay in Giza.',
        eveningTitle: 'Easy Giza Evening — Dinner Near Your Stay',
        eveningDescription: 'A quiet evening near your Giza stay. Rest up for an early pyramids morning.',
        arrivalTransportNote: 'Uber/Careem from Cairo Airport to Giza.',
      };

    case 'new_cairo':
      return {
        displayName: 'New Cairo',
        planningNote: 'Using New Cairo as your Cairo base.',
        arrivalEveningTitle: 'Easy Dinner Near Your New Cairo Stay',
        arrivalEveningDescription:
          'Settle into your New Cairo accommodation and find a local dinner nearby.',
        gizaTransportNote: 'Uber/Careem to Giza from New Cairo — allow extra transfer buffer.',
        eveningTitle: 'Easy Evening Near Your Stay',
        eveningDescription: 'Relax near your New Cairo accommodation. Good local dining options nearby.',
        arrivalTransportNote: 'Uber/Careem from Cairo Airport to New Cairo.',
      };

    default:
      return {
        displayName: null,
        planningNote:
          'Sample plan based on your trip style. Choose a Cairo stay area to make local planning smarter.',
        arrivalEveningTitle: 'Easy Dinner Near Your Stay Area',
        arrivalEveningDescription:
          'Settle in and find a comfortable dinner spot near your accommodation.',
        gizaTransportNote: 'Uber/Careem to Giza in the morning.',
        eveningTitle: 'Easy Evening Near Your Stay',
        eveningDescription: 'A calm first evening near your accommodation. Rest up for the next day.',
        arrivalTransportNote: 'Uber/Careem from Cairo Airport to your accommodation.',
      };
  }
}
