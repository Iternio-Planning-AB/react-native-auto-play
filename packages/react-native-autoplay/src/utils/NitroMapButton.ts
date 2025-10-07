import { Platform } from 'react-native';
import type { MapButtons } from '../templates/MapTemplate';
import { NitroImage } from './NitroImage';

type NitroMapButtonType = 'pan' | 'custom';

export type NitroMapButton = {
  type: NitroMapButtonType;
  image?: NitroImage;
  onPress: () => void;
};

const convert = (mapButtons?: MapButtons): Array<NitroMapButton> | undefined => {
  if (mapButtons == null) {
    return undefined;
  }

  return mapButtons?.map<NitroMapButton>((button) => {
    const { onPress, type } = button;

    if (button.type === 'pan') {
      if (Platform.OS === 'android') {
        return { type: 'pan', onPress };
      }
      throw new Error(
        'unsupported platform, pan button can be used on Android only! Use a custom button instead.'
      );
    }

    return {
      type,
      onPress,
      image: NitroImage.convert(button.image),
    };
  });
};

export const NitroMapButton = { convert };
