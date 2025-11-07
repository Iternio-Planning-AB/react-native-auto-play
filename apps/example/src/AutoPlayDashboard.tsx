import {
  CarPlayDashboard,
  type RootComponentInitialProps,
  SafeAreaView,
} from '@g4rb4g3/react-native-autoplay';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import { AutoTrip } from './config/AutoTrip';
import { actionStartNavigation } from './state/navigationSlice';
import { useAppDispatch } from './state/store';

export const AutoPlayDashboard = (props: RootComponentInitialProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    CarPlayDashboard.setButtons([
      {
        titleVariants: ['Start navigation'],
        subtitleVariants: [],
        image: { name: 'play_circle', type: 'glyph' },
        onPress: () => {
          dispatch(
            actionStartNavigation({
              tripId: AutoTrip[0].id,
              routeId: AutoTrip[0].routeChoices[0].id,
            })
          );
        },
      },
    ]);
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
