import { NitroModules } from 'react-native-nitro-modules';
import type { HybridGridTemplate as NitroHybridGridTemplate } from '../specs/HybridGridTemplate.nitro';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type GridButton, type NitroGridButton, NitroGridUtil } from '../utils/NitroGrid';
import { NitroMapButton } from '../utils/NitroMapButton';
import { type BaseMapTemplateConfig, convertMapActions } from './MapTemplate';
import {
  type HeaderActions,
  type NitroBaseMapTemplateConfig,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

const HybridGridTemplate =
  NitroModules.createHybridObject<NitroHybridGridTemplate>('HybridGridTemplate');

export interface NitroGridTemplateConfig extends TemplateConfig {
  headerActions?: Array<NitroAction>;
  title: AutoText;
  buttons: Array<NitroGridButton>;
  mapConfig?: NitroBaseMapTemplateConfig;
}

export type GridTemplateConfig = Omit<
  NitroGridTemplateConfig,
  'headerActions' | 'buttons' | 'mapConfig'
> & {
  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  headerActions?: HeaderActions<GridTemplate>;

  buttons: Array<GridButton<GridTemplate>>;

  /**
   * If mapConfig is defined, it will use a MapWithContentTemplate with the current template. This results in a GridTemplate with a map in background. No actions need to be specified, can be empty object.
   * @namespace Android
   */
  mapConfig?: BaseMapTemplateConfig<GridTemplate>;
};

export class GridTemplate extends Template<GridTemplateConfig, HeaderActions<GridTemplate>> {
  private template = this;

  constructor(config: GridTemplateConfig) {
    super(config);

    const { headerActions, buttons, mapConfig, ...rest } = config;

    const nitroConfig: NitroGridTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      buttons: NitroGridUtil.convert(this.template, buttons),
      mapConfig: mapConfig
        ? {
            mapButtons: NitroMapButton.convert(this.template, mapConfig.mapButtons),
            headerActions: convertMapActions(this.template, mapConfig.headerActions),
          }
        : undefined,
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
