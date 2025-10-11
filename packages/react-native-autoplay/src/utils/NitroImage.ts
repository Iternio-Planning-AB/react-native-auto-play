import { Platform, processColor } from 'react-native';
import { glyphMap } from '../types/Glyphmap';
import type { AutoImage } from '../types/Image';

/**
 * we need to map the ButtonImage.name from GlyphName to
 * the actual numeric value so we need a nitro specific type
 */
export type NitroImage = {
  glyph: number;
  size: number;
  color?: number;
  backgroundColor?: number;
};

function convert(image: AutoImage): NitroImage;
function convert(image?: AutoImage): NitroImage | undefined;
function convert(image?: AutoImage): NitroImage | undefined {
  if (image == null) {
    return undefined;
  }

  const { name, size = 22, color = 'white', backgroundColor = 'transparent', ...rest } = image;
  return {
    ...rest,
    size,
    glyph: glyphMap[name],
    color: processColor(color) as number | undefined,
    backgroundColor: processColor(Platform.OS === 'android' ? 'transparent' : backgroundColor) as
      | number
      | undefined,
  };
}

export const NitroImage = { convert };
