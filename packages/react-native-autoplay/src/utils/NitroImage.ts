import { Platform } from 'react-native';
import { glyphMap } from '../types/Glyphmap';
import type { AutoImage } from '../types/Image';
import { NitroColorUtil } from './NitroColor';

/**
 * we need to map the ButtonImage.name from GlyphName to
 * the actual numeric value so we need a nitro specific type
 */
export type NitroImage = {
  glyph: number;
  lightColor?: number;
  darkColor?: number;
  backgroundColor?: number;
};

function convert(image: AutoImage): NitroImage;
function convert(image?: AutoImage): NitroImage | undefined;
function convert(image?: AutoImage): NitroImage | undefined {
  if (image == null) {
    return undefined;
  }

  const {
    name,
    lightColor = 'black',
    darkColor = 'white',
    backgroundColor = 'transparent',
    ...rest
  } = image;
  return {
    ...rest,
    glyph: glyphMap[name],
    lightColor: NitroColorUtil.convert(lightColor),
    darkColor: NitroColorUtil.convert(darkColor),
    backgroundColor: NitroColorUtil.convert(
      Platform.OS === 'android' ? 'transparent' : backgroundColor
    ),
  };
}

export const NitroImageUtil = { convert };
