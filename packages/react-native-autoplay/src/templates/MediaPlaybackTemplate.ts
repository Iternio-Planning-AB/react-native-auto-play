import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type { MediaPlaybackTemplate as NitroMediaPlaybackTemplate } from '../specs/MediaPlaybackTemplate.nitro';
import type { AutoText } from '../types/Text';
import type { NitroAction } from '../utils/NitroAction';
import { NitroActionUtil } from '../utils/NitroAction';
import type { HeaderActions, NitroTemplateConfig, TemplateConfig } from './Template';
import { Template } from './Template';

const HybridMediaPlaybackTemplate =
  Platform.OS === 'android'
    ? NitroModules.createHybridObject<NitroMediaPlaybackTemplate>('MediaPlaybackTemplate')
    : null;

export interface NitroMediaPlaybackTemplateConfig extends TemplateConfig {
  title?: AutoText;
  headerActions?: Array<NitroAction>;
}

export type MediaPlaybackTemplateConfig = Omit<
  NitroMediaPlaybackTemplateConfig,
  'headerActions'
> & {
  /**
   * Actions displayed in the playback screen header.
   * @namespace Android
   */
  headerActions?: HeaderActions<MediaPlaybackTemplate>;
};

/**
 * The Android Auto / Android Automotive now-playing screen for media apps.
 *
 * Playback metadata and transport controls are supplied by Android from the app's media session.
 * Set `ReactNativeAutoPlay_androidAutoAppCategory=media`; this template requires Car App API 8.
 * @namespace Android
 */
export class MediaPlaybackTemplate extends Template<
  MediaPlaybackTemplateConfig,
  HeaderActions<MediaPlaybackTemplate>
> {
  private template = this;

  constructor(config: MediaPlaybackTemplateConfig = {}) {
    super(config);

    const { headerActions, ...rest } = config;
    const nitroConfig: NitroMediaPlaybackTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
    };

    HybridMediaPlaybackTemplate?.createMediaPlaybackTemplate(nitroConfig);
  }
}
