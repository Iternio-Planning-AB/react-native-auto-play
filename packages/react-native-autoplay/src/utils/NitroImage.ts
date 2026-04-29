import { Image, type ImageResolvedAssetSource } from 'react-native';
import { glyphMap } from '../types/Glyphmap';
import type { AutoImage, GlyphFontSource } from '../types/Image';
import { type NitroColor, NitroColorUtil } from './NitroColor';

function glyphFontToBridge(font?: GlyphFontSource): { customFontName?: string } {
  if (font == null) {
    return {};
  }
  const n = font.name.trim();
  if (n.length === 0) {
    return {};
  }
  return { customFontName: n };
}

function resolveGlyphScalar(image: AutoGlyphForConvert): number {
  if ('name' in image && image.name !== undefined) {
    return image.codepoint ?? glyphMap[image.name];
  }
  if (image.codepoint !== undefined) {
    return image.codepoint;
  }
  throw new Error('Glyph image must set `name` or `codepoint`');
}

type AutoGlyphForConvert = Extract<AutoImage, { type: 'glyph' }>;

interface AssetImage extends ImageResolvedAssetSource {
  color?: NitroColor;
  packager_asset: boolean;
}

interface GlyphImage {
  glyph: number;
  color: NitroColor;
  backgroundColor: NitroColor;
  fontScale?: number;
  /** Same id for Android `res/font/<name>.ttf` and iOS `UIFont(name:size:)`. */
  customFontName?: string;
}

interface RemoteImage {
  uri: string;
  color?: NitroColor;
  timeoutMs?: number;
}

/**
 * we need to map the ButtonImage.name from GlyphName to
 * the actual numeric value so we need a nitro specific type
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
      font,
    } = image;

    return {
      glyph: resolveGlyphScalar(image),
      color: NitroColorUtil.convert(color),
      backgroundColor: NitroColorUtil.convert(backgroundColor),
      fontScale,
      ...glyphFontToBridge(font),
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
