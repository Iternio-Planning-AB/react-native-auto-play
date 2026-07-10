import type { ImageButton, TextButton } from '../types/Button';
import type { AutoText } from '../types/Text';
import { type NitroAction, NitroActionUtil } from './NitroAction';
import { type GridButton, type NitroGridButton, NitroGridUtil } from './NitroGrid';
import {
  type DefaultRow,
  type MultiSection,
  type NitroSection,
  NitroSectionUtil,
  type RadioRow,
  type TextRow,
  type ToggleRow,
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
 * charger section having n-ChargerOutlet
 */
export type OptionsPanelChargerSection<T> = {
  type: 'charger';
  title?: string;
  outlets: Array<ChargerOutlet<T>>;
};

export type OptionsPanelListSection<T> = {
  type: 'list';
  title?: string;
  items: Array<DefaultRow<T> | ToggleRow<T> | TextRow> | Array<RadioRow<T>>;
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

export type NitroOptionsPanelChargerSection = {
  title?: string;
  outlets: Array<NitroChargerOutlet>;
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
    return {
      title: section.title,
      outlets: section.outlets.map((outlet) => ({
        connector: outlet.connector,
        voltage: outlet.voltage,
        powerKw: outlet.powerKw,
        onPress: outlet.onPress ? () => outlet.onPress?.(template) : undefined,
      })),
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
