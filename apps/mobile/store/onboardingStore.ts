import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingStore {
  hasSeenOnboarding: boolean;
  hasHydrated: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      hasHydrated: false,
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      resetOnboarding: () => set({ hasSeenOnboarding: false }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'eurostore-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ hasSeenOnboarding: state.hasSeenOnboarding }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

