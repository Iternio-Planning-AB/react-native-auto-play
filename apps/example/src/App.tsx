import { AutoPlay } from '@g4rb4g3/react-native-autoplay';
import type { RemoveListener } from '@g4rb4g3/react-native-autoplay/lib/types/Event';
import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRootVisible, setIsRootVisible] = useState(false);

  useEffect(() => {
    const listeners: Array<RemoveListener> = [];

    listeners.push(AutoPlay.addListener('didConnect', () => setIsConnected(true)));
    listeners.push(AutoPlay.addListener('didDisconnect', () => setIsConnected(false)));
    listeners.push(
      AutoPlay.addListenerRenderState('AutoPlayRoot', (state) =>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
