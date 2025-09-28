import { useEffect, useState } from 'react';
import { AppRegistry, Text, View } from 'react-native';
import '@g4rb4g3/react-native-autoplay';

const AndroidAuto = () => {
  console.log('executing android auto runnable');
};

const AndroidAutoCluster = ({ initialProps: { id } }: { initialProps: { id: string } }) => {
  console.log('executing android auto cluster runnable', id);
};

const Content = (props) => {
  const [i, setI] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setI((p) => p + 1), 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Text>Hello Nitro Android Auto {i}</Text>
    </View>
  );
};

const registerRunnable = () => {
  AppRegistry.registerHeadlessTask(
    'AndroidAutoHeadlessJsTask',
    () => () =>
      new Promise((resolve, reject) => {
        console.log('*** AndroidAutoHeadlessJsTask up and running....');
      })
  );

  AppRegistry.registerRunnable('AndroidAuto', AndroidAuto);
  AppRegistry.registerRunnable('AndroidAutoCluster', AndroidAutoCluster);
  AppRegistry.registerComponent('root', () => Content);
};

export default registerRunnable;
