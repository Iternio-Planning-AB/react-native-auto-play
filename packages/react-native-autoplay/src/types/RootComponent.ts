import type { MapTemplateId } from '../templates/MapTemplate';

export type WindowInformation = {
  width: number;
  height: number;
  scale: number;
};

export type ColorScheme = 'dark' | 'light';

export type RootComponentInitialProps = {
  /**
   * AutoPlayRoot for the main app on the head unit
   * AutoPlayDashboard for the CarPlay dashboard (iOS only)
   * or a random uuid for cluster displays
   */
  id: MapTemplateId;
  /**
   * react-native rootTag
   */
  rootTag: number;
  /**
   * this is the initial color scheme, add onAppearanceDidChange on MapTemplate to get updates
   */
  colorScheme: ColorScheme;
  window: WindowInformation;
};
