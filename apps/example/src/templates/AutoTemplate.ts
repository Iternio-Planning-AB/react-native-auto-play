import {
  type Actions,
  type Alert,
  type AutoManeuvers,
  type BackButton,
  HybridAutoPlay,
  type ImageButton,
  ManeuverType,
  type MapTemplate,
  type MapTemplateConfig,
  TrafficSide,
  type TripPoint,
  TurnType,
  type VisibleTravelEstimate,
} from '@g4rb4g3/react-native-autoplay';
import { Platform } from 'react-native';
import { AutoTrip, TextConfig } from '../config/AutoTrip';
import { setIsNavigating, setSelectedTrip } from '../state/navigationSlice';
import { dispatch } from '../state/store';
import { AutoGridTemplate } from './AutoGridTemplate';
import { AutoListTemplate } from './AutoListTemplate';

// biome-ignore lint/suspicious/noExplicitAny: this is used across different typed templates
const backButton: BackButton<any> = {
  type: 'back',
  onPress: () => HybridAutoPlay.popTemplate(),
};

// biome-ignore lint/suspicious/noExplicitAny: this is used across different typed templates
const actions: Actions<any> = {
  android: {
    startHeaderAction: backButton,
    endHeaderActions: [
      {
        type: 'textImage',
        image: { name: 'help' },
        title: 'help',
        onPress: () => {
          console.log('*** help \\o/');
        },
      },
      {
        type: 'image',
        image: { name: 'close' },
        onPress: () => {
          HybridAutoPlay.popToRootTemplate();
        },
      },
    ],
  },
  ios: {
    backButton,
    trailingNavigationBarButtons: [
      {
        type: 'text',
        title: 'help',
        onPress: () => {
          console.log('*** help \\o/');
        },
      },
      {
        type: 'image',
        image: { name: 'close' },
        onPress: () => {
          HybridAutoPlay.popToRootTemplate();
        },
      },
    ],
  },
};

export const onTripFinished = (template: MapTemplate) => {
  template.stopNavigation();
  template.setActions(mapActions);

  dispatch(setIsNavigating(false));
};

const stopNavigation: ImageButton<MapTemplate> = {
  image: {
    name: 'close',
  },
  onPress: onTripFinished,
  type: 'image',
};

const plusOne: ImageButton<MapTemplate> = {
  image: {
    name: 'add',
  },
  onPress: (template) => {
    estimatesUpdate(template, 'add');
    const maneuvers: AutoManeuvers = [
      {
        id: '#0',
        attributedInstructionVariants: [{ text: 'Straight' }],
        travelEstimates: {
          distanceRemaining: { unit: 'meters', value: 500 },
          timeRemaining: { seconds: 20, timezone: 'Europe/Berlin' },
        },
        symbolImage: {
          name: 'straight',
        },
        maneuverType: ManeuverType.Straight,
        trafficSide: TrafficSide.Left,
        roadName: ['Main St.'],
      },
      {
        id: '#1',
        attributedInstructionVariants: [{ text: 'Left' }],
        travelEstimates: {
          distanceRemaining: { unit: 'meters', value: 1500 },
          timeRemaining: { seconds: 40, timezone: 'Europe/Berlin' },
        },
        symbolImage: {
          name: 'turn_left',
        },
        maneuverType: ManeuverType.Turn,
        trafficSide: TrafficSide.Left,
        turnType: TurnType.NormalLeft,
        angle: 90,
      },
    ];

    template.updateManeuvers(maneuvers);
  },
  type: 'image',
};

const minusOne: ImageButton<MapTemplate> = {
  image: {
    name: 'remove',
  },
  onPress: (template) => {
    estimatesUpdate(template, 'remove');
    const maneuvers: AutoManeuvers = [
      {
        id: '#3',
        attributedInstructionVariants: [{ text: 'Right' }],
        travelEstimates: {
          distanceRemaining: { unit: 'meters', value: 500 },
          timeRemaining: { seconds: 20, timezone: 'Europe/Berlin' },
        },
        symbolImage: {
          name: 'turn_right',
        },
        maneuverType: ManeuverType.Turn,
        trafficSide: TrafficSide.Left,
        turnType: TurnType.NormalLeft,
      },
      {
        id: '#4',
        attributedInstructionVariants: [{ text: '2nd exit' }],
        travelEstimates: {
          distanceRemaining: { unit: 'meters', value: 1500 },
          timeRemaining: { seconds: 40, timezone: 'Europe/Berlin' },
        },
        symbolImage: {
          name: 'roundabout_right',
        },
        maneuverType: ManeuverType.Roundabout,
        trafficSide: TrafficSide.Left,
        angle: 42,
        elementAngles: [100, 200],
        exitNumber: 1,
      },
    ];

    template.updateManeuvers(maneuvers);
  },
  type: 'image',
};

let visibleTravelEstimate: VisibleTravelEstimate = 'first';

const toggleEta: ImageButton<MapTemplate> = {
  image: {
    name: 'refresh',
  },
  onPress: (template) => {
    visibleTravelEstimate = visibleTravelEstimate === 'first' ? 'last' : 'first';
    template.updateVisibleTravelEstimate(visibleTravelEstimate);
  },
  type: 'image',
};

