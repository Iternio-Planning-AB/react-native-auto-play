import { AutoPlay } from '..';
import type { ActionButtonAndroid, ActionButtonIos, AppButton, BackButton } from '../types/Button';
import { NitroActionUtil } from '../utils/NitroAction';

export type ActionsIos = {
  backButton?: BackButton;
  leadingNavigationBarButtons?: [ActionButtonIos, ActionButtonIos] | [ActionButtonIos];
  trailingNavigationBarButtons?: [ActionButtonIos, ActionButtonIos] | [ActionButtonIos];
};

export type ActionsAndroid = {
  startHeaderAction?: AppButton | BackButton;
  endHeaderActions?: [ActionButtonAndroid, ActionButtonAndroid] | [ActionButtonAndroid];
};

export type Actions = {
  android?: ActionsAndroid;
  ios?: ActionsIos;
};

export interface TemplateConfig {
  /**
   * Specify an id for your template, must be unique.
   */
  id: string;

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
   * Fired when popToRootTemplate finished
   */
  onPoppedToRoot?(animated?: boolean): void;
}

export class Template<TemplateConfigType, ActionsType> {
  public templateId!: string;

  constructor(config: TemplateConfig & TemplateConfigType) {
    this.templateId = config.id;
  }

  /**
   * must be called manually whenever you are sure the template is not needed anymore
   */
  public destroy() {}

  public setRootTemplate() {
    return AutoPlay.setRootTemplate(this.templateId);
  }

  public push() {
    return AutoPlay.pushTemplate(this.templateId);
  }

  public setActions(actions?: ActionsType) {
    const nitroActions = NitroActionUtil.convert(actions as Actions);
    AutoPlay.setTemplateActions(this.templateId, nitroActions);
  }
}
