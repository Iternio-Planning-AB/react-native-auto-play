import type { ImageSourcePropType } from 'react-native';
import type { ThemedColor } from '../utils/NitroColor';
import type { GlyphName } from './Glyphmap';

export type AutoImage =
  | {
      name: GlyphName;

      /**
       * Sets the icon dark and light mode color or a single color for both.
       * Defaults to white for dark mode and black for light mode if not specified.
       * Might not get applied everywhere like MapTemplate buttons on Android.
       */
      color?: ThemedColor | string;

      /**
       * Sets the background color for dark and light mode or a single color for both
       * Defaults to transparent if not specified.
       */
      backgroundColor?: ThemedColor | string;
      fontScale?: number;
      type: 'glyph';
    }
  | {
      image: ImageSourcePropType;
      /**
       * if specified the image gets tinted, if not it will just use the original image
       * Might not get applied everywhere like MapTemplate buttons on Android.
       */
      color?: ThemedColor | string;
      type: 'image';
    };
