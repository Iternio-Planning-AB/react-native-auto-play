import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type NavigationState, SliceName } from './types';

const initialState: NavigationState = {
  isNavigating: false,
  selectedTrip: null,
};

const navigationSlice = createSlice({
  name: SliceName.Navigation,
  initialState,
  reducers: {
    setSelectedTrip(state, action: PayloadAction<NavigationState['selectedTrip']>) {
      state.selectedTrip = action.payload;
    },
    setIsNavigating(state, action: PayloadAction<boolean>) {
      state.isNavigating = action.payload;
      if (!state.isNavigating) {
        state.selectedTrip = null;
      }
    },
  },
});

export const { setSelectedTrip, setIsNavigating } = navigationSlice.actions;

export const actionStartNavigation = createAction(
  'startNavigation',
  (payload: NonNullable<NavigationState['selectedTrip']>) => {
    return { payload };
  }
);

export const actionStopNavigation = createAction('stopNavigation');

export const navigationReducer = navigationSlice.reducer;
