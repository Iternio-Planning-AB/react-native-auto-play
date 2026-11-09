/**
 * - `success`: the payload carries a fix
 * - `unsupportedApiLevel`: the head unit runs a car app API level below 3
 * - `permissionDenied`: the app lacks the runtime `ACCESS_FINE_LOCATION` grant
 * - `unimplemented`: the head unit does not provide its location
 * - `unavailable`: the head unit provides its location, but has no fix right now
 * - `error`: registering the native listener failed
 * - `unknown`: the head unit reported a status this library does not know
 */
export type CarLocationStatus =
  | 'success'
  | 'unsupportedApiLevel'
  | 'permissionDenied'
  | 'unimplemented'
  | 'unavailable'
  | 'error'
  | 'unknown';

/**
 * The head unit's own location fix, apart from the phone's location providers.
 * All fields except status are only set when status is `success`.
 */
export interface CarLocation {
  status: CarLocationStatus;
  latitude?: number;
  longitude?: number;
  /** horizontal accuracy in meters */
  accuracy?: number;
  /** meters above the WGS84 ellipsoid */
  altitude?: number;
  /** meters per second */
  speed?: number;
  /** bearing in degrees, 0 = north, clockwise */
  heading?: number;
  /** UTC time of the fix in ms as reported by the head unit, whose clock can be far off the phone's */
  timestamp?: number;
  /**
   * Age of the fix in ms when it was handed to JS, measured on the phone's monotonic clock.
   * Use `Date.now() - fixAgeMs` to put the fix on the phone's clock instead of trusting `timestamp`.
   */
  fixAgeMs?: number;
  /** Age in ms of the CarValue that carried the fix, measured on the phone's monotonic clock */
  carValueAgeMs?: number;
}
