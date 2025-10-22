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
  dayColor?: number;
  nightColor?: number;
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
    dayColor = 'white',
    nightColor = 'black',
    backgroundColor = 'transparent',
    ...rest
  } = image;
  return {
    ...rest,
    glyph: glyphMap[name],
    dayColor: NitroColorUtil.convert(dayColor) as number | undefined,
    nightColor: NitroColorUtil.convert(nightColor) as number | undefined,
    backgroundColor: NitroColorUtil.convert(
      Platform.OS === 'android' ? 'transparent' : backgroundColor
    ) as number | undefined,
  };
}

export const NitroImageUtil = { convert };
