import { type AutoImage, HybridMessageTemplate } from '..';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type NitroImage, NitroImageUtil } from '../utils/NitroImage';
import {
  type HeaderActions,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

export interface NitroMessageTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  /**
   * @namespace Android title shown on header
   */
  title?: AutoText;
  message: AutoText;
  actions?: Array<NitroAction>;
  image?: NitroImage;
}

export type MessageTemplateConfig = Omit<NitroMessageTemplateConfig, 'headerActions' | 'image'> & {
  /**
   * action buttons, usually at the top right on Android
   * @namespace Android
   */
  headerActions?: HeaderActions<MessageTemplate>;
  /**
   * image shown at the top of the message on Android
   * @namespace Android
   */
  image?: AutoImage;
};

/**
 * On iOS the MessageTemplate behaves slightly different than on Android. It is presented instead of pushed.
 * Also on iOS it is always on top of all other templates, while on Android it can be overlayed by other templates.
 */
export class MessageTemplate extends Template<
  MessageTemplateConfig,
  HeaderActions<MessageTemplate>
> {
  private template = this;

  constructor(config: MessageTemplateConfig) {
    super(config);

    const { headerActions, image, ...rest } = config;

    const nitroConfig: NitroMessageTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      image: NitroImageUtil.convert(image),
    };

    HybridMessageTemplate.createMessageTemplate(nitroConfig);
  }
}
