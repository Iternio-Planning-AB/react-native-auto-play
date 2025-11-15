import {
  CarPlayDashboard,
  type RootComponentInitialProps,
  SafeAreaView,
} from '@iternio/react-native-auto-play';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import { getCarPlayDashboardButtons } from './config/CarPlayDashboardButtons';
import { useAppDispatch } from './state/store';

export const AutoPlayDashboard = (props: RootComponentInitialProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    CarPlayDashboard.setButtons(getCarPlayDashboardButtons(dispatch));
  }, [dispatch]);

  useEffect(() => {
    const removeListener = CarPlayDashboard.addListenerRenderState((payload) =>
      console.log(`Dashboard ${payload}`)
    );

    return () => removeListener();
  }, []);

  useEffect(() => {
    const removeListener = CarPlayDashboard.addListenerColorScheme((payload) =>
      console.log(`Dashboard ${payload}`)
    );

    return () => {
      removeListener();
    };
  }, []);

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
