import type { DefaultRow, RadioRow, Section, ToggleRow } from '../templates/ListTemplate';
import type { AutoText } from '../types/Text';
import { NitroImage } from './NitroImage';

type NitroSectionType = 'default' | 'radio';

export type NitroRow = {
  title: AutoText;
  detailedText?: AutoText;
  browsable?: boolean;
  enabled: boolean;
  image?: NitroImage;
  checked?: boolean;
  onPress: (checked?: boolean) => void;
};

export type NitroSection = {
  title?: string;
  items: Array<NitroRow>;
  type: NitroSectionType;
  selectedIndex?: number;
};

const convert = <T>(template: T, sections?: Section<T>): Array<NitroSection> | undefined => {
  if (sections == null) {
    return undefined;
  }

  if (Array.isArray(sections)) {
    return sections.map<NitroSection>((section) => {
      const { title, type } = section;
      const items = section.items.map<NitroRow>((item) => convertRow(template, item));

      return {
        items,
        type,
        title,
        selectedIndex: type === 'radio' ? section.selectedIndex : undefined,
      };
    });
  }

  return [
    {
      items: sections.items.map((item) => convertRow(template, item)),
      type: sections.type,
      selectedIndex: sections.type === 'radio' ? sections.selectedIndex : undefined,
    },
  ];
};

const convertRow = <T>(template: T, item: DefaultRow<T> | RadioRow<T> | ToggleRow<T>): NitroRow => {
  const { title, type, enabled = true, image, onPress } = item;

  const detailedText = type === 'default' ? item.detailedText : undefined;

  return {
    browsable: type === 'default' ? item.browsable : undefined,
    detailedText,
    enabled,
    image: NitroImage.convert(image),
    title,
    checked: type === 'toggle' ? item.checked : undefined,
    onPress: (checked) =>
      type === 'toggle' ? onPress(template, checked ?? false) : onPress(template),
  };
};

export const NitroSectionUtil = { convert };
