import {
  type GridButton,
  GridTemplate,
  type GridTemplateConfig,
} from '@g4rb4g3/react-native-autoplay';
import { AutoTemplate } from './AutoTemplate';

const getButtons = (
  lightColor: string,
  darkColor: string,
  selectedIdx: number
): Array<GridButton<GridTemplate>> => [
  {
    title: { text: '#1' },
    image: {
      name: 'star',
      color: { darkColor, lightColor },
      backgroundColor: selectedIdx === 0 ? 'rgba(0, 255, 255, 1)' : undefined,
      type: 'glyph',
      fontScale: 0.9,
    },
    onPress: (template) => {
      template.updateGrid(getButtons('red', 'green', 0));
    },
  },
  {
    title: { text: '#2' },
    image: {
      name: 'star',
      color: { darkColor, lightColor },
      backgroundColor: selectedIdx === 1 ? 'rgba(0, 255, 255, 1)' : undefined,
      type: 'glyph',
      fontScale: 0.8,
    },
    onPress: (template) => {
      template.updateGrid(getButtons('yellow', 'blue', 1));
    },
  },
  {
    title: { text: '#3' },
    image: {
      name: 'star',
      color: { darkColor, lightColor },
      backgroundColor: selectedIdx === 2 ? 'rgba(0, 255, 255, 1)' : undefined,
      type: 'glyph',
      fontScale: 0.7,
    },
    onPress: (template) => {
      template.updateGrid(getButtons('pink', 'orange', 2));
    },
  },
  {
    title: { text: '#4' },
    image: {
      name: 'star',
      color: { darkColor, lightColor },
      backgroundColor: selectedIdx === 3 ? 'rgba(0, 255, 255, 1)' : undefined,
      type: 'glyph',
    },
    onPress: (template) => {
      template.updateGrid(getButtons('violet', 'purple', 3));
    },
  },
  {
    title: { text: '#5' },
    image: {
      name: 'star',
      color: { darkColor, lightColor },
      backgroundColor: selectedIdx === 4 ? 'rgba(0, 255, 255, 1)' : undefined,
      type: 'glyph',
    },
    onPress: (template) => {
      template.updateGrid(getButtons('green', 'red', 4));
    },
  },
  {
    title: { text: '#6' },
    image: {
      name: 'star',
      color: { darkColor, lightColor },
      backgroundColor: selectedIdx === 5 ? 'rgba(0, 255, 255, 1)' : undefined,
      type: 'glyph',
    },
    onPress: (template) => {
      template.updateGrid(getButtons('blue', 'yellow', 5));
    },
  },
];

const getTemplate = (props?: { mapConfig?: GridTemplateConfig['mapConfig'] }): GridTemplate => {
  return new GridTemplate({
    title: { text: 'grid' },
    mapConfig: props?.mapConfig,
    headerActions: AutoTemplate.headerActions,
    buttons: getButtons('green', 'red', 0),
    onWillAppear: () => console.log('GridTemplate onWillAppear'),
    onDidAppear: () => console.log('GridTemplate onDidAppear'),
    onWillDisappear: () => console.log('GridTemplate onWillDisappear'),
    onDidDisappear: () => console.log('GridTemplate onDidDisappear'),
    onPopped: () => console.log('GridTemplate onPopped'),
  });
};

export const AutoGridTemplate = { getTemplate };
