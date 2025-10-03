import { AutoPlay, MapTemplate } from '@g4rb4g3/react-native-autoplay';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

const AutoPlayRoot = (props) => {
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
  });

  const onConnect = () => {
    template.setRootTemplate();
  };

  const onDisconnect = () => {};

  AutoPlay.addListener('didConnect', onConnect);
  AutoPlay.addListener('didDisconnect', onDisconnect);
};

export default registerRunnable;
