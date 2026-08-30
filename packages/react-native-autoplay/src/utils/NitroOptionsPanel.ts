import type { ImageButton, TextButton } from '../types/Button';
import type { AutoImage } from '../types/Image';
import type { AutoText, Distance } from '../types/Text';
import type { DurationWithTimeZone } from '../types/Trip';
import { type NitroAction, NitroActionUtil } from './NitroAction';
import { type GridButton, type NitroGridButton, NitroGridUtil } from './NitroGrid';
import { type NitroImage, NitroImageUtil } from './NitroImage';
import {
  type DefaultRow,
  type MultiSection,
  type NitroSection,
  NitroSectionUtil,
  type RadioRow,
  type TextRow,
  type ToggleRow,
  type WaypointCoordinate,
  type WaypointRow,
} from './NitroSection';

export type OptionsPanelGridSection<T> = {
  type: 'grid';
  title?: string;
  buttons: Array<GridButton<T>>;
};

export type ChargingConnector =
  | 'ccs1'
  | 'ccs2'
  | 'j1772'
  | 'chaDeMo'
  | 'mennekes'
  | 'gbtDC'
  | 'gbtAC'
  | 'nacsDC'
  | 'nacsAC';

/**
 * one outlet (`CPChargingStationConnection`) on a charging station.
 */
export type ChargerOutlet<T> = {
  connector: ChargingConnector;
  voltage: number;
  /** converted to megawatts on the native side above 1000 kW */
  powerKw: number;
  onPress?: (template: T) => void;
};

/**
 * the charging station's own location, shown as an additional `CPMapTemplateWaypoint` item in
 * the charger section, alongside its outlets.
 */
export type ChargerLocation<T> = {
  /**
   * the item's own label — distinct from the section's `title`, which is already shown as the
   * section header, so this defaults to blank rather than repeating it.
   */
  name?: string;
  /** newline-separated address lines, most-preferred first */
  address?: string;
  coordinate: WaypointCoordinate;
  travelEstimates: {
    distance: Distance;
    duration: DurationWithTimeZone;
    /**
     * by default travel estimates are not shown
     * setting this to true add another row showing CPTravelEstimates
     */
    visible?: boolean;
  };
  image?: AutoImage;
  onPress?: (template: T) => void;
};

/**
 * charger section having n-ChargerOutlet
 */
export type OptionsPanelChargerSection<T> = {
  type: 'charger';
  title?: string;
  outlets: Array<ChargerOutlet<T>>;
  location?: ChargerLocation<T>;
};

export type OptionsPanelListSection<T> = {
  type: 'list';
  title?: string;
  items: Array<DefaultRow<T> | ToggleRow<T> | TextRow | WaypointRow<T>> | Array<RadioRow<T>>;
};

export type OptionsPanelSection<T> =
  | OptionsPanelListSection<T>
  | OptionsPanelGridSection<T>
  | OptionsPanelChargerSection<T>;

export type OptionsPanelConfig<T> = {
  title?: AutoText;
  sections: Array<OptionsPanelSection<T>>;
  actions?: [TextButton<T>] | [TextButton<T>, ImageButton<T>];
};

export type NitroOptionsPanelGridSection = {
  title?: string;
  buttons: Array<NitroGridButton>;
};

export type NitroChargerOutlet = {
  connector: ChargingConnector;
  voltage: number;
  powerKw: number;
  onPress?: () => void;
};

export type NitroChargerLocation = {
  name?: string;
  address?: string;
  coordinate: WaypointCoordinate;
  distance: Distance;
  duration: DurationWithTimeZone;
  visible?: boolean;
  image?: NitroImage;
  onPress?: () => void;
};

export type NitroOptionsPanelChargerSection = {
  title?: string;
  outlets: Array<NitroChargerOutlet>;
  location?: NitroChargerLocation;
};

export type NitroOptionsPanelSection =
  | NitroSection
  | NitroOptionsPanelGridSection
  | NitroOptionsPanelChargerSection;

export type NitroOptionsPanelConfig = {
  title?: AutoText;
  sections: Array<NitroOptionsPanelSection>;
  actions?: Array<NitroAction>;
};

const isRadioSection = <T>(
  items: OptionsPanelListSection<T>['items']
): items is Array<RadioRow<T>> => {
  return items.length > 0 && items.every((item) => item.type === 'radio');
};

const convertSection = <T>(
  template: T,
  section: OptionsPanelSection<T>
): NitroOptionsPanelSection => {
  if (section.type === 'grid') {
    return {
      title: section.title,
      buttons: NitroGridUtil.convert(template, section.buttons),
    };
  }

  if (section.type === 'charger') {
    const { location } = section;

    return {
      title: section.title,
      outlets: section.outlets.map((outlet) => ({
        connector: outlet.connector,
        voltage: outlet.voltage,
        powerKw: outlet.powerKw,
        onPress: outlet.onPress ? () => outlet.onPress?.(template) : undefined,
      })),
      location: location
        ? {
            name: location.name,
            address: location.address,
            coordinate: location.coordinate,
            distance: location.travelEstimates.distance,
            duration: location.travelEstimates.duration,
            visible: location.travelEstimates.visible,
            image: NitroImageUtil.convert(location.image),
            onPress: location.onPress ? () => location.onPress?.(template) : undefined,
          }
        : undefined,
    };
  }

  const { items, title = '' } = section;

  const multiSection: MultiSection<T> = isRadioSection(items)
    ? { type: 'radio', title, items }
    : {
        type: 'default',
        title,
        items,
      };

  const [nitroSection] = NitroSectionUtil.convert(template, [multiSection]) ?? [];

  if (nitroSection == null) {
    throw new Error('converting sections failed');
  }

  return nitroSection;
};

const convert = <T>(
  template: T,
  config?: OptionsPanelConfig<T>
): NitroOptionsPanelConfig | undefined => {
  if (config == null) {
    return undefined;
  }

  return {
    title: config.title,
    sections: config.sections.map((section) => convertSection(template, section)),
    actions: NitroActionUtil.convert(template, config.actions),
  };
};

export const NitroOptionsPanelUtil = { convert };
