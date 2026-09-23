import { AppRegistry, Platform, type TaskProvider } from 'react-native';
import type { AutoPlay as NitroAutoPlay } from './specs/AutoPlay.nitro';

// react-native no longer exports `Task` publicly; TaskProvider's return type, reconstructed locally.
type Task = () => Promise<void>;

const createTaskProvider =
  (hybridAutoPlay: NitroAutoPlay): TaskProvider =>
  (): Task =>
  () =>
    new Promise<void>((resolve) => {
      const remove = hybridAutoPlay.addListener('didDisconnect', () => {
        resolve();
        remove();
      });
    });

const registerHeadlessTask = (hybridAutoPlay: NitroAutoPlay) => {
  if (Platform.OS !== 'android') {
    return;
  }
  AppRegistry.registerHeadlessTask('AndroidAutoHeadlessJsTask', createTaskProvider(hybridAutoPlay));
};

export default { registerHeadlessTask };
