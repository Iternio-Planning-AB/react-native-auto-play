import {
  type AutoManeuver,
  ManeuverType,
  type MapTemplate,
  TrafficSide,
  TurnType,
} from '@g4rb4g3/react-native-autoplay';
import uuid from 'react-native-uuid';
import { updateTripEstimates } from '../templates/AutoTemplate';

const getManeuvers = (): Array<AutoManeuver> => [
  {
    id: uuid.v4(),
    attributedInstructionVariants: [{ text: 'Straight' }],
    travelEstimates: {
      distanceRemaining: { unit: 'meters', value: 1000 },
      timeRemaining: { seconds: 10, timezone: 'Europe/Berlin' },
    },
    symbolImage: {
      name: 'straight',
    },
    maneuverType: ManeuverType.Straight,
    trafficSide: TrafficSide.Left,
    roadName: ['Main St.'],
    linkedLaneGuidance: {
      instructionVariants: ['lane'],
      lanes: [
        { angles: [-90] },
        { highlightedAngle: 0, angles: [], isPreferred: true },
        { highlightedAngle: 0, angles: [90], isPreferred: false },
        { angles: [90] },
        { angles: [90] },
      ],
    },
  },
  {
    id: uuid.v4(),
    attributedInstructionVariants: [{ text: 'Left' }],
    travelEstimates: {
      distanceRemaining: { unit: 'meters', value: 2000 },
      timeRemaining: { seconds: 20, timezone: 'Europe/Berlin' },
    },
    symbolImage: {
      name: 'turn_left',
    },
    maneuverType: ManeuverType.Turn,
    roadName: ['Main St.'],
    trafficSide: TrafficSide.Left,
    turnType: TurnType.NormalLeft,
    angle: 90,
  },
  {
    id: uuid.v4(),
    attributedInstructionVariants: [{ text: 'Right' }],
    travelEstimates: {
      distanceRemaining: { unit: 'meters', value: 2000 },
      timeRemaining: { seconds: 20, timezone: 'Europe/Berlin' },
    },
    symbolImage: {
      name: 'turn_right',
    },
    maneuverType: ManeuverType.Turn,
    roadName: ['2nd St.'],
    trafficSide: TrafficSide.Left,
    turnType: TurnType.NormalRight,
    angle: 90,
  },
  {
    id: uuid.v4(),
    attributedInstructionVariants: [{ text: 'Arrived' }],
    travelEstimates: {
      distanceRemaining: { unit: 'meters', value: 2000 },
      timeRemaining: { seconds: 20, timezone: 'Europe/Berlin' },
    },
    symbolImage: {
      name: 'tour',
    },
    maneuverType: ManeuverType.Arrive,
    trafficSide: TrafficSide.Left,
    roadName: ['Destination St.'],
  },
];

let interval: ReturnType<typeof setInterval> | null = null;

const playManeuvers = (template: MapTemplate) => {
  let maneuvers = getManeuvers();

  const [initialCurrent, initialNext] = maneuvers;

  template.updateManeuvers([initialCurrent, initialNext]);

  interval = setInterval(() => {
    if (maneuvers[0].travelEstimates.timeRemaining.seconds === 0) {
      maneuvers = maneuvers.slice(1);
    } else {
      maneuvers[0].travelEstimates.timeRemaining.seconds -= 1;
      maneuvers[0].travelEstimates.distanceRemaining.value -= 100;
    }

    const [current, next] = maneuvers;

    if (current == null) {
      if (interval != null) {
        clearInterval(interval);
      }
      return;
    }

    template.updateManeuvers([current, next]);
    updateTripEstimates(template, 'remove');
  }, 1000);
};

const stopManeuvers = () => {
  if (interval != null) {
    clearInterval(interval);
  }
};

export const AutoManeuverUtil = { playManeuvers, stopManeuvers };
