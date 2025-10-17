import { MessageTemplate } from '@g4rb4g3/react-native-autoplay/lib/templates/MessageTemplate';
import { AutoTemplate } from './AutoTemplate';

const getTemplate = (): MessageTemplate => {
  return new MessageTemplate({
    title: { text: 'message' },
    message: { text: 'message' },
    actions: AutoTemplate.actions,
    onWillAppear: () => console.log('MessageTemplate onWillAppear'),
    onDidAppear: () => console.log('MessageTemplate onDidAppear'),
    onWillDisappear: () => console.log('MessageTemplate onWillDisappear'),
    onDidDisappear: () => console.log('MessageTemplate onDidDisappear'),
    onPopped: () => console.log('MessageTemplate onPopped'),
  });
};

export const AutoMessageTemplate = { getTemplate };
