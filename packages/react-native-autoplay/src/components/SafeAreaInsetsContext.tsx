// biome-ignore lint/style/useImportType: 'React' cannot be used as a value because it was imported using 'import type'
import React, { createContext, useEffect, useState } from 'react';
import { AutoPlay, type SafeAreaInsets } from '..';

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
    const removeSafeAreaInsetsListener = AutoPlay.addSafeAreaInsetsListener(
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
