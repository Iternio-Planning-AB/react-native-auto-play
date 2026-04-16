import { NitroModules } from 'react-native-nitro-modules';
import type { AndroidAutoTelemetry } from '../specs/AndroidAutoTelemetry.nitro';

export const HybridAndroidAutoTelemetry =
  NitroModules.createHybridObject<AndroidAutoTelemetry>('AndroidAutoTelemetry');
