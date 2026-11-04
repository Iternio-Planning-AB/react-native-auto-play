import type { AlertPriority } from '@iternio/react-native-auto-play';

export enum SliceName {
  Navigation = 'navigation',
  Audio = 'audio',
  Alert = 'alert',
}

export type NavigationState = {
  isNavigating: boolean;
  selectedTrip: { tripId: string; routeId: string } | null;
};

export type AudioState = {
  recording: string | null;
};

export type AlertOptions = {
  priority: AlertPriority;
  sameId: boolean;
  cancelPrimary: boolean;
  noTimer: boolean;
};

export type AlertState = {
  log: Array<string>;
};
