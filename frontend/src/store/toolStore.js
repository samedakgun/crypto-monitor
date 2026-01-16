import { create } from 'zustand';
export const TOOLS = [
    { id: 'select', name: 'Select', icon: '⛶', cursor: 'default', shortcut: 'V' },
    { id: 'crosshair', name: 'Crosshair', icon: '✚', cursor: 'crosshair', shortcut: 'C' },
    { id: 'vertical', name: 'Vertical Line', icon: '┃', cursor: 'col-resize', shortcut: 'L' },
    { id: 'horizontal', name: 'Horizontal Line', icon: '━', cursor: 'row-resize', shortcut: 'H' },
    { id: 'trendline', name: 'Trend Line', icon: '╱', cursor: 'crosshair', shortcut: 'T' },
    { id: 'rectangle', name: 'Rectangle', icon: '▭', cursor: 'crosshair', shortcut: 'R' },
    { id: 'measure', name: 'Measure', icon: '📏', cursor: 'crosshair', shortcut: 'M' },
    { id: 'frvp', name: 'Volume Profile', icon: '📊', cursor: 'crosshair', shortcut: 'P' },
];
export const useToolStore = create((set) => ({
    // Initial state
    activeTool: 'select',
    magnetEnabled: false,
    frvpRange: null,
    isSelectingFRVP: false,
    // Actions
    setActiveTool: (tool) => set(() => ({
        activeTool: tool,
        // Reset FRVP when switching tools
        isSelectingFRVP: tool === 'frvp',
    })),
    toggleMagnet: () => set((state) => ({
        magnetEnabled: !state.magnetEnabled,
    })),
    setMagnetEnabled: (enabled) => set(() => ({
        magnetEnabled: enabled,
    })),
    setFRVPRange: (range) => set(() => ({
        frvpRange: range,
    })),
    setIsSelectingFRVP: (selecting) => set(() => ({
        isSelectingFRVP: selecting,
    })),
    startFRVPSelection: () => set(() => ({
        activeTool: 'frvp',
        isSelectingFRVP: true,
        frvpRange: null,
    })),
    cancelFRVPSelection: () => set(() => ({
        activeTool: 'select',
        isSelectingFRVP: false,
        frvpRange: null,
    })),
}));
