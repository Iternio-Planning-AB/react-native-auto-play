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

const convert = (sections?: Section): Array<NitroSection> | undefined => {
  if (sections == null) {
    return undefined;
  }

  if (Array.isArray(sections)) {
    return sections.map<NitroSection>((section) => {
      const { title, type } = section;
      const items = section.items.map<NitroRow>(convertRow);

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
      items: sections.items.map(convertRow),
      type: sections.type,
      selectedIndex: sections.type === 'radio' ? sections.selectedIndex : undefined,
    },
  ];
};

const convertRow = (item: DefaultRow | RadioRow | ToggleRow): NitroRow => {
  const { title, type, enabled = true, image, onPress } = item;

  const detailedText = type === 'default' ? item.detailedText : undefined;

  return {
    browsable: type === 'default' ? item.browsable : undefined,
    detailedText,
    enabled,
    image: NitroImage.convert(image),
    title,
    checked: type === 'toggle' ? item.checked : undefined,
    onPress: (checked) => (type === 'toggle' ? onPress(checked ?? false) : onPress()),
  };
};

export const NitroSectionUtil = { convert };
