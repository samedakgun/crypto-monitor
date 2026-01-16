import { create } from 'zustand';

interface SettingsState {
  theme: 'dark' | 'light';
  showFootprint: boolean;
  toggleTheme: () => void;
  toggleFootprint: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'dark',
  showFootprint: true,
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  toggleFootprint: () => set((state) => ({ showFootprint: !state.showFootprint })),
}));
