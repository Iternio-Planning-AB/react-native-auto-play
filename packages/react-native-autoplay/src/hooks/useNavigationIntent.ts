import { useCallback, useEffect, useState } from 'react';
import { HybridAndroidAutoNavigation } from '../hybrid/HybridAndroidAutoNavigation';
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

  useEffect(
    () => HybridAndroidAutoNavigation?.addListenerNavigationIntent(setNavigationIntent),
    []
  );

  return { navigationIntent, resetNavigationIntent };
};
