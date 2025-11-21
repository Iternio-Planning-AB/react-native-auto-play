import uuid from 'react-native-uuid';
import { HybridAutoPlay } from '..';
import type { ActionButtonAndroid, ActionButtonIos, AppButton, BackButton } from '../types/Button';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import type { NitroMapButton } from '../utils/NitroMapButton';

export type ActionButton<T> = ActionButtonAndroid<T> | ActionButtonIos<T>;

export type HeaderActionsIos<T> = {
  /**
   * @platform iOS - the back button can not be hidden or disabled, if you don't define it iOS will provide a default back button popping the template
   */
  backButton?: BackButton<T>;
  leadingNavigationBarButtons?: [ActionButtonIos<T>, ActionButtonIos<T>] | [ActionButtonIos<T>];
  trailingNavigationBarButtons?: [ActionButtonIos<T>, ActionButtonIos<T>] | [ActionButtonIos<T>];
};

export type HeaderActionsAndroid<T> = {
  startHeaderAction?: AppButton | BackButton<T>;
  endHeaderActions?: [ActionButtonAndroid<T>, ActionButtonAndroid<T>] | [ActionButtonAndroid<T>];
};

export type HeaderActions<T> = {
  android?: HeaderActionsAndroid<T>;
  ios?: HeaderActionsIos<T>;
};
export interface NitroTemplateConfig {
  id: string;
}

export interface TemplateConfig {
  /**
   * Fired before template appears
   */
  onWillAppear?(animated?: boolean): void;

  /**
   * Fired before template disappears
   */
  onWillDisappear?(animated?: boolean): void;

  /**
   * Fired after template appears
   */
  onDidAppear?(animated?: boolean): void;

  /**
   * Fired after template disappears
   */
  onDidDisappear?(animated?: boolean): void;

  /**
   * Fired when the template was removed from the stack
   * on all other states the template is still on the stack and might appear again
   * this callback lets you know the template is gone forever
   * @namespace Android - works fine on all templates
   * @namespace iOS - does not work on all templates like SearchTemplate
   */
  onPopped?(): void;

  /**
   * if specified the template will be popped after the specified timeout once it has been pushed
   * will be ignored if setRootTemplate is called
   * template will be popped only if it is still visible to the user aka the topmost template
   */
  autoDismissMs?: number;
}

export interface NitroBaseMapTemplateConfig extends TemplateConfig {
  mapButtons?: Array<NitroMapButton>;
  headerActions?: Array<NitroAction>;
  onDidChangePanningInterface?: (isPanningInterfaceVisible: boolean) => void;
}

export class Template<TemplateConfigType, ActionsType> {
  public id!: string;

  constructor(config: TemplateConfig & TemplateConfigType) {
    // templates that render on a surface provide their own id, others use a auto generated one
    this.id =
      'id' in config && config.id != null && typeof config.id === 'string' ? config.id : uuid.v4();
  }

  /**
   * set as root template on the stack
   */
  public setRootTemplate() {
    return HybridAutoPlay.setRootTemplate(this.id);
  }

  /**
   * push this template on the stack and show it to the user
   */
  public push() {
    return HybridAutoPlay.pushTemplate(this.id);
  }

  /**
   * remove all templates above this one from the stack
   */
  public popTo() {
    return HybridAutoPlay.popToTemplate(this.id);
  }

  public setHeaderActions<T>(headerActions?: ActionsType) {
    const nitroActions = NitroActionUtil.convert(headerActions as HeaderActions<T>);
    return HybridAutoPlay.setTemplateHeaderActions(this.id, nitroActions);
  }
}
