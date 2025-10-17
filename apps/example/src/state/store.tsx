import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import {
  Provider,
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
  useStore,
} from 'react-redux';
import { navigationReducer } from './navigationSlice';
import { SliceName } from './types';

const rootReducer = {
  [SliceName.Navigation]: navigationReducer,
};

export const listenerMiddleware = createListenerMiddleware();

const store = configureStore({
  reducer: combineReducers(rootReducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

export const useAppStore = useStore.withTypes<typeof store>();

type Props = {
  children: ReactNode;
};

export const StateWrapper: React.FC<Props> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};

export const { dispatch, getState } = store;
