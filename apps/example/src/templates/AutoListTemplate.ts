import {
  type DefaultRow,
  ListTemplate,
  type ListTemplateConfig,
  type Section,
  TextPlaceholders,
  type TextRow,
  type ToggleRow,
} from '@iternio/react-native-auto-play';
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

const getMainSection = (showRadios: boolean): Section<ListTemplate> => {
  const items: Array<DefaultRow<ListTemplate> | ToggleRow<ListTemplate> | TextRow> = [
    {
      type: 'toggle',
      title: { text: 'row #1' },
      checked: showRadios,
      image: {
        name: 'alarm',
        color: { lightColor: 'red', darkColor: 'orange' },
        type: 'glyph',
      },
      onPress: (template, checked) => {
        template.updateSections(getMainSection(checked));
      },
    },
    {
      type: 'toggle',
      title: { text: 'row #2' },
      checked: false,
      image: {
        name: 'bomb',
        type: 'glyph',
      },
      onPress: (_template, checked) => {
        console.log('*** toggle', checked);
      },
    },
    {
      type: 'text',
      title: { text: 'text' },
      detailedText: { text: 'text only row' },
      image: { name: 'text_ad', type: 'glyph' },
    },
  ];

  if (showRadios) {
    items.push({
      type: 'default',
      title: { text: 'row #3' },
      browsable: true,
      image: {
        name: 'rotate_auto',
        type: 'glyph',
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
    sections: getMainSection(true),
    onPopped: () => console.log('ListTemplate onPopped'),
  });
};

export const AutoListTemplate = { getTemplate };
