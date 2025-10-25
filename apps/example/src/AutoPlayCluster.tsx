import { type RootComponentInitialProps, SafeAreaView } from '@g4rb4g3/react-native-autoplay';
import { Platform, Text, View } from 'react-native';

export const AutoPlayCluster = (props: RootComponentInitialProps) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'red' }}>
      <View style={{ flex: 1, backgroundColor: 'green' }}>
        <Text>Hello Nitro {Platform.OS}</Text>
        <Text>{JSON.stringify(props.window)}</Text>
        <Text>Running as {props.id}</Text>
      </View>
    </SafeAreaView>
  );
};
