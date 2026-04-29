import type { ImageSourcePropType } from 'react-native';
import type { ThemedColor } from '../utils/NitroColor';
import type { GlyphName } from './Glyphmap';

/**
 * Optional custom font for `type: 'glyph'` images. When omitted, the bundled Material Symbols font is used.
 *
 * The value is passed to native as **`customFontName`**: Android resolves `res/font/<name>.ttf` using the id
 * lowercased (Android font resource names must be lowercase); iOS uses the original string with `UIFont(name:size:)`.
 */
export type GlyphFontSource = {
  /** Font id: Android lowercases for `res/font/<name>.ttf`; iOS uses this string as-is for `UIFont(name:size:)`. */
  name: string;
};

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
  font?: GlyphFontSource;
};

/** Material symbol by name from the bundled map; optional `codepoint` overrides the mapped value. */
type AutoGlyphByName = GlyphStyleFields & {
  type: 'glyph';
  name: GlyphName;
  codepoint?: number;
};

/** Raw Unicode scalar for icon fonts not covered by the Material map (e.g. custom TTF). */
type AutoGlyphByCodepoint = GlyphStyleFields & {
  type: 'glyph';
  codepoint: number;
};

export type AutoImage =
  | AutoGlyphByName
  | AutoGlyphByCodepoint
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
