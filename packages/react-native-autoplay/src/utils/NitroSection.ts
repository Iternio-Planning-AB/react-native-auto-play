import type { AutoImage } from '../types/Image';
import type { AutoText } from '../types/Text';
import { type NitroImage, NitroImageUtil } from './NitroImage';

type BaseRow = {
  title: AutoText;
  enabled?: boolean;
  image?: AutoImage;
};

export type DefaultRow<T> = BaseRow & {
  type: 'default';
  /**
   * adds a chevron at the end of the row
   */
  browsable?: boolean;
  onPress: (template: T) => void;
  detailedText?: AutoText;
};

export type ToggleRow<T> = BaseRow & {
  type: 'toggle';
  checked: boolean;
  onPress: (template: T, checked: boolean) => void;
};

export type RadioRow<T> = BaseRow & {
  type: 'radio';
  onPress: (template: T) => void;
  selected?: boolean;
};

export type TextRow = BaseRow & {
  type: 'text';
  detailedText?: AutoText;
};

export type MultiSection<T> =
  | {
      type: 'default';
      title: string;
      items: Array<DefaultRow<T> | ToggleRow<T> | TextRow>;
    }
  | {
      type: 'radio';
      title: string;
      items: Array<RadioRow<T>>;
    };

export type SingleSection<T> = {
  [K in MultiSection<T> as K['type']]: Omit<K, 'title' | 'detailedText'>;
}[MultiSection<T>['type']];

export type Section<T> = Array<MultiSection<T>> | SingleSection<T>;

type NitroSectionType = 'default' | 'radio';

export type NitroRow = {
  title: AutoText;
  detailedText?: AutoText;
  browsable?: boolean;
  enabled: boolean;
  image?: NitroImage;
  checked?: boolean;
  onPress?: (checked?: boolean) => void;
  selected?: boolean;
};

export type NitroSection = {
  title?: string;
  items: Array<NitroRow>;
  type: NitroSectionType;
};

const validateRadioItems = (type: NitroSectionType, items: Array<NitroRow>) => {
  if (
    __DEV__ &&
    type === 'radio' &&
    (items.filter((item) => item.selected).length > 1 || items.every((item) => !item.selected))
  ) {
    throw new Error('radio lists must have one selected item');
  }
};

const convert = <T>(template: T, sections?: Section<T>): Array<NitroSection> | undefined => {
  if (sections == null) {
    return undefined;
  }

  if (Array.isArray(sections)) {
    return sections.map<NitroSection>((section) => {
      const { title, type } = section;
      const items = section.items.map<NitroRow>((item) => convertRow(template, item));

      validateRadioItems(type, items);

      return {
        items,
        type,
        title,
      };
    });
  }

  const items = sections.items.map((item) => convertRow(template, item));

  validateRadioItems(sections.type, items);

  return [
    {
      items,
      type: sections.type,
    },
  ];
};

const convertRow = <T>(
  template: T,
  item: DefaultRow<T> | RadioRow<T> | ToggleRow<T> | TextRow
): NitroRow => {
  const { title, type, enabled = true, image } = item;

  const detailedText = 'detailedText' in item ? item.detailedText : undefined;
  const selected = type === 'radio' ? (item.selected ?? false) : undefined;

  const onTogglePress = item.type === 'toggle' ? item.onPress : undefined;
  const onRowPress = item.type !== 'text' && item.type !== 'toggle' ? item.onPress : undefined;

  const onPress =
    item.type === 'text'
      ? undefined
      : (checked?: boolean) => {
          if (onTogglePress != null && checked != null) {
            onTogglePress(template, checked);
            return;
          }
          if (onRowPress != null) {
            onRowPress(template);
          }
        };

  return {
    browsable: type === 'default' ? item.browsable : undefined,
    detailedText,
    enabled,
    image: NitroImageUtil.convert(image),
    title,
    checked: type === 'toggle' ? item.checked : undefined,
    onPress,
    selected,
  };
};

export const NitroSectionUtil = { convert };
