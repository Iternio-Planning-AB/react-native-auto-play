import {
  type Actions,
  type Alert,
  AutoPlay,
  type BackButton,
  type MapTemplate,
  type MapTemplateConfig,
} from '@g4rb4g3/react-native-autoplay';
import { Platform } from 'react-native';
import { AutoTrip, TextConfig } from '../config/AutoTrip';
import { AutoGridTemplate } from './AutoGridTemplate';
import { AutoListTemplate } from './AutoListTemplate';

// biome-ignore lint/suspicious/noExplicitAny: this is used across different typed templates
const backButton: BackButton<any> = {
  type: 'back',
  onPress: () => AutoPlay.popTemplate(),
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
          AutoPlay.popToRootTemplate();
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
          AutoPlay.popToRootTemplate();
        },
      },
    ],
  },
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
  };

  const onTripStarted = (tripId: string, routeId: string) => {
    if (Platform.OS === 'ios') {
      template.setActions(mapActions);
      template.setMapButtons(mapButtons);
    }
    console.log(`started trip ${tripId} using route ${routeId}`);
  };

  template.showTripSelector(AutoTrip, null, TextConfig, onTripSelected, onTripStarted);
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
        image: { name: 'grid_3x3' },
        onPress: () => AutoGridTemplate.getTemplate().push(),
      },
      {
        type: 'image',
        image: {
          name: 'list',
        },
        onPress: () => AutoListTemplate.getTemplate().push(),
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
