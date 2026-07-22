import type { AutoImage } from '../types/Image';
import { type AutoText, type Distance, TextPlaceholders } from '../types/Text';
import type { DurationWithTimeZone } from '../types/Trip';
import { type NitroImage, NitroImageUtil } from './NitroImage';

type BaseRow = {
  title: AutoText;
  enabled?: boolean;
  image?: AutoImage;
};

export type DefaultRow<T> = BaseRow & {
  type: 'default';
  /**
   * adds a chevron at the end of the row
   */
  browsable?: boolean;
  onPress: (template: T) => void;
  detailedText?: AutoText;
};

export type ToggleRow<T> = BaseRow & {
  type: 'toggle';
  checked: boolean;
  onPress: (template: T, checked: boolean) => void;
};

export type RadioRow<T> = BaseRow & {
  type: 'radio';
  onPress: (template: T) => void;
  selected?: boolean;
};

export type TextRow = BaseRow & {
  type: 'text';
  detailedText?: AutoText;
};

export type WaypointCoordinate = {
  latitude: number;
  longitude: number;
  altitude?: number;
};

/**
 * a point of interest, e.g. a charger's location. Renders as a `CPMapTemplateWaypoint` item
 * (showing `title` as the name, `address` as the address, and the travel estimate for reaching
 * it) when part of a `CPMapPanel` (iOS 27+); falls back to a plain row using `title`/`address`
 * as the detail line everywhere else (including Android, which has no equivalent concept).
 */
export type WaypointRow<T> = BaseRow & {
  type: 'waypoint';
  /**
   * add one of {@link TextPlaceholders} to add travelEstimates
   * prefer travelEstimates.visible over that on iOS 27+
   */
  address?: string;
  coordinate: WaypointCoordinate;
  travelEstimates: {
    distance: Distance;
    duration: DurationWithTimeZone;
    /**
     * by default travel estimates are not shown
     * setting this to true adds another row showing CPTravelEstimates
     * @namespace iOS 27+
     */
    visible?: boolean;
  };
  onPress?: (template: T) => void;
};

export type MultiSection<T> =
  | {
      type: 'default';
      title: string;
      items: Array<DefaultRow<T> | ToggleRow<T> | TextRow | WaypointRow<T>>;
    }
  | {
      type: 'radio';
      title: string;
      items: Array<RadioRow<T>>;
    };

export type SingleSection<T> = {
  [K in MultiSection<T> as K['type']]: Omit<K, 'title' | 'detailedText'>;
}[MultiSection<T>['type']];

export type Section<T> = Array<MultiSection<T>> | SingleSection<T>;

type NitroSectionType = 'default' | 'radio';

export type NitroRow = {
  title: AutoText;
  detailedText?: AutoText;
  browsable?: boolean;
  enabled: boolean;
  image?: NitroImage;
  checked?: boolean;
  onPress?: (checked?: boolean) => void;
  selected?: boolean;
  coordinate?: WaypointCoordinate;
  distance?: Distance;
  duration?: DurationWithTimeZone;
  /**
   * only meaningful in panel context (iOS 27+, `mapConfig` set) — adds a sibling `CPMapPanelItem`
   * showing `distance`/`duration` as a native `CPTravelEstimates` row. Non-panel/Android rendering
   * relies purely on `title`/`detailedText` opting in via `TextPlaceholders` instead.
   */
  travelEstimatesVisible?: boolean;
  address?: string;
};

export type NitroSection = {
  title?: string;
  items: Array<NitroRow>;
  type: NitroSectionType;
};

const validateRadioItems = (type: NitroSectionType, items: Array<NitroRow>) => {
  if (
    __DEV__ &&
    type === 'radio' &&
    (items.filter((item) => item.selected).length > 1 || items.every((item) => !item.selected))
  ) {
    throw new Error('radio lists must have one selected item');
  }
};

