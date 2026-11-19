import type { Location } from './Event';

/**
 * What the user asked for, from the intent's `intent` parameter.
 * - `navigation`: replace the destination and start navigating
 * - `add_a_stop`: add the destination as the next stop
 * - `directions`: show the route without starting navigation
 *
 * Also `navigation` when the parameter is absent (Google's default) or holds a value this
 * library does not know.
 */
export type NavigationIntentType = 'navigation' | 'add_a_stop' | 'directions';

/**
 * Route options to avoid, from the intent's `avoid` parameter (`t`, `h`, `f`).
 */
export type NavigationAvoidOption = 'tolls' | 'highways' | 'ferries';

/**
 * A navigation request the OS sent to the car app, e.g. "navigate to X" or "add a stop at X" by
 * voice. Parsed from the `androidx.car.app.action.NAVIGATE` intent's `geo:` URI.
 * Carries a location, a query, or both.
 */
export interface NavigationIntent {
  /** from `geo:lat,lon`, undefined for `0,0` or invalid coordinates */
  location?: Location;
  /** the destination query from `q`, decoded */
  query?: string;
  intent: NavigationIntentType;
  /** unknown letters are ignored, empty when the parameter is absent */
  avoid: NavigationAvoidOption[];
  /**
   * The raw travel mode letter: `b` bike, `d` drive, `x` taxi, `l` two-wheeler, `r` transit,
   * `w` walk. Passed through unmapped so new values need no library release.
   * Undefined when absent, which it always is on Android Automotive.
   */
  mode?: string;
  /** where the request came from, e.g. `assistant` */
  entry?: string;
}
