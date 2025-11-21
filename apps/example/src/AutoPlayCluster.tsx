import {
  AutoPlayCluster,
  type AutoPlayClusterInitialProps,
  type CleanupCallback,
  SafeAreaView,
} from '@iternio/react-native-auto-play';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

export const Cluster = (props: AutoPlayClusterInitialProps) => {
  const [colorScheme, setColorScheme] = useState(props.colorScheme);
  const [compass, setCompass] = useState(props.compass);
  const [speedLimit, setSpeedLimit] = useState(props.speedLimit);

  useEffect(() => {
    const listeners: Array<CleanupCallback | undefined> = [];

    listteners.push(
      AutoPlayCluster.addListenerColorScheme((clusterId, payload) => {
        if (props.id !== clusterId) {
          return;
        }
        setColorScheme(payload);
      })
    );

    listeners.push(
      AutoPlayCluster.addListenerCompass((clusterId, payload) => {
        if (props.id !== clusterId) {
          return;
        }
        setCompass(payload);
      })
    );

    listeners.push(
      AutoPlayCluster.addListenerSpeedLimit((clusterId, payload) => {
        if (props.id !== clusterId) {
          return;
        }
        setSpeedLimit(payload);
      })
    );

    return () => listeners.forEach((remove) => remove?.());
  }, [props.id]);

  const textStyle = { color: colorScheme === 'dark' ? 'white' : 'black' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'red' }}>
      <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? 'black' : 'white' }}>
        <Text style={textStyle}>Hello Nitro {Platform.OS}</Text>
        <Text style={textStyle}>{JSON.stringify(props.window)}</Text>
        <Text style={textStyle}>Running as {props.id}</Text>
        <Text style={textStyle}>Compass enabled: {JSON.stringify(compass)}</Text>
        <Text style={textStyle}>SpeedLimit enabled: {JSON.stringify(speedLimit)}</Text>
      </View>
    </SafeAreaView>
  );
};
