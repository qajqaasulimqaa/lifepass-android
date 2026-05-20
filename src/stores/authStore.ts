import { create } from 'zustand';

type AuthStore = {
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  setAuthenticated: (value: boolean) => void;
  setHasSeenOnboarding: (value: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  hasSeenOnboarding: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
}));
