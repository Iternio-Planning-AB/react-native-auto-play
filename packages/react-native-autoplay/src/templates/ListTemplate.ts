import { NitroModules } from 'react-native-nitro-modules';
import type { ListTemplate as NitroListTemplate } from '../specs/ListTemplate.nitro';
import type { AutoImage } from '../types/Image';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { NitroMapButton } from '../utils/NitroMapButton';
import { type NitroSection, NitroSectionUtil } from '../utils/NitroSection';
import type { BaseMapTemplateConfig } from './MapTemplate';
import {
  type HeaderActions,
  type NitroBaseMapTemplateConfig,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

const HybridListTemplate = NitroModules.createHybridObject<NitroListTemplate>('ListTemplate');

type BaseRow = {
  title: AutoText;
  enabled?: boolean;
  image?: AutoImage;
};

export type DefaultRow<T> = BaseRow & {
  type: 'default';
  /**
   * adds a chevron at the end of the row
   */
  browsable?: boolean;
  onPress: (template: T) => void;
  detailedText?: AutoText;
};

export type ToggleRow<T> = BaseRow & {
  type: 'toggle';
  checked: boolean;
  onPress: (template: T, checked: boolean) => void;
};

export type RadioRow<T> = BaseRow & {
  type: 'radio';
  onPress: (template: T) => void;
  selected?: boolean;
};

export type TextRow = BaseRow & {
  type: 'text';
  detailedText?: AutoText;
};

export type MultiSection<T> =
  | {
      type: 'default';
      title: string;
      items: Array<DefaultRow<T> | ToggleRow<T> | TextRow>;
    }
  | {
      type: 'radio';
      title: string;
      items: Array<RadioRow<T>>;
    };

export type SingleSection<T> = {
  [K in MultiSection<T> as K['type']]: Omit<K, 'title' | 'detailedText'>;
}[MultiSection<T>['type']];

export type Section<T> = Array<MultiSection<T>> | SingleSection<T>;

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
   * @namespace Android
   */
  mapConfig?: BaseMapTemplateConfig<ListTemplate>;
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
