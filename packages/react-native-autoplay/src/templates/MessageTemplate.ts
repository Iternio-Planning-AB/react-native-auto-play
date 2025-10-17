import { HybridMessageTemplate } from '..';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type Actions, type NitroTemplateConfig, Template, type TemplateConfig } from './Template';

export interface NitroMessageTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  title?: AutoText;
  message: AutoText;
}

export type MessageTemplateConfig = Omit<NitroMessageTemplateConfig, 'headerActions'> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  headerActions?: Actions<MessageTemplate>;
};

export class MessageTemplate extends Template<MessageTemplateConfig, Actions<MessageTemplate>> {
  private template = this;

  constructor(config: MessageTemplateConfig) {
    super(config);

    const { headerActions, ...rest } = config;

    const nitroConfig: NitroMessageTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
    };

    HybridMessageTemplate.createMessageTemplate(nitroConfig);
  }
}
