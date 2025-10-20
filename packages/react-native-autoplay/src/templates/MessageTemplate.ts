import { Platform } from 'react-native';
import { HybridAutoPlay, HybridMessageTemplate } from '..';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type Actions, type NitroTemplateConfig, Template, type TemplateConfig } from './Template';

export interface NitroMessageTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  title?: AutoText;
  message: AutoText;
  actions?: Array<NitroAction>;
}

export type MessageTemplateConfig = Omit<NitroMessageTemplateConfig, 'headerActions'> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  headerActions?: Actions<MessageTemplate>;
  /**
   * Actions shown below the message, maximum 3 are shown.
   * @default 'default'
   */
  actions?: Actions<MessageTemplate>;
};

/**
 * On iOS the MessageTemplate behaves slightly different than on Android. It is presented instead of pushed.
 * Also on iOS it is always on top of all other templates, while on Android it can be overlayed by other templates.
 */
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

  public push(): Promise<void> {
    if (Platform.OS === 'ios') {
      // on iOS a CPMessageTemplate needs to be presented instead of pushed.
      return HybridAutoPlay.presentTemplate(this.id);
    }

    return super.push();
  }
}
