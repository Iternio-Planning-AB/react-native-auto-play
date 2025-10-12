import { type GridButton, GridTemplate } from '@g4rb4g3/react-native-autoplay';
import { AutoTemplate } from './AutoTemplate';

const getButtons = (color: string): Array<GridButton<GridTemplate>> => [
  {
    title: { text: '#1' },
    image: {
      name: 'star',
      color,
      size: 26,
    },
    onPress: (template) => {
      template.updateGrid(getButtons('red'));
    },
  },
  {
    title: { text: '#2' },
    image: {
      name: 'star',
      color,
      size: 26,
    },
    onPress: (template) => {
      template.updateGrid(getButtons('yellow'));
    },
  },
  {
    title: { text: '#3' },
    image: {
      name: 'star',
      color,
      size: 26,
    },
    onPress: (template) => {
      template.updateGrid(getButtons('pink'));
    },
  },
  {
    title: { text: '#4' },
    image: {
      name: 'star',
      color,
      size: 26,
    },
    onPress: (template) => {
      template.updateGrid(getButtons('violet'));
    },
  },
  {
    title: { text: '#5' },
    image: {
      name: 'star',
      color,
      size: 26,
    },
    onPress: (template) => {
      template.updateGrid(getButtons('green'));
    },
  },
  {
    title: { text: '#6' },
    image: {
      name: 'star',
      color,
      size: 26,
    },
    onPress: (template) => {
      template.updateGrid(getButtons('blue'));
    },
  },
];

const getTemplate = (): GridTemplate => {
  return new GridTemplate({
    id: 'gridTemplate',
    title: { text: 'grid' },
    actions: AutoTemplate.actions,
    buttons: getButtons('green'),
  });
};

export const AutoGridTemplate = { getTemplate };
