import type React from 'react';
import { createContext } from 'react';
import type { MapTemplate } from '..';

export const MapTemplateContext = createContext<MapTemplate | null>(null);

export function MapTemplateProvider({
  children,
  mapTemplate,
}: {
  children: React.ReactNode;
  mapTemplate: MapTemplate;
}) {
  return <MapTemplateContext.Provider value={mapTemplate}>{children}</MapTemplateContext.Provider>;
}
