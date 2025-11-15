import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';
import registerRunnable from './src/AutoPlay';
import { StateWrapper } from './src/state/store';

AppRegistry.setWrapperComponentProvider(() => StateWrapper);
AppRegistry.registerComponent(appName, () => App);

registerRunnable();
