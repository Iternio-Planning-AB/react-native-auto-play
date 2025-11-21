import type { HybridObject } from 'react-native-nitro-modules';
import type { NitroListTemplateConfig } from '../templates/ListTemplate';
import type { NitroTemplateConfig } from './AutoPlay.nitro';

interface ListTemplateConfig extends NitroTemplateConfig, NitroListTemplateConfig {}

export interface ListTemplate extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  createListTemplate(config: ListTemplateConfig): void;
  updateListTemplateSections(
    templateId: string,
    sections: NitroListTemplateConfig['sections']
  ): Promise<void>;
}
