import {
  type AutoText,
  HybridAutoPlay,
  MessageTemplate,
  type MessageTemplateConfig,
} from '@iternio/react-native-auto-play';
import { DefaultTemplateImageColor } from '../config/Color';
import { AutoTemplate } from './AutoTemplate';

const getTemplate = ({
  message,
  mapConfig,
}: {
  message: AutoText;
  mapConfig?: MessageTemplateConfig['mapConfig'];
}): MessageTemplate => {
  const image: MessageTemplateConfig['image'] = {
    name: 'info',
    type: 'glyph',
    color: DefaultTemplateImageColor,
  };

  const commonConfig = {
    title: { text: 'header title' },
    message,
    image,
    headerActions: AutoTemplate.headerActions.android,
    onWillAppear: () => console.log('MessageTemplate onWillAppear'),
    onDidAppear: () => console.log('MessageTemplate onDidAppear'),
    onWillDisappear: () => console.log('MessageTemplate onWillDisappear'),
    onDidDisappear: () => console.log('MessageTemplate onDidDisappear'),
    onPopped: () => console.log('MessageTemplate onPopped'),
  };

  if (mapConfig) {
    return new MessageTemplate({
      ...commonConfig,
      mapConfig,
      actions: {
        android: [
          {
            type: 'image',
            image: { name: 'thumb_up', type: 'glyph', color: DefaultTemplateImageColor },
            onPress: () => {
              console.log('yeah');
              void HybridAutoPlay.popTemplate();
            },
          },
          {
            type: 'textImage',
            image: {
              name: 'thumb_down',
              type: 'glyph',
              color: DefaultTemplateImageColor,
            },
            title: 'thumb down',
            onPress: () => {
              console.log('better luck next time');
              void HybridAutoPlay.popToRootTemplate();
            },
          },
        ],
        ios: [
          {
            type: 'text',
            title: 'thumb up',
            onPress: () => {
              console.log('yeah');
              void HybridAutoPlay.popTemplate();
            },
          },
          {
            type: 'image',
            image: { name: 'thumb_down', type: 'glyph' },
            onPress: () => {
              console.log('yeah');
              void HybridAutoPlay.popToRootTemplate();
            },
          },
        ],
      },
    });
  }

  return new MessageTemplate({
    ...commonConfig,
    mapConfig: undefined,
    actions: {
      android: [
        {
          type: 'image',
          image: { name: 'thumb_up', type: 'glyph', color: DefaultTemplateImageColor },
          onPress: () => {
            console.log('yeah');
            void HybridAutoPlay.popTemplate();
          },
        },
        {
          type: 'textImage',
          image: {
            name: 'thumb_down',
            type: 'glyph',
            color: DefaultTemplateImageColor,
          },
          title: 'thumb down',
          onPress: () => {
            console.log('better luck next time');
            void HybridAutoPlay.popToRootTemplate();
          },
        },
      ],
      ios: [
        {
          type: 'text',
          title: 'thumb up',
          onPress: () => {
            console.log('yeah');
            void HybridAutoPlay.popTemplate();
          },
        },
        {
          type: 'text',
          title: 'thumb down',
          onPress: () => {
            console.log('yeah');
            void HybridAutoPlay.popToRootTemplate();
          },
        },
      ],
    },
  });
};

export const AutoMessageTemplate = { getTemplate };
