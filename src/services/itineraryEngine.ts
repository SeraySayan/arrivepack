import type { ItineraryDay, BudgetStyle, TravelStyle, StayAreaId, Trip } from '../types';
import { generateEgyptItinerary } from '../data/egyptItinerary';

export function getItinerary(
  destinationId: string,
  durationDays: number,
  budgetStyle: BudgetStyle,
  travelStyle: TravelStyle,
  stayArea?: StayAreaId | null
): ItineraryDay[] {
  if (destinationId !== 'egypt') return [];
  return generateEgyptItinerary(durationDays, budgetStyle, travelStyle, stayArea ?? null);
}

/**
 * Returns true only when the AI-adjusted itinerary stored in `trip` was
 * created for the exact same trip context that is active right now.
 *
 * If any of destinationId / durationDays / budgetStyle / travelStyle / stayArea
 * has changed since the AI ran, the saved plan is stale and must not be shown.
 */
function isAdjustedContextValid(trip: Trip): boolean {
  const ctx = trip.adjustedItineraryContext;
  if (!ctx) return false;
  return (
    ctx.destinationId === trip.destinationId &&
    ctx.durationDays === trip.durationDays &&
    ctx.budgetStyle === trip.budgetStyle &&
    ctx.travelStyle === trip.travelStyle &&
    ctx.stayArea === trip.stayArea
  );
}

/**
 * Returns the active itinerary for the given trip, choosing the correct source:
 *
 * 1. If `trip.adjustedItinerary` exists, has the right number of days, AND the
 *    context it was built for matches the current trip context → use AI days.
 * 2. Otherwise fall back to the rule-based Egypt engine.
 *
 * This is the single selector both `/trip/itinerary` and `/trip/day` must call.
 * It guarantees the two pages can never show different sources.
 */
export function getActiveItinerary(trip: Trip | null): ItineraryDay[] {
  if (!trip) return [];

  if (
    trip.adjustedItinerary &&
    trip.adjustedItinerary.length === trip.durationDays &&
    isAdjustedContextValid(trip)
  ) {
    return trip.adjustedItinerary;
  }

  return getItinerary(
    trip.destinationId,
    trip.durationDays,
    trip.budgetStyle,
    trip.travelStyle,
    trip.stayArea
  );
}
