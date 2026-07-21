import {
  type DefaultRow,
  HybridAutoPlay,
  ListTemplate,
  type ListTemplateConfig,
  type Section,
  TextPlaceholders,
  type TextRow,
  type ToggleRow,
} from '@iternio/react-native-auto-play';
import type { WaypointRow } from '@iternio/react-native-auto-play/lib/utils/NitroSection';
import { DefaultTemplateImageColor } from '../config/Color';
import { AutoGridTemplate } from './AutoGridTemplate';
import { AutoTemplate } from './AutoTemplate';

const getRadioTemplate = (): ListTemplate => {
  const template = new ListTemplate({
    title: { text: 'radios' },
    headerActions: AutoTemplate.headerActions,
    mapConfig: {},
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
        {
          type: 'radio',
          onPress: () => {
            HybridAutoPlay.popTemplate();
          },
          title: { text: 'pop template' },
        },
        {
          type: 'radio',
          onPress: () => {
            HybridAutoPlay.popToRootTemplate();
          },
          title: { text: 'pop to root' },
        },
      ],
    },
    onPopped: () => console.log('RadioTemplate onPopped', template.id),
    onDidAppear: () => {
      console.log('RadioTemplate onDidAppear', template.id);
    },
    onDidDisappear: () => {
      console.log('RadioTemplate onDidDisappear', template.id);
    },
    onWillAppear: () => {
      console.log('RadioTemplate onWillAppear', template.id);
    },
    onWillDisappear: () => {
      console.log('RadioTemplate onWillDisappear', template.id);
    },
  });

  return template;
};

const checked: [boolean, boolean] = [true, false];

const getMainSection = (): Section<ListTemplate> => {
  const items: Array<
    DefaultRow<ListTemplate> | ToggleRow<ListTemplate> | TextRow | WaypointRow<ListTemplate>
  > = [
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
    {
      type: 'default',
      onPress: () => {
        HybridAutoPlay.popTemplate();
      },
      title: { text: 'pop template' },
      image: { type: 'glyph', name: 'arrow_back' },
    },
    {
      type: 'default',
      onPress: () => {
        HybridAutoPlay.popToRootTemplate();
      },
      title: { text: 'pop to root' },
      image: { type: 'glyph', name: 'map' },
    },
    {
      type: 'waypoint',
      coordinate: {
        latitude: 0,
        longitude: 0,
      },
      distanceMeters: 123,
      durationSeconds: 4,
      title: {
        text: 'some waypoint',
      },
      address: 'charger ave.',
      image: {
        type: 'glyph',
        name: 'pin_drop',
      },
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
  const template = new ListTemplate({
    title: {
      text: `${TextPlaceholders.Distance} - ${TextPlaceholders.Duration}`,
      distance: { unit: 'meters', value: 1234 },
      duration: 4711,
    },
    mapConfig: props?.mapConfig,
    headerActions: AutoTemplate.headerActions,
    sections: getMainSection(),
    onPopped: () => console.log('ListTemplate onPopped', template.id),
    onDidAppear: () => {
      console.log('ListTemplate onDidAppear', template.id);
    },
    onDidDisappear: () => {
      console.log('ListTemplate onDidDisappear', template.id);
    },
    onWillAppear: () => {
      console.log('ListTemplate onWillAppear', template.id);
    },
    onWillDisappear: () => {
      console.log('ListTemplate onWillDisappear', template.id);
    },
  });

  return template;
};

export const AutoListTemplate = { getTemplate };
