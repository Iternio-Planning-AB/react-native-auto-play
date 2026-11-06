import type { LocalAutoImage } from '../types/Image';
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
  /**
   * no remote images, attributed strings are not redrawn once a download finishes, see README
   */
  images?: Array<{ image: LocalAutoImage; position: number }>;
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
