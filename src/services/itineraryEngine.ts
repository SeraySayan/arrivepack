import type { ItineraryDay, BudgetStyle, TravelStyle } from '../types';
import { generateItinerary } from '../data/mockItineraries';

export function getItinerary(
  destinationId: string,
  durationDays: number,
  budgetStyle: BudgetStyle,
  travelStyle: TravelStyle
): ItineraryDay[] {
  if (destinationId !== 'egypt') return [];
  return generateItinerary(durationDays, budgetStyle, travelStyle);
}
