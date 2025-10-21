import { HybridListTemplate } from '..';
import type { AutoImage } from '../types/Image';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type NitroSection, NitroSectionUtil } from '../utils/NitroSection';
import {
  type HeaderActions,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

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
};

export type MultiSection<T> =
  | {
      type: 'default';
      title: string;
      items: Array<DefaultRow<T> | ToggleRow<T>>;
    }
  | {
      type: 'radio';
      title: string;
      items: Array<RadioRow<T>>;
      selectedIndex: number;
    };

export type SingleSection<T> = {
  [K in MultiSection<T> as K['type']]: Omit<K, 'title' | 'detailedText'>;
}[MultiSection<T>['type']];

export type Section<T> = Array<MultiSection<T>> | SingleSection<T>;

export interface NitroListTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  title: AutoText;
  sections?: Array<NitroSection>;
}

export type ListTemplateConfig = Omit<NitroListTemplateConfig, 'headerActions' | 'sections'> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  headerActions?: HeaderActions<ListTemplate>;

  /**
   * a container that groups your list items into sections.
   */
  sections?: Section<ListTemplate>;
};

export class ListTemplate extends Template<ListTemplateConfig, HeaderActions<ListTemplate>> {
  private template = this;

  constructor(config: ListTemplateConfig) {
    super(config);

    const { headerActions, sections, ...rest } = config;

    const nitroConfig: NitroListTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      sections: NitroSectionUtil.convert(this.template, sections),
    };

    HybridListTemplate.createListTemplate(nitroConfig);
  }

  public updateSections(sections?: Section<ListTemplate>) {
    HybridListTemplate.updateListTemplateSections(
      this.id,
      NitroSectionUtil.convert(this.template, sections)
    );
  }
}
