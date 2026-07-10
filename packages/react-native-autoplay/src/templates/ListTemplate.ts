import { NitroModules } from 'react-native-nitro-modules';
import type { ListTemplate as NitroListTemplate } from '../specs/ListTemplate.nitro';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { NitroMapButton } from '../utils/NitroMapButton';
import { type NitroSection, NitroSectionUtil, type Section } from '../utils/NitroSection';
import type { BaseMapTemplateConfig, PanelHeaderActions } from './MapTemplate';
import {
  type HeaderActions,
  type NitroBaseMapTemplateConfig,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

const HybridListTemplate = NitroModules.createHybridObject<NitroListTemplate>('ListTemplate');

export type {
  DefaultRow,
  MultiSection,
  RadioRow,
  Section,
  SingleSection,
  TextRow,
  ToggleRow,
} from '../utils/NitroSection';

export interface NitroListTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  title: AutoText;
  sections?: Array<NitroSection>;
  mapConfig?: NitroBaseMapTemplateConfig;
}

export type ListTemplateConfig = Omit<
  NitroListTemplateConfig,
  'headerActions' | 'sections' | 'mapConfig'
> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  headerActions?: HeaderActions<ListTemplate>;

  /**
   * a container that groups your list items into sections.
   * must have a single selected item in case it is a radio list.
   * in case it does not the first item will be selected.
   * in case it has multiple only the first selected one will be shown as selected.
   */
  sections?: Section<ListTemplate>;
  /**
   * If mapConfig is defined, it will use a MapWithContentTemplate with the current template. This results in a ListTemplate with a map in background. No actions need to be specified, can be empty object.
   * @namespace Android - uses MapWithContentTemplate
   * @namespace iOS - renders as a CPMapPanel on the current root map template (iOS 27+);
   * `headerActions` here is Android-only — on iOS this template's own `headerActions` are
   * applied to the root map template's nav bar instead, since CarPlay has no separate header
   * for the map behind a panel.
   */
  mapConfig?: Omit<BaseMapTemplateConfig<ListTemplate>, 'headerActions'> & {
    headerActions?: PanelHeaderActions<ListTemplate>;
  };
};

export class ListTemplate extends Template<ListTemplateConfig, HeaderActions<ListTemplate>> {
  private template = this;

  constructor(config: ListTemplateConfig) {
    super(config);

    const { headerActions, mapConfig, sections, ...rest } = config;

    const nitroConfig: NitroListTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      sections: NitroSectionUtil.convert(this.template, sections),
      mapConfig: mapConfig
        ? {
            mapButtons: NitroMapButton.convert(this.template, mapConfig.mapButtons),
            headerActions: NitroActionUtil.convert(this.template, mapConfig.headerActions),
          }
        : undefined,
    };

    HybridListTemplate.createListTemplate(nitroConfig);
  }

  public updateSections(sections?: Section<ListTemplate>) {
    return HybridListTemplate.updateListTemplateSections(
      this.id,
      NitroSectionUtil.convert(this.template, sections)
    );
  }
}
