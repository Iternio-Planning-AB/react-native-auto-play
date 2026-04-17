import {
  type DefaultRow,
  ListTemplate,
  type ListTemplateConfig,
  type Section,
  TextPlaceholders,
  type TextRow,
  type ToggleRow,
} from '@iternio/react-native-auto-play';
import { DefaultTemplateImageColor } from '../config/Color';
import { AutoGridTemplate } from './AutoGridTemplate';
import { AutoTemplate } from './AutoTemplate';

const getRadioTemplate = (): ListTemplate => {
  return new ListTemplate({
    title: { text: 'radios' },
    headerActions: AutoTemplate.headerActions,
    sections: {
      type: 'radio',
      items: [
        {
          type: 'radio',
          title: { text: 'radio #1' },
          onPress: () => {
            console.log('*** radio #1');
          },
        },
        {
          type: 'radio',
          title: { text: 'radio #2' },
          onPress: () => {
            console.log('*** radio #2');
          },
          selected: true,
        },
        {
          type: 'radio',
          title: { text: 'radio #3' },
          onPress: () => {
            console.log('*** radio #3');
          },
        },
      ],
    },
    onPopped: () => console.log('RadioTemplate onPopped'),
  });
};

const checked: [boolean, boolean] = [true, false];

const getMainSection = (): Section<ListTemplate> => {
  const items: Array<DefaultRow<ListTemplate> | ToggleRow<ListTemplate> | TextRow> = [
    {
      type: 'toggle',
      title: { text: 'toggle radio list' },
      checked: checked[0],
      image: {
        name: 'alarm',
        color: { lightColor: 'red', darkColor: 'orange' },
        type: 'glyph',
      },
      onPress: (template, isChecked) => {
        checked[0] = isChecked;
        template.updateSections(getMainSection());
        console.log('*** toggle 0', isChecked);
      },
    },
    {
      type: 'toggle',
      title: { text: 'row #2' },
      checked: checked[1],
      image: {
        name: 'bomb',
        type: 'glyph',
        color: DefaultTemplateImageColor,
      },
      onPress: (_template, isChecked) => {
        checked[1] = isChecked;
        console.log('*** toggle 1', isChecked);
      },
    },
    {
      type: 'text',
      title: { text: 'text' },
      detailedText: { text: 'text only row' },
      image: { name: 'text_ad', type: 'glyph', color: DefaultTemplateImageColor },
    },
    {
      type: 'default',
      onPress: () => {
        AutoGridTemplate.getTemplate().push();
      },
      title: { text: 'grid template' },
      image: {
        type: 'glyph',
        name: 'grid_3x3',
        color: DefaultTemplateImageColor,
      },
      browsable: true,
    },
  ];

  if (checked[0]) {
    items.push({
      type: 'default',
      title: { text: 'radio list template' },
      browsable: true,
      image: {
        name: 'rotate_auto',
        type: 'glyph',
        color: DefaultTemplateImageColor,
      },
      onPress: () => {
        getRadioTemplate()
          .push()
          .catch((e) => console.log('*** error radio template', e));
      },
    });
  }

  return [
    {
      type: 'default',
      title: 'section text',
      items,
    },
  ];
};

const getTemplate = (props?: { mapConfig?: ListTemplateConfig['mapConfig'] }): ListTemplate => {
  return new ListTemplate({
    title: {
      text: `${TextPlaceholders.Distance} - ${TextPlaceholders.Duration}`,
      distance: { unit: 'meters', value: 1234 },
      duration: 4711,
    },
    mapConfig: props?.mapConfig,
    headerActions: AutoTemplate.headerActions,
    sections: getMainSection(),
    onPopped: () => console.log('ListTemplate onPopped'),
  });
};

export const AutoListTemplate = { getTemplate };
