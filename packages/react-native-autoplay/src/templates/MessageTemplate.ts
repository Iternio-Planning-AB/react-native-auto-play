import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import uuid from 'react-native-uuid';
import type {
  AutoImage,
  BaseMapTemplateConfig,
  CustomActionButtonAndroid,
  HeaderActionsAndroid,
  TextButton,
} from '..';
import { HybridAutoPlay } from '../hybrid/HybridAutoPlay';
import type { MessageTemplate as NitroMessageTemplate } from '../specs/MessageTemplate.nitro';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type NitroImage, NitroImageUtil } from '../utils/NitroImage';
import { NitroMapButton } from '../utils/NitroMapButton';
import type { PanelActionsIos, PanelHeaderActions } from './MapTemplate';
import type { NitroBaseMapTemplateConfig, NitroTemplateConfig, TemplateConfig } from './Template';

const HybridMessageTemplate =
  NitroModules.createHybridObject<NitroMessageTemplate>('MessageTemplate');

export interface NitroMessageTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  /**
   * @namespace Android title shown on header
   * @namespace iOS title shown when mapConfig is set, otherwise it isn't supported
   */
  title?: AutoText;
  message: AutoText;
  actions?: Array<NitroAction>;
  image?: NitroImage;
  mapConfig?: NitroBaseMapTemplateConfig;
}

type MessageActionsAndroid<T> =
  | [CustomActionButtonAndroid<T>]
  | [CustomActionButtonAndroid<T>, CustomActionButtonAndroid<T>];

type MessageTemplateBaseConfig = Omit<
  NitroMessageTemplateConfig,
  'headerActions' | 'image' | 'mapConfig' | 'actions'
> & {
  /**
   * action buttons, usually at the top right on Android
   * @namespace Android
   */
  headerActions?: HeaderActionsAndroid<MessageTemplate>;
  /**
   * image shown at the top of the message on Android
   * @namespace Android
   */
  image?: AutoImage;
};

export type MessageTemplateConfig = MessageTemplateBaseConfig &
  (
    | {
        mapConfig?: undefined;

        /**
         * @namespace Android up to 2 buttons of type TextButton, TextAndImageButton or ImageButton
         * @namespace iOS - up to 3 buttons of type TextButton
         */
        actions?: {
          android?: MessageActionsAndroid<MessageTemplate>;
          ios?:
            | [
                TextButton<MessageTemplate>,
                TextButton<MessageTemplate>,
                TextButton<MessageTemplate>,
              ]
            | [TextButton<MessageTemplate>, TextButton<MessageTemplate>]
            | [TextButton<MessageTemplate>];
        };
      }
    | {
        /**
         * If mapConfig is defined, it will use a MapWithContentTemplate with the current
         * template. This results in a MessageTemplate with a map in background. No actions
         * need to be specified, can be empty object.
         * @namespace Android - uses MapWithContentTemplate
         * @namespace iOS - renders as a CPMapPanel on the current root map template (iOS 27+),
         * trading the usual full-screen modal alert presentation for panel content;
         * `headerActions` here is Android-only — on iOS this template's own `headerActions` are
         * applied to the root map template's nav bar instead, since CarPlay has no separate
         * header for the map behind a panel.
         */
        mapConfig: Omit<BaseMapTemplateConfig<MessageTemplate>, 'headerActions'> & {
          headerActions?: PanelHeaderActions<MessageTemplate>;
        };

        /**
         * @namespace Android up to 2 buttons of type TextButton, TextAndImageButton or ImageButton
         * @namespace iOS - the panel can only show one TextButton plus one optional icon-only
         * ImageButton, see PanelActionsIos
         */
        actions?: {
          android?: MessageActionsAndroid<MessageTemplate>;
          ios?: PanelActionsIos<MessageTemplate>;
        };
      }
  );

/**
 * This template is always pushed on top and will stay on top until it is popped.
 * Other templates being pushed will end up below this one on the stack.
 * Pushing another MessageTemplate will pop the currently shown one.
 */
export class MessageTemplate {
  private template = this;
  public id = uuid.v4();

  constructor(config: MessageTemplateConfig) {
    const { headerActions, image, mapConfig, actions, ...rest } = config;

    const platformActions =
      Platform.OS === 'android'
        ? NitroActionUtil.convert(this.template, actions?.android)
        : NitroActionUtil.convert(this.template, actions?.ios);

    const nitroConfig: NitroMessageTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, { android: headerActions }),
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

  /**
   * push this template on the stack and show it to the user
   */
  public push() {
    return HybridAutoPlay.pushTemplate(this.id);
  }
}
