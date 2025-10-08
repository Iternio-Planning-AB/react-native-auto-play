import { Platform } from 'react-native';
import type { ActionsAndroidMap } from '../templates/MapTemplate';
import type { Actions, ActionsAndroid, ActionsIos } from '../templates/Template';
import type {
  ActionButtonAndroid,
  ActionButtonIos,
  ImageButton,
  TextAndImageButton,
  TextButton,
} from '../types/Button';
import { NitroImage } from './NitroImage';

type NitroActionType = 'appIcon' | 'back' | 'custom';
type NitroAlignment = 'leading' | 'trailing';

/**
 * used to convert the very specific typescript typing in an easier to handle type for native code
 */
export type NitroAction = {
  title?: string;
  image?: NitroImage;
  enabled?: boolean;
  onPress: () => void;
  type: NitroActionType;
  alignment?: NitroAlignment;
  flags?: number;
};

const getImage = (
  action: ActionButtonIos | TextButton | ImageButton | TextAndImageButton
): NitroImage | undefined => ('image' in action ? NitroImage.convert(action.image) : undefined);

const getTitle = (
  action: ActionButtonIos | TextButton | ImageButton | TextAndImageButton
): string | undefined => ('title' in action ? action.title : undefined);

// appIcon can not be pressed but we wanna have a non-optional onPress on native side
const getAppIconAction = (alignment?: NitroAlignment): NitroAction => ({
  type: 'appIcon',
  onPress: () => null,
  alignment,
});

const convertToNitro = (action: ActionButtonAndroid, alignment?: NitroAlignment): NitroAction => {
  const { type } = action;
  if (type === 'appIcon') {
    return getAppIconAction(alignment);
  }

  const { onPress } = action;

  if (type === 'back') {
    return { type, onPress, alignment };
  }

  const { enabled, flags } = action;

  const title = 'title' in action ? action.title : undefined;
  const image = 'image' in action ? NitroImage.convert(action.image) : undefined;

  return {
    onPress,
    type: 'custom' as const,
    enabled,
    flags,
    image,
    title,
    alignment,
  };
};

const convertAndroidMap = (actions?: ActionsAndroidMap): Array<NitroAction> | undefined => {
  return actions?.map<NitroAction>((action) => convertToNitro(action, undefined));
};

const convertIos = (actions?: ActionsIos): Array<NitroAction> | undefined => {
  if (actions == null) {
    return undefined;
  }

  const nitroActions: Array<NitroAction> = [];

  if (actions.backButton != null) {
    nitroActions.push({
      type: 'back',
      onPress: actions.backButton.onPress,
      alignment: undefined,
    });
  }

  if (actions.leadingNavigationBarButtons != null) {
    for (const button of actions.leadingNavigationBarButtons) {
      const { onPress, enabled } = button;
      const image = getImage(button);
      const title = getTitle(button);

      nitroActions.push({
        type: 'custom',
        enabled,
        image,
        onPress,
        title,
        alignment: 'leading',
      });
    }
  }

  if (actions.trailingNavigationBarButtons) {
    for (const button of actions.trailingNavigationBarButtons) {
      const { onPress, enabled } = button;
      const image = getImage(button);
      const title = getTitle(button);

      nitroActions.push({
        type: 'custom',
        enabled,
        image,
        onPress,
        title,
        alignment: 'trailing',
      });
    }
  }

  return nitroActions;
};

const convertAndroid = (actions?: ActionsAndroid): Array<NitroAction> | undefined => {
  if (actions == null) {
    return undefined;
  }

  const nitroActions: Array<NitroAction> = [];

  const { startHeaderAction, endHeaderActions = [] } = actions;

  if (startHeaderAction != null) {
    const action: NitroAction =
      startHeaderAction.type === 'appIcon'
        ? getAppIconAction('leading')
        : {
            ...startHeaderAction,
            alignment: 'leading',
          };

    nitroActions.push(action);
  }

  for (const action of endHeaderActions) {
    nitroActions.push(convertToNitro(action, 'trailing'));
  }

  return nitroActions;
};

const convert = (actions?: Actions) => {
  return Platform.OS === 'android' ? convertAndroid(actions?.android) : convertIos(actions?.ios);
};

export const NitroAction = { convert, convertAndroidMap, convertIos };
