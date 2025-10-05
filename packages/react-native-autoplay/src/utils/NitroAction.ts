import type { ActionsAndroidMap } from '../templates/MapTemplate';
import type { ActionsIos } from '../templates/Template';
import type { ActionButtonIos, ImageButton, TextAndImageButton, TextButton } from '../types/Button';
import { NitroImage } from './NitroImage';

type NitroActionType = 'leading' | 'trailing' | 'appIcon' | 'back' | 'custom';

/**
 * used to convert the very specific typescript typing in an easier to handle type for native code
 */
export type NitroAction = {
  title?: string;
  image?: NitroImage;
  enabled?: boolean;
  onPress: () => void;
  type: NitroActionType;
  flags?: number;
};

const getImage = (
  action: ActionButtonIos | TextButton | ImageButton | TextAndImageButton
): NitroImage | undefined => ('image' in action ? NitroImage.convert(action.image) : undefined);

const getTitle = (
  action: ActionButtonIos | TextButton | ImageButton | TextAndImageButton
): string | undefined => ('title' in action ? action.title : undefined);

const convertAndroidMap = (actions?: ActionsAndroidMap): Array<NitroAction> | undefined => {
  return actions?.map<NitroAction>((action) => {
    const { type } = action;
    if (type === 'appIcon') {
      // appIcon can not be pressed but we wanna have a non-optional onPress on native side
      return { type: 'appIcon', onPress: () => null };
    }

    const { onPress } = action;

    if (type === 'back') {
      return { type: 'back', onPress };
    }

    const { enabled, flags } = action;

    const title = 'title' in action ? action.title : undefined;
    const image = 'image' in action ? NitroImage.convert(action.image) : undefined;

    return {
      onPress,
      type: 'custom',
      enabled,
      flags,
      image,
      title,
    };
  });
};

const convertIos = (actions?: ActionsIos): Array<NitroAction> | undefined => {
  if (actions == null) {
    return undefined;
  }

  const nitroActions: Array<NitroAction> = [];

  if (actions.backButton != null) {
    nitroActions.push({ type: 'back', onPress: actions.backButton.onPress });
  }

  if (actions.leadingNavigationBarButtons != null) {
    for (const button of actions.leadingNavigationBarButtons) {
      const { onPress, enabled } = button;
      const image = getImage(button);
      const title = getTitle(button);

      nitroActions.push({
        type: 'leading',
        enabled,
        image,
        onPress,
        title,
      });
    }
  }

  if (actions.trailingNavigationBarButtons) {
    for (const button of actions.trailingNavigationBarButtons) {
      const { onPress, enabled } = button;
      const image = getImage(button);
      const title = getTitle(button);

      nitroActions.push({
        type: 'trailing',
        enabled,
        image,
        onPress,
        title,
      });
    }
  }

  return nitroActions;
};

export const NitroAction = { convertAndroidMap, convertIos };
