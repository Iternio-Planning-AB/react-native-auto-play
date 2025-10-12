import {
  AutoPlay,
  type MapButton,
  type MapPanButton,
  MapTemplate,
  type RootComponentInitialProps,
  SafeAreaView,
} from '@g4rb4g3/react-native-autoplay';
import { useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';
import { AutoGridTemplate } from './templates/AutoGridTemplate';
import { AutoListTemplate } from './templates/AutoListTemplate';

const AutoPlayRoot = (props: RootComponentInitialProps) => {
  const [i, setI] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setI((p) => p + 1), 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView
      style={{
        backgroundColor: 'green',
      }}
    >
      <Text>
        Hello Nitro {Platform.OS} {i}
      </Text>
      <Text>{JSON.stringify(props.window)}</Text>
      <Text>Running as {props.id}</Text>
    </SafeAreaView>
  );
};

const mapButtonPan: MapButton<MapTemplate> | MapPanButton<MapTemplate> =
  Platform.OS === 'android'
    ? {
        type: 'pan',
        onPress: () => console.log('pan button press'),
      }
    : {
        type: 'custom',
        image: {
          name: 'drag_pan',
        },
        onPress: (template) => console.log('map button on press', template.templateId),
      };

const mapButtonMoney: MapButton<MapTemplate> = {
  type: 'custom',
  image: {
    name: 'euro_symbol',
    color: 'rgba(255, 255, 255, 1)',
    backgroundColor: 'rgba(66, 66, 66, 0.5)',
  },
  onPress: (template) => {
    template.setMapButtons([mapButtonPan, mapButtonEv]);
  },
};

const mapButtonEv: MapButton<MapTemplate> = {
  type: 'custom',
  image: {
    name: 'ev_station',
    color: 'rgba(255, 255, 255, 1)',
    backgroundColor: 'rgba(66, 66, 66, 0.5)',
  },
  onPress: (template) => {
    template.setMapButtons([mapButtonPan, mapButtonMoney]);
  },
};

const registerRunnable = () => {
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
      actions: {
        android: [
          {
            type: 'image',
            image: { name: 'grid_3x3' },
            onPress: (t) => {
              console.log('***', t.templateId);
              AutoGridTemplate.getTemplate().push();
            },
          },
          {
            type: 'image',
            image: {
              name: 'list',
            },
            onPress: () => AutoListTemplate.getTemplate().push(),
          },
        ],
        ios: {
          leadingNavigationBarButtons: [
            {
              type: 'image',
              image: { name: 'grid_3x3' },
              onPress: () => AutoGridTemplate.getTemplate().push(),
            },
          ],
          trailingNavigationBarButtons: [
            {
              type: 'image',
              image: {
                name: 'list',
              },
              onPress: () => AutoListTemplate.getTemplate().push(),
            },
          ],
        },
      },
      mapButtons: [mapButtonPan, mapButtonEv],
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
