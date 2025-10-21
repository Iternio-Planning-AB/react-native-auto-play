import { HybridGridTemplate } from '..';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type GridButton, type NitroGridButton, NitroGridUtil } from '../utils/NitroGrid';
import {
  type HeaderActions,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

export interface NitroGridTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  title: AutoText;
  buttons: Array<NitroGridButton>;
}

export type GridTemplateConfig = Omit<NitroGridTemplateConfig, 'headerActions' | 'buttons'> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  headerActions?: HeaderActions<GridTemplate>;

  buttons: Array<GridButton<GridTemplate>>;
};

export class GridTemplate extends Template<GridTemplateConfig, HeaderActions<GridTemplate>> {
  private template = this;

  constructor(config: GridTemplateConfig) {
    super(config);

    const { headerActions, buttons, ...rest } = config;

    const nitroConfig: NitroGridTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      buttons: NitroGridUtil.convert(this.template, buttons),
    };

    HybridGridTemplate.createGridTemplate(nitroConfig);
  }

  public updateGrid(buttons: Array<GridButton<GridTemplate>>) {
    HybridGridTemplate.updateGridTemplateButtons(
      this.id,
      NitroGridUtil.convert(this.template, buttons)
    );
  }
}
