import { useContext } from 'react';
import { type MapTemplateRef, MapTemplateContext } from '../components/MapTemplateContext';

export type { MapTemplateRef } from '../components/MapTemplateContext';

/**
 * Provides access to the map template via a ref.
 * The returned ref's `.current` is null when disconnected, preventing
 * native calls after CarPlay/Android Auto disconnects.
 *
 * Always check `ref.current` for null before use.
 * In useEffect cleanups, reading `ref.current` will correctly return null
 * if a disconnect happened before the cleanup runs.
 */
export const useMapTemplate = (): MapTemplateRef => {
  return useContext(MapTemplateContext);
};
