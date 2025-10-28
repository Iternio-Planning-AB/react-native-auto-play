import type { GlyphName } from './Glyphmap';
import type { TravelEstimates } from './Trip';

export enum ManeuverType {
  Depart = 0,
  Arrive = 10,
  ArriveLeft = 11,
  ArriveRight = 12,
  Straight = 20,
  Turn = 30,
  Roundabout = 40,
  OffRamp = 50,
  OnRamp = 60,
  Fork = 70,
  EnterFerry = 80,
  Keep = 90,
}

export enum TrafficSide {
  Right = 0, // counterclockwise for roundabouts
  Left = 1, // clockwise for roundabouts
}

export enum TurnType {
  NoTurn = 0, // Android TYPE_UNKNOWN, iOS noTurn
  SlightLeft = 1, // Android TYPE_TURN_SLIGHT_LEFT, iOS slightLeftTurn
  SlightRight = 2, // Android TYPE_TURN_SLIGHT_RIGHT, iOS slightRightTurn
  NormalLeft = 3, // Android TYPE_TURN_NORMAL_LEFT, iOS leftTurn
  NormalRight = 4, // Android TYPE_TURN_NORMAL_RIGHT, iOS rightTurn
  SharpLeft = 5, // Android TYPE_TURN_SHARP_LEFT, iOS sharpLeftTurn
  SharpRight = 6, // Android TYPE_TURN_SHARP_RIGHT, iOS sharpRightTurn
  UTurnLeft = 7, // Android TYPE_U_TURN_LEFT, iOS uTurn
  UTurnRight = 8, // Android TYPE_U_TURN_RIGHT, iOS uTurn
}

export enum OffRampType {
  SlightLeft = 0, // Android TYPE_OFF_RAMP_SLIGHT_LEFT
  SlightRight = 1, // Android TYPE_OFF_RAMP_SLIGHT_RIGHT
  NormalLeft = 2, // Android TYPE_OFF_RAMP_NORMAL_LEFT
  NormalRight = 3, // Android TYPE_OFF_RAMP_NORMAL_RIGHT
}

export enum OnRampType {
  SlightLeft = 0, // Android TYPE_ON_RAMP_SLIGHT_LEFT
  SlightRight = 1, // Android TYPE_ON_RAMP_SLIGHT_RIGHT
  NormalLeft = 2, // Android TYPE_ON_RAMP_NORMAL_LEFT
  NormalRight = 3, // Android TYPE_ON_RAMP_NORMAL_RIGHT
  SharpLeft = 4, // Android TYPE_ON_RAMP_SHARP_LEFT
  SharpRight = 5, // Android TYPE_ON_RAMP_SHARP_RIGHT
  UTurnLeft = 6, // Android TYPE_ON_RAMP_U_TURN_LEFT
  UTurnRight = 7, // Android TYPE_ON_RAMP_U_TURN_RIGHT
}

export enum ForkType {
  Left = 0, // Android TYPE_FORK_LEFT
  Right = 1, // Android TYPE_FORK_RIGHT
}

export enum KeepType {
  Left = 0, // Android TYPE_KEEP_LEFT, iOS keepLeft
  Right = 1, // Android TYPE_KEEP_RIGHT, iOS keepRight
  FollowRoad = 2,
}

export interface BaseManeuver {
  /**
   * @namespace iOS specify a unique identifier, sending over a Maneuver with a known id will only update the travelEstimates on the previously sent Maneuver
   * @namespace Android applies all updates and does not check for id
   */
  id: string;
  travelEstimates: TravelEstimates;
  trafficSide: TrafficSide;
  maneuverType: ManeuverType;
  /**
   * @namespace iOS picks the best matching one based on length
   * @namespace Android picks the first one only
   */
  roadName?: Array<string>;
  highwayExitLabel?: string;
}

export interface WaypointManeuver extends BaseManeuver {
  maneuverType:
    | ManeuverType.Arrive
    | ManeuverType.ArriveLeft
    | ManeuverType.ArriveRight
    | ManeuverType.Depart;
}

export interface StraightManeuver extends BaseManeuver {
  maneuverType: ManeuverType.Straight;
}

export interface TurnManeuver extends BaseManeuver {
  maneuverType: ManeuverType.Turn;
  turnType: TurnType;
  /**
   * Optional turn angle in degrees to represent exact turn geometry.
   */
  angle?: number;
  /**
   * must not include turnAngle
   * @namespace iOS
   */
  elementAngles?: Array<number>;
}

export interface RoundaboutManeuver extends BaseManeuver {
  maneuverType: ManeuverType.Roundabout;
  /**
   * Optional exit number at the roundabout (1 = first exit).
   */
  exitNumber?: number;
  /**
   * Optional exit angle in degrees (1 to 360).
   */
  angle?: number;
  /**
   * must not include exitAngle
   * @namespace iOS
   */
  elementAngles?: Array<number>;
}

export interface OffRampManeuver extends BaseManeuver {
  maneuverType: ManeuverType.OffRamp;
  offRampType: OffRampType;
}

export interface OnRampManeuver extends BaseManeuver {
  maneuverType: ManeuverType.OnRamp;
  onRampType: OnRampType;
}

export interface FerryManeuver extends BaseManeuver {
  maneuverType: ManeuverType.EnterFerry;
}

export interface ForkManeuver extends BaseManeuver {
  maneuverType: ManeuverType.Fork;
  forkType: ForkType;
}

export interface KeepManeuver extends BaseManeuver {
  maneuverType: ManeuverType.Keep;
  keepType: KeepType;
}

export interface Lane {
  angles: Array<number>;
}

export interface PreferredLane extends Lane {
  /**
   * highlightedAngle must not be included in angles, if you have no more angles you can specify an empty angles array
   */
  highlightedAngle: number;
  isPreferred: boolean;
}

export interface ManeuverImage {
  name: GlyphName;
  /**
   * make sure to specify a color with a proper contrast ratio to cardBackgroundColor otherwise it might not get applied
   * defaults to white
   */
  color?: string;
}

export interface GlyphLane {
  /**
   * all images from all lanes will be merged and
   * @namespace Android setLanesImage called on the specified step/maneuver
   * @namespace iOS be set as symbolImage on the secondary maneuver (a new one will be generated, in case you specify a secondary maneuver it will not be shown then)
   */
  image: ManeuverImage;
}

export type Maneuver =
  | WaypointManeuver
  | StraightManeuver
  | TurnManeuver
  | RoundaboutManeuver
  | OffRampManeuver
  | OnRampManeuver
  | FerryManeuver
  | ForkManeuver
  | KeepManeuver;

export type AutoManeuver = Maneuver & {
  attributedInstructionVariants: Array<{
    text: string;
    images?: Array<{ image: ManeuverImage; position: number }>;
  }>;
  symbolImage: ManeuverImage;
  junctionImage?: ManeuverImage;
  linkedLaneGuidance?: {
    /**
     * @namespace iOS
     */
    instructionVariants: Array<string>;
    lanes: Array<(PreferredLane & GlyphLane) | (Lane & GlyphLane)>;
  };
  cardBackgroundColor: string;
};

export type AutoManeuvers = [AutoManeuver, AutoManeuver | undefined];
