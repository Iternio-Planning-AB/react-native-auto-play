import {
  InformationTemplate,
  type InformationTemplateConfig,
  TextPlaceholders,
} from '@iternio/react-native-auto-play';
import { Platform } from 'react-native';
import { AutoTemplate } from './AutoTemplate';

const defaultColor =
  Platform.OS === 'android' ? 'white' : { lightColor: 'black', darkColor: 'white' };

const getTemplate = (props?: {
  mapConfig?: InformationTemplateConfig['mapConfig'];
}): InformationTemplate => {
  const title = {
    text: `${TextPlaceholders.Distance} - ${TextPlaceholders.Duration}`,
    distance: { unit: 'meters' as const, value: 1234 },
    duration: 4711,
  };

  const items: InformationTemplateConfig['items'] = [
    {
      type: 'text',
      title,
      detailedText: title,
      image: { name: 'text_ad', color: defaultColor, type: 'glyph' },
    },
    {
      type: 'text',
      title: { text: 'Title 2' },
      detailedText: { text: 'Text2' },
      image: { name: 'text_ad', color: defaultColor, type: 'glyph' },
    },
    {
      type: 'text',
      title: { text: 'Title 3\nwith 2 rows\nCan i add one more? - oh no it truncates me :(' },
      detailedText: {
        text: [
          'some longer text',
          'with two rows',
          'do three work?',
          'oh yes they do!',
          'and another one? - nope, this one is cut off',
        ].join('\n'),
      },
      image: { name: 'text_ad', color: defaultColor, type: 'glyph' },
    },
  ];

  const commonConfig = {
    title,
    headerActions: AutoTemplate.headerActions,
    items,
    onPopped: () => console.log('InformationTemplate onPopped'),
  };

  if (props?.mapConfig) {
    return new InformationTemplate({
      ...commonConfig,
      mapConfig: props.mapConfig,
      actions: {
        android: [
          {
            type: 'textImage',
            image: { name: 'alarm', type: 'glyph' },
            title: 'Confirm',
            style: 'confirm',
            onPress: (template) => {
              console.log('*** Action 1');
              template.updateItems([
                {
                  title: { text: 'title' },
                  type: 'text',
                  detailedText: { text: 'detailedText' },
                  enabled: false,
                  image: { type: 'glyph', name: 'thumb_up', color: defaultColor },
                },
              ]);
            },
          },
          {
            type: 'text',
            title: 'Default',
            style: 'normal',
            onPress: () => {
              console.log('*** Action 2');
            },
          },
        ],
        ios: [
          { type: 'text', title: 'Normal', onPress: () => {} },
          { type: 'image', image: { type: 'glyph', name: 'airlines' }, onPress: () => {} },
        ],
      },
    });
  }

  return new InformationTemplate({
    ...commonConfig,
    mapConfig: undefined,
    actions: {
      android: [
        {
          type: 'textImage',
          image: { name: 'alarm', type: 'glyph' },
          title: 'Confirm',
          style: 'confirm',
          onPress: (template) => {
            console.log('*** Action 1');
            template.updateItems([
              {
                title: { text: 'title' },
                type: 'text',
                detailedText: { text: 'detailedText' },
                enabled: false,
                image: { type: 'glyph', name: 'thumb_up', color: defaultColor },
              },
            ]);
          },
        },
        {
          type: 'text',
          title: 'Default',
          style: 'normal',
          onPress: () => {
            console.log('*** Action 2');
          },
        },
      ],
      ios: [
        {
          type: 'text',
          title: 'Normal',
          style: 'normal',
          onPress: (template) => {
            console.log('*** Action 1');
            template.updateItems([
              {
                title: { text: 'title' },
                type: 'text',
                detailedText: { text: 'detailedText' },
                enabled: false,
                image: { type: 'glyph', name: 'thumb_up', color: defaultColor },
              },
            ]);
          },
        },
        {
          type: 'text',
          title: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('*** Action 2');
          },
        },
        {
          type: 'text',
          title: 'Confirm',
          style: 'confirm',
          onPress: () => {
            console.log('*** Action 3');
          },
        },
      ],
    },
  });
};

export const AutoInformationTemplate = { getTemplate };
