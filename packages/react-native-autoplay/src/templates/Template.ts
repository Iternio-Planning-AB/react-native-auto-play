export interface TemplateConfig {
  /**
   * Specify an id for your template, must be unique.
   */
  id: string;

  /**
   * Fired before template appears
   * @param e Event
   */
  onWillAppear?(): void;

  /**
   * Fired before template disappears
   * @param e Event
   */
  onWillDisappear?(): void;

  /**
   * Fired after template appears
   * @param e Event
   */
  onDidAppear?(): void;

  /**
   * Fired after template disappears
   * @param e Event
   */
  onDidDisappear?(): void;

  /**
   * Fired when popToRootTemplate finished
   */
  onPoppedToRoot?(): void;
}

export class Template<P> {
  public get type(): string {
    return 'unset';
  }
  public templateId!: string;

  constructor(public config: TemplateConfig & P) {
    this.templateId = config.id;
  }
}
