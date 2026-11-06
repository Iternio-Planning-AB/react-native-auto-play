import { Image } from 'react-native';
import type { AutoAssetImage, AutoImage, LocalAutoImage } from '../types/Image';
import { type NitroColor, NitroColorUtil } from './NitroColor';

let _iconFont: string | undefined;
let _glyphMap: Record<string, number> | undefined;

/**
 * Register the icon font and (optionally) a glyph map for name-based lookups.
 * Must be called **once** before creating any templates. Subsequent calls are ignored.
 *
 * The font name maps directly to a native font asset:
 * - **Android** — `res/font/<name>.ttf` (must be lowercase)
 * - **iOS** — `<name>.ttf` in the app bundle (registered via CoreText automatically)
 *
 * For cross-platform compatibility use lowercase with underscores only.
 *
 * @param name  Native font asset name (without extension).
 * @param glyphMap  Optional map of glyph names to Unicode code points.
 *                  When provided, glyphs can use `{ type: 'glyph', name: 'icon_name' }`.
 *
 * @example
 * ```ts
 * import { glyphMap } from './assets/Glyphmap';
 * setIconFont('material_symbols', glyphMap);
 * ```
 */
export function setIconFont(name: string, glyphMap?: Record<string, number>): void {
  if (_iconFont != null) {
    return;
  }
  _iconFont = name;
  _glyphMap = glyphMap;
}

function getIconFont(): string {
  if (_iconFont == null) {
    throw new Error(
      'No icon font configured. Call setIconFont("your_font_name") before using glyph images.'
    );
  }
  return _iconFont;
}

function resolveGlyph(image: Extract<AutoImage, { type: 'glyph' }>): number {
  if ('name' in image && image.name !== undefined) {
    if (image.codepoint !== undefined) {
      return image.codepoint;
    }
    if (_glyphMap == null) {
      throw new Error(
        `Glyph name "${image.name}" used but no glyph map was provided to setIconFont().`
      );
    }
    const cp = _glyphMap[image.name];
    if (cp === undefined) {
      throw new Error(`Glyph name "${image.name}" not found in the glyph map.`);
    }
    return cp;
  }
  if (image.codepoint !== undefined) {
    return image.codepoint;
  }
  throw new Error('Glyph image must provide either `name` or `codepoint`.');
}

interface AssetImage {
  uri: string;
  width: number;
  height: number;
  scale: number;
  color?: NitroColor;
  packager_asset: boolean;
}

interface GlyphImage {
  glyph: number;
  fontName: string;
  color: NitroColor;
  backgroundColor: NitroColor;
  fontScale?: number;
}

/**
 * the placeholder glyph or asset is flattened into placeholder* fields, a nested struct overflows
 * nitrogen's call stack for the specs that use NitroImage deep inside their config.
 * `placeholderColor` is the glyph color or the asset tint.
 */
interface RemoteImage {
  uri: string;
  color?: NitroColor;
  timeoutMs?: number;
  placeholderGlyph?: number;
  placeholderFontName?: string;
  placeholderColor?: NitroColor;
  placeholderBackgroundColor?: NitroColor;
  placeholderFontScale?: number;
  placeholderUri?: string;
  placeholderWidth?: number;
  placeholderHeight?: number;
  placeholderScale?: number;
  placeholderPackagerAsset?: boolean;
}

/**
 * NitroModules-compatible image types passed to native.
 */
export type NitroImage = GlyphImage | AssetImage | RemoteImage;

function convertGlyph(image: Extract<AutoImage, { type: 'glyph' }>): GlyphImage {
  const { color = 'default', fontScale, backgroundColor = 'transparent' } = image;

  return {
    glyph: resolveGlyph(image),
    fontName: getIconFont(),
    color: NitroColorUtil.convert(color),
    backgroundColor: NitroColorUtil.convert(backgroundColor),
    fontScale,
  };
}

function convertAsset(image: AutoAssetImage): AssetImage {
  // Image.resolveAssetSource is pretty terrible, it will simply return whatever object you pass it is not a number [require(...)]
  // so the input allows all optional parameters which are returned as is even though
  // the return type claims to not have any optional parameters...
  // we specify some default values to not crash because of proper typing required by nitro-modules
  const {
    height = 0,
    scale = 0,
    uri = '',
    width = 0,
    ...rest
  } = Image.resolveAssetSource(image.image) ?? {};

  return {
    height,
    scale,
    uri,
    width,
    packager_asset: '__packager_asset' in rest ? Boolean(rest.__packager_asset) : false,
    color: NitroColorUtil.convert(image.color),
  };
}

function convertPlaceholder(placeholder?: LocalAutoImage): Partial<RemoteImage> {
  if (placeholder == null) {
    return {};
  }

  if (placeholder.type === 'asset') {
    const asset = convertAsset(placeholder);

    return {
      placeholderUri: asset.uri,
      placeholderWidth: asset.width,
      placeholderHeight: asset.height,
      placeholderScale: asset.scale,
      placeholderPackagerAsset: asset.packager_asset,
      placeholderColor: asset.color,
    };
  }

  const glyph = convertGlyph(placeholder);

  return {
    placeholderGlyph: glyph.glyph,
    placeholderFontName: glyph.fontName,
    placeholderColor: glyph.color,
    placeholderBackgroundColor: glyph.backgroundColor,
    placeholderFontScale: glyph.fontScale,
  };
}

function convert(image: AutoImage): NitroImage;
function convert(image?: AutoImage): NitroImage | undefined;
function convert(image?: AutoImage): NitroImage | undefined {
  if (image == null) {
    return undefined;
  }

  if (image.type === 'glyph') {
    return convertGlyph(image);
  }

  if (image.type === 'remote') {
    return {
      uri: image.uri,
      color: NitroColorUtil.convert(image.color),
      timeoutMs: image.timeoutMs,
      ...convertPlaceholder(image.placeholder),
    };
  }

  return convertAsset(image);
}

export const NitroImageUtil = { convert };
