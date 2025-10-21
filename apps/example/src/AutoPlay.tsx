import {
  HybridAutoPlay,
  MapTemplate,
  type RootComponentInitialProps,
  SafeAreaView,
  useMapTemplate,
} from '@g4rb4g3/react-native-autoplay';
import type { UnsubscribeListener } from '@reduxjs/toolkit';
import { useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';
import { AutoTrip } from './config/AutoTrip';
import {
  actionStartNavigation,
  actionStopNavigation,
  setSelectedTrip,
} from './state/navigationSlice';
import { startAppListening } from './state/store';
import {
  AutoTemplate,
  estimatesUpdate,
  onTripFinished,
  onTripStarted,
} from './templates/AutoTemplate';

const AutoPlayRoot = (props: RootComponentInitialProps) => {
  const mapTemplate = useMapTemplate();

  const [i, setI] = useState(0);

  useEffect(() => {
    mapTemplate?.showAlert({
      durationMs: 10 * 1000,
      id: 1,
      primaryAction: {
        title: 'Yeah!',
        onPress: () => {
          console.log('yeah useMapTemplate rules');
        },
      },
      title: {
        text: 'useMapTemplate rules \\o/',
      },
    });

    const timer = setInterval(() => setI((p) => p + 1), 1000);

    return () => clearInterval(timer);
  }, [mapTemplate?.showAlert]);

  useEffect(() => {
    const listeners: Array<UnsubscribeListener> = [];

    listeners.push(
      startAppListening({
        actionCreator: actionStartNavigation,
        effect: (action, { dispatch }) => {
          if (mapTemplate == null) {
            return;
          }

          const { tripId, routeId } = action.payload;

          const trip = AutoTrip.find((t) => t.id === tripId);
          const routeChoice = trip?.routeChoices.find((r) => r.id === routeId);

          if (routeChoice == null) {
            console.error('invalid tripId or routeId specified');
            return;
          }

          dispatch(setSelectedTrip({ routeId, tripId }));
          onTripStarted(tripId, routeId, mapTemplate);
          mapTemplate.startNavigation({ id: tripId, routeChoice });
          estimatesUpdate(mapTemplate, 'initial');
        },
      })
    );

    listeners.push(
      startAppListening({
        actionCreator: actionStopNavigation,
        effect: () => {
          if (mapTemplate == null) {
            return;
          }
          onTripFinished(mapTemplate);
        },
      })
    );

    return () => {
      listeners.forEach((remove) => remove());
    };
  }, [mapTemplate]);

  return (
    <SafeAreaView
      style={{
        backgroundColor: 'green',
      }}
    >
      <Text>
        Hello Nitro {Platform.OS} {i}
      </Text>
      <Text>{JSON.stringify(props.window)}</Text>
      <Text>Running as {props.id}</Text>
    </SafeAreaView>
  );
};

const registerRunnable = () => {
  const onConnect = () => {
    const rootTemplate = new MapTemplate({
      component: AutoPlayRoot,
      id: 'AutoPlayRoot',
      visibleTravelEstimate: 'first',
      onWillAppear: () => console.log('AutoPlayRoot onWillAppear'),
      onDidAppear: () => console.log('AutoPlayRoot onDidAppear'),
      onWillDisappear: () => console.log('AutoPlayRoot onWillDisappear'),
      onDidDisappear: () => console.log('AutoPlayRoot onDidDisappear'),
      onDidUpdatePanGestureWithTranslation: ({ x, y }) => {
        console.log('*** onDidUpdatePanGestureWithTranslation', x, y);
      },
      onDidUpdateZoomGestureWithCenter: ({ x, y }, scale) => {
        console.log('*** onDidUpdateZoomGestureWithCenter', x, y, scale);
      },
      onClick: ({ x, y }) => console.log('*** onClick', x, y),
      onDoubleClick: ({ x, y }) => console.log('*** onDoubleClick', x, y),
      onAppearanceDidChange: (colorScheme) => console.log('*** onAppearanceDidChange', colorScheme),
      headerActions: AutoTemplate.mapHeaderActions,
      mapButtons: AutoTemplate.mapButtons,
    });
    rootTemplate.setRootTemplate();
  };

  const onDisconnect = () => {
    // template.destroy();
  };

  HybridAutoPlay.addListener('didConnect', onConnect);
  HybridAutoPlay.addListener('didDisconnect', onDisconnect);
};

export default registerRunnable;
