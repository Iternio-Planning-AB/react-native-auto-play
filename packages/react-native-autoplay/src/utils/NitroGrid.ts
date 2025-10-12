import type { AutoImage } from '../types/Image';
import type { AutoText } from '../types/Text';
import { NitroImage } from './NitroImage';

export type GridButton<T> = {
  title: AutoText;
  image: AutoImage;
  onPress: (template: T) => void;
};

export type NitroGridButton = {
  title: AutoText;
  image: NitroImage;
  onPress: () => void;
};

const convert = <T>(template: T, buttons: Array<GridButton<T>>) => {
  return buttons.map<NitroGridButton>((button) => ({
    title: button.title,
    image: NitroImage.convert(button.image),
    onPress: () => button.onPress(template),
  }));
};

export const NitroGridUtil = { convert };
