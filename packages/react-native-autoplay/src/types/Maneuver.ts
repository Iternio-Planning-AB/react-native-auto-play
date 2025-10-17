import type { AutoImage } from './Image';
import type { TravelEstimates } from './Trip';

export enum ManeuverType {
  NoTurn = 0,
  LeftTurn = 1,
  RightTurn = 2,
  StraightAhead = 3,
  UTurn = 4,
  FollowRoad = 5,
  EnterRoundabout = 6,
  ExitRoundabout = 7,
  OffRamp = 8,
  OnRamp = 9,
  ArriveEndOfNavigation = 10,
  StartRoute = 11,
  ArriveAtDestination = 12,
  KeepLeft = 13,
  KeepRight = 14,
  Enter_Ferry = 15,
  ExitFerry = 16,
  ChangeFerry = 17,
  StartRouteWithUTurn = 18,
  UTurnAtRoundabout = 19,
  LeftTurnAtEnd = 20,
  RightTurnAtEnd = 21,
  HighwayOffRampLeft = 22,
  HighwayOffRampRight = 23,
  ArriveAtDestinationLeft = 24,
  ArriveAtDestinationRight = 25,
  UTurnWhenPossible = 26,
  ArriveEndOfDirections = 27,
  RoundaboutExit1 = 28,
  RoundaboutExit2 = 29,
  RoundaboutExit3 = 30,
  RoundaboutExit4 = 31,
  RoundaboutExit5 = 32,
  RoundaboutExit6 = 33,
  RoundaboutExit7 = 34,
  RoundaboutExit8 = 35,
  RoundaboutExit9 = 36,
  RoundaboutExit10 = 37,
  RoundaboutExit11 = 38,
  RoundaboutExit12 = 39,
  RoundaboutExit13 = 40,
  RoundaboutExit14 = 41,
  RoundaboutExit15 = 42,
  RoundaboutExit16 = 43,
  RoundaboutExit17 = 44,
  RoundaboutExit18 = 45,
  RoundaboutExit19 = 46,
  SharpLeftTurn = 47,
  SharpRightTurn = 48,
  SlightLeftTurn = 49,
  SlightRightTurn = 50,
  ChangeHighway = 51,
  ChangeHighwayLeft = 52,
  ChangeHighwayRight = 53,
}

export enum JunctionType {
  Intersection = 0, // single intersection with roads coming to a common point
  Roundabout = 1, // roundabout, junction elements represent roads exiting the roundabout
}

export enum TrafficSide {
  Right = 0, // counterclockwise for roundabouts
  Left = 1, // clockwise for roundabouts
}

export enum LaneStatus {
  NotGood = 0,
  Good = 1,
  Preferred = 2,
}

export type Lane = {
  angles: Array<number>;
  highlightedAngle: number;
  status: LaneStatus;
};

export type LaneGuidance = {
  instructionVariants: Array<string>;
  lanes: Array<Lane>;
};

export type Maneuver = {
  /**
   * @namespace iOS specify a unique identifier, sending over a Maneuver with a known id will only update the travelEstimates on the previously sent Maneuver
   * @namespace Android applies all updates and does not check for id
   */
  id: string;
  attributedInstructionVariants: Array<{
    text: string;
    images?: [{ image: AutoImage; position: number }];
  }>;
  travelEstimates: TravelEstimates;
  maneuverType: ManeuverType;
  trafficSide: TrafficSide;
  roadFollowingManeuverVariants?: Array<string>;
  symbolImage: AutoImage;
  junctionImage?: AutoImage;
  junctionType?: JunctionType;
  junctionExitAngle?: number;
  junctionElementAngles?: Array<number>;
  highwayExitLabel?: string;
  linkedLaneGuidance?: LaneGuidance;
};

export type Maneuvers = [Maneuver, Maneuver | undefined];
