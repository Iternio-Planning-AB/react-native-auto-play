import { AutoPlay } from '..';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type GridButton, type NitroGridButton, NitroGridUtil } from '../utils/NitroGrid';
import { type Actions, Template, type TemplateConfig } from './Template';

export interface NitroGridTemplateConfig extends TemplateConfig {
  actions?: Array<NitroAction>;
  title: AutoText;
  buttons: Array<NitroGridButton>;
}

export type GridTemplateConfig = Omit<NitroGridTemplateConfig, 'actions' | 'buttons'> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  actions?: Actions;

  buttons: Array<GridButton>;
};

export class GridTemplate extends Template<GridTemplateConfig, Actions> {
  private cleanup: () => void;

  constructor(config: GridTemplateConfig) {
    super(config);

    const { actions, buttons, ...rest } = config;

    const nitroConfig: NitroGridTemplateConfig = {
      ...rest,
      actions: NitroActionUtil.convert(actions),
      buttons: NitroGridUtil.convert(buttons),
    };

    this.cleanup = AutoPlay.createGridTemplate(nitroConfig);
  }

  public updateGrid(buttons: Array<GridButton>) {
    AutoPlay.updateGridTemplateButtons(this.templateId, NitroGridUtil.convert(buttons));
  }

  public destroy() {
    this.cleanup();
    super.destroy();
  }
}
