import type { HybridObject } from 'react-native-nitro-modules';
import type { NitroMediaPlaybackTemplateConfig } from '../templates/MediaPlaybackTemplate';
import type { NitroTemplateConfig } from './AutoPlay.nitro';

interface MediaPlaybackTemplateConfig
  extends NitroTemplateConfig,
    NitroMediaPlaybackTemplateConfig {}

export interface MediaPlaybackTemplate extends HybridObject<{ android: 'kotlin' }> {
  createMediaPlaybackTemplate(config: MediaPlaybackTemplateConfig): void;
}
