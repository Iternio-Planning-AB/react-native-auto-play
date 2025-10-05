import type { GlyphName } from './Glyphmap';

export type ButtonImage = {
  name: GlyphName;
  size?: number;
  /**
   * sets the icon color, currently Android does not allow colors and converts everything to grayscale so we stick to white for this
   * @summary defaults to white if not specified
   * @namespace iOS
   */
  color?: string;
  /**
   * sets the background color, currently Android does not allow colors and converts everything to grayscale so we stick to transparent for this
   * @summary defaults to transparent if not specified
   * @namespace iOS
   */
  backgroundColor?: string;
};

export type MapButton = {
  type: 'custom';
  image: ButtonImage;
  onPress: () => void;
};

/**
 * this is a special button only visible on devices that have no touch support
 * @namespace Android
 */
export type MapPanButton = {
  type: 'pan';
  onPress: () => void;
};

export type TextButton = {
  type: 'text';
  title: string;
  enabled?: boolean;
  onPress: () => void;
};

export type ImageButton = {
  type: 'image';
  image: ButtonImage;
  enabled?: boolean;
  onPress: () => void;
};

export type TextAndImageButton = {
  type: 'textImage';
  image: ButtonImage;
  title: string;
  enabled?: boolean;
  onPress: () => void;
};

/**
 * @namespace iOS
 */
export type ActionButtonIos = TextButton | ImageButton;

export type BackButton = {
  type: 'back';
  onPress: () => void;
};

/**
 * this is a special button that just shows the app icon and can not be pressed
 * @namespace Android
 */
export type AppButton = {
  type: 'appIcon';
};

/**
 * @namespace Android
 */
export enum Flag {
  Primary = 1,
  Persistent = 2,
  Default = 4,
}

/**
 * @namespace Android
 */
export type Flags = Flag | (number & { __brand: 'Flags' });

/**
 * @namespace Android
 */
export type ActionButtonAndroid =
  | ((TextButton | ImageButton | TextAndImageButton) & {
      /**
       * flags can be bitwise combined
       */
      flags?: Flags;
    })
  | BackButton
  | AppButton;
