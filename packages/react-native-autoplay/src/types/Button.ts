import type { AutoImage } from './Image';

export type MapButton = {
  type: 'custom';
  image: AutoImage;
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
  image: AutoImage;
  enabled?: boolean;
  onPress: () => void;
};

export type TextAndImageButton = {
  type: 'textImage';
  image: AutoImage;
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
