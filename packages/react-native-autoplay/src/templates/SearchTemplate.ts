import { NitroModules } from 'react-native-nitro-modules';
import type { DefaultRow, SingleSection } from '..';
import type { SearchTemplate as NitroSearchTemplate } from '../specs/SearchTemplate.nitro';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type NitroSection, NitroSectionUtil } from '../utils/NitroSection';
import {
  type HeaderActions,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

const HybridSearchTemplate = NitroModules.createHybridObject<NitroSearchTemplate>('SearchTemplate');

export type SearchSection<T> = {
  type: 'default';
  items: Array<DefaultRow<T>>;
};

export interface NitroSearchTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  title: AutoText;
  results: NitroSection;
  /**
   * Text that is put into the searchbar as initial value
   * @namespace Android
   */
  initialSearchText?: string;
  /**
   * Placeholder value in the search bar until text is entered
   * @namespace Android
   */
  searchHint?: string;
  /**
   * Called when the user types on the keyboard. Should be debounced to avoid excessive calls to backend.
   * @param searchText the text that the user has entered into the search bar
   */
  onSearchTextChanged: (searchText: string) => void;
  /**
   * Called when the user presses enter or search button to confirm search explicitly.
   * Can be used to trigger a backend call immediately, but might never be called if the user selects a search result item from autocomplete results instead.
   * @param searchText the text that the user has entered into the search bar
   */
  onSearchTextSubmitted: (searchText: string) => void;
}

export type SearchTemplateConfig = Omit<
  NitroSearchTemplateConfig,
  'headerActions' | 'results' | 'onPopped'
> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   * @namespace Android
   */
  headerActions?: HeaderActions<SearchTemplate>;
  /**
   * List of search results to show in the search results screen
   */
  results?: SearchSection<SearchTemplate>;

  /**
   * @namespace Android
   */
  onPopped?: TemplateConfig['onPopped'];
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
      results: NitroSectionUtil.convert(this.template, results)?.at(0) ?? {
        items: [],
        type: 'default',
      },
    };

    HybridSearchTemplate.createSearchTemplate(nitroConfig);
  }

  public updateSearchResults(results?: SingleSection<SearchTemplate>) {
    return HybridSearchTemplate.updateSearchResults(
      this.id,
      NitroSectionUtil.convert(this.template, results)?.at(0) ?? {
        items: [],
        type: 'default',
      }
    );
  }
}
