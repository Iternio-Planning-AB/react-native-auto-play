import { glyphMap } from '../types/Glyphmap';
import type { AutoImage } from '../types/Image';
import { type NitroColor, NitroColorUtil } from './NitroColor';

/**
 * we need to map the ButtonImage.name from GlyphName to
 * the actual numeric value so we need a nitro specific type
 */
export type NitroImage = {
  glyph: number;
  color: NitroColor;
  backgroundColor: NitroColor;
};

function convert(image: AutoImage): NitroImage;
function convert(image?: AutoImage): NitroImage | undefined;
function convert(image?: AutoImage): NitroImage | undefined {
  if (image == null) {
    return undefined;
  }

  const {
    name,
    color = { darkColor: 'black', lightColor: 'white' },
    backgroundColor = 'transparent',
    ...rest
  } = image;

  return {
    ...rest,
    glyph: glyphMap[name],
    color:
      typeof color === 'string'
        ? NitroColorUtil.convertThemed({ darkColor: color, lightColor: color })
        : NitroColorUtil.convertThemed(color),
    backgroundColor:
      typeof backgroundColor === 'string'
        ? NitroColorUtil.convertThemed({ darkColor: backgroundColor, lightColor: backgroundColor })
        : NitroColorUtil.convertThemed(backgroundColor),
  };
}

export const NitroImageUtil = { convert };
