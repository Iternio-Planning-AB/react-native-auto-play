import type React from 'react';
import { createContext, useEffect, useState } from 'react';
import type { SafeAreaInsets } from '..';
import { HybridAutoPlay } from '../hybrid/HybridAutoPlay';

const DEFAULT: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

export const SafeAreaInsetsContext = createContext<SafeAreaInsets>(DEFAULT);

export function SafeAreaInsetsProvider({
  children,
  moduleName,
}: {
  children: React.ReactNode;
  moduleName: string;
}) {
  const [insets, setInsets] = useState<SafeAreaInsets>(DEFAULT);

  useEffect(() => {
    const removeSafeAreaInsetsListener = HybridAutoPlay.addSafeAreaInsetsListener(
      moduleName,
      (safeAreaInsets) => {
        setInsets(safeAreaInsets);
      }
    );

    return () => {
      removeSafeAreaInsetsListener();
    };
  }, [moduleName]);

  return <SafeAreaInsetsContext.Provider value={insets}>{children}</SafeAreaInsetsContext.Provider>;
}
