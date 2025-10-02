export type TemplateEventPayload = {
  /**
   * A Boolean value indicating whether the system animates the disappearance of the template.
   * @namespace iOS
   */
  animated?: boolean;
  state: VisibilityState;
};

export type VisibilityState = 'willAppear' | 'didAppear' | 'willDisappear' | 'didDisappear';
