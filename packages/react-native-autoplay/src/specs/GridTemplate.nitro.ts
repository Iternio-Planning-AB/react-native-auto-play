import type { HybridObject } from 'react-native-nitro-modules';
import type { NitroGridTemplateConfig } from '../templates/GridTemplate';
import type { NitroGridButton } from '../utils/NitroGrid';
import type { NitroTemplateConfig } from './AutoPlay.nitro';

interface GridTemplateConfig extends NitroTemplateConfig, NitroGridTemplateConfig {}

export interface GridTemplate extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  createGridTemplate(config: GridTemplateConfig): void;
  updateGridTemplateButtons(templateId: string, buttons: Array<NitroGridButton>): Promise<void>;
}
