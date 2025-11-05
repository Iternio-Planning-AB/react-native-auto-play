import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type { HybridInformationTemplate as NitroHybridInformationTemplate } from '../specs/HybridInformationTemplate.nitro';
import type { ImageButton, TextAndImageButton, TextButton } from '../types/Button';
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

const HybridInformationTemplate = NitroModules.createHybridObject<NitroHybridInformationTemplate>(
  'HybridInformationTemplate'
);

export interface NitroInformationTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  title: AutoText;
  section: NitroSection;
  actions?: Array<NitroAction>;
  mapConfig?: NitroBaseMapTemplateConfig;
}

export type InformationSection = {
  type: 'default';
  items:
    | [TextRow]
    | [TextRow, TextRow]
    | [TextRow, TextRow, TextRow]
    | [TextRow, TextRow, TextRow, TextRow];
};

type InformationButton =
  | TextButton<InformationTemplate>
  | ImageButton<InformationTemplate>
  | TextAndImageButton<InformationTemplate>;

export type InformationTemplateConfig = Omit<
  NitroInformationTemplateConfig,
  'headerActions' | 'section' | 'mapConfig' | 'actions'
> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  headerActions?: HeaderActions<InformationTemplate>;

  /**
   * A container that groups your items into a single section.
   *
   * In AndroidAuto this is a PaneTemplate with a list of rows. Each row can have a title with up to 2 rows and a detailedText with up to 4 rows, either as a single string that is automatically wrapped,
   * or a string with line breaks. However if the text is too long it might be broken into multiple rows and then truncated, if more than 4 rows are required due to wrapping.
   *
   * In Carplay this is an InformationTemplate.
   */
  section: InformationSection;
  /**
   * If mapConfig is defined, it will use a MapWithContentTemplate with the current template. This results in a PaneTemplate with a map in background. No actions need to be specified, can be empty object.
   * @namespace Android
   */
  mapConfig?: BaseMapTemplateConfig<InformationTemplate>;

  /**
   * Android allows TextButton, TextAndImageButton and ImageButton. iOS only allows TextButton.
   * @namespace Android - TextButton, TextAndImageButton and ImageButton, 2 in total
   * @namespace iOS - TextButton, 3 in total
   */
  actions?:
    | [InformationButton]
    | [InformationButton, InformationButton]
    | [
        TextButton<InformationTemplate>,
        TextButton<InformationTemplate>,
        TextButton<InformationTemplate>,
      ];
};

export class InformationTemplate extends Template<
  InformationTemplateConfig,
  HeaderActions<InformationTemplate>
> {
  private template = this;

  constructor(config: InformationTemplateConfig) {
    super(config);

    const { headerActions, mapConfig, section, actions, ...rest } = config;

    if (
      Platform.OS === 'ios' &&
      actions?.find((action) => action.type === 'image' || action.type === 'textImage')
    ) {
      throw new Error(
        `Action of type 'image/textImage' is not supported on InformationTemplate for CarPlay`
      );
    }
    if (Platform.OS === 'android' && (actions?.length ?? 0) > 2) {
      throw new Error('Only two actions supported on InformationTemplate for AndroidAuto');
    }

    const nitroConfig: NitroInformationTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      actions: NitroActionUtil.convert(this.template, actions),
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

  public updateSections(section?: SingleSection<InformationTemplate>) {
    HybridInformationTemplate.updateInformationTemplateSections(
      this.id,
      NitroSectionUtil.convert(this.template, section)?.at(0) ?? { items: [], type: 'default' }
    );
  }
}
