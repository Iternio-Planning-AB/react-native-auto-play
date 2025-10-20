import { HybridAutoPlay } from '@g4rb4g3/react-native-autoplay';
import { MessageTemplate } from '@g4rb4g3/react-native-autoplay/lib/templates/MessageTemplate';
import { AutoTemplate } from './AutoTemplate';

const getTemplate = (showHeaderActions = true): MessageTemplate => {
  return new MessageTemplate({
    title: { text: 'message' },
    message: { text: 'message' },
    image: { name: 'info', size: 56 },
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
    headerActions: showHeaderActions ? AutoTemplate.headerActions : undefined,
    onWillAppear: () => console.log('MessageTemplate onWillAppear'),
    onDidAppear: () => console.log('MessageTemplate onDidAppear'),
    onWillDisappear: () => console.log('MessageTemplate onWillDisappear'),
    onDidDisappear: () => console.log('MessageTemplate onDidDisappear'),
    onPopped: () => console.log('MessageTemplate onPopped'),
  });
};

export const AutoMessageTemplate = { getTemplate };