const convert = <T>(template: T, sections?: Section<T>): Array<NitroSection> | undefined => {
  if (sections == null) {
    return undefined;
  }

  if (Array.isArray(sections)) {
    return sections.map<NitroSection>((section) => {
      const { title, type } = section;
      const items = section.items.map<NitroRow>((item) => convertRow(template, item));

      validateRadioItems(type, items);

      return {
        items,
        type,
        title,
      };
    });
  }

  const items = sections.items.map((item) => convertRow(template, item));

  validateRadioItems(sections.type, items);

  return [
    {
      items,
      type: sections.type,
    },
  ];
};

/**
 * `AutoText.distance`/`.duration` only take effect if `text` actually uses the matching
 * `TextPlaceholders` marker — populate whichever of those the text references, leaving the rest
 * of `text` untouched, so a title/address that doesn't opt in via a placeholder is unaffected.
 */
const withTravelEstimates = (
  text: AutoText,
  distance: Distance,
  durationSeconds: number
): AutoText => {
  const hasDistance = text.text.includes(TextPlaceholders.Distance);
  const hasDuration = text.text.includes(TextPlaceholders.Duration);

  if (!hasDistance && !hasDuration) {
    return text;
  }

  return {
    ...text,
    distance: hasDistance ? distance : text.distance,
    duration: hasDuration ? durationSeconds : text.duration,
  };
};

const convertRow = <T>(
  template: T,
  item: DefaultRow<T> | RadioRow<T> | ToggleRow<T> | TextRow | WaypointRow<T>
): NitroRow => {
  const { type, enabled = true, image } = item;

  // `WaypointRow` has no `detailedText` of its own — `address` doubles as the detail line
  // whenever this falls back to a plain row (non-panel context, Android).
  let title = item.title;
  let detailedText =
    item.type === 'waypoint'
      ? item.address != null
        ? { text: item.address }
        : undefined
      : 'detailedText' in item
        ? item.detailedText
        : undefined;

  // Opt-in only: a title/address using `{distance}`/`{duration}` gets those values filled in,
  // via the same substitution `AutoText` already does everywhere else — no separate "estimate"
  // UI element needed for a row embedded in a list alongside other rows. Deliberately NOT gated
  // on `travelEstimates.visible` — that flag only controls the panel-only sibling
  // `CPTravelEstimates` item (see `Parser.swift`'s `travelEstimatesVisible` check), which has no
  // bearing on the non-panel/Android fallback text this feeds; a placeholder in the text is
  // already its own explicit opt-in regardless of `visible`.
  if (item.type === 'waypoint') {
    const { distance, duration } = item.travelEstimates;
    title = withTravelEstimates(title, distance, duration.seconds);
    if (detailedText != null) {
      detailedText = withTravelEstimates(detailedText, distance, duration.seconds);
    }
  }

  const selected = type === 'radio' ? (item.selected ?? false) : undefined;

  const onTogglePress = item.type === 'toggle' ? item.onPress : undefined;
  const onRowPress = item.type !== 'text' && item.type !== 'toggle' ? item.onPress : undefined;

  const onPress =
    item.type === 'text'
      ? undefined
      : (checked?: boolean) => {
          if (onTogglePress != null && checked != null) {
            onTogglePress(template, checked);
            return;
          }
          if (onRowPress != null) {
            onRowPress(template);
          }
        };

  return {
    browsable: type === 'default' ? item.browsable : undefined,
    detailedText,
    enabled,
    image: NitroImageUtil.convert(image),
    title,
    checked: type === 'toggle' ? item.checked : undefined,
    onPress,
    selected,
    coordinate: item.type === 'waypoint' ? item.coordinate : undefined,
    distance: item.type === 'waypoint' ? item.travelEstimates.distance : undefined,
    duration: item.type === 'waypoint' ? item.travelEstimates.duration : undefined,
    travelEstimatesVisible: item.type === 'waypoint' ? item.travelEstimates.visible : undefined,
    address: item.type === 'waypoint' ? item.address : undefined,
  };
};

export const NitroSectionUtil = { convert };
