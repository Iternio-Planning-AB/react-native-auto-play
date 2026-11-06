import {
  type GridButton,
  type LocalAutoImage,
  type SectionedItemSection,
  SectionedItemTemplate,
} from '@iternio/react-native-auto-play';
import { DefaultTemplateImageColor } from '../config/Color';
import { AutoTemplate } from './AutoTemplate';

// mixed aspect ratios on purpose, user photos of chargers come in any shape
const glyphRowUris = [
  'https://picsum.photos/id/1018/800/600',
  'https://picsum.photos/id/1043/600/800',
  'https://picsum.photos/id/1067/800/800',
];

// other photos than the glyph row, the same URIs would share their downloads
const assetRowUris = [
  'https://picsum.photos/id/1015/800/600',
  'https://picsum.photos/id/1036/600/800',
  'https://picsum.photos/id/1074/800/800',
];

const glyphPlaceholder: LocalAutoImage = {
  type: 'glyph',
  name: 'photo',
  color: DefaultTemplateImageColor,
};

const assetPlaceholder: LocalAutoImage = {
  type: 'asset',
  image: require('../../assets/flower.png'),
};

// the template shows the placeholder right away and is redrawn natively once a photo is loaded
const getPhotoButtons = (
  uris: Array<string>,
  placeholder: LocalAutoImage
): Array<GridButton<SectionedItemTemplate>> =>
  uris.map((uri, index) => ({
    image: { type: 'remote', uri, placeholder },
    onPress: () => console.log('charger photo pressed', index + 1),
  }));

const getSections = (): Array<SectionedItemSection<SectionedItemTemplate>> => [
  {
    type: 'grid',
    title: 'photos (glyph placeholder)',
    imageSize: 'large',
    buttons: getPhotoButtons(glyphRowUris, glyphPlaceholder),
  },
  {
    type: 'grid',
    title: 'photos (asset placeholder)',
    imageSize: 'large',
    buttons: getPhotoButtons(assetRowUris, assetPlaceholder),
  },
  {
    type: 'default',
    title: 'outlets',
    items: [
      {
        type: 'text',
        title: { text: 'Supermarket • Example Town' },
        detailedText: { text: 'Main Street 1, Example Town' },
        image: { type: 'glyph', name: 'bolt', color: DefaultTemplateImageColor },
      },
      {
        type: 'text',
        title: { text: 'TYPE2 · 22 kW' },
        detailedText: { text: '1/1' },
        image: { type: 'glyph', name: 'ev_station', color: DefaultTemplateImageColor },
      },
      {
        type: 'text',
        title: { text: 'CCS · 50 kW' },
        detailedText: { text: '1/1' },
        image: { type: 'glyph', name: 'ev_station', color: DefaultTemplateImageColor },
      },
    ],
  },
];

const getTemplate = (): SectionedItemTemplate => {
  const template = new SectionedItemTemplate({
    title: { text: 'charger details' },
    headerActions: AutoTemplate.headerActions,
    sections: getSections(),
  });

  return template;
};

export const AutoChargerPhotosTemplate = { getTemplate };
