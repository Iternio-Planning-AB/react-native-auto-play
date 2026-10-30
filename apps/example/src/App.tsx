import {
  type AlertPriority,
  AutoPlayModules,
  type CleanupCallback,
  HybridAutoPlay,
  HybridVoice,
} from '@iternio/react-native-auto-play';
import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';
import { Button, Platform, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AutoTrip } from './config/AutoTrip';
import { playPCM } from './PCMPlayer';
import { actionDismissAlert, actionShowAlert, clearAlertLog } from './state/alertSlice';
import { setRecording } from './state/audioSlice';
import { actionStartNavigation, actionStopNavigation } from './state/navigationSlice';
import { useAppSelector, useAppStore } from './state/store';
import type { AlertDefaultAction } from './state/types';
import TelemetryView from './TelemetryView';
import saveVoiceRecording from './utils/saveVoiceRecording';

const nextDefaultAction: Record<AlertDefaultAction, AlertDefaultAction> = {
  unset: 'none',
  none: 'primary',
  primary: 'secondary',
  secondary: 'unset',
};

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
  const { dispatch, getState } = useAppStore();

  const isNavigating = useAppSelector((state) => state.navigation.isNavigating);
  const selectedTrip = useAppSelector((state) => state.navigation.selectedTrip);

  const [sessionId, setSessionId] = useState(HybridAutoPlay.getCurrentSessionId());
  const [isRootVisible, setIsRootVisible] = useState(false);
  const [savedVoiceRecording, setSavedVoiceRecording] = useState('');
  const [sameAlertId, setSameAlertId] = useState(false);
  const [alertDefaultAction, setAlertDefaultAction] = useState<AlertDefaultAction>('unset');
  const [alertHasTimer, setAlertHasTimer] = useState(true);
  const alertLog = useAppSelector((state) => state.alert.log);

  const showAlert = (priority: AlertPriority) =>
    dispatch(
      actionShowAlert({
        priority,
        sameId: sameAlertId,
        defaultAction: alertDefaultAction,
        noTimer: !alertHasTimer,
      })
    );

  useEffect(() => {
    const listeners: Array<CleanupCallback> = [];

    listeners.push(HybridAutoPlay.addListener('didConnect', (id) => setSessionId(id)));
    listeners.push(HybridAutoPlay.addListener('didDisconnect', () => setSessionId(undefined)));
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
      <Text>
        AutoPlay connected: {sessionId === undefined ? 'false' : `true (session ${sessionId})`}
      </Text>
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
          <Button title="low prio" onPress={() => showAlert('low')} />
          <Button title="medium prio" onPress={() => showAlert('medium')} />
          <Button title="high prio" onPress={() => showAlert('high')} />
          <Button title="dismiss" onPress={() => dispatch(actionDismissAlert())} />
        </View>
        <View style={styles.buttonRow}>
          <Button
            title={`id: ${sameAlertId ? 'shared' : 'per prio'}`}
            onPress={() => setSameAlertId((p) => !p)}
          />
          <Button
            title={`default: ${alertDefaultAction}`}
            onPress={() => setAlertDefaultAction((p) => nextDefaultAction[p])}
          />
          <Button
            title={`timer: ${alertHasTimer ? 'on' : 'off'}`}
            onPress={() => setAlertHasTimer((p) => !p)}
          />
        </View>
        {alertLog.map((entry, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the log only grows at its end
          <Text key={index} style={styles.alertLog}>
            {entry}
          </Text>
        ))}
        {alertLog.length > 0 ? (
          <Button title="clear alert log" onPress={() => dispatch(clearAlertLog())} />
        ) : null}
        <Text>Saved recording: {savedVoiceRecording}</Text>
        <View style={styles.buttonRow}>
          <Button
            title="record audio"
            onPress={async () => {
              const granted = await HybridVoice.requestVoiceInputPermission();
              if (!granted) {
                return;
              }

              void HybridVoice.startVoiceInput({ preferSpeechToText: true }).then((result) => {
                if (result.audio) {
                  console.log(`received ${result.audio.byteLength} bytes`);
                  dispatch(
                    setRecording(Buffer.from(new Uint8Array(result.audio)).toString('base64'))
                  );
                } else if (result.transcription) {
                  console.log(`received ${result.transcription}`);
                  setSavedVoiceRecording(result.transcription);
                }
              });
            }}
          />
          <Button
            title="play recording"
            onPress={() => {
              const recording = getState().audio.recording;
              if (recording == null) {
                return;
              }
              void playPCM(recording);
            }}
          />
          <Button
            title="save recording"
            onPress={async () => {
              const result = await saveVoiceRecording(getState);
              setSavedVoiceRecording(result);
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
  alertLog: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    gap: 8,
  },
});

export default App;
