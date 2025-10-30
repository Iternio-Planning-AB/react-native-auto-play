import {
  AutoPlayCluster,
  CarPlayDashboard,
  HybridAutoPlay,
  MapTemplate,
  type RootComponentInitialProps,
  SafeAreaView,
  useMapTemplate,
} from '@g4rb4g3/react-native-autoplay';
import type { UnsubscribeListener } from '@reduxjs/toolkit';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { Cluster } from './AutoPlayCluster';
import { AutoPlayDashboard } from './AutoPlayDashboard';
import { AutoManeuverUtil } from './config/AutoManeuver';
import { AutoTrip } from './config/AutoTrip';
import {
  actionStartNavigation,
  actionStopNavigation,
  setSelectedTrip,
} from './state/navigationSlice';
import { startAppListening } from './state/store';
import { TelemetryView } from './TelemetryView';
import {
  AutoTemplate,
  onTripFinished,
  onTripStarted,
  updateTripEstimates,
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
          mapTemplate.startNavigation({ id: tripId, routeChoice });
          onTripStarted(tripId, routeId, mapTemplate);
          updateTripEstimates(mapTemplate, 'initial');
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
        backgroundColor: 'red',
      }}
    >
      <View style={{ flex: 1, backgroundColor: 'green' }}>
        <Text>
          Hello Nitro {Platform.OS} {i}
        </Text>
        <Text>{JSON.stringify(props.window)}</Text>
        <Text>Running as {props.id}</Text>
        {Platform.OS === 'android' ? <TelemetryView /> : null}
      </View>
    </SafeAreaView>
  );
};

const registerRunnable = () => {
  const onConnect = () => {
    const rootTemplate = new MapTemplate({
      component: AutoPlayRoot,
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
    AutoManeuverUtil.stopManeuvers();
  };

  if (Platform.OS === 'ios') {
    CarPlayDashboard.setComponent(AutoPlayDashboard);
  }
  AutoPlayCluster.setComponent(Cluster);
  AutoPlayCluster.setAttributedInactiveDescriptionVariants([
    { text: 'Example', images: [{ image: { name: 'bolt' }, position: 0 }] },
  ]);

  HybridAutoPlay.addListener('didConnect', onConnect);
  HybridAutoPlay.addListener('didDisconnect', onDisconnect);
};

export default registerRunnable;
