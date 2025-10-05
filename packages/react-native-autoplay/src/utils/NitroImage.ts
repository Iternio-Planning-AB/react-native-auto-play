import { Platform, processColor } from 'react-native';
import type { ButtonImage } from '../types/Button';
import { glyphMap } from '../types/Glyphmap';

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

const convert = (image: ButtonImage): NitroImage => {
  const { name, size = 16, color = 'white', backgroundColor = 'transparent', ...rest } = image;
  return {
    ...rest,
    size,
    glyph: glyphMap[name],
    color: processColor(Platform.OS === 'android' ? 'white' : color) as number | undefined,
    backgroundColor: processColor(Platform.OS === 'android' ? 'transparent' : backgroundColor) as
      | number
      | undefined,
  };
};

export const NitroImage = { convert };
