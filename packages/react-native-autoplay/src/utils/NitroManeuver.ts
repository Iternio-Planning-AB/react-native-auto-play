import {
  type AutoManeuver,
  type BaseManeuver,
  type ForkType,
  type KeepType,
  type Lane,
  type ManeuverImage,
  ManeuverType,
  type OffRampType,
  type OnRampType,
  type PreferredLane,
  type TurnType,
} from '../types/Maneuver';
import { NitroColorUtil } from './NitroColor';
import { type NitroImage, NitroImageUtil } from './NitroImage';

type AttributedInstructionVariantImage = {
  image: NitroImage;
  position: number;
};

type AttributedInstructionVariant = {
  text: string;
  images?: Array<AttributedInstructionVariantImage>;
};

interface PreferredImageLane extends PreferredLane {
  image: NitroImage;
}

interface ImageLane extends Lane {
  image: NitroImage;
}

export interface LaneGuidance {
  instructionVariants: Array<string>;
  lanes: Array<PreferredImageLane | ImageLane>;
}

export interface NitroManeuver extends BaseManeuver {
  attributedInstructionVariants: Array<AttributedInstructionVariant>;
  symbolImage: NitroImage;
  junctionImage?: NitroImage;
  turnType?: TurnType;
  angle?: number;
  elementAngles?: Array<number>;
  exitNumber?: number;
  offRampType?: OffRampType;
  onRampType?: OnRampType;
  forkType?: ForkType;
  keepType?: KeepType;
  linkedLaneGuidance?: LaneGuidance;
  cardBackgroundColor: number;
}

function convertManeuverImage(image: ManeuverImage): NitroImage;
function convertManeuverImage(image: ManeuverImage | undefined): NitroImage | undefined;
function convertManeuverImage(image?: ManeuverImage): NitroImage | undefined {
  if (image == null) {
    return undefined;
  }
  return NitroImageUtil.convert({
    name: image.name,
    darkColor: image.color ?? 'white',
    lightColor: image.color ?? 'white',
  });
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
    cardBackgroundColor,
  } = autoManeuver;

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
    linkedLaneGuidance: linkedLaneGuidance
      ? {
          ...linkedLaneGuidance,
          lanes: linkedLaneGuidance.lanes.map((lane) => ({
            ...lane,
            image: convertManeuverImage(lane.image),
          })),
        }
      : undefined,
    highwayExitLabel,
    roadName,
    attributedInstructionVariants: attributedInstructionVariants.map((variant) => ({
      text: variant.text,
      images: variant.images?.map(({ image, position }) => ({
        image: convertManeuverImage(image),
        position,
      })),
    })),
    junctionImage: convertManeuverImage(junctionImage),
    symbolImage: convertManeuverImage(symbolImage),
    elementAngles,
    angle,
    turnType,
    exitNumber,
    offRampType,
    onRampType,
    forkType,
    keepType,
    cardBackgroundColor: NitroColorUtil.convert(cardBackgroundColor),
  };
}

export const NitroManeuverUtil = { convert };
