import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type { AutoImage, BaseMapTemplateConfig, CustomActionButtonAndroid, TextButton } from '..';
import type { HybridMessageTemplate as NitroHybridMessageTemplate } from '../specs/HybridMessageTemplate.nitro';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type NitroImage, NitroImageUtil } from '../utils/NitroImage';
import { NitroMapButton } from '../utils/NitroMapButton';
import {
  type HeaderActions,
  type NitroBaseMapTemplateConfig,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

const HybridMessageTemplate =
  NitroModules.createHybridObject<NitroHybridMessageTemplate>('HybridMessageTemplate');

export interface NitroMessageTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  /**
   * @namespace Android title shown on header
   */
  title?: AutoText;
  message: AutoText;
  actions?: Array<NitroAction>;
  image?: NitroImage;
  mapConfig?: NitroBaseMapTemplateConfig;
}

export type MessageTemplateConfig = Omit<
  NitroMessageTemplateConfig,
  'headerActions' | 'image' | 'mapConfig' | 'actions'
> & {
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
  /**
   * If mapConfig is defined, it will use a MapWithContentTemplate with the current template. This results in a MessageTemplate with a map in background. No actions need to be specified, can be empty object.
   * @namespace Android
   */
  mapConfig?: BaseMapTemplateConfig<MessageTemplate>;

  /**
   * @namespace Android up to 2 buttons of type TextButton, TextAndImageButton or ImageButton
   * @namespace iOS - up to 3 buttons of type TextButton
   */
  actions?: {
    android?:
      | [CustomActionButtonAndroid<MessageTemplate>]
      | [CustomActionButtonAndroid<MessageTemplate>, CustomActionButtonAndroid<MessageTemplate>];
    ios?:
      | [TextButton<MessageTemplate>, TextButton<MessageTemplate>, TextButton<MessageTemplate>]
      | [TextButton<MessageTemplate>, TextButton<MessageTemplate>]
      | [TextButton<MessageTemplate>];
  };
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

    const { headerActions, image, mapConfig, actions, ...rest } = config;

    const platformActions =
      Platform.OS === 'android'
        ? NitroActionUtil.convert(this.template, actions?.android)
        : NitroActionUtil.convert(this.template, actions?.ios);

    const nitroConfig: NitroMessageTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      image: NitroImageUtil.convert(image),
      actions: platformActions,
      mapConfig: mapConfig
        ? {
            mapButtons: NitroMapButton.convert(this.template, mapConfig.mapButtons),
            headerActions: NitroActionUtil.convert(this.template, mapConfig.headerActions),
          }
        : undefined,
    };

    HybridMessageTemplate.createMessageTemplate(nitroConfig);
  }
}
