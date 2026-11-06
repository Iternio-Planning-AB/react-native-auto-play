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
   * Defaults to `'default'` if not specified, which is white for dark mode and black for light mode.
   * On Android Auto the host tint that follows the template is not applied when `backgroundColor` is not transparent.
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

export type AutoAssetImage = {
  image: ImageSourcePropType;
  /**
   * if specified the image gets tinted, if not it will just use the original image
   * Might not get applied everywhere like MapTemplate buttons on Android.
   * Use `'default'` for monochrome icons that must stay readable on both dark and light
   * Android Auto templates (17.8+), see README.
   */
  color?: ThemedColor | string;
  type: 'asset';
};

/**
 * `AutoImage` without remote images, for images drawn outside of a template build such as
 * navigation alerts. A remote image there would hold up the update while it downloads and can not
 * be redrawn once it arrives, see README.
 */
export type LocalAutoImage = AutoGlyph | AutoAssetImage;

export type AutoImage =
  | LocalAutoImage
  | {
      /** HTTPS URL to a remote image. HTTP is not supported (blocked by App Transport Security). */
      uri: string;
      /**
       * if specified the image gets tinted, if not it will just use the original image
       * Use `'default'` for monochrome icons that must stay readable on both dark and light
       * Android Auto templates (17.8+), see README.
       */
      color?: ThemedColor | string;
      /**
       * Without `placeholder`: how long building the template waits for the download, an
       * uncached image delays the template by up to this, defaults to 500ms. The image is shown
       * as an error icon when the download takes longer.
       * With `placeholder`: how long the background download may take before it is given up and
       * the placeholder stays, defaults to 10s. Where an image is drawn outside of a template
       * build (CarPlay map panel header actions and map buttons) it is ignored and the download
       * waits for 500ms like without placeholder.
       */
      timeoutMs?: number;
      /**
       * Shown while the image downloads, the template is not delayed by the download and gets
       * redrawn with the image once it is available. Also stays when the download fails.
       * Header actions and map buttons of a CarPlay map panel are applied outside of a template
       * build and still wait like without a placeholder, see README.
       * Glyphs are drawn at a larger size so they stay sharp in large grid items, assets at their
       * own size.
       */
      placeholder?: LocalAutoImage;
      type: 'remote';
    };

/**
 * `T` with every image in it restricted to {@link LocalAutoImage}, for configs drawn outside of a
 * template build that reuse types with `AutoImage` fields, like map buttons and list rows.
 */
export type WithoutRemoteImages<T> = T extends { type: 'remote'; uri: string }
  ? never
  : T extends (...args: never[]) => unknown
    ? T
    : T extends object
      ? { [K in keyof T]: WithoutRemoteImages<T[K]> }
      : T;

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
