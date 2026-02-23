import {
  AutoPlayCluster,
  CarPlayDashboard,
  HybridAutoPlay,
  MapTemplate,
  type RootComponentInitialProps,
  SafeAreaView,
  useMapTemplate,
} from '@iternio/react-native-auto-play';
import type { UnsubscribeListener } from '@reduxjs/toolkit';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import AutomotiveView from './AutomotiveView';
import { Cluster } from './AutoPlayCluster';
import { AutoPlayDashboard } from './AutoPlayDashboard';
import { AutoManeuverUtil } from './config/AutoManeuver';
import { AutoTrip } from './config/AutoTrip';
import {
  actionShowAlert,
  actionStartNavigation,
  actionStopNavigation,
  setSelectedTrip,
} from './state/navigationSlice';
import { startAppListening } from './state/store';
import TelemetryView from './TelemetryView';
import { AutoSignInTemplate } from './templates/AutoSignInTemplate';
import {
  AutoTemplate,
  onTripFinished,
  onTripStarted,
  updateTripEstimates,
} from './templates/AutoTemplate';
import { VoiceInputView } from './VoiceInputView';

const AutoPlayRoot = (props: RootComponentInitialProps) => {
  const mapTemplate = useMapTemplate();

  const [i, setI] = useState(0);

  const [signedIn, setSignedIn] = useState(Platform.OS !== 'android');

  useEffect(() => {
    if (Platform.OS === 'android' && mapTemplate.current && !signedIn) {
      const signInFinishedListener = () => {
        setTimeout(() => {
          // delay this a bit, so we show the alert when the map template is visible again, otherwise it will not be shown
          setSignedIn(true);
        }, 1000);
      };
      AutoSignInTemplate.getTemplate(signInFinishedListener).push();
    }
  }, [mapTemplate.current, signedIn]);

  useEffect(() => {
    if (!signedIn) {
      return;
    }

    mapTemplate.current?.showAlert({
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
      priority: 'medium',
    });

    const timer = setInterval(() => setI((p) => p + 1), 1000);

    return () => clearInterval(timer);
  }, [signedIn, mapTemplate.current]);

  useEffect(() => {
    const listeners: Array<UnsubscribeListener> = [];

    listeners.push(
      startAppListening({
        actionCreator: actionStartNavigation,
        effect: (action, { dispatch }) => {
          if (mapTemplate.current == null) {
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
          mapTemplate.current.startNavigation({ id: tripId, routeChoice });
          onTripStarted(tripId, routeId, mapTemplate.current);
          updateTripEstimates(mapTemplate.current, 'initial');
        },
      })
    );

    listeners.push(
      startAppListening({
        actionCreator: actionStopNavigation,
        effect: () => {
          if (mapTemplate.current == null) {
            return;
          }
          onTripFinished(mapTemplate.current);
        },
      })
    );

    listeners.push(
      startAppListening({
        actionCreator: actionShowAlert,
        effect: (action) => {
          if (mapTemplate.current == null) {
            return;
          }
          const prio = action.payload;
          let timer: number | null = null;
          const id = Date.now();

          mapTemplate.current.showAlert({
            id,
            title: { text: `Alert ${id}` },
            subtitle: { text: `Prio: ${prio}` },
            primaryAction: { title: 'OK', onPress: () => {} },
            durationMs: 10000,
            priority: prio,
            onDidDismiss: (reason) => {
              if (timer != null) {
                clearTimeout(timer);
                timer = null;
              }
              console.log('*** onDidDismiss', prio, reason);
            },
            onWillShow: () => {
              timer = setTimeout(() => {
                mapTemplate.current?.updateAlert(id, { text: `Alert ${Date.now()}` }, undefined);
              }, 5000);
            },
          });
        },
      })
    );

    return () => {
      listeners.forEach((remove) => remove());
    };
  }, [mapTemplate.current]);

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
        <VoiceInputView />
        <AutomotiveView />
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
      onDidPan: ({ x, y }) => {
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
      onStopNavigation: (template) => {
        if (HybridAutoPlay.isConnected()) {
          onTripFinished(template);
        }
      },
      onAutoDriveEnabled: (template) => {
        const trip = AutoTrip[0];
        const routeChoice = trip?.routeChoices[0];

        template.startNavigation({ id: trip.id, routeChoice });
        onTripStarted(trip.id, routeChoice.id, template);
        updateTripEstimates(template, 'initial');
      },
      onDidChangePanningInterface: (isPanningInterfaceVisible) => {
        console.log('onDidChangePanningInterface', isPanningInterfaceVisible);
      },
    });
    rootTemplate.setRootTemplate();
  };

  const onDisconnect = () => {
    AutoManeuverUtil.stopManeuvers();
  };

  if (Platform.OS === 'ios') {
    CarPlayDashboard.setComponent(AutoPlayDashboard);
    AutoPlayCluster.setAttributedInactiveDescriptionVariants([
      { text: 'Example', images: [{ image: { name: 'bolt', type: 'glyph' }, position: 0 }] },
    ]);
  }
  AutoPlayCluster.setComponent(Cluster);

  HybridAutoPlay.addListener('didConnect', onConnect);
  HybridAutoPlay.addListener('didDisconnect', onDisconnect);
};

export default registerRunnable;
