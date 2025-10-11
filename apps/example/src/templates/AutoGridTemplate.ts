import { GridTemplate } from '@g4rb4g3/react-native-autoplay';
import type { GridButton } from '@g4rb4g3/react-native-autoplay/lib/utils/NitroGrid';
import { AutoTemplate } from './AutoTemplate';

const getButtons = (template: GridTemplate, color: string): Array<GridButton> => {
  return [
    {
      title: { text: '#1' },
      image: {
        name: 'star',
        color,
        size: 26,
      },
      onPress: () => {
        template.updateGrid(getButtons(template, 'red'));
      },
    },
    {
      title: { text: '#2' },
      image: {
        name: 'star',
        color,
        size: 26,
      },
      onPress: () => {
        template.updateGrid(getButtons(template, 'yellow'));
      },
    },
    {
      title: { text: '#3' },
      image: {
        name: 'star',
        color,
        size: 26,
      },
      onPress: () => {
        template.updateGrid(getButtons(template, 'pink'));
      },
    },
    {
      title: { text: '#4' },
      image: {
        name: 'star',
        color,
        size: 26,
      },
      onPress: () => {
        template.updateGrid(getButtons(template, 'violet'));
      },
    },
    {
      title: { text: '#5' },
      image: {
        name: 'star',
        color,
        size: 26,
      },
      onPress: () => {
        template.updateGrid(getButtons(template, 'green'));
      },
    },
    {
      title: { text: '#6' },
      image: {
        name: 'star',
        color,
        size: 26,
      },
      onPress: () => {
        template.updateGrid(getButtons(template, 'blue'));
      },
    },
  ];
};

const getTemplate = (): GridTemplate => {
  const template = new GridTemplate({
    id: 'gridTemplate',
    title: { text: 'grid' },
    actions: AutoTemplate.actions,
    buttons: [],
  });

  template.updateGrid(getButtons(template, 'green'));

  return template;
};

export const AutoGridTemplate = { getTemplate };
