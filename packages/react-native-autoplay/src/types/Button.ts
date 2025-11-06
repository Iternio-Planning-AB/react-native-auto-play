import type { AutoImage } from './Image';

export type MapButton<T = unknown> = {
  type: 'custom';
  image: AutoImage;
  onPress: (template: T) => void;
};

export type ButtonStyle = 'normal' | 'confirm' | 'cancel';

/**
 * this is a special button only visible on devices that have no touch support
 * @namespace Android
 */
export type MapPanButton<T = unknown> = {
  type: 'pan';
  onPress: (template: T) => void;
};

type BaseButton<T = unknown> = {
  style?: ButtonStyle;
  enabled?: boolean;
  onPress: (template: T) => void;
};

export type TextButton<T = unknown> = BaseButton<T> & {
  type: 'text';
  title: string;
};

export type ImageButton<T = unknown> = BaseButton<T> & {
  type: 'image';
  image: AutoImage;
};

export type TextAndImageButton<T = unknown> = BaseButton<T> & {
  type: 'textImage';
  image: AutoImage;
  title: string;
};

/**
 * @namespace iOS
 */
export type ActionButtonIos<T = unknown> = TextButton<T> | ImageButton<T>;

export type BackButton<T = unknown> = {
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
export type ActionButtonAndroid<T = unknown> =
  | (CustomActionButtonAndroid<T> & {
      /**
       * flags can be bitwise combined
       */
      flags?: Flags;
    })
  | BackButton<T>
  | AppButton;

/**
 * this excludes back and appIcon
 */
export type CustomActionButtonAndroid<T> = TextButton<T> | ImageButton<T> | TextAndImageButton<T>;
