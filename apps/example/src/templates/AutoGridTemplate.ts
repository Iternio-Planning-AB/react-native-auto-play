import { type GridButton, GridTemplate } from '@g4rb4g3/react-native-autoplay';
import { AutoTemplate } from './AutoTemplate';

const getButtons = (lightColor: string, darkColor: string): Array<GridButton<GridTemplate>> => [
  {
    title: { text: '#1' },
    image: { name: 'star', darkColor, lightColor, backgroundColor: 'rgba(0, 255, 255, 1)' },
    onPress: (template) => {
      template.updateGrid(getButtons('red', 'green'));
    },
  },
  {
    title: { text: '#2' },
    image: { name: 'star', darkColor, lightColor },
    onPress: (template) => {
      template.updateGrid(getButtons('yellow', 'blue'));
    },
  },
  {
    title: { text: '#3' },
    image: { name: 'star', darkColor, lightColor },
    onPress: (template) => {
      template.updateGrid(getButtons('pink', 'orange'));
    },
  },
  {
    title: { text: '#4' },
    image: { name: 'star', darkColor, lightColor },
    onPress: (template) => {
      template.updateGrid(getButtons('violet', 'purple'));
    },
  },
  {
    title: { text: '#5' },
    image: { name: 'star', darkColor, lightColor },
    onPress: (template) => {
      template.updateGrid(getButtons('green', 'red'));
    },
  },
  {
    title: { text: '#6' },
    image: { name: 'star', darkColor, lightColor },
    onPress: (template) => {
      template.updateGrid(getButtons('blue', 'yellow'));
    },
  },
];

const getTemplate = (): GridTemplate => {
  return new GridTemplate({
    title: { text: 'grid' },
    headerActions: AutoTemplate.headerActions,
    buttons: getButtons('green', 'red'),
    onWillAppear: () => console.log('GridTemplate onWillAppear'),
    onDidAppear: () => console.log('GridTemplate onDidAppear'),
    onWillDisappear: () => console.log('GridTemplate onWillDisappear'),
    onDidDisappear: () => console.log('GridTemplate onDidDisappear'),
    onPopped: () => console.log('GridTemplate onPopped'),
  });
};

export const AutoGridTemplate = { getTemplate };
