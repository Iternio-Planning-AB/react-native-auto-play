import type { ImageSourcePropType } from 'react-native';
import type { ThemedColor } from '../utils/NitroColor';

type GlyphStyleFields = {
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
};

/** Glyph image rendered from an icon font using a Unicode code point. */
export type AutoGlyph = GlyphStyleFields & {
  type: 'glyph';
  codepoint: number;
};

export type AutoImage =
  | AutoGlyph
  | {
      image: ImageSourcePropType;
      /**
       * if specified the image gets tinted, if not it will just use the original image
       * Might not get applied everywhere like MapTemplate buttons on Android.
       */
      color?: ThemedColor | string;
      type: 'asset';
    }
  | {
      /** HTTPS URL to a remote image. HTTP is not supported (blocked by App Transport Security). */
      uri: string;
      /**
       * if specified the image gets tinted, if not it will just use the original image
       */
      color?: ThemedColor | string;
      /**
       * Network timeout in milliseconds before the remote fetch is abandoned and `null` is returned.
       * Defaults to 500ms when not specified.
       */
      timeoutMs?: number;
      type: 'remote';
    };
