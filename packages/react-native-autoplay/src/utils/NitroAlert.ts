import type { AutoImage } from '../types/Image';
import type { AutoText } from '../types/Text';
import { type NitroImage, NitroImageUtil } from './NitroImage';

export type AlertActionStyle = 'default' | 'destructive' | 'cancel';
type AlertDismissalReason = 'timeout' | 'user' | 'system';

export type NavigationAlertAction = {
  title: string;
  style?: AlertActionStyle;
  onPress: () => void;
};

export type NavigationAlert = {
  id: number;
  title: AutoText;
  subtitle?: AutoText;
  image?: AutoImage;
  primaryAction: NavigationAlertAction;
  secondaryAction?: NavigationAlertAction;
  durationMs: number;
  onWillShow?: () => void;
  onDidDismiss?: (reason: AlertDismissalReason) => void;
};

export type NitroNavigationAlert = {
  id: number;
  title: AutoText;
  subtitle?: AutoText;
  image?: NitroImage;
  primaryAction: NavigationAlertAction;
  secondaryAction?: NavigationAlertAction;
  durationMs: number;
  onWillShow?: () => void;
  onDidDismiss?: (reason: AlertDismissalReason) => void;
};

const convert = (alert: NavigationAlert): NitroNavigationAlert => {
  const { image, ...rest } = alert;

  return {
    ...rest,
    image: NitroImageUtil.convert(image),
  };
};

export const NitroAlertUtil = { convert };
