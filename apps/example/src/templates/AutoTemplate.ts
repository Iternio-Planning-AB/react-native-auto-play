import {
  type Alert,
  type BackButton,
  CarPlayDashboard,
  type HeaderActions,
  HybridAutoPlay,
  type ImageButton,
  type MapTemplate,
  type MapTemplateConfig,
  TextPlaceholders,
  type TripPoint,
  type VisibleTravelEstimate,
} from '@g4rb4g3/react-native-autoplay';
import { Platform } from 'react-native';
import { AutoManeuverUtil } from '../config/AutoManeuver';
import { AutoTrip, TextConfig } from '../config/AutoTrip';
import {
  actionStartNavigation,
  actionStopNavigation,
  setIsNavigating,
  setSelectedTrip,
} from '../state/navigationSlice';
import { dispatch } from '../state/store';
import { AutoGridTemplate } from './AutoGridTemplate';
import { AutoListTemplate } from './AutoListTemplate';
import { AutoMessageTemplate } from './AutoMessageTemplate';
import { AutoSearchTemplate } from './AutoSearchTemplate';

const backButton: BackButton = {
  type: 'back',
  onPress: () => HybridAutoPlay.popTemplate(),
};

const headerActions: HeaderActions<unknown> = {
  android: {
    startHeaderAction: backButton,
    endHeaderActions: [
      {
        type: 'textImage',
        image: { name: 'help' },
        title: 'help',
        onPress: () => {
          console.log('*** help \\o/');
          AutoMessageTemplate.getTemplate({
            message: {
              text: `help \\o/ ${TextPlaceholders.Duration}`,
              duration: 4711,
            },
          }).push();
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
          AutoMessageTemplate.getTemplate({
            message: {
              text: `help \\o/ ${TextPlaceholders.Duration}`,
              duration: 4711,
            },
          }).push();
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
  template.setHeaderActions(mapHeaderActions);

  AutoManeuverUtil.stopManeuvers();

  if (Platform.OS === 'ios') {
    CarPlayDashboard.setButtons([
      {
        image: { name: 'play_circle' },
        titleVariants: ['Start navigation'],
        subtitleVariants: [],
        onPress: () => {
          dispatch(
            actionStartNavigation({
              tripId: AutoTrip[0].id,
              routeId: AutoTrip[0].routeChoices[0].id,
            })
          );
        },
      },
    ]);
  }

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
    updateTripEstimates(template, 'add');
  },
  type: 'image',
};

const minusOne: ImageButton<MapTemplate> = {
  image: {
    name: 'remove',
  },
  onPress: (template) => {
    updateTripEstimates(template, 'remove');
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

export const updateTripEstimates = (template: MapTemplate, type: 'initial' | 'add' | 'remove') => {
  const value = type === 'initial' ? 0 : type === 'add' ? 1 : -1;

  steps = steps.map((s) => ({
    ...s,
    travelEstimates: {
      ...s.travelEstimates,
      distanceRemaining: {
        ...s.travelEstimates.distanceRemaining,
        value: s.travelEstimates.distanceRemaining.value + value * 0.1,
      },
      timeRemaining: {
        ...s.travelEstimates.timeRemaining,
        seconds: s.travelEstimates.timeRemaining.seconds + value,
      },
    },
  }));

  template.updateTravelEstimates(steps);
};

export const onTripStarted = (tripId: string, routeId: string, template: MapTemplate) => {
  dispatch(setIsNavigating(true));

  template.setHeaderActions({
    android: [stopNavigation, toggleEta, plusOne, minusOne],
    ios: {
      leadingNavigationBarButtons: [toggleEta, stopNavigation],
      trailingNavigationBarButtons: [plusOne, minusOne],
    },
  });

  if (Platform.OS === 'ios') {
    template.setMapButtons(mapButtons);

    CarPlayDashboard.setButtons([
      {
        image: { name: 'stop_circle' },
        titleVariants: ['Stop navigation'],
        subtitleVariants: [],
        onPress: () => {
          dispatch(actionStopNavigation());
        },
      },
    ]);
  }

  console.log(`started trip ${tripId} using route ${routeId}`);

  steps =
    AutoTrip.find((t) => t.id === tripId)
      ?.routeChoices.find((r) => r.id === routeId)
      ?.steps.slice(1) ?? [];

  AutoManeuverUtil.playManeuvers(template);
};

const mapButtonHandler: (template: MapTemplate) => void = (template) => {
  if (Platform.OS === 'ios') {
    template.setHeaderActions({
      ios: {
        backButton: {
          type: 'back',
          onPress: () => {
            template.setHeaderActions(mapHeaderActions);
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

const mapHeaderActions: MapTemplateConfig['headerActions'] = {
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
      darkColor: 'rgba(255, 0, 0, 1)',
      lightColor: 'rgba(0, 255, 0, 1)',
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
  {
    type: 'custom',
    image: {
      name: 'map',
      darkColor: 'rgba(255, 0, 0, 1)',
      lightColor: 'rgba(0, 255, 0, 1)',
      backgroundColor: 'rgba(66, 66, 66, 0.5)',
    },
    onPress: () => {
      AutoMessageTemplate.getTemplate({
        message: { text: 'message' },
        mapConfig: {
          mapButtons: [
            {
              type: 'custom',
              image: { name: 'list' },
              onPress: () => {
                AutoListTemplate.getTemplate({ mapConfig: {} }).push();
              },
            },
            {
              type: 'custom',
              image: { name: 'grid_3x3' },
              onPress: () => {
                AutoGridTemplate.getTemplate({ mapConfig: {} }).push();
              },
            },
            { type: 'custom', image: { name: 'inbox' }, onPress: () => {} },
            { type: 'custom', image: { name: 'assignment_late' }, onPress: () => {} },
          ],
          headerActions: {
            // ios does not support map with template, so no need to specify headers for ios here
            android: [
              { type: 'image', image: { name: 'battery_vert_050' }, onPress: () => {} },
              { type: 'image', image: { name: 'barcode_reader' }, onPress: () => {} },
              { type: 'image', image: { name: 'article_shortcut' }, onPress: () => {} },
              { type: 'image', image: { name: 'directions_run' }, onPress: () => {} },
            ],
          },
        },
      }).push();
    },
  },
  {
    type: 'custom',
    image: {
      name: 'search',
      darkColor: 'rgba(255, 0, 0, 1)',
      lightColor: 'rgba(0, 255, 0, 1)',
      backgroundColor: 'rgba(66, 66, 66, 0.5)',
    },
    onPress: () => {
      let timeout: number;
      const template = AutoSearchTemplate.getTemplate({
        searchHint: 'search hint',
        onSearchTextChanged: (searchText) => {
          // simple debouncing to not send too many requests to backend
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            template.updateSearchResults(
              searchText
                ? {
                    items: [
                      {
                        title: { text: searchText },
                        detailedText: { text: 'onSearchTextChanged' },
                        type: 'default',
                        onPress: () => {
                          console.log('*** onPress', searchText);
                          HybridAutoPlay.popToRootTemplate(true).catch((error) => {
                            console.error('*** error', error);
                          });
                        },
                        image: {
                          name: 'ev_charger',
                          lightColor: 'red',
                          darkColor: 'orange',
                        },
                      },
                    ],
                    type: 'default',
                  }
                : undefined
            );
          }, 1000);
        },
        onSearchTextSubmitted: (searchText) => {
          clearTimeout(timeout);
          template.updateSearchResults(
            searchText
              ? {
                  items: [
                    {
                      title: { text: searchText },
                      detailedText: { text: 'onSearchTextSubmitted' },
                      type: 'default',
                      onPress: () => {
                        console.log('*** onPress', searchText);
                        HybridAutoPlay.popToRootTemplate(true);
                      },
                      image: {
                        name: 'ev_charger',
                        lightColor: 'blue',
                        darkColor: 'green',
                      },
                    },
                  ],
                  type: 'default',
                }
              : undefined
          );
        },
      });

      template.push();
    },
  },
];

export const AutoTemplate = { headerActions, mapHeaderActions, mapButtons };
