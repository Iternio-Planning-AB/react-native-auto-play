import {
  AutoPlayModules,
  type CleanupCallback,
  HybridAutoPlay,
} from '@iternio/react-native-auto-play';
import { useEffect, useState } from 'react';
import { Button, Platform, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AutoTrip } from './config/AutoTrip';
import {
  actionShowAlert,
  actionStartNavigation,
  actionStopNavigation,
} from './state/navigationSlice';
import { useAppDispatch, useAppSelector } from './state/store';
import { TelemetryView } from './TelemetryView';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    const remove = HybridAutoPlay.addListenerRenderState(AutoPlayModules.App, (state) => {
      console.log('*** AppState', state);
    });

    return () => remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const dispatch = useAppDispatch();

  const isNavigating = useAppSelector((state) => state.navigation.isNavigating);
  const selectedTrip = useAppSelector((state) => state.navigation.selectedTrip);

  const [isConnected, setIsConnected] = useState(HybridAutoPlay.isConnected());
  const [isRootVisible, setIsRootVisible] = useState(false);

  useEffect(() => {
    const listeners: Array<CleanupCallback> = [];

    listeners.push(HybridAutoPlay.addListener('didConnect', () => setIsConnected(true)));
    listeners.push(HybridAutoPlay.addListener('didDisconnect', () => setIsConnected(false)));
    listeners.push(
      HybridAutoPlay.addListenerRenderState('AutoPlayRoot', (state) =>
        setIsRootVisible(state === 'didAppear')
      )
    );

    return () => {
      for (const remove of listeners) {
        remove();
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text>AutoPlay connected: {String(isConnected)}</Text>
      <Text>Head unit root visible: {String(isRootVisible)}</Text>
      <Text>isNavigating: {String(isNavigating)}</Text>
      <Text>selectedTrip: {JSON.stringify(selectedTrip)}</Text>
      {Platform.OS === 'android' ? <TelemetryView /> : null}
      {isNavigating ? (
        <Button
          title="stop navigation"
          onPress={() => {
            dispatch(actionStopNavigation());
          }}
        />
      ) : (
        <Button
          title="start navigation"
          onPress={() => {
            dispatch(
              actionStartNavigation({
                tripId: AutoTrip[0].id,
                routeId: AutoTrip[0].routeChoices[0].id,
              })
            );
          }}
        />
      )}
      <View style={{ marginTop: 16 }}>
        <Text>Navigation alerts</Text>
        <View style={styles.buttonRow}>
          <Button
            title="low prio"
            onPress={() => {
              dispatch(actionShowAlert('low'));
            }}
          />
          <Button
            title="medium prio"
            onPress={() => {
              dispatch(actionShowAlert('medium'));
            }}
          />
          <Button
            title="high prio"
            onPress={() => {
              dispatch(actionShowAlert('high'));
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    margin: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    gap: 8,
  },
});

export default App;
