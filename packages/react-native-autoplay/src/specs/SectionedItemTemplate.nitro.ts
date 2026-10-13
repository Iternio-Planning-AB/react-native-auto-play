import type { HybridObject } from 'react-native-nitro-modules';
import type { NitroSectionedItemTemplateConfig } from '../templates/SectionedItemTemplate';
import type { NitroTemplateConfig } from './AutoPlay.nitro';

interface SectionedItemTemplateConfig
  extends NitroTemplateConfig,
    NitroSectionedItemTemplateConfig {}

export interface SectionedItemTemplate extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  createSectionedItemTemplate(config: SectionedItemTemplateConfig): void;
  updateSectionedItemTemplateSections(
    templateId: string,
    sections: NitroSectionedItemTemplateConfig['sections']
  ): Promise<void>;
}
