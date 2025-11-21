import type { HybridObject } from 'react-native-nitro-modules';
import type { NitroSearchTemplateConfig } from '../templates/SearchTemplate';
import type { NitroTemplateConfig } from './AutoPlay.nitro';

interface SearchTemplateConfig extends NitroTemplateConfig, NitroSearchTemplateConfig {}

export interface SearchTemplate extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  createSearchTemplate(config: SearchTemplateConfig): void;
  updateSearchResults(
    templateId: string,
    results: NitroSearchTemplateConfig['results']
  ): Promise<void>;
}
