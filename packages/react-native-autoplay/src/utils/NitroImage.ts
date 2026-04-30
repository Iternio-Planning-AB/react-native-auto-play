import { Image, type ImageResolvedAssetSource } from 'react-native';
import type { AutoImage } from '../types/Image';
import { type NitroColor, NitroColorUtil } from './NitroColor';

let _iconFont: string | undefined;

/**
 * Set the icon font name used for all glyph images. Must be called before
 * creating any templates.
 *
 * The name maps directly to a native font asset:
 * - **Android** — `res/font/<name>.ttf` (must be lowercase)
 * - **iOS** — `<name>.ttf` in the app bundle (registered via CoreText automatically)
 *
 * For cross-platform compatibility use lowercase with underscores only.
 *
 * @example
 * ```ts
 * setIconFont('material_symbols');
 * ```
 */
export function setIconFont(name: string): void {
  _iconFont = name;
}

function getIconFont(): string {
  if (_iconFont == null) {
    throw new Error(
      'No icon font configured. Call setIconFont("your_font_name") before using glyph images.'
    );
  }
  return _iconFont;
}

interface AssetImage extends ImageResolvedAssetSource {
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

interface RemoteImage {
  uri: string;
  color?: NitroColor;
  timeoutMs?: number;
}

/**
 * NitroModules-compatible image types passed to native.
 */
export type NitroImage = GlyphImage | AssetImage | RemoteImage;

function convert(image: AutoImage): NitroImage;
function convert(image?: AutoImage): NitroImage | undefined;
function convert(image?: AutoImage): NitroImage | undefined {
  if (image == null) {
    return undefined;
  }

  if (image.type === 'glyph') {
    const {
      color = { darkColor: 'white', lightColor: 'black' },
      fontScale,
      backgroundColor = 'transparent',
    } = image;

    return {
      glyph: image.codepoint,
      fontName: getIconFont(),
      color: NitroColorUtil.convert(color),
      backgroundColor: NitroColorUtil.convert(backgroundColor),
      fontScale,
    };
  }

  if (image.type === 'remote') {
    return {
      uri: image.uri,
      color: NitroColorUtil.convert(image.color),
      timeoutMs: image.timeoutMs,
    };
  }

  // Image.resolveAssetSource is pretty terrible, it will simply return whatever object you pass it is not a number [require(...)]
  // so the input allows all optional parameters which are returned as is even though
  // the return type claims to not have any optional parameters...
  // we specify some default values to not crash because of proper typing required by nitro-modules
  const { height = 0, scale = 0, uri, width = 0, ...rest } = Image.resolveAssetSource(image.image);

  const assetImage: AssetImage = {
    height,
    scale,
    uri,
    width,
    packager_asset: '__packager_asset' in rest ? Boolean(rest.__packager_asset) : false,
    color: NitroColorUtil.convert(image.color),
  };

  return assetImage;
}

export const NitroImageUtil = { convert };
