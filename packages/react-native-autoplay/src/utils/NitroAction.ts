import { Platform } from 'react-native';
import type { MapHeaderActions } from '../templates/MapTemplate';
import type {
  ActionButton,
  HeaderActions,
  HeaderActionsAndroid,
  HeaderActionsIos,
} from '../templates/Template';
import type {
  ActionButtonAndroid,
  ActionButtonIos,
  ButtonStyle,
  ImageButton,
  TextAndImageButton,
  TextButton,
} from '../types/Button';
import type { AlertActionStyle } from './NitroAlert';
import { type NitroImage, NitroImageUtil } from './NitroImage';

type NitroActionType = 'appIcon' | 'back' | 'custom';
type NitroAlignment = 'leading' | 'trailing';
type NitroButtonStyle = ButtonStyle | AlertActionStyle;

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
  style?: NitroButtonStyle;
};

const getImage = <T>(
  action: ActionButtonIos<T> | TextButton<T> | ImageButton<T> | TextAndImageButton<T>
): NitroImage | undefined => {
  if (action.type === 'text') {
    return undefined;
  }

  if (action.image.type === 'glyph' && action.image.fontScale == null) {
    action.image.fontScale = Platform.OS === 'android' ? 1.0 : 0.8;
  }

  return NitroImageUtil.convert(action.image);
};

const getTitle = <T>(
  action: ActionButtonIos<T> | TextButton<T> | ImageButton<T> | TextAndImageButton<T>
): string | undefined => {
  if (action.type !== 'text') {
    return undefined;
  }

  return action.title;
};

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

  const { enabled, flags, style } = action;

  const title = getTitle(action);
  const image = getImage(action);

  return {
    onPress: () => onPress(template),
    type: 'custom' as const,
    enabled,
    flags,
    image,
    title,
    alignment,
    style,
  };
};

const convertActionButtons = <T>(
  template: T,
  actions?: Array<ActionButton<T>>
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

function convert<T>(
  template: T,
  actions: HeaderActions<T> | Array<ActionButton<T>> | MapHeaderActions<T>
): Array<NitroAction>;
function convert<T>(
  template: T,
  actions?: HeaderActions<T> | Array<ActionButton<T>> | MapHeaderActions<T>
): Array<NitroAction> | undefined;
function convert<T>(
  template: T,
  actions?: HeaderActions<T> | Array<ActionButton<T>> | MapHeaderActions<T>
): Array<NitroAction> | undefined {
  if (Array.isArray(actions)) {
    return convertActionButtons(template, actions);
  }

  if (actions?.android != null && Array.isArray(actions.android)) {
    return convertActionButtons(template, actions.android);
  }

  return Platform.OS === 'android'
    ? convertAndroid(template, actions?.android)
    : convertIos(template, actions?.ios);
}

export const NitroActionUtil = { convert };
