import type { AutoText } from './Text';

/**
 * Drives the default pin renderer's color and center label. `Available` and `Busy` render the
 * `available`/`total` count as the label, anything else renders as inactive with a cross.
 */
export type PointOfInterestStatus = 'Available' | 'Busy' | 'Inactive';

export type PointOfInterest = {
  id: string;
  title: AutoText;
  /**
   * first line of the list row, the host prepends the formatted distance to it
   * @namespace Android
   */
  line1?: string;
  line2?: string;
  lat: number;
  lng: number;
  /**
   * distance shown in front of `line1`, in meters
   * @default 0
   * @namespace Android
   */
  distanceMeters?: number;
  /**
   * @default Inactive
   */
  status?: PointOfInterestStatus;
  /**
   * current value shown on the pin, ignored when the status is inactive
   * @default 0
   */
  available?: number;
  /**
   * denominator for `available`
   * @default 1
   */
  total?: number;
  /**
   * draws the secondary badge on the pin
   * @default false
   */
  hasBadge?: boolean;
  /**
   * draws the highlight ring on the pin, e.g. for a favorited item
   * @default false
   */
  isHighlighted?: boolean;
};
