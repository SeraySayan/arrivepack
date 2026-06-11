import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, Place, ReadinessItem, Activity, ItineraryDay } from '../types';
import { generateId } from '../utils/ids';
import { buildReadinessState, updateItemStatus } from '../services/readinessEngine';
import { getItinerary } from '../services/itineraryEngine';
import { DEFAULT_READINESS_ITEMS } from '../data/egypt';

interface TripStore {
  trip: Trip | null;
  hasOnboarded: boolean;

  createTrip: (params: {
    destinationId: string;
    destinationName: string;
    durationDays: number;
    budgetStyle: Trip['budgetStyle'];
    travelStyle: Trip['travelStyle'];
    expectationNote?: string;
  }) => void;

  updateReadinessItem: (itemId: string, status: ReadinessItem['status']) => void;

  savePlace: (place: Place) => void;
  unsavePlace: (placeId: string) => void;
  markPlaceVisited: (placeId: string) => void;
  favoritPlace: (placeId: string) => void;
  addDiaryNote: (placeId: string, note: string) => void;

  swapActivityIntoDay: (dayIndex: number, activity: Activity) => void;
  markActivityVisited: (dayIndex: number, timeSlot: 'morning' | 'afternoon' | 'evening', activityId: string) => void;

  setHasOnboarded: (value: boolean) => void;
  resetTrip: () => void;
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trip: null,
      hasOnboarded: false,

      createTrip: ({ destinationId, destinationName, durationDays, budgetStyle, travelStyle, expectationNote }) => {
        const itinerary = getItinerary(destinationId, durationDays, budgetStyle, travelStyle);
        const readiness = buildReadinessState(DEFAULT_READINESS_ITEMS);

        const trip: Trip = {
          id: generateId(),
          destinationId,
          destinationName,
          durationDays,
          budgetStyle,
          travelStyle,
          expectationNote,
          readiness,
          itinerary,
          savedPlaces: [],
          visitedPlaces: [],
          createdAt: new Date().toISOString(),
        };

        set({ trip, hasOnboarded: true });
      },

      updateReadinessItem: (itemId, status) => {
        const { trip } = get();
        if (!trip) return;
        const updatedReadiness = updateItemStatus(trip.readiness, itemId, status);
        set({ trip: { ...trip, readiness: updatedReadiness } });
      },

      savePlace: (place) => {
        const { trip } = get();
        if (!trip) return;
        const alreadySaved = trip.savedPlaces.some((p) => p.id === place.id);
        if (alreadySaved) return;
        set({ trip: { ...trip, savedPlaces: [...trip.savedPlaces, place] } });
      },

      unsavePlace: (placeId) => {
        const { trip } = get();
        if (!trip) return;
        set({ trip: { ...trip, savedPlaces: trip.savedPlaces.filter((p) => p.id !== placeId) } });
      },

      markPlaceVisited: (placeId) => {
        const { trip } = get();
        if (!trip) return;

        const savedPlaces = trip.savedPlaces.map((p) =>
          p.id === placeId ? { ...p, isVisited: true } : p
        );

        const alreadyVisited = trip.visitedPlaces.some((p) => p.id === placeId);
        let visitedPlaces = trip.visitedPlaces;

        if (!alreadyVisited) {
          const place = trip.savedPlaces.find((p) => p.id === placeId);
          if (place) {
            visitedPlaces = [...visitedPlaces, { ...place, isVisited: true }];
          }
        }

        set({ trip: { ...trip, savedPlaces, visitedPlaces } });
      },

      favoritPlace: (placeId) => {
        const { trip } = get();
        if (!trip) return;
        const savedPlaces = trip.savedPlaces.map((p) =>
          p.id === placeId ? { ...p, isFavorite: !p.isFavorite } : p
        );
        set({ trip: { ...trip, savedPlaces } });
      },

      addDiaryNote: (placeId, note) => {
        const { trip } = get();
        if (!trip) return;
        const savedPlaces = trip.savedPlaces.map((p) =>
          p.id === placeId ? { ...p, userNote: note } : p
        );
        set({ trip: { ...trip, savedPlaces } });
      },

      swapActivityIntoDay: (dayIndex, activity) => {
        const { trip } = get();
        if (!trip) return;
        const itinerary: ItineraryDay[] = trip.itinerary.map((day, i) => {
          if (i !== dayIndex) return day;
          return {
            ...day,
            morning: [...day.morning, activity],
          };
        });
        set({ trip: { ...trip, itinerary } });
      },

      markActivityVisited: (dayIndex, timeSlot, activityId) => {
        const { trip } = get();
        if (!trip) return;
        const itinerary = trip.itinerary.map((day, i) => {
          if (i !== dayIndex) return day;
          const updateSlot = (activities: Activity[]) =>
            activities.map((a) => (a.id === activityId ? { ...a, isVisited: true } : a));
          return {
            ...day,
            morning: timeSlot === 'morning' ? updateSlot(day.morning) : day.morning,
            afternoon: timeSlot === 'afternoon' ? updateSlot(day.afternoon) : day.afternoon,
            evening: timeSlot === 'evening' ? updateSlot(day.evening) : day.evening,
          };
        });
        set({ trip: { ...trip, itinerary } });
      },

      setHasOnboarded: (value) => set({ hasOnboarded: value }),

      resetTrip: () => set({ trip: null, hasOnboarded: false }),
    }),
    {
      name: 'arrivepack-trip',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
