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
 * Route options to avoid. Mapped natively from the letters of the intent's `avoid` parameter as
 * Google documents them: `t` tolls, `h` highways, `f` ferries. Letters the library does not know
 * are dropped, so a letter Google adds later is missing until the library maps it.
 */
export type NavigationAvoidOption = 'tolls' | 'highways' | 'ferries';

/**
 * The travel modes this library maps. Mapped natively from the letter of the intent's `mode`
 * parameter as Google documents it: `b` bicycling, `d` driving, `x` taxi, `l` two_wheeler,
 * `r` transit, `w` walking. Compare NavigationIntent.mode against these.
 */
export type NavigationTravelMode =
  | 'bicycling'
  | 'driving'
  | 'taxi'
  | 'two_wheeler'
  | 'transit'
  | 'walking';

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
   * The travel mode, one of NavigationTravelMode. A letter the library does not know is passed
   * through as is, so a mode Google adds later still arrives, just unmapped. Kept a string
   * rather than the union for that reason.
   * Undefined when absent, which it always is on Android Automotive.
   */
  mode?: string;
  /** where the request came from, e.g. `assistant` */
  entry?: string;
}
