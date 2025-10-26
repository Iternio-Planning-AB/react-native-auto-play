import {
  AutoPlayCluster,
  type RootComponentInitialProps,
  SafeAreaView,
} from '@g4rb4g3/react-native-autoplay';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

export const Cluster = (props: RootComponentInitialProps) => {
  const [colorScheme, setColorScheme] = useState(props.colorScheme);

  useEffect(() => {
    AutoPlayCluster.addListenerColorScheme((clusterId, payload) => {
      if (props.id !== clusterId) {
        return;
      }
      setColorScheme(payload);
    });
  }, [props.id]);

  const textStyle = { color: colorScheme === 'dark' ? 'white' : 'black' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'red' }}>
      <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? 'black' : 'white' }}>
        <Text style={textStyle}>Hello Nitro {Platform.OS}</Text>
        <Text style={textStyle}>{JSON.stringify(props.window)}</Text>
        <Text style={textStyle}>Running as {props.id}</Text>
      </View>
    </SafeAreaView>
  );
};
