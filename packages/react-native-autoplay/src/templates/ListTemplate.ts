import { AutoPlay } from '..';
import type { AutoImage } from '../types/Image';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type NitroSection, NitroSectionUtil } from '../utils/NitroSection';
import { type Actions, Template, type TemplateConfig } from './Template';

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
  actions?: Array<NitroAction>;
  title: AutoText;
  sections?: Array<NitroSection>;
}

export type ListTemplateConfig = Omit<NitroListTemplateConfig, 'actions' | 'sections'> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  actions?: Actions<ListTemplate>;

  /**
   * a container that groups your list items into sections.
   */
  sections?: Section<ListTemplate>;
};

export class ListTemplate extends Template<ListTemplateConfig, Actions<ListTemplate>> {
  private cleanup: () => void;
  private template = this;

  constructor(config: ListTemplateConfig) {
    super(config);

    const { actions, sections, ...rest } = config;

    const nitroConfig: NitroListTemplateConfig = {
      ...rest,
      actions: NitroActionUtil.convert(this.template, actions),
      sections: NitroSectionUtil.convert(this.template, sections),
    };

    this.cleanup = AutoPlay.createListTemplate(nitroConfig);
  }

  public updateSections(sections?: Section<ListTemplate>) {
    AutoPlay.updateListTemplateSections(
      this.templateId,
      NitroSectionUtil.convert(this.template, sections)
    );
  }

  public destroy() {
    this.cleanup();
    super.destroy();
  }
}
