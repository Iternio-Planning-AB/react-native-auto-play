import type React from 'react';
import { createContext, type RefObject, useEffect, useRef } from 'react';
import { HybridAutoPlay, type MapTemplate } from '..';

export type MapTemplateRef = RefObject<MapTemplate | null>;

const defaultRef: MapTemplateRef = { current: null };

export const MapTemplateContext = createContext<MapTemplateRef>(defaultRef);

export function MapTemplateProvider({
  children,
  mapTemplate,
}: {
  children: React.ReactNode;
  mapTemplate: MapTemplate;
}) {
  const templateRef = useRef<MapTemplate | null>(mapTemplate);
  templateRef.current = mapTemplate;

  useEffect(() => {
    // in react-native the children run their cleanup functions in the useEffects first, so we can't set it to null in the cleanup function of this
    // component, but rather need to use the disconnect handler, which is called before all the components are unmounted. Like that an invalid
    // map template can't be used anymore in the childrens cleanup functions, which prevents accessing native code, when the head unit disconnects.
    const removeListener = HybridAutoPlay.addListener('didDisconnect', () => {
      templateRef.current = null;
    });

    return removeListener;
  }, []);

  return <MapTemplateContext.Provider value={templateRef}>{children}</MapTemplateContext.Provider>;
}
