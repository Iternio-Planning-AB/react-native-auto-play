import type { HybridObject } from 'react-native-nitro-modules';
import type { NitroMessageTemplateConfig } from '../templates/MessageTemplate';
import type { NitroTemplateConfig } from './AutoPlay.nitro';

interface MessageTemplateConfig extends NitroTemplateConfig, NitroMessageTemplateConfig {}

export interface MessageTemplate extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  createMessageTemplate(config: MessageTemplateConfig): void;
}
