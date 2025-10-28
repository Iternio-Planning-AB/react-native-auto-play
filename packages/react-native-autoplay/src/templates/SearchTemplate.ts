import { type DefaultRow, HybridSearchTemplate, type SingleSection } from '..';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type NitroSection, NitroSectionUtil } from '../utils/NitroSection';
import {
  type HeaderActions,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

export type SearchSection<T> = {
  type: 'default';
  items: Array<Omit<DefaultRow<T>, 'browsable'>>;
};

export interface NitroSearchTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  title: AutoText;
  results?: NitroSection;
  /**
   * Text that is put into the searchbar as initial value
   */
  initialSearchText?: string;
  /**
   * Placeholder value in the search bar until text is entered
   */
  searchHint?: string;
  /**
   * Called when the user types on the keyboard. Should be debounced to avoid excessive calls to search backends.
   * @param searchText the text that the user has entered into the search bar
   */
  onSearchTextChanged?: (searchText: string) => void;
  /**
   * Called when the user presses enter or search button to confirm search explicitly.
   * @param searchText the text that the user has entered into the search bar
   */
  onSearchTextSubmitted?: (searchText: string) => void;
}

export type SearchTemplateConfig = Omit<NitroSearchTemplateConfig, 'headerActions' | 'results'> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  headerActions?: HeaderActions<SearchTemplate>;
  /**
   * List of search results to show in the search results screen
   */
  results?: SearchSection<SearchTemplate>;
};

export class SearchTemplate extends Template<SearchTemplateConfig, HeaderActions<SearchTemplate>> {
  private template = this;

  constructor(config: SearchTemplateConfig) {
    super(config);

    const { headerActions, results, ...rest } = config;

    const nitroConfig: NitroSearchTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      results: NitroSectionUtil.convert(this.template, results)?.at(0),
    };

    HybridSearchTemplate.createSearchTemplate(nitroConfig);
  }

  public updateSearchResults(results?: SingleSection<SearchTemplate>) {
    HybridSearchTemplate.updateSearchResults(
      this.id,
      NitroSectionUtil.convert(this.template, results)?.at(0)
    );
  }
}
