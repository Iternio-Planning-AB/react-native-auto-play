import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type AlertOptions, type AlertState, SliceName } from './types';

const MAX_LOG_ENTRIES = 12;

const initialState: AlertState = {
  log: [],
};

const alertSlice = createSlice({
  name: SliceName.Alert,
  initialState,
  reducers: {
    addAlertLog(state, action: PayloadAction<string>) {
      state.log = [...state.log, action.payload].slice(-MAX_LOG_ENTRIES);
    },
    clearAlertLog(state) {
      state.log = [];
    },
  },
});

export const { addAlertLog, clearAlertLog } = alertSlice.actions;

export const actionShowAlert = createAction('showAlert', (payload: AlertOptions) => {
  return { payload };
});

export const actionDismissAlert = createAction('dismissAlert');

export const alertReducer = alertSlice.reducer;
