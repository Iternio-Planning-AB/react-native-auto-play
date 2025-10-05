import type { ActionButtonAndroid, ActionButtonIos, AppButton, BackButton } from '../types/Button';

export type ActionsIos = {
  backButton?: BackButton;
  leadingNavigationBarButtons?: [ActionButtonIos, ActionButtonIos] | [ActionButtonIos];
  trailingNavigationBarButtons?: [ActionButtonIos, ActionButtonIos] | [ActionButtonIos];
};

export type ActionsAndroid = {
  startHeaderAction?: BackButton | AppButton;
  endHeaderAction?: [ActionButtonAndroid, ActionButtonAndroid] | [ActionButtonAndroid];
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

export class Template<P> {
  public get type(): string {
    return 'unset';
  }
  public templateId!: string;

  constructor(public config: TemplateConfig & P) {
    this.templateId = config.id;
  }

  /**
   * must be called manually whenever you are sure the template is not needed anymore
   */
  public destroy() {}
}
