import type { CarPlayDashboardButton } from '@iternio/react-native-auto-play';
import type { Dispatch } from '@reduxjs/toolkit';
import { actionStartNavigation } from '../state/navigationSlice';
import { AutoTrip } from './AutoTrip';

export const getCarPlayDashboardButtons = (dispatch: Dispatch): Array<CarPlayDashboardButton> => [
  {
    titleVariants: ['Start navigation'],
    subtitleVariants: [],
    image: { name: 'play_circle', type: 'glyph' },
    onPress: () => {
      dispatch(
        actionStartNavigation({
          tripId: AutoTrip[0].id,
          routeId: AutoTrip[0].routeChoices[0].id,
        })
      );
    },
  },
  {
    titleVariants: ['Open app'],
    subtitleVariants: [],
    image: { name: 'app_promo', type: 'glyph' },
    launchHeadUnitScene: true,
    onPress: () => {},
  },
];
