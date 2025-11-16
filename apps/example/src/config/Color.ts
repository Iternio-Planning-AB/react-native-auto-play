import type { ThemedColor } from '@iternio/react-native-auto-play';
import { Platform } from 'react-native';

export const DefaultTemplateImageColor: ThemedColor | string =
  Platform.OS === 'android'
    ? 'white'
    : {
        darkColor: 'white',
        lightColor: 'black',
      };
