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
} from '@iternio/react-native-auto-play';
import { Platform } from 'react-native';
import { AutoManeuverUtil } from '../config/AutoManeuver';
import { AutoTrip, TextConfig } from '../config/AutoTrip';
import { getCarPlayDashboardButtons } from '../config/CarPlayDashboardButtons';
import { actionStopNavigation, setIsNavigating, setSelectedTrip } from '../state/navigationSlice';
import { dispatch } from '../state/store';
import { AutoGridTemplate } from './AutoGridTemplate';
import { AutoInformationTemplate } from './AutoInformationTemplate';
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
        image: { name: 'help', type: 'glyph' },
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
        image: { name: 'close', type: 'glyph' },
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
        image: { name: 'close', type: 'glyph' },
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
    CarPlayDashboard.setButtons(getCarPlayDashboardButtons(dispatch));
  }

  dispatch(setIsNavigating(false));
};

const stopNavigation: ImageButton<MapTemplate> = {
  image: {
    name: 'close',
    type: 'glyph',
  },
  onPress: onTripFinished,
  type: 'image',
};

const plusOne: ImageButton<MapTemplate> = {
  image: {
    name: 'add',
    type: 'glyph',
  },
  onPress: (template) => {
    updateTripEstimates(template, 'add');
  },
  type: 'image',
};

const minusOne: ImageButton<MapTemplate> = {
  image: {
    name: 'remove',
    type: 'glyph',
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
    type: 'glyph',
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
        image: { name: 'stop_circle', type: 'glyph' },
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
  const onTripSelected = (tripId: string, routeId: string) => {
    console.log(`selected trip ${tripId} using route ${routeId}`);
    dispatch(setSelectedTrip({ routeId, tripId }));
  };

  const tripSelector = template.showTripSelector({
    trips: AutoTrip,
    textConfig: TextConfig,
    onTripSelected,
    onTripStarted: (tripId, routeId) => {
      onTripStarted(tripId, routeId, template);
    },
    onBackPressed: () => {
      console.log('trip selector back pressed');
    },
    mapButtons: [
      {
        image: { name: 'car_crash', type: 'glyph' },
        type: 'custom',
        onPress: () => {
          console.log('oh no you just crashed your car...');
        },
      },
      {
        image: { name: 'plus_one', type: 'glyph' },
        type: 'custom',
        onPress: () => {
          tripSelector.setSelectedTrip(AutoTrip[1].id);
        },
      },
    ],
  });
};

const mapHeaderActions: MapTemplateConfig['headerActions'] = {
  android: [
    {
      type: 'image',
      image: { name: 'grid_3x3', type: 'glyph' },
      onPress: (t) => {
        console.log('***', t.id);
        AutoGridTemplate.getTemplate().push();
      },
    },
    {
      type: 'image',
      image: {
        name: 'list',
        type: 'glyph',
      },
      onPress: () => AutoListTemplate.getTemplate().push(),
    },
    {
      type: 'image',
      image: {
        name: 'flag_check',
        type: 'glyph',
      },
      onPress: mapButtonHandler,
    },
    {
      type: 'image',
      image: {
        name: 'list_alt',
        type: 'glyph',
      },
      onPress: () => AutoInformationTemplate.getTemplate().push(),
    },
  ],
  ios: {
    leadingNavigationBarButtons: [
      {
        type: 'image',
        image: {
          name: 'list',
          type: 'glyph',
        },
        onPress: () => AutoListTemplate.getTemplate().push(),
      },
      {
        type: 'image',
        image: { name: 'grid_3x3', type: 'glyph' },
        onPress: () => AutoGridTemplate.getTemplate().push(),
      },
    ],
    trailingNavigationBarButtons: [
      {
        type: 'image',
        image: {
          name: 'flag_check',
          type: 'glyph',
        },
        onPress: mapButtonHandler,
      },
      {
        type: 'image',
        image: {
          name: 'list_alt',
          type: 'glyph',
        },
        onPress: () => AutoInformationTemplate.getTemplate().push(),
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
    type: 'glyph',
    color: Platform.OS === 'android' ? 'white' : { darkColor: 'white', lightColor: 'white' },
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
  priority: 'medium',
});

const mapButtons: MapTemplateConfig['mapButtons'] = [
  {
    type: 'custom',
    image: {
      name: 'ev_station',
      color: { darkColor: 'rgba(255, 0, 0, 1)', lightColor: 'rgba(0, 255, 0, 1)' },
      backgroundColor: 'rgba(66, 66, 66, 0.5)',
      type: 'glyph',
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
      color: { darkColor: 'rgba(255, 0, 0, 1)', lightColor: 'rgba(0, 255, 0, 1)' },
      backgroundColor: 'rgba(66, 66, 66, 0.5)',
      type: 'glyph',
    },
    onPress: () => {
      AutoMessageTemplate.getTemplate({
        message: { text: 'message' },
        mapConfig: {
          mapButtons: [
            {
              type: 'custom',
              image: { name: 'list', type: 'glyph' },
              onPress: () => {
                AutoListTemplate.getTemplate({ mapConfig: {} }).push();
              },
            },
            {
              type: 'custom',
              image: { name: 'grid_3x3', type: 'glyph' },
              onPress: () => {
                AutoGridTemplate.getTemplate({ mapConfig: {} }).push();
              },
            },
            {
              type: 'custom',
              image: { name: 'list_alt', type: 'glyph' },
              onPress: () => {
                AutoInformationTemplate.getTemplate({ mapConfig: {} }).push();
              },
            },
            {
              type: 'custom',
              image: { name: 'assignment_late', type: 'glyph' },
              onPress: () => {},
            },
          ],
          headerActions: {
            // ios does not support map with template, so no need to specify headers for ios here
            android: [
              {
                type: 'image',
                image: { name: 'battery_vert_050', type: 'glyph' },
                onPress: () => {},
              },
              {
                type: 'image',
                image: { name: 'barcode_reader', type: 'glyph' },
                onPress: () => {},
              },
              {
                type: 'image',
                image: { name: 'article_shortcut', type: 'glyph' },
                onPress: () => {},
              },
              {
                type: 'image',
                image: { name: 'directions_run', type: 'glyph' },
                onPress: () => {},
              },
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
      color: { darkColor: 'rgba(255, 0, 0, 1)', lightColor: 'rgba(0, 255, 0, 1)' },
      backgroundColor: 'rgba(66, 66, 66, 0.5)',
      type: 'glyph',
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
                          color: { lightColor: 'red', darkColor: 'orange' },
                          type: 'glyph',
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
                        color: { lightColor: 'blue', darkColor: 'green' },
                        type: 'glyph',
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
