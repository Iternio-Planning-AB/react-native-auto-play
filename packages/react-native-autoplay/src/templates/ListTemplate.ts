import { AutoPlay } from '..';
import { NitroAction } from '../utils/NitroAction';
import { type Actions, Template, type TemplateConfig } from './Template';

export interface NitroListTemplateConfig extends TemplateConfig {
  actions?: Array<NitroAction>;
  title: string;
}

export type ListTemplateConfig = Omit<NitroListTemplateConfig, 'actions'> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  actions?: Actions;
};

export class ListTemplate extends Template<ListTemplateConfig, Actions> {
  public get type(): string {
    return 'list';
  }

  private cleanup: () => void;

  constructor(config: ListTemplateConfig) {
    super(config);

    const { actions, ...rest } = config;

    const nitroConfig: NitroListTemplateConfig = {
      ...rest,
      actions: NitroAction.convert(actions),
    };

    this.cleanup = AutoPlay.createListTemplate(nitroConfig);
  }

  public destroy() {
    this.cleanup();
    super.destroy();
  }
}
