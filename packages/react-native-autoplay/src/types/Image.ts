import type { GlyphName } from './Glyphmap';

export type AutoImage = {
  name: GlyphName;

  /**
   * Sets the icon color used in light mode, on Android it is not always applied, depending on where the icon is used.
   * For example in a GridTemplate or in a ListTemplate a colored icon works, where on a MapTemplate it does not.
   * @summary defaults to white if not specified
   */
  lightColor?: string;

  /**
   * Sets the icon color used in dark mode, on Android it is not always applied, depending on where the icon is used
   * For example in a GridTemplate or in a ListTemplate a colored icon works, where on a MapTemplate it does not.
   * @summary defaults to black if not specified
   */
  darkColor?: string;

  /**
   * Sets the background color, currently Android does not allow colors and converts everything to grayscale so we stick to transparent for this
   * @summary defaults to transparent if not specified
   * @namespace iOS
   */
  backgroundColor?: string;
};
