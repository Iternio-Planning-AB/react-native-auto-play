import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type { InformationTemplate as NitroInformationTemplate } from '../specs/InformationTemplate.nitro';
import type { CustomActionButtonAndroid, TextButton } from '../types/Button';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { NitroMapButton } from '../utils/NitroMapButton';
import { type NitroSection, NitroSectionUtil } from '../utils/NitroSection';
import type { SingleSection, TextRow } from './ListTemplate';
import type { BaseMapTemplateConfig } from './MapTemplate';
import {
  type HeaderActions,
  type NitroBaseMapTemplateConfig,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

const HybridInformationTemplate =
  NitroModules.createHybridObject<NitroInformationTemplate>('InformationTemplate');

export interface NitroInformationTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  title: AutoText;
  section: NitroSection;
  actions?: Array<NitroAction>;
  mapConfig?: NitroBaseMapTemplateConfig;
}

export type InformationItems =
  | [TextRow]
  | [TextRow, TextRow]
  | [TextRow, TextRow, TextRow]
  | [TextRow, TextRow, TextRow, TextRow];

export type InformationTemplateConfig = Omit<
  NitroInformationTemplateConfig,
  'headerActions' | 'section' | 'mapConfig' | 'actions'
> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  headerActions?: HeaderActions<InformationTemplate>;

  /**
   * @namespace Android this is a PaneTemplate with a list of rows. Each row can have a title with up to 2 rows and a detailedText with up to 4 rows, either as a single string that is automatically wrapped or a string with line breaks. However if the text is too long it might be broken into multiple rows and then truncated, if more than 4 rows are required due to wrapping.
   * @namespace iOS this is an InformationTemplate, ⚠️ the row image is NOT supported
   */
  items?: InformationItems;

  /**
   * If mapConfig is defined, it will use a MapWithContentTemplate with the current template. This results in a PaneTemplate with a map in background. No actions need to be specified, can be empty object.
   * @namespace Android
   */
  mapConfig?: BaseMapTemplateConfig<InformationTemplate>;

  /**
   * @namespace Android up to 2 buttons of type TextButton, TextAndImageButton or ImageButton
   * @namespace iOS - up to 3 buttons of type TextButton
   */
  actions?: {
    android?:
      | [CustomActionButtonAndroid<InformationTemplate>]
      | [
          CustomActionButtonAndroid<InformationTemplate>,
          CustomActionButtonAndroid<InformationTemplate>,
        ];
    ios?:
      | [
          TextButton<InformationTemplate>,
          TextButton<InformationTemplate>,
          TextButton<InformationTemplate>,
        ]
      | [TextButton<InformationTemplate>, TextButton<InformationTemplate>]
      | [TextButton<InformationTemplate>];
  };
};

export class InformationTemplate extends Template<
  InformationTemplateConfig,
  HeaderActions<InformationTemplate>
> {
  private template = this;

  constructor(config: InformationTemplateConfig) {
    super(config);

    const { headerActions, mapConfig, items, actions, ...rest } = config;

    const platformActions =
      Platform.OS === 'android'
        ? NitroActionUtil.convert(this.template, actions?.android)
        : NitroActionUtil.convert(this.template, actions?.ios);

    const section = this.getSection(items);

    const nitroConfig: NitroInformationTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      actions: platformActions,
      section: NitroSectionUtil.convert(this.template, section)?.at(0) ?? {
        items: [],
        type: 'default',
      },
      mapConfig: mapConfig
        ? {
            mapButtons: NitroMapButton.convert(this.template, mapConfig.mapButtons),
            headerActions: NitroActionUtil.convert(this.template, mapConfig.headerActions),
          }
        : undefined,
    };

    HybridInformationTemplate.createInformationTemplate(nitroConfig);
  }

  public updateItems(items?: InformationItems) {
    const section = this.getSection(items);
    return HybridInformationTemplate.updateInformationTemplateSections(
      this.id,
      NitroSectionUtil.convert(this.template, section)?.at(0) ?? { items: [], type: 'default' }
    );
  }

  private getSection(items?: InformationItems): SingleSection<InformationTemplate> {
    return {
      type: 'default',
      items: items ?? [],
    };
  }
}
