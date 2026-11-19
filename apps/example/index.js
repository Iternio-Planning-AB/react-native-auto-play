// Must be the first import -- ES import declarations are hoisted and evaluated in source order,
// so this is what actually guarantees timer installation runs before anything else has a
// chance to capture a reference to the original setTimeout/setInterval globals.
import '@iternio/react-native-auto-play/installTimers';
import { AppRegistry } from 'react-native';
import App from './src/App';
import registerRunnable from './src/AutoPlay';
import { StateWrapper } from './src/state/store';

AppRegistry.setWrapperComponentProvider(() => StateWrapper);
// must match AutoPlayMainModuleName on iOS (defaults to main) and getMainComponentName on Android
AppRegistry.registerComponent('main', () => App);

registerRunnable();
