import type { HybridObject } from 'react-native-nitro-modules';
import type { NitroSignInTemplateConfig } from '../templates/SignInTemplate';
import type { NitroTemplateConfig } from './AutoPlay.nitro';

interface SignInTemplateConfig extends NitroTemplateConfig, NitroSignInTemplateConfig {}

export interface SignInTemplate extends HybridObject<{ android: 'kotlin' }> {
  createSignInTemplate(config: SignInTemplateConfig): void;
  updateTemplate(templateId: string, config: SignInTemplateConfig): Promise<void>;
  isGoogleSignInAvailable(): boolean;
}
