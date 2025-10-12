import type { AutoImage } from './Image';

export type MapButton<T> = {
  type: 'custom';
  image: AutoImage;
  onPress: (template: T) => void;
};

/**
 * this is a special button only visible on devices that have no touch support
 * @namespace Android
 */
export type MapPanButton<T> = {
  type: 'pan';
  onPress: (template: T) => void;
};

export type TextButton<T> = {
  type: 'text';
  title: string;
  enabled?: boolean;
  onPress: (template: T) => void;
};

export type ImageButton<T> = {
  type: 'image';
  image: AutoImage;
  enabled?: boolean;
  onPress: (template: T) => void;
};

export type TextAndImageButton<T> = {
  type: 'textImage';
  image: AutoImage;
  title: string;
  enabled?: boolean;
  onPress: (template: T) => void;
};

/**
 * @namespace iOS
 */
export type ActionButtonIos<T> = TextButton<T> | ImageButton<T>;

export type BackButton<T> = {
  type: 'back';
  onPress: (template: T) => void;
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
export type ActionButtonAndroid<T> =
  | ((TextButton<T> | ImageButton<T> | TextAndImageButton<T>) & {
      /**
       * flags can be bitwise combined
       */
      flags?: Flags;
    })
  | BackButton<T>
  | AppButton;
