import {
  AutoPlay,
  MapTemplate,
  type RootComponentInitialProps,
} from '@g4rb4g3/react-native-autoplay';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

const AutoPlayRoot = (props: RootComponentInitialProps) => {
  const [i, setI] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setI((p) => p + 1), 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Text>
        Hello Nitro {Platform.OS} {i}
      </Text>
      <Text>{JSON.stringify(props.window)}</Text>
    </View>
  );
};

const registerRunnable = () => {
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
  });

  const onConnect = () => {
    template.setRootTemplate();
  };

  const onDisconnect = () => {};

  AutoPlay.addListener('didConnect', onConnect);
  AutoPlay.addListener('didDisconnect', onDisconnect);
};

export default registerRunnable;
