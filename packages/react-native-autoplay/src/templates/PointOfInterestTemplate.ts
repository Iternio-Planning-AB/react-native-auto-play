import { NitroModules } from 'react-native-nitro-modules';
import type { PointOfInterestTemplate as NitroPointOfInterestTemplate } from '../specs/PointOfInterestTemplate.nitro';
import type { PointOfInterest } from '../types/PointOfInterest';
import type { AutoText } from '../types/Text';
import { type NitroColor, NitroColorUtil, type ThemedColor } from '../utils/NitroColor';
import { type NitroTemplateConfig, Template, type TemplateConfig } from './Template';

const HybridPointOfInterestTemplate =
  NitroModules.createHybridObject<NitroPointOfInterestTemplate>('PointOfInterestTemplate');

export type NitroActionStrip = {
  label: string;
  onPress: () => void;
};

/**
 * An action shown in the action strip of the `PlaceListMapTemplate`.
 * @namespace Android
 */
export type ActionStripConfig = {
  label: string;
  onPress: (template: PointOfInterestTemplate) => void;
};

/**
 * Colors of the default pin renderer, each falling back to a status-specific default.
 */
export type PointOfInterestColors = {
  available?: ThemedColor | string;
  busy?: ThemedColor | string;
  inactive?: ThemedColor | string;
  highlight?: ThemedColor | string;
};

export type NitroPointOfInterestColors = {
  available?: NitroColor;
  busy?: NitroColor;
  inactive?: NitroColor;
  highlight?: NitroColor;
};

export interface NitroPointOfInterestTemplateConfig extends TemplateConfig {
  title: AutoText;
  items: Array<PointOfInterest>;
  actionStrip?: NitroActionStrip;
  colors?: NitroPointOfInterestColors;
  onSelectItem?: (itemId: string) => void;
}

export type PointOfInterestTemplateConfig = Omit<
  NitroPointOfInterestTemplateConfig,
  'actionStrip' | 'colors' | 'onSelectItem'
> & {
  /**
   * an action shown in the action strip of the `PlaceListMapTemplate`
   * @namespace Android
   */
  actionStrip?: ActionStripConfig;

  /**
   * colors of the default pin renderer
   */
  colors?: PointOfInterestColors;

  /**
   * callback for a pressed list row/pin
   * @param template the template the item belongs to
   * @param itemId id of the pressed {@link PointOfInterest}
   */
  onSelectItem?: (template: PointOfInterestTemplate, itemId: string) => void;
};

const convertColors = (colors: PointOfInterestColors): NitroPointOfInterestColors => ({
  available: NitroColorUtil.convert(colors.available),
  busy: NitroColorUtil.convert(colors.busy),
  inactive: NitroColorUtil.convert(colors.inactive),
  highlight: NitroColorUtil.convert(colors.highlight),
});

/**
 * A `PlaceListMapTemplate` (Android Auto) / `CPPointOfInterestTemplate` (CarPlay) list of pinned
 * places, e.g. for a "find nearby chargers" flow.
 */
export class PointOfInterestTemplate extends Template<PointOfInterestTemplateConfig, undefined> {
  private template = this;

  constructor(config: PointOfInterestTemplateConfig) {
    super(config);

    const { actionStrip, colors, onSelectItem, ...rest } = config;

    const nitroConfig: NitroPointOfInterestTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      actionStrip:
        actionStrip != null
          ? { label: actionStrip.label, onPress: () => actionStrip.onPress(this.template) }
          : undefined,
      colors: colors != null ? convertColors(colors) : undefined,
      onSelectItem:
        onSelectItem != null ? (itemId: string) => onSelectItem(this.template, itemId) : undefined,
    };

    HybridPointOfInterestTemplate.createPointOfInterestTemplate(nitroConfig);
  }

  /**
   * replaces the shown places, e.g. after the list of nearby chargers was refreshed
   */
  public updateItems(items: Array<PointOfInterest>) {
    return HybridPointOfInterestTemplate.updatePointOfInterestTemplateItems(this.id, items);
  }
}
