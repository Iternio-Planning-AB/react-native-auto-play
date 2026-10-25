import type { AutoImage } from '../types/Image';
import type { AutoText } from '../types/Text';
import { type NitroImage, NitroImageUtil } from './NitroImage';

export type AlertActionStyle = 'default' | 'destructive' | 'cancel';
type AlertDismissalReason = 'timeout' | 'user' | 'system';

export type NavigationAlertAction = {
  title: string;
  style?: AlertActionStyle;
  /**
   * Android only. Marks this as the alert's default action. Android Auto triggers the default
   * action by itself when the alert times out, so `onPress` runs without the user touching
   * anything. Leave it unset if a timeout should only call `onDidDismiss('timeout')`.
   * Only the first default action is used. iOS has no default action, so this is ignored there.
   */
  isDefault?: boolean;
  onPress: () => void;
};

enum AlertPriorityEnum {
  low = 0,
  medium = 1,
  high = 2,
}

export type AlertPriority = 'low' | 'medium' | 'high';

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
  /**
   * The priority of the alert. When an alert with a higher priority is visible, and a lower priority alert is sent, the lower priority alert will not be shown.
   * However if a higher priority alert is sent and a lower priority alert is visible, the lower priority alert will be replaced by the higher priority alert.
   */
  priority: AlertPriority;
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
  priority: number;
};

const convert = (alert: NavigationAlert): NitroNavigationAlert => {
  const { image, priority, ...rest } = alert;

  return {
    ...rest,
    image: NitroImageUtil.convert(image),
    priority: AlertPriorityEnum[priority],
  };
};

export const NitroAlertUtil = { convert };
