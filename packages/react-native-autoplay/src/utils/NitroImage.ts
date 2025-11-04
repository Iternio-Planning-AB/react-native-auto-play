import { Image, type ImageResolvedAssetSource } from 'react-native';
import { glyphMap } from '../types/Glyphmap';
import type { AutoImage } from '../types/Image';
import { type NitroColor, NitroColorUtil } from './NitroColor';

interface AssetImage extends ImageResolvedAssetSource {
  color?: NitroColor;
  packager_asset: boolean;
}

interface GlyphImage {
  glyph: number;
  color: NitroColor;
  backgroundColor: NitroColor;
}

/**
 * we need to map the ButtonImage.name from GlyphName to
 * the actual numeric value so we need a nitro specific type
 */
export type NitroImage = GlyphImage | AssetImage;

function convert(image: AutoImage): NitroImage;
function convert(image?: AutoImage): NitroImage | undefined;
function convert(image?: AutoImage): NitroImage | undefined {
  if (image == null) {
    return undefined;
  }

  if ('name' in image) {
    const { color = { darkColor: 'white', lightColor: 'black' } } = image;
    const backgroundColor = image.backgroundColor ?? 'transparent';

    return {
      glyph: glyphMap[image.name],
      color:
        typeof color === 'string'
          ? NitroColorUtil.convertThemed({ darkColor: color, lightColor: color })
          : NitroColorUtil.convertThemed(color),
      backgroundColor:
        typeof backgroundColor === 'string'
          ? NitroColorUtil.convertThemed({
              darkColor: backgroundColor,
              lightColor: backgroundColor,
            })
          : NitroColorUtil.convertThemed(backgroundColor),
    };
  }

  if ('image' in image) {
    const { color } = image;
    const resolvedAsset = Image.resolveAssetSource(image.image);

    const assetImage: AssetImage = {
      ...resolvedAsset,
      packager_asset:
        '__packager_asset' in resolvedAsset ? Boolean(resolvedAsset.__packager_asset) : false,
      color:
        typeof color === 'string'
          ? NitroColorUtil.convertThemed({ darkColor: color, lightColor: color })
          : NitroColorUtil.convertThemed(color),
    };

    return assetImage;
  }

  return undefined;
}

export const NitroImageUtil = { convert };
