import { installAutoPlayTimers } from '@iternio/react-native-auto-play';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';
import registerRunnable from './src/AutoPlay';
import { StateWrapper } from './src/state/store';

// Must run before any other module has a chance to capture a reference to the original
// setTimeout/setInterval globals -- see installAutoPlayTimers' own docs.
installAutoPlayTimers();

AppRegistry.setWrapperComponentProvider(() => StateWrapper);
AppRegistry.registerComponent(appName, () => App);

registerRunnable();
