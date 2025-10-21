import { Platform } from 'react-native';
import type { HeaderActionsAndroidMap } from '../templates/MapTemplate';
import type { HeaderActions, HeaderActionsAndroid, HeaderActionsIos } from '../templates/Template';
import type {
  ActionButtonAndroid,
  ActionButtonIos,
  ImageButton,
  TextAndImageButton,
  TextButton,
} from '../types/Button';
import type { AlertActionStyle } from './NitroAlert';
import { type NitroImage, NitroImageUtil } from './NitroImage';

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
  /**
   * Only used for non header actions
   * @namespace iOS
   * @default default
   */
  // REVISIT: check if we can re-use the flags?
  style?: AlertActionStyle;
};

const getImage = <T>(
  action: ActionButtonIos<T> | TextButton<T> | ImageButton<T> | TextAndImageButton<T>
): NitroImage | undefined => ('image' in action ? NitroImageUtil.convert(action.image) : undefined);

const getTitle = <T>(
  action: ActionButtonIos<T> | TextButton<T> | ImageButton<T> | TextAndImageButton<T>
): string | undefined => ('title' in action ? action.title : undefined);

// appIcon can not be pressed but we wanna have a non-optional onPress on native side
const getAppIconAction = (alignment?: NitroAlignment): NitroAction => ({
  type: 'appIcon',
  onPress: () => null,
  alignment,
});

const convertToNitro = <T>(
  template: T,
  action: ActionButtonAndroid<T>,
  alignment?: NitroAlignment
): NitroAction => {
  const { type } = action;
  if (type === 'appIcon') {
    return getAppIconAction(alignment);
  }

  const { onPress } = action;

  if (type === 'back') {
    return { type, onPress: () => onPress(template), alignment };
  }

  const { enabled, flags } = action;

  const title = 'title' in action ? action.title : undefined;
  const image = 'image' in action ? NitroImageUtil.convert(action.image) : undefined;

  return {
    onPress: () => onPress(template),
    type: 'custom' as const,
    enabled,
    flags,
    image,
    title,
    alignment,
  };
};

const convertAndroidMap = <T>(
  template: T,
  actions?: HeaderActionsAndroidMap<T>
): Array<NitroAction> | undefined => {
  return actions?.map<NitroAction>((action) => convertToNitro(template, action, undefined));
};

function convertIos<T>(template: T, actions: HeaderActionsIos<T>): Array<NitroAction>;
function convertIos<T>(template: T, actions?: HeaderActionsIos<T>): Array<NitroAction> | undefined;
function convertIos<T>(template: T, actions?: HeaderActionsIos<T>): Array<NitroAction> | undefined {
  if (actions == null) {
    return undefined;
  }

  const nitroActions: Array<NitroAction> = [];

  if (actions.backButton != null) {
    nitroActions.push({
      type: 'back',
      onPress: () => actions.backButton?.onPress(template),
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
        onPress: () => onPress(template),
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
        onPress: () => onPress(template),
        title,
        alignment: 'trailing',
      });
    }
  }

  return nitroActions;
}

function convertAndroid<T>(template: T, actions: HeaderActionsAndroid<T>): Array<NitroAction>;
function convertAndroid<T>(
  template: T,
  actions?: HeaderActionsAndroid<T>
): Array<NitroAction> | undefined;
function convertAndroid<T>(
  template: T,
  actions?: HeaderActionsAndroid<T>
): Array<NitroAction> | undefined {
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
            onPress: () => startHeaderAction.onPress(template),
          };

    nitroActions.push(action);
  }

  for (const action of endHeaderActions) {
    nitroActions.push(convertToNitro(template, action, 'trailing'));
  }

  return nitroActions;
}

function convert<T>(template: T, actions: HeaderActions<T>): Array<NitroAction>;
function convert<T>(template: T, actions?: HeaderActions<T>): Array<NitroAction> | undefined;
function convert<T>(template: T, actions?: HeaderActions<T>): Array<NitroAction> | undefined {
  return Platform.OS === 'android'
    ? convertAndroid(template, actions?.android)
    : convertIos(template, actions?.ios);
}

export const NitroActionUtil = { convert, convertAndroidMap, convertIos };
