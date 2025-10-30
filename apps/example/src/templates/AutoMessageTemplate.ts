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
    image: { name: 'info' },
    actions: [
      {
        type: 'custom',
        title: 'Pop',
        style: 'destructive',
        onPress: () => {
          console.log('*** Pop');
          HybridAutoPlay.popTemplate();
        },
      },
      {
        type: 'custom',
        title: 'PopToRoot',
        style: 'cancel',
        onPress: () => {
          console.log('*** PopToRoot');
          HybridAutoPlay.popToRootTemplate();
        },
      },
    ],
    headerActions: AutoTemplate.headerActions,
    onWillAppear: () => console.log('MessageTemplate onWillAppear'),
    onDidAppear: () => console.log('MessageTemplate onDidAppear'),
    onWillDisappear: () => console.log('MessageTemplate onWillDisappear'),
    onDidDisappear: () => console.log('MessageTemplate onDidDisappear'),
    onPopped: () => console.log('MessageTemplate onPopped'),
  });
};

export const AutoMessageTemplate = { getTemplate };
