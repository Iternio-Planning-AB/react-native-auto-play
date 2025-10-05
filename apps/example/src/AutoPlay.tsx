import {
  AutoPlay,
  MapTemplate,
  type RootComponentInitialProps,
} from '@g4rb4g3/react-native-autoplay';
import type { MapButton, MapPanButton } from '@g4rb4g3/react-native-autoplay/lib/types/Button';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

const AutoPlayRoot = (props: RootComponentInitialProps) => {
  const [i, setI] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setI((p) => p + 1), 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'green' }}>
      <Text>
        Hello Nitro {Platform.OS} {i}
      </Text>
      <Text>{JSON.stringify(props.window)}</Text>
      <Text>Running as {props.id}</Text>
    </View>
  );
};

const registerRunnable = () => {
  const panButton: MapButton | MapPanButton =
    Platform.OS === 'android'
      ? {
          type: 'pan',
          onPress: () => console.log('pan button press'),
        }
      : {
          type: 'custom',
          image: {
            name: 'drag_pan',
            size: 22,
          },
          onPress: () => console.log('map button on press'),
        };

  const onConnect = () => {
    const template = new MapTemplate({
      component: AutoPlayRoot,
      id: 'AutoPlayRoot',
      onWillAppear: () => console.log('onWillAppear'),
      onDidAppear: () => console.log('onDidAppear'),
      onWillDisappear: () => console.log('onWillDisappear'),
      onDidDisappear: () => console.log('onDidDisappear'),
      onDidUpdatePanGestureWithTranslation: ({ x, y }) => {
        console.log('*** onDidUpdatePanGestureWithTranslation', x, y);
      },
      onDidUpdateZoomGestureWithCenter: ({ x, y }, scale) => {
        console.log('*** onDidUpdateZoomGestureWithCenter', x, y, scale);
      },
      onClick: ({ x, y }) => console.log('*** onClick', x, y),
      onDoubleClick: ({ x, y }) => console.log('*** onDoubleClick', x, y),
      onAppearanceDidChange: (colorScheme) => console.log('*** onAppearanceDidChange', colorScheme),
      onSafeAreaInsetsDidChange: (top, left, bottom, right, isLegacyLayout) =>
        console.log('*** onSafeAreaInsetsDidChange', { top, left, bottom, right, isLegacyLayout }),
      mapButtons: [
        {
          type: 'custom',
          image: {
            name: 'ev_station',
            size: 22,
            color: 'rgba(255, 255, 255, 1)',
            backgroundColor: 'rgba(66, 66, 66, 0.5)',
          },
          onPress: () => console.log('map button on press'),
        },
        panButton,
      ],
      actions: {
        android: [
          { type: 'back', onPress: () => console.log('*** back') },
          { type: 'image', image: { name: 'home' }, onPress: () => console.log('*** home') },
          {
            type: 'text',
            title: 'work',
            onPress: () => console.log('*** work'),
          },
        ],
        ios: {
          backButton: { type: 'back', onPress: () => console.log('*** back') },
          leadingNavigationBarButtons: [
            {
              type: 'image',
              image: { name: 'home', size: 22 },
              onPress: () => console.log('*** home'),
            },
          ],
          trailingNavigationBarButtons: [
            { type: 'text', title: 'work', onPress: () => console.log('*** work') },
          ],
        },
      },
    });
    template.setRootTemplate();
  };

  const onDisconnect = () => {
    // template.destroy();
  };

  AutoPlay.addListener('didConnect', onConnect);
  AutoPlay.addListener('didDisconnect', onDisconnect);
};

export default registerRunnable;
