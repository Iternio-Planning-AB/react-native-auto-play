import type { AutoImage } from '../types/Image';
import { type NitroImage, NitroImageUtil } from './NitroImage';

type NitroAttributedStringImage = {
  image: NitroImage;
  position: number;
};

export type NitroAttributedString = {
  text: string;
  images?: Array<NitroAttributedStringImage>;
};

export type AutoAttributedString = {
  text: string;
  images?: Array<{ image: AutoImage; position: number }>;
};

function convert(attributedStrings: Array<AutoAttributedString>): Array<NitroAttributedString> {
  return attributedStrings.map((attributedString) => ({
    ...attributedString,
    images: attributedString.images?.map((image) => ({
      ...image,
      image: NitroImageUtil.convert(image.image),
    })),
  }));
}

export const NitroAttributedStringUtil = { convert };
