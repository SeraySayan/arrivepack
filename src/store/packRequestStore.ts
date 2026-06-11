import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PackRequestStore {
  /** Destination ids the user has requested a verified pack for. */
  requestedPackIds: string[];
  requestPack: (destinationId: string) => void;
  hasRequested: (destinationId: string) => boolean;
}

export const usePackRequestStore = create<PackRequestStore>()(
  persist(
    (set, get) => ({
      requestedPackIds: [],

      requestPack: (destinationId) => {
        const current = get().requestedPackIds;
        if (current.includes(destinationId)) return;
        set({ requestedPackIds: [...current, destinationId] });
      },

      hasRequested: (destinationId) => get().requestedPackIds.includes(destinationId),
    }),
    {
      name: 'arrivepack-pack-requests',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
