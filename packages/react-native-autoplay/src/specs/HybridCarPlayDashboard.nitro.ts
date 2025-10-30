import type { HybridObject } from 'react-native-nitro-modules';
import type { CleanupCallback, EventName } from '../types/Event';
import type { ColorScheme } from '../types/RootComponent';
import type { NitroImage } from '../utils/NitroImage';

export interface BaseCarPlayDashboardButton {
  titleVariants: Array<string>;
  subtitleVariants: Array<string>;
  onPress: () => void;
}

interface NitroCarPlayDashboardButton extends BaseCarPlayDashboardButton {
  image: NitroImage;
}

export interface HybridCarPlayDashboard extends HybridObject<{ ios: 'swift' }> {
  addListener(eventType: EventName, callback: () => void): CleanupCallback;
  setButtons(buttons: Array<NitroCarPlayDashboardButton>): Promise<void>;
  initRootView(): void;
  addListenerColorScheme(callback: (payload: ColorScheme) => void): CleanupCallback;
}
