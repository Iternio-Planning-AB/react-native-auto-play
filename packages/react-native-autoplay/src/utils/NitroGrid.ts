import type { AutoImage } from '../types/Image';
import type { AutoText } from '../types/Text';
import { NitroImage } from './NitroImage';

export type GridButton = {
  title: AutoText;
  image: AutoImage;
  onPress: () => void;
};

export type NitroGridButton = {
  title: AutoText;
  image: NitroImage;
  onPress: () => void;
};

const convert = (buttons: Array<GridButton>) => {
  return buttons.map<NitroGridButton>((button) => ({
    title: button.title,
    image: NitroImage.convert(button.image),
    onPress: button.onPress,
  }));
};

export const NitroGridUtil = { convert };
