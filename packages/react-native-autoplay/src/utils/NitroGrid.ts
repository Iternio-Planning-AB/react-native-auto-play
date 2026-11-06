import type { AutoImage } from '../types/Image';
import type { AutoText } from '../types/Text';
import { type NitroImage, NitroImageUtil } from './NitroImage';

export type GridButton<T> = {
  /**
   * optional, a button without title is drawn with an empty one
   */
  title?: AutoText;
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
    title: button.title ?? { text: '' },
    image: NitroImageUtil.convert(button.image),
    onPress: () => button.onPress(template),
  }));
};

export const NitroGridUtil = { convert };
