/**
 * The custom actions this library maps, e.g. "mute navigation" or "avoid tolls" by voice.
 * Names as in Google's geo.action intent spec. Compare NavigationAction.act against these.
 */
export type NavigationActionName =
  | 'mute'
  | 'unmute'
  | 'show_traffic'
  | 'hide_traffic'
  | 'show_satellite'
  | 'hide_satellite'
  | 'show_alternates'
  | 'route_overview'
  | 'exit_navigation'
  | 'query_next_turn'
  | 'distance_to_next_turn'
  | 'time_to_next_turn'
  | 'distance_to_destination'
  | 'time_to_destination'
  | 'eta'
  | 'go_back'
  | 'show_directions_list'
  | 'query_current_road'
  | 'query_destination'
  | 'follow_mode'
  | 'avoid_tolls'
  | 'allow_tolls'
  | 'avoid_ferries'
  | 'allow_ferries'
  | 'avoid_highways'
  | 'allow_highways'
  | 'report_crash'
  | 'report_traffic_jam'
  | 'report_police'
  | 'report_hazard'
  | 'resume_navigation'
  | 'report_road_closure'
  | 'clear_search_results'
  | 'remove_next_stop'
  | 'apply_electric_vehicle_connector_filter'
  | 'remove_electric_vehicle_connector_filter'
  | 'apply_electric_vehicle_payment_filter'
  | 'remove_electric_vehicle_payment_filter'
  | 'apply_electric_vehicle_fast_charging_filter'
  | 'remove_electric_vehicle_fast_charging_filter';

/**
 * A custom action the OS sent to the car app instead of a destination, e.g. "mute navigation" or
 * "avoid tolls" by voice. Arrives as an androidx.car.app.action.NAVIGATE intent with an `act`
 * parameter, either numeric (e.g. `google.maps://maps.google.com/?act=35` or `geo:0,0?act=35`) or
 * named (`geo.action:?act=avoid_tolls`).
 */
export interface NavigationAction {
  /**
   * The documented action name, one of NavigationActionName: the numeric act values the Android
   * Auto host delivers are mapped to their name natively, so a numeric and a named act arrive as
   * the same value. A number the library does not know (or a name it does not list) is passed
   * through as is. On Android Automotive the car Assistant sends the named form, only to the
   * navigation app chosen in its settings.
   * The numbers are not documented by Google; the mapping is taken from the Android Auto host app
   * (18.0) and could change.
   */
  act: string;
}
