import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type AudioState, SliceName } from './types';

const initialState: AudioState = {
  recording: null,
};

const audioSlice = createSlice({
  name: SliceName.Navigation,
  initialState,
  reducers: {
    setRecording(state, action: PayloadAction<string>) {
      state.recording = action.payload;
    },
    resetRecording(state) {
      state.recording = null;
    },
  },
});

export const { setRecording, resetRecording } = audioSlice.actions;

export const audioReducer = audioSlice.reducer;
