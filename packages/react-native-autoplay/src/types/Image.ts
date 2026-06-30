import type { ImageSourcePropType } from 'react-native';
import type { ThemedColor } from '../utils/NitroColor';

/**
 * Augment this interface in your app to get type-safe glyph name autocompletion.
 *
 * @example
 * ```ts
 * // autoplay-glyphs.d.ts
 * import type { GlyphName } from './assets/symbolFont/Glyphmap';
 * declare module '@iternio/react-native-auto-play' {
 *   interface AutoPlayGlyphMap extends Record<GlyphName, number> {}
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: must be an interface for declaration merging
export interface AutoPlayGlyphMap {}

/** Resolves to the augmented glyph name union, or falls back to `string` when not augmented. */
export type GlyphMapKey = keyof AutoPlayGlyphMap extends never
  ? string
  : Extract<keyof AutoPlayGlyphMap, string>;

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

/** Glyph by name — looked up in the glyph map registered via {@link setIconFont}. */
export type AutoGlyphByName = GlyphStyleFields & {
  type: 'glyph';
  /** Key in the glyph map passed to `setIconFont`. */
  name: GlyphMapKey;
  /** Optional override — if set, used instead of the map lookup. */
  codepoint?: number;
};

/** Glyph by raw Unicode code point. */
export type AutoGlyphByCodepoint = GlyphStyleFields & {
  type: 'glyph';
  codepoint: number;
};

export type AutoGlyph = AutoGlyphByName | AutoGlyphByCodepoint;

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

/**
 * Image for the CarPlay voice control overlay. Animated GIF, APNG, and WebP all animate.
 * `color` is ignored for animated assets — frames cannot be tinted individually. Static
 * assets and glyphs are resized/capped to fit within 150×150pt (`fontScale` controls a
 * glyph's relative size). CarPlay enforces a 0.3s–5s animation cycle duration: shorter
 * source animations are stretched to 0.3s by the system, longer ones are capped to 5s.
 * @namespace ios
 */
export type VoiceInputImage =
  | AutoGlyph
  | {
      type: 'asset';
      image: ImageSourcePropType;
      /** Tints the image. Ignored for animated assets — frames cannot be tinted individually. */
      color?: ThemedColor | string;
      /** Whether the animation loops. Defaults to `true` for animated images, `false` for static. */
      repeats?: boolean;
    };
