import type { ThemedColor } from '../utils/NitroColor';
import type { GlyphName } from './Glyphmap';

export type AutoImage = {
  name: GlyphName;

  /**
   * Sets the icon dark and light mode color or a single color for both.
   * Defaults to white for light mode and black for dark mode if not specified.
   * Might not get applied everywhere like MapTemplate buttons on Android.
   */
  color?: ThemedColor | string;

  /**
   * Sets the background color for dark and light mode or a single color for both
   * Defaults to transparent if not specified.
   */
  backgroundColor?: ThemedColor | string;
};
