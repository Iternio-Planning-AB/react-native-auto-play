import {
  type GridButton,
  type SectionedItemSection,
  SectionedItemTemplate,
} from '@iternio/react-native-auto-play';
import { DefaultTemplateImageColor } from '../config/Color';
import { AutoTemplate } from './AutoTemplate';

// mixed aspect ratios on purpose, user photos of chargers come in any shape
const photoUris = [
  'https://picsum.photos/id/1018/800/600',
  'https://picsum.photos/id/1043/600/800',
  'https://picsum.photos/id/1067/800/800',
];

// the template shows the placeholder right away and is redrawn natively once a photo is loaded
const getPhotoButtons = (): Array<GridButton<SectionedItemTemplate>> =>
  photoUris.map((uri, index) => ({
    image: {
      type: 'remote',
      uri,
      placeholder: { type: 'glyph', name: 'photo', color: DefaultTemplateImageColor },
    },
    onPress: () => console.log('charger photo pressed', index + 1),
  }));

const getSections = (): Array<SectionedItemSection<SectionedItemTemplate>> => [
  {
    type: 'grid',
    title: 'photos',
    imageSize: 'large',
    buttons: getPhotoButtons(),
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
