import { useCallback, useEffect, useState } from 'react';
import { HybridAutoPlay } from '../hybrid/HybridAutoPlay';
import type { NavigationIntent } from '../types/NavigationIntent';

/**
 * Exposes the latest navigation intent the OS sent, e.g. "navigate to X" by voice.
 * Subscribes on mount, so the intent that cold-started the app is received too.
 * Call resetNavigationIntent once it was handled, otherwise the same intent stays set.
 * @namespace Android
 */
export const useNavigationIntent = () => {
  const [navigationIntent, setNavigationIntent] = useState<NavigationIntent | undefined>();

  const resetNavigationIntent = useCallback(() => {
    setNavigationIntent(undefined);
  }, []);

  useEffect(() => HybridAutoPlay.addListenerNavigationIntent(setNavigationIntent), []);

  return { navigationIntent, resetNavigationIntent };
};
