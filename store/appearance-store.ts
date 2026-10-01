import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AppearancePreference = 'light' | 'dark' | 'system';
interface AppearanceState {
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
}

/** Keep the existing dark appearance until a person selects another option.
 * Device preference stays available before sign-in and across account changes. */
export const useAppearanceStore = create<AppearanceState>()(
  persist(
    set => ({
      preference: 'dark',
      setPreference: preference => set({ preference }),
    }),
    {
      name: 'menta-appearance',
      storage: createJSONStorage(() => AsyncStorage),
      // Retain explicit choices and System across upgrades; unknown values
      // keep the established dark default.
      merge: (persisted, current) => {
        const preference = (persisted as Partial<AppearanceState> | undefined)
          ?.preference;
        return {
          ...current,
          preference:
            preference === 'light' || preference === 'system'
              ? preference
              : 'dark',
        };
      },
      partialize: state => ({ preference: state.preference }),
    }
  )
);
