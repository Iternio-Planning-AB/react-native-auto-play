import {
  type DefaultRow,
  ListTemplate,
  type Section,
  TextPlaceholders,
  type ToggleRow,
} from '@g4rb4g3/react-native-autoplay';
import { AutoTemplate } from './AutoTemplate';

const getRadioTemplate = (): ListTemplate => {
  return new ListTemplate({
    title: { text: 'radios' },
    headerActions: AutoTemplate.headerActions,
    sections: {
      type: 'radio',
      selectedIndex: 1,
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
  const items: Array<DefaultRow<ListTemplate> | ToggleRow<ListTemplate>> = [
    {
      type: 'toggle',
      title: { text: 'row #1' },
      checked: showRadios,
      image: {
        name: 'alarm',
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
      },
      onPress: (_template, checked) => {
        console.log('*** toggle', checked);
      },
    },
  ];

  if (showRadios) {
    items.push({
      type: 'default',
      title: { text: 'row #3' },
      browsable: true,
      image: {
        name: 'rotate_auto',
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

const getTemplate = (): ListTemplate => {
  return new ListTemplate({
    title: {
      text: `${TextPlaceholders.Distance} - ${TextPlaceholders.Duration}`,
      distance: { unit: 'meters', value: 1234 },
      duration: 4711,
    },
    headerActions: AutoTemplate.headerActions,
    sections: getMainSection(true),
    onPopped: () => console.log('ListTemplate onPopped'),
  });
};

export const AutoListTemplate = { getTemplate };
