import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type { SectionedItemTemplate as NitroSectionedItemTemplate } from '../specs/SectionedItemTemplate.nitro';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type GridButton, type NitroGridButton, NitroGridUtil } from '../utils/NitroGrid';
import { NitroMapButton } from '../utils/NitroMapButton';
import {
  type DefaultRow,
  type NitroSection,
  NitroSectionUtil,
  type TextRow,
  type ToggleRow,
} from '../utils/NitroSection';
import type { BaseMapTemplateConfig, PanelHeaderActions } from './MapTemplate';
import {
  type HeaderActions,
  type NitroBaseMapTemplateConfig,
  type NitroPanelTemplatePlatformConfig,
  type NitroTemplateConfig,
  type PanelTemplateIosConfig,
  Template,
  type TemplateConfig,
} from './Template';

const HybridSectionedItemTemplate =
  NitroModules.createHybridObject<NitroSectionedItemTemplate>('SectionedItemTemplate');

/**
 * radio sections are not supported, Android Auto shows no selection state for them, see
 * https://issuetracker.google.com/issues/572978190
 */
export type SectionedItemListSection<T> = {
  type: 'default';
  title: string;
  items: Array<DefaultRow<T> | ToggleRow<T> | TextRow>;
};

/**
 * @namespace Android - a GridSection, below Car API 8 one row per button
 * @namespace iOS - grid buttons on a panel, otherwise a CPListImageRowItem. Below iOS 26 at most
 * `CPMaximumNumberOfGridImages` buttons in one line, titles need iOS 17.4+.
 */
export type SectionedItemGridSection<T> = {
  type: 'grid';
  title: string;
  buttons: Array<GridButton<T>>;
};

export type SectionedItemSection<T> = SectionedItemListSection<T> | SectionedItemGridSection<T>;

export type NitroGridSection = {
  title?: string;
  buttons: Array<NitroGridButton>;
};

export type NitroSectionedItemSection = NitroSection | NitroGridSection;

export interface NitroSectionedItemTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  title: AutoText;
  sections?: Array<NitroSectionedItemSection>;
  mapConfig?: NitroBaseMapTemplateConfig;
  platform?: NitroPanelTemplatePlatformConfig;
}

export type SectionedItemTemplateConfig = Omit<
  NitroSectionedItemTemplateConfig,
  'headerActions' | 'sections' | 'mapConfig' | 'platform'
> & {
  /**
   * action buttons, usually at the top right on Android and a top bar on iOS
   */
  headerActions?: HeaderActions<SectionedItemTemplate>;

  /**
   * list and grid sections in any order, sections without items or buttons are not shown.
   * undefined or empty shows a loading indicator on Android and an empty list on iOS.
   * @namespace Android - a SectionedItemTemplate (Car API 8+), older hosts get a ListTemplate
   * @namespace iOS - a CPListTemplate, or a CPMapPanel with `mapConfig` on iOS 27+
   */
  sections?: Array<SectionedItemSection<SectionedItemTemplate>>;

  /**
   * shows the template on top of the map, an empty object is enough
   * @namespace Android - a MapWithContentTemplate (Car API 7+), older hosts show it full screen.
   * The content is a GridTemplate for a single grid section, otherwise a ListTemplate with grid
   * buttons as rows. A SectionedItemTemplate on the map crashes Android Auto
   * (https://issuetracker.google.com/issues/572287914).
   * @namespace iOS - a CPMapPanel on the root map template (iOS 27+), full screen below.
   * `headerActions` here are Android only, iOS shows the template's own on the map's nav bar.
   */
  mapConfig?: Omit<BaseMapTemplateConfig<SectionedItemTemplate>, 'headerActions'> & {
    headerActions?: PanelHeaderActions<SectionedItemTemplate>;
  };

  /**
   * iOS only props
   * @namespace iOS
   */
  ios?: PanelTemplateIosConfig;
};

const convertSections = <T>(
  template: T,
  sections?: Array<SectionedItemSection<T>>
): Array<NitroSectionedItemSection> | undefined => {
  // empty sections are dropped, Android's ListTemplate fallback rejects them
  const filledSections = sections?.filter((section) =>
    section.type === 'grid' ? section.buttons.length > 0 : section.items.length > 0
  );

  return filledSections?.map<NitroSectionedItemSection>((section) => {
    if (section.type === 'grid') {
      return {
        title: section.title,
        buttons: NitroGridUtil.convert(template, section.buttons),
      };
    }

    const [nitroSection] = NitroSectionUtil.convert(template, [section]) ?? [];

    if (nitroSection == null) {
      throw new Error('converting sections failed');
    }

    return nitroSection;
  });
};

export class SectionedItemTemplate extends Template<
  SectionedItemTemplateConfig,
  HeaderActions<SectionedItemTemplate>
> {
  private template = this;

  constructor(config: SectionedItemTemplateConfig) {
    super(config);

    const { headerActions, mapConfig, sections, ios, ...rest } = config;

    const nitroConfig: NitroSectionedItemTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      sections: convertSections(this.template, sections),
      mapConfig: mapConfig
        ? {
            mapButtons: NitroMapButton.convert(this.template, mapConfig.mapButtons),
            headerActions: NitroActionUtil.convert(this.template, mapConfig.headerActions),
          }
        : undefined,
      platform: Platform.OS === 'ios' ? ios : undefined,
    };

    HybridSectionedItemTemplate.createSectionedItemTemplate(nitroConfig);
  }

  public updateSections(sections?: Array<SectionedItemSection<SectionedItemTemplate>>) {
    return HybridSectionedItemTemplate.updateSectionedItemTemplateSections(
      this.id,
      convertSections(this.template, sections)
    );
  }
}
