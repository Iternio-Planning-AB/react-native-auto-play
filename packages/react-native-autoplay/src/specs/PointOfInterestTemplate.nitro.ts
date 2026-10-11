import type { HybridObject } from 'react-native-nitro-modules';
import type { NitroPointOfInterestTemplateConfig } from '../templates/PointOfInterestTemplate';
import type { PointOfInterest } from '../types/PointOfInterest';
import type { NitroTemplateConfig } from './AutoPlay.nitro';

interface PointOfInterestTemplateConfig
  extends NitroTemplateConfig,
    NitroPointOfInterestTemplateConfig {}

export interface PointOfInterestTemplate extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  createPointOfInterestTemplate(config: PointOfInterestTemplateConfig): void;
  updatePointOfInterestTemplateItems(
    templateId: string,
    items: Array<PointOfInterest>
  ): Promise<void>;
}
