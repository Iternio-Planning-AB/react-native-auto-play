import type { RootComponentInitialProps } from '@g4rb4g3/react-native-autoplay';
import { Platform, Text, View } from 'react-native';

export const AutoPlayDashboard = (props: RootComponentInitialProps) => {
  return (
    <View style={{ flex: 1, backgroundColor: 'green' }}>
      <Text>Hello Nitro {Platform.OS}</Text>
      <Text>{JSON.stringify(props.window)}</Text>
      <Text>Running as {props.id}</Text>
    </View>
  );
};
