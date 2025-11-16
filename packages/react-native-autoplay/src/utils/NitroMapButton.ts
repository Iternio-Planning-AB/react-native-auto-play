import { Platform } from 'react-native';
import type { MapButtons } from '../templates/MapTemplate';
import { type NitroImage, NitroImageUtil } from './NitroImage';

type NitroMapButtonType = 'pan' | 'custom';

export type NitroMapButton = {
  type: NitroMapButtonType;
  image: NitroImage;
  onPress?: () => void;
};

const convert = <T>(template: T, mapButtons?: MapButtons<T>): Array<NitroMapButton> | undefined => {
  if (mapButtons == null) {
    return undefined;
  }

  return mapButtons?.map<NitroMapButton>((button) => {
    const { type } = button;
    const onPress = button.type === 'custom' ? () => button.onPress(template) : undefined;

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
        onPress,
        image: NitroImageUtil.convert({ ...button.image, backgroundColor, fontScale }),
      };
    }

    return {
      type,
      onPress,
      image: NitroImageUtil.convert(button.image),
    };
  });
};

export const NitroMapButton = { convert };
