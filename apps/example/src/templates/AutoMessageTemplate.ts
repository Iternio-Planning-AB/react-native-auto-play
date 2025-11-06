import {
  type AutoText,
  HybridAutoPlay,
  MessageTemplate,
  type MessageTemplateConfig,
} from '@g4rb4g3/react-native-autoplay';
import { AutoTemplate } from './AutoTemplate';

const getTemplate = ({
  message,
  mapConfig,
}: {
  message: AutoText;
  mapConfig?: MessageTemplateConfig['mapConfig'];
}): MessageTemplate => {
  return new MessageTemplate({
    title: { text: 'header title' },
    message,
    mapConfig,
    image: { name: 'info', type: 'glyph' },
    actions: {
      android: [
        {
          type: 'image',
          image: { name: 'thumb_up', type: 'glyph' },
          onPress: () => {
            console.log('yeah');
            HybridAutoPlay.popTemplate();
          },
        },
        {
          type: 'textImage',
          image: {
            name: 'thumb_down',
            type: 'glyph',
          },
          title: 'thumb down',
          onPress: () => {
            console.log('better luck next time');
            HybridAutoPlay.popToRootTemplate();
          },
        },
      ],
      ios: [
        {
          type: 'text',
          title: 'thumb up',
          onPress: () => {
            console.log('yeah');
            HybridAutoPlay.popTemplate();
          },
        },
        {
          type: 'text',
          title: 'thumb down',
          onPress: () => {
            console.log('yeah');
            HybridAutoPlay.popToRootTemplate();
          },
        },
      ],
    },
    headerActions: AutoTemplate.headerActions,
    onWillAppear: () => console.log('MessageTemplate onWillAppear'),
    onDidAppear: () => console.log('MessageTemplate onDidAppear'),
    onWillDisappear: () => console.log('MessageTemplate onWillDisappear'),
    onDidDisappear: () => console.log('MessageTemplate onDidDisappear'),
    onPopped: () => console.log('MessageTemplate onPopped'),
  });
};

export const AutoMessageTemplate = { getTemplate };
