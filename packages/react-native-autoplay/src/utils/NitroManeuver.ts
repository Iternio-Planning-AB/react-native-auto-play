import {
  type ArrivalDirection,
  type AutoManeuver,
  type BaseManeuver,
  type ForkType,
  type KeepType,
  ManeuverType,
  type OffRampType,
  type OnRampType,
  type TurnType,
} from '../types/Maneuver';
import { type NitroImage, NitroImageUtil } from './NitroImage';

type AttributedInstructionVariantImage = {
  image: NitroImage;
  position: number;
};

type AttributedInstructionVariant = {
  text: string;
  images?: Array<AttributedInstructionVariantImage>;
};

export interface NitroManeuver extends BaseManeuver {
  attributedInstructionVariants: Array<AttributedInstructionVariant>;
  symbolImage: NitroImage;
  junctionImage?: NitroImage;
  arrivalDirection?: ArrivalDirection;
  turnType?: TurnType;
  angle?: number;
  elementAngles?: Array<number>;
  exitNumber?: number;
  offRampType?: OffRampType;
  onRampType?: OnRampType;
  forkType?: ForkType;
  keepType?: KeepType;
}

function convert(autoManeuver: AutoManeuver): NitroManeuver {
  const {
    symbolImage,
    junctionImage,
    attributedInstructionVariants,
    id,
    maneuverType,
    trafficSide,
    travelEstimates,
    highwayExitLabel,
    linkedLaneGuidance,
    roadName,
  } = autoManeuver;

  const arrivalDirection =
    maneuverType === ManeuverType.Arrive ? autoManeuver.arrivalDirection : undefined;
  const elementAngles =
    maneuverType === ManeuverType.Turn || maneuverType === ManeuverType.Roundabout
      ? autoManeuver.elementAngles
      : undefined;
  const angle =
    maneuverType === ManeuverType.Turn || maneuverType === ManeuverType.Roundabout
      ? autoManeuver.angle
      : undefined;
  const turnType = maneuverType === ManeuverType.Turn ? autoManeuver.turnType : undefined;
  const exitNumber = maneuverType === ManeuverType.Roundabout ? autoManeuver.exitNumber : undefined;
  const offRampType = maneuverType === ManeuverType.OffRamp ? autoManeuver.offRampType : undefined;
  const onRampType = maneuverType === ManeuverType.OnRamp ? autoManeuver.onRampType : undefined;
  const forkType = maneuverType === ManeuverType.Fork ? autoManeuver.forkType : undefined;
  const keepType = maneuverType === ManeuverType.Keep ? autoManeuver.keepType : undefined;

  return {
    id,
    maneuverType,
    trafficSide,
    travelEstimates,
    linkedLaneGuidance,
    highwayExitLabel,
    roadName,
    attributedInstructionVariants: attributedInstructionVariants.map((variant) => ({
      text: variant.text,
      images: variant.images?.map(({ image, position }) => ({
        image: NitroImageUtil.convert(image),
        position,
      })),
    })),
    junctionImage: NitroImageUtil.convert(junctionImage),
    symbolImage: NitroImageUtil.convert(symbolImage),
    arrivalDirection,
    elementAngles,
    angle,
    turnType,
    exitNumber,
    offRampType,
    onRampType,
    forkType,
    keepType,
  };
}

export const NitroManeuverUtil = { convert };
