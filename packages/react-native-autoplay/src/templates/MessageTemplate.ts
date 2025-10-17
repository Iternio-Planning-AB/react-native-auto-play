import { HybridMessageTemplate } from '..';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type Actions, type NitroTemplateConfig, Template, type TemplateConfig } from './Template';

export interface NitroMessageTemplateConfig extends TemplateConfig {
  actions?: Array<NitroAction>;
  title?: AutoText;
  message: AutoText;
}

export type MessageTemplateConfig = Omit<NitroMessageTemplateConfig, 'actions'> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  actions?: Actions<MessageTemplate>;
};

export class MessageTemplate extends Template<MessageTemplateConfig, Actions<MessageTemplate>> {
  private template = this;

  constructor(config: MessageTemplateConfig) {
    super(config);

    const { actions, ...rest } = config;

    const nitroConfig: NitroMessageTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      actions: NitroActionUtil.convert(this.template, actions),
    };

    HybridMessageTemplate.createMessageTemplate(nitroConfig);
  }
}