let steps: Array<TripPoint> = [];

export const estimatesUpdate = (template: MapTemplate, type: 'initial' | 'add' | 'remove') => {
  const value = type === 'initial' ? 0 : type === 'add' ? 1 : -1;

  steps = steps.map((s) => ({
    ...s,
    travelEstimates: {
      ...s.travelEstimates,
      distanceRemaining: {
        ...s.travelEstimates.distanceRemaining,
        value: s.travelEstimates.distanceRemaining.value + value,
      },
      timeRemaining: {
        ...s.travelEstimates.timeRemaining,
        seconds: s.travelEstimates.timeRemaining.seconds + value * 60,
      },
    },
  }));

  template.updateTravelEstimates(steps);
};

export const onTripStarted = (tripId: string, routeId: string, template: MapTemplate) => {
  dispatch(setIsNavigating(true));

  template.setActions({
    android: [stopNavigation, toggleEta, plusOne, minusOne],
    ios: {
      leadingNavigationBarButtons: [toggleEta, stopNavigation],
      trailingNavigationBarButtons: [plusOne, minusOne],
    },
  });

  if (Platform.OS === 'ios') {
    template.setMapButtons(mapButtons);
  }

  console.log(`started trip ${tripId} using route ${routeId}`);

  steps =
    AutoTrip.find((t) => t.id === tripId)
      ?.routeChoices.find((r) => r.id === routeId)
      ?.steps.slice(1) ?? [];
};

const mapButtonHandler: (template: MapTemplate) => void = (template) => {
  if (Platform.OS === 'ios') {
    template.setActions({
      ios: {
        backButton: {
          type: 'back',
          onPress: () => {
            template.setActions(mapActions);
            template.setMapButtons(mapButtons);
            template.hideTripSelector();
          },
        },
      },
    });
    template.setMapButtons([]);
  }

  const onTripSelected = (tripId: string, routeId: string) => {
    console.log(`selected trip ${tripId} using route ${routeId}`);
    dispatch(setSelectedTrip({ routeId, tripId }));
  };

  template.showTripSelector(AutoTrip, null, TextConfig, onTripSelected, (tripId, routeId) =>
    onTripStarted(tripId, routeId, template)
  );
};

const mapActions: MapTemplateConfig['actions'] = {
  android: [
    {
      type: 'image',
      image: { name: 'grid_3x3' },
      onPress: (t) => {
        console.log('***', t.id);
        AutoGridTemplate.getTemplate().push();
      },
    },
    {
      type: 'image',
      image: {
        name: 'list',
      },
      onPress: () => AutoListTemplate.getTemplate().push(),
    },
    {
      type: 'image',
      image: {
        name: 'flag_check',
      },
      onPress: mapButtonHandler,
    },
  ],
  ios: {
    leadingNavigationBarButtons: [
      {
        type: 'image',
        image: {
          name: 'list',
        },
        onPress: () => AutoListTemplate.getTemplate().push(),
      },
      {
        type: 'image',
        image: { name: 'grid_3x3' },
        onPress: () => AutoGridTemplate.getTemplate().push(),
      },
    ],
    trailingNavigationBarButtons: [
      {
        type: 'image',
        image: {
          name: 'flag_check',
        },
        onPress: mapButtonHandler,
      },
    ],
  },
};

let alertTimer: ReturnType<typeof setInterval> | null = null;

const AutoAlert = (remaining: number): Alert => ({
  durationMs: 10000,
  id: 1,
  title: {
    text: `alert ${remaining}ms`,
  },
  subtitle: {
    text: 'danger',
  },
  image: {
    name: 'alarm',
  },
  primaryAction: {
    title: 'keep calm',
    onPress: () => {
      console.log('keep calm');
      if (alertTimer != null) {
        clearInterval(alertTimer);
      }
    },
    style: 'default',
  },
  secondaryAction: {
    title: 'run',
    onPress: () => {
      console.log('run');
      if (alertTimer != null) {
        clearInterval(alertTimer);
      }
    },
    style: 'destructive',
  },
  onWillShow: () => console.log('alarm alert showing....'),
  onDidDismiss: (reason) => console.log('alarm alert dismissed', reason),
});

const mapButtons: MapTemplateConfig['mapButtons'] = [
  {
    type: 'custom',
    image: {
      name: 'ev_station',
      color: 'rgba(255, 255, 255, 1)',
      backgroundColor: 'rgba(66, 66, 66, 0.5)',
    },
    onPress: (template) => {
      var remaining = 10000;
      alertTimer = setInterval(() => {
        remaining -= 1000;
        if (remaining > 0) {
          template.showAlert(AutoAlert(remaining));
          return;
        }
        if (alertTimer != null) {
          clearInterval(alertTimer);
        }
      }, 1000);
      template.showAlert(AutoAlert(remaining));
    },
  },
];

export const AutoTemplate = { actions, mapActions, mapButtons };
