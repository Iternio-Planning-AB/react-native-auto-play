import {
  type GridButton,
  type SectionedItemSection,
  SectionedItemTemplate,
  type SectionedItemTemplateConfig,
} from '@iternio/react-native-auto-play';
import { DefaultTemplateImageColor } from '../config/Color';
import { AutoTemplate } from './AutoTemplate';

type State = {
  lastPressed: string;
  notifications: boolean;
};

const categories = [
  { title: 'parking', glyph: 'local_parking' },
  { title: 'food', glyph: 'restaurant' },
  { title: 'charger', glyph: 'ev_station' },
  { title: 'coffee', glyph: 'local_cafe' },
  { title: 'restroom', glyph: 'wc' },
  { title: 'hotel', glyph: 'hotel' },
  { title: 'shopping', glyph: 'shopping_cart' },
] as const;

const getSections = (state: State): Array<SectionedItemSection<SectionedItemTemplate>> => {
  const update = (template: SectionedItemTemplate, changes: Partial<State>) => {
    const nextState = { ...state, ...changes };
    template.updateSections(getSections(nextState));
  };

  const buttons: Array<GridButton<SectionedItemTemplate>> = categories.map((category) => ({
    title: { text: category.title },
    image: { type: 'glyph', name: category.glyph, color: DefaultTemplateImageColor },
    onPress: (template) => update(template, { lastPressed: category.title }),
  }));

  return [
    {
      type: 'grid',
      title: 'categories',
      buttons,
    },
    {
      type: 'default',
      title: 'list',
      items: [
        {
          type: 'text',
          title: { text: 'last pressed' },
          detailedText: { text: state.lastPressed },
        },
        {
          type: 'toggle',
          title: { text: 'notifications' },
          checked: state.notifications,
          onPress: (_template, checked) => {
            state.notifications = checked;
          },
        },
      ],
    },
  ];
};

const getTemplate = (props?: {
  mapConfig?: SectionedItemTemplateConfig['mapConfig'];
}): SectionedItemTemplate => {
  const template = new SectionedItemTemplate({
    title: { text: 'sectioned items' },
    mapConfig: props?.mapConfig,
    headerActions: AutoTemplate.headerActions,
    sections: getSections({ lastPressed: '-', notifications: true }),
    onDidAppear: () => console.log('SectionedItemTemplate onDidAppear', template.id),
    onDidDisappear: () => console.log('SectionedItemTemplate onDidDisappear', template.id),
    onWillAppear: () => console.log('SectionedItemTemplate onWillAppear', template.id),
    onWillDisappear: () => console.log('SectionedItemTemplate onWillDisappear', template.id),
    onPopped: () => console.log('SectionedItemTemplate onPopped', template.id),
  });

  return template;
};

export const AutoSectionedItemTemplate = { getTemplate };
