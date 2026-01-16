import { create } from 'zustand';
import { FRVPRange } from '@shared/types/market';

// Tüm çizim araçları
export type Tool =
  | 'select'      // Seçim aracı
  | 'crosshair'   // Artı işareti
  | 'vertical'    // Dikey çizgi
  | 'horizontal'  // Yatay çizgi
  | 'trendline'   // Eğilim çizgisi
  | 'rectangle'   // Dikdörtgen
  | 'measure'     // Ölçüm aracı
  | 'frvp';       // Fixed Range Volume Profile

// Araç tanımlamaları
export interface ToolDefinition {
  id: Tool;
  name: string;
  icon: string;
  cursor: string;
  shortcut?: string;
}

export const TOOLS: ToolDefinition[] = [
  { id: 'select', name: 'Select', icon: '⛶', cursor: 'default', shortcut: 'V' },
  { id: 'crosshair', name: 'Crosshair', icon: '✚', cursor: 'crosshair', shortcut: 'C' },
  { id: 'vertical', name: 'Vertical Line', icon: '┃', cursor: 'col-resize', shortcut: 'L' },
  { id: 'horizontal', name: 'Horizontal Line', icon: '━', cursor: 'row-resize', shortcut: 'H' },
  { id: 'trendline', name: 'Trend Line', icon: '╱', cursor: 'crosshair', shortcut: 'T' },
  { id: 'rectangle', name: 'Rectangle', icon: '▭', cursor: 'crosshair', shortcut: 'R' },
  { id: 'measure', name: 'Measure', icon: '📏', cursor: 'crosshair', shortcut: 'M' },
  { id: 'frvp', name: 'Volume Profile', icon: '📊', cursor: 'crosshair', shortcut: 'P' },
];

interface ToolState {
  // Active tool
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  // Magnet mode - çizgileri mumların OHLC noktalarına yapıştırır
  magnetEnabled: boolean;
  toggleMagnet: () => void;
  setMagnetEnabled: (enabled: boolean) => void;

  // FRVP (Fixed Range Volume Profile) state
  frvpRange: FRVPRange | null;
  isSelectingFRVP: boolean;
  setFRVPRange: (range: FRVPRange | null) => void;
  setIsSelectingFRVP: (selecting: boolean) => void;
  startFRVPSelection: () => void;
  cancelFRVPSelection: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  // Initial state
  activeTool: 'select',
  magnetEnabled: false,
  frvpRange: null,
  isSelectingFRVP: false,

  // Actions
  setActiveTool: (tool) =>
    set(() => ({
      activeTool: tool,
      // Reset FRVP when switching tools
      isSelectingFRVP: tool === 'frvp',
    })),

  toggleMagnet: () =>
    set((state) => ({
      magnetEnabled: !state.magnetEnabled,
    })),

  setMagnetEnabled: (enabled) =>
    set(() => ({
      magnetEnabled: enabled,
    })),

  setFRVPRange: (range) =>
    set(() => ({
      frvpRange: range,
    })),

  setIsSelectingFRVP: (selecting) =>
    set(() => ({
      isSelectingFRVP: selecting,
    })),

  startFRVPSelection: () =>
    set(() => ({
      activeTool: 'frvp',
      isSelectingFRVP: true,
      frvpRange: null,
    })),

  cancelFRVPSelection: () =>
    set(() => ({
      activeTool: 'select',
      isSelectingFRVP: false,
      frvpRange: null,
    })),
}));
