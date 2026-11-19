import type { Location } from './Event';

/**
 * What the user asked for. For a NAVIGATE intent from its `intent` parameter:
 * - `navigation`: make it the new destination
 * - `add_a_stop`: keep the destination and add it as another stop
 * - `directions`: show the route without starting navigation
 *
 * Also `navigation` when the parameter is absent (Google's default) or holds a value this
 * library does not know.
 * - `search`: show search results for the query, e.g. "find charging stations". Set for a
 *   VIEW `geo:` intent, whatever its `intent` parameter says.
 */
export type NavigationIntentType = 'navigation' | 'add_a_stop' | 'directions' | 'search';

/**
 * Route options to avoid, from the intent's `avoid` parameter (`t`, `h`, `f`).
 */
export type NavigationAvoidOption = 'tolls' | 'highways' | 'ferries';

/**
 * A navigation request the OS sent to the car app, e.g. "navigate to X" or "add a stop at X" by
 * voice. Parsed from the `geo:` URI of an `androidx.car.app.action.NAVIGATE` intent, or of a
 * VIEW intent for a search.
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
