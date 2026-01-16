import { create } from 'zustand';
export const useSettingsStore = create((set) => ({
    theme: 'dark',
    showFootprint: true,
    toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    toggleFootprint: () => set((state) => ({ showFootprint: !state.showFootprint })),
}));
