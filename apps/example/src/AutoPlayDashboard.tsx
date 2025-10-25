import { CarPlayDashboard, type RootComponentInitialProps } from '@g4rb4g3/react-native-autoplay';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';

export const AutoPlayDashboard = (props: RootComponentInitialProps) => {
  useEffect(() => {
    CarPlayDashboard.setButtons([
      {
        titleVariants: ['Example'],
        subtitleVariants: ['Loading...'],
        image: { name: 'hourglass_top' },
      },
    ]);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'green' }}>
      <Text>Hello Nitro {Platform.OS}</Text>
      <Text>{JSON.stringify(props.window)}</Text>
      <Text>Running as {props.id}</Text>
    </View>
  );
};
