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
  fontScale?: number;
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

  if (image.type === 'glyph') {
    const {
      color = { darkColor: 'white', lightColor: 'black' },
      fontScale,
      name,
      backgroundColor = 'transparent',
    } = image;

    return {
      glyph: glyphMap[name],
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
      fontScale,
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
    color:
      typeof image.color === 'string'
        ? NitroColorUtil.convertThemed({ darkColor: image.color, lightColor: image.color })
        : NitroColorUtil.convertThemed(image.color),
  };

  return assetImage;
}

export const NitroImageUtil = { convert };
