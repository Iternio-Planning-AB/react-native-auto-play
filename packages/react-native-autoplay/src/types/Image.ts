import type { GlyphName } from './Glyphmap';

export type AutoImage = {
  name: GlyphName;

  /**
   * sets the icon color, on Android it is not always applied, depending on where the icon is used
   * @summary defaults to white if not specified
   */
  dayColor?: string;

  /**
   * sets the icon color, on Android it is not always applied, depending on where the icon is used
   * @summary defaults to black if not specified
   */
  nightColor?: string;

  /**
   * sets the background color, currently Android does not allow colors and converts everything to grayscale so we stick to transparent for this
   * @summary defaults to transparent if not specified
   * @namespace iOS
   */
  backgroundColor?: string;
};
