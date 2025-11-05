import { Platform } from 'react-native';
import type { MapButtons } from '../templates/MapTemplate';
import { type NitroImage, NitroImageUtil } from './NitroImage';

type NitroMapButtonType = 'pan' | 'custom';

export type NitroMapButton = {
  type: NitroMapButtonType;
  image?: NitroImage;
  onPress: () => void;
};

const convert = <T>(template: T, mapButtons?: MapButtons<T>): Array<NitroMapButton> | undefined => {
  if (mapButtons == null) {
    return undefined;
  }

  return mapButtons?.map<NitroMapButton>((button) => {
    const { onPress, type } = button;

    if (button.type === 'pan') {
      if (Platform.OS === 'android') {
        return { type: 'pan', onPress: () => onPress(template) };
      }
      throw new Error(
        'unsupported platform, pan button can be used on Android only! Use a custom button instead.'
      );
    }

    if (button.image.type === 'glyph') {
      const backgroundColor =
        Platform.OS === 'android'
          ? 'transparent'
          : 'backgroundColor' in button.image
            ? button.image.backgroundColor
            : 'transparent';

      const fontScale = (button.image.fontScale ?? Platform.OS === 'android') ? 1.0 : 0.65;

      return {
        type,
        onPress: () => onPress(template),
        image: NitroImageUtil.convert({ ...button.image, backgroundColor, fontScale }),
      };
    }

    return {
      type,
      onPress: () => onPress(template),
      image: NitroImageUtil.convert(button.image),
    };
  });
};

export const NitroMapButton = { convert };
