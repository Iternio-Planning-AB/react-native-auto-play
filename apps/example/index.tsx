import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';
import registerRunnable from './src/AutoPlay';

AppRegistry.registerComponent(appName, () => App);

registerRunnable();
