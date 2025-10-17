import type {
  JunctionType,
  LaneGuidance,
  Maneuver,
  ManeuverType,
  TrafficSide,
} from '../types/Maneuver';
import type { TravelEstimates } from '../types/Trip';
import { type NitroImage, NitroImageUtil } from './NitroImage';

type AttributedInstructionVariantImage = {
  image: NitroImage;
  position: number;
};

type AttributedInstructionVariant = {
  text: string;
  images?: Array<AttributedInstructionVariantImage>;
};

export type NitroManeuver = {
  id: string;
  attributedInstructionVariants: Array<AttributedInstructionVariant>;
  travelEstimates: TravelEstimates;
  maneuverType: ManeuverType;
  trafficSide: TrafficSide;
  roadFollowingManeuverVariants?: Array<string>;
  symbolImage: NitroImage;
  junctionImage?: NitroImage;
  junctionType?: JunctionType;
  junctionExitAngle?: number;
  junctionElementAngles?: Array<number>;
  highwayExitLabel?: string;
  linkedLaneGuidance?: LaneGuidance;
};

function convert(maneuver: Maneuver): NitroManeuver {
  const { symbolImage, junctionImage, attributedInstructionVariants, ...rest } = maneuver;

  return {
    ...rest,
    attributedInstructionVariants: attributedInstructionVariants.map((variant) => ({
      text: variant.text,
      images: variant.images?.map(({ image, position }) => ({
        image: NitroImageUtil.convert(image),
        position,
      })),
    })),
    junctionImage: NitroImageUtil.convert(junctionImage),
    symbolImage: NitroImageUtil.convert(symbolImage),
  };
}

export const NitroManeuverUtil = { convert };
