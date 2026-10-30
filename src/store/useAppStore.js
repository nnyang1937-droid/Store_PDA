import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      currentStoreKey: null,
      currentStoreName: null,
      setStore: (key, name) =>
        set({ currentStoreKey: key, currentStoreName: name }),
      clear: () => set({ currentStoreKey: null, currentStoreName: null }),
    }),
    { name: 'app-store' },
  ),
);
