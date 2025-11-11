import {
  ManeuverType,
  type MapTemplate,
  type MessageManeuver,
  type RoutingManeuver,
  TrafficSide,
  TurnType,
} from '@g4rb4g3/react-native-autoplay';
import type { ThemedColor } from '@g4rb4g3/react-native-autoplay/lib/utils/NitroColor';
import uuid from 'react-native-uuid';
import { updateTripEstimates } from '../templates/AutoTemplate';

const cardBackgroundColor: ThemedColor = {
  darkColor: 'rgba(0, 0, 159, 1)',
  lightColor: 'rgba(173, 232, 255, 1)',
};

const getManeuvers = (): Array<RoutingManeuver> => [
  {
    id: uuid.v4(),
    type: 'routing',
    attributedInstructionVariants: [
      {
        text: 'Straight',
        images: [
          {
            image: { name: 'music_note', color: 'blue', type: 'glyph' },
            position: 'Straight'.length,
          },
          { image: { name: 'music_note', color: 'red', type: 'glyph' }, position: 0 },
          { image: { name: 'music_note', color: 'green', type: 'glyph' }, position: 4 },
        ],
      },
    ],
    travelEstimates: {
      distanceRemaining: { unit: 'meters', value: 1000 },
      timeRemaining: { seconds: 10, timezone: 'Europe/Berlin' },
    },
    symbolImage: {
      image: require('../../assets/heart.png'),
      color: { darkColor: 'white', lightColor: 'black' },
      type: 'asset',
    },
    maneuverType: ManeuverType.Straight,
    trafficSide: TrafficSide.Left,
    roadName: ['Main St.'],
    linkedLaneGuidance: {
      instructionVariants: ['Take second lane'],
      lanes: [
        { angles: [-90], image: { name: 'turn_left', color: 'grey', type: 'glyph' } },
        {
          highlightedAngle: 0,
          angles: [],
          isPreferred: true,
          image: { name: 'straight', type: 'glyph' },
        },
        {
          highlightedAngle: 0,
          angles: [90],
          isPreferred: false,
          image: { name: 'fork_right', color: 'gray', type: 'glyph' },
        },
        { angles: [90], image: { name: 'turn_right', color: 'gray', type: 'glyph' } },
        { angles: [90], image: { name: 'turn_right', color: 'gray', type: 'glyph' } },
      ],
    },
    cardBackgroundColor,
  },
  {
    id: uuid.v4(),
    type: 'routing',
    attributedInstructionVariants: [{ text: 'Left' }],
    travelEstimates: {
      distanceRemaining: { unit: 'kilometers', value: 2 },
      timeRemaining: { seconds: 20, timezone: 'Europe/Berlin' },
    },
    symbolImage: {
      image: require('../../assets/flower.png'),
      type: 'asset',
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
          image: { name: 'turn_left', type: 'glyph' },
        },
        { angles: [0], image: { name: 'straight', color: 'gray', type: 'glyph' } },
        { angles: [90], image: { name: 'fork_right', color: 'gray', type: 'glyph' } },
      ],
    },
    cardBackgroundColor,
  },
  {
    id: uuid.v4(),
    type: 'routing',
    attributedInstructionVariants: [{ text: 'Right' }],
    travelEstimates: {
      distanceRemaining: { unit: 'kilometers', value: 2 },
      timeRemaining: { seconds: 20, timezone: 'Europe/Berlin' },
    },
    symbolImage: {
      image: require('../../assets/heart.png'),
      color: 'red',
      type: 'asset',
    },
    maneuverType: ManeuverType.Turn,
    roadName: ['2nd St.'],
    trafficSide: TrafficSide.Left,
    turnType: TurnType.NormalRight,
    angle: 90,
    cardBackgroundColor,
  },
  {
    id: uuid.v4(),
    type: 'routing',
    attributedInstructionVariants: [{ text: 'Arrived' }],
    travelEstimates: {
      distanceRemaining: { unit: 'kilometers', value: 2 },
      timeRemaining: { seconds: 20, timezone: 'Europe/Berlin' },
    },
    symbolImage: {
      name: 'tour',
      type: 'glyph',
    },
    maneuverType: ManeuverType.Arrive,
    trafficSide: TrafficSide.Left,
    roadName: ['Destination St.'],
    cardBackgroundColor,
  },
];

let interval: ReturnType<typeof setInterval> | null = null;

const playManeuvers = (template: MapTemplate, isInitialCall = true) => {
  if (isInitialCall) {
    const message: MessageManeuver = {
      cardBackgroundColor: 'pink',
      title: 'Get ready...',
      type: 'message',
      image: {
        type: 'glyph',
        name: 'party_mode',
      },
      text: "Let's get started!",
    };

    template.updateManeuvers(message);

    setTimeout(() => playManeuvers(template, false), 1000);
    return;
  }

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

      const message: MessageManeuver = {
        cardBackgroundColor: 'pink',
        title: 'Congrats',
        type: 'message',
        image: {
          type: 'glyph',
          name: 'party_mode',
        },
        text: 'You have arrived!',
      };

      template.updateManeuvers(message);
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
