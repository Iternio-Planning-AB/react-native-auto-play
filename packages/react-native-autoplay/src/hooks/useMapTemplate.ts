import { useContext } from 'react';
import { MapTemplateContext } from '../components/MapTemplateContext';

/**
 * provides access to the map template
 * obviously this works only on the map template component and its children
 */
export const useMapTemplate = () => {
  return useContext(MapTemplateContext);
};
