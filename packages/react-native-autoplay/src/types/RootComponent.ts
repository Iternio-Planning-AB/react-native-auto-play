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
  id: string;
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

export type AutoPlayClusterInitialProps = RootComponentInitialProps & {
  /**
   * lets you know if the compass is enabled/disabled
   * @namespace iOS
   */
  compass?: boolean;
  /**
   * lets you know if the speed limit is enabled/disabled
   * @namespace iOS
   */
  speedLimit?: boolean;
};
