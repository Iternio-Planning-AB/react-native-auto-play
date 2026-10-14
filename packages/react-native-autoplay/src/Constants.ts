import { Platform } from 'react-native';

// Platform.Version is a string like '27.0.1' on iOS, which Number() turns into NaN
const isIos27OrGreater =
  Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 27;

const Constants: Readonly<{ isIos27OrGreater: boolean }> = {
  isIos27OrGreater,
};

export { Constants };
