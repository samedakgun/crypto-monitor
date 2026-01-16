import { useEffect } from 'react';
import { useMarketStore } from '../store/marketStore';
import { useToolStore, TOOLS } from '../store/toolStore';
import { Timeframe } from '@shared/types/market';

export function useKeyboardShortcuts() {
  const { selectedInterval, setInterval } = useMarketStore();
  const {
    activeTool,
    setActiveTool,
    startFRVPSelection,
    cancelFRVPSelection,
    toggleMagnet,
  } = useToolStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Timeframe shortcuts (1-6 keys)
      const timeframeMap: Record<string, Timeframe> = {
        '1': '1m',
        '2': '5m',
        '3': '15m',
        '4': '30m',
        '5': '1h',
        '6': '4h',
      };

      if (timeframeMap[e.key]) {
        e.preventDefault();
        setInterval(timeframeMap[e.key]);
        return;
      }

      const key = e.key.toUpperCase();

      // Tool shortcuts from TOOLS array
      const tool = TOOLS.find((t) => t.shortcut === key);
      if (tool) {
        e.preventDefault();
        if (tool.id === 'frvp') {
          if (activeTool === 'frvp') {
            cancelFRVPSelection();
          } else {
            startFRVPSelection();
          }
        } else {
          setActiveTool(tool.id);
        }
        return;
      }

      // Other shortcuts
      switch (key) {
        case 'ESCAPE':
          // ESC - Cancel current tool, return to select
          e.preventDefault();
          if (activeTool !== 'select') {
            setActiveTool('select');
          }
          break;

        case 'G':
          // G - Toggle Magnet mode
          e.preventDefault();
          toggleMagnet();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    selectedInterval,
    setInterval,
    activeTool,
    setActiveTool,
    startFRVPSelection,
    cancelFRVPSelection,
    toggleMagnet,
  ]);
}
