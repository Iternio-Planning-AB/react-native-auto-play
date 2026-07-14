import { NitroModules } from 'react-native-nitro-modules';
import type { AndroidWindowInformation } from '../specs/AndroidWindowInformation.nitro';

export const HybridAndroidWindowInformation: AndroidWindowInformation | null =
  NitroModules.createHybridObject<AndroidWindowInformation>('AndroidWindowInformation');
