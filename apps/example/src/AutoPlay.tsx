import {
  AutoPlay,
  MapTemplate,
  type RootComponentInitialProps,
  SafeAreaView,
  TextPlaceholders,
} from '@g4rb4g3/react-native-autoplay';
import { ListTemplate } from '@g4rb4g3/react-native-autoplay/lib/templates/ListTemplate';
import type { MapButton, MapPanButton } from '@g4rb4g3/react-native-autoplay/lib/types/Button';
import { useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';

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

const mapButtonPan: MapButton | MapPanButton =
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

const mapButtonMoney = (template: MapTemplate): MapButton => ({
  type: 'custom',
  image: {
    name: 'euro_symbol',
    size: 22,
    color: 'rgba(255, 255, 255, 1)',
    backgroundColor: 'rgba(66, 66, 66, 0.5)',
  },
  onPress: () => {
    template.setMapButtons([mapButtonPan, mapButtonEv(template)]);
  },
});

const mapButtonEv = (template: MapTemplate): MapButton => ({
  type: 'custom',
  image: {
    name: 'ev_station',
    size: 22,
    color: 'rgba(255, 255, 255, 1)',
    backgroundColor: 'rgba(66, 66, 66, 0.5)',
  },
  onPress: () => {
    template.setMapButtons([mapButtonPan, mapButtonMoney(template)]);
  },
});

const getListTemplate = () => {
  const template = new ListTemplate({
    id: 'list',
    title: {
      text: `${TextPlaceholders.Distance} ${TextPlaceholders.Duration}`,
      distance: { unit: 'meters', value: 1234 },
      duration: 4711,
    },
    actions: {
      android: {
        startHeaderAction: {
          type: 'back',
          onPress: () => {
            AutoPlay.popTemplate();
          },
        },
        endHeaderActions: [
          { type: 'image', image: { name: 'close', size: 22 }, onPress: () => {} },
          {
            type: 'textImage',
            image: { name: 'help', size: 22 },
            title: 'help',
            onPress: () => {},
          },
        ],
      },
      ios: {
        backButton: {
          type: 'back',
          onPress: () => {
            AutoPlay.popTemplate();
          },
        },
        trailingNavigationBarButtons: [
          { type: 'image', image: { name: 'close', size: 22 }, onPress: () => {} },
          {
            type: 'text',
            title: 'help',
            onPress: () => {},
          },
        ],
      },
    },
    onDidDisappear: () => {
      template.destroy();
    },
  });

  return template;
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
            type: 'back',
            onPress: () => console.log('*** back'),
          },
          { type: 'image', image: { name: 'home' }, onPress: () => console.log('*** home') },
          {
            type: 'text',
            title: 'list',
            onPress: () => {
              const listTemplate = getListTemplate();
              listTemplate.push();
            },
          },
        ],
        ios: {
          backButton: {
            type: 'back',
            onPress: () => console.log('*** back'),
          },
          leadingNavigationBarButtons: [
            {
              type: 'image',
              image: { name: 'home', size: 22 },
              onPress: () => console.log('*** home'),
            },
          ],
          trailingNavigationBarButtons: [
            {
              type: 'text',
              title: 'list',
              onPress: () => {
                const listTemplate = getListTemplate();
                listTemplate.push();
              },
            },
          ],
        },
      },
    });
    template.setMapButtons([mapButtonPan, mapButtonEv(template)]);
    template.setRootTemplate();
  };

  const onDisconnect = () => {
    // template.destroy();
  };

  AutoPlay.addListener('didConnect', onConnect);
  AutoPlay.addListener('didDisconnect', onDisconnect);
};

export default registerRunnable;
