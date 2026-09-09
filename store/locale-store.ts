import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  isAppLocalePreference,
  type AppLocalePreference,
} from '@/lib/localization/language-options';

type LocaleState = {
  preference: AppLocalePreference;
  setPreference: (preference: AppLocalePreference) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    set => ({
      preference: 'system',
      setPreference: preference => set({ preference }),
    }),
    {
      name: 'menta-locale-preference',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ preference: state.preference }),
      version: 1,
      merge: (persistedState, currentState) => {
        const storedPreference = (persistedState as Partial<LocaleState> | null)
          ?.preference;

        return {
          ...currentState,
          preference: isAppLocalePreference(storedPreference)
            ? storedPreference
            : 'system',
        };
      },
    }
  )
);
