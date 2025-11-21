import type { HybridObject } from 'react-native-nitro-modules';
import type { NitroInformationTemplateConfig } from '../templates/InformationTemplate';
import type { NitroTemplateConfig } from './AutoPlay.nitro';

interface InformationTemplateConfig extends NitroTemplateConfig, NitroInformationTemplateConfig {}

export interface InformationTemplate extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  createInformationTemplate(config: InformationTemplateConfig): void;
  updateInformationTemplateSections(
    templateId: string,
    section: NitroInformationTemplateConfig['section']
  ): Promise<void>;
}
