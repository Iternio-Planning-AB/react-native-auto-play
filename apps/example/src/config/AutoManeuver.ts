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
    attributedInstructionVariants: [
      {
        text: 'Straight',
        images: [
          { image: { name: 'music_note', color: 'blue' }, position: 'Straight'.length },
          { image: { name: 'music_note', color: 'red' }, position: 0 },
          { image: { name: 'music_note', color: 'green' }, position: 4 },
        ],
      },
    ],
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
      instructionVariants: ['Take second lane'],
      lanes: [
        { angles: [-90], image: { name: 'turn_left', color: 'grey' } },
        {
          highlightedAngle: 0,
          angles: [],
          isPreferred: true,
          image: { name: 'straight', color: 'white' },
        },
        {
          highlightedAngle: 0,
          angles: [90],
          isPreferred: false,
          image: { name: 'fork_right', color: 'gray' },
        },
        { angles: [90], image: { name: 'turn_right', color: 'gray' } },
        { angles: [90], image: { name: 'turn_right', color: 'gray' } },
      ],
    },
    cardBackgroundColor: 'black',
  },
  {
    id: uuid.v4(),
    attributedInstructionVariants: [{ text: 'Left' }],
    travelEstimates: {
      distanceRemaining: { unit: 'kilometers', value: 2 },
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
    linkedLaneGuidance: {
      instructionVariants: ['Take first lane'],
      lanes: [
        {
          highlightedAngle: -90,
          angles: [],
          isPreferred: true,
          image: { name: 'turn_left', color: 'white' },
        },
        { angles: [0], image: { name: 'straight', color: 'gray' } },
        { angles: [90], image: { name: 'fork_right', color: 'gray' } },
      ],
    },
    cardBackgroundColor: 'black',
  },
  {
    id: uuid.v4(),
    attributedInstructionVariants: [{ text: 'Right' }],
    travelEstimates: {
      distanceRemaining: { unit: 'kilometers', value: 2 },
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
    cardBackgroundColor: 'black',
  },
  {
    id: uuid.v4(),
    attributedInstructionVariants: [{ text: 'Arrived' }],
    travelEstimates: {
      distanceRemaining: { unit: 'kilometers', value: 2 },
      timeRemaining: { seconds: 20, timezone: 'Europe/Berlin' },
    },
    symbolImage: {
      name: 'tour',
    },
    maneuverType: ManeuverType.Arrive,
    trafficSide: TrafficSide.Left,
    roadName: ['Destination St.'],
    cardBackgroundColor: 'black',
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
      const { unit, value } = maneuvers[0].travelEstimates.distanceRemaining;
      if (unit === 'kilometers') {
        if (value > 1.0) {
          maneuvers[0].travelEstimates.distanceRemaining.value = (value * 10 - 1) / 10;
        } else {
          maneuvers[0].travelEstimates.distanceRemaining.unit = 'meters';
          maneuvers[0].travelEstimates.distanceRemaining.value = value * 1000 - 100;
        }
      } else {
        maneuvers[0].travelEstimates.distanceRemaining.value -= 100;
      }
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
