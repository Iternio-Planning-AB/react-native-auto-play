import type { HybridObject } from 'react-native-nitro-modules';
import type { NitroListTemplateConfig } from '../templates/ListTemplate';
import type { NitroTemplateConfig } from './HybridAutoPlay.nitro';

interface ListTemplateConfig extends NitroTemplateConfig, NitroListTemplateConfig {}

export interface HybridListTemplate extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  createListTemplate(config: ListTemplateConfig): Promise<void>;
  updateListTemplateSections(
    templateId: string,
    sections: NitroListTemplateConfig['sections']
  ): Promise<void>;
}
