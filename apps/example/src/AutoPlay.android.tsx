import { useEffect, useState } from 'react';
import { AppRegistry, Text, View } from 'react-native';

const AutoPlayRoot = (props) => {
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
  AppRegistry.registerComponent('AutoPlayRoot', () => AutoPlayRoot);
};

export default registerRunnable;
