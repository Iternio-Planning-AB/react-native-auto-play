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

export type AlertDefaultAction = 'unset' | 'none' | 'primary' | 'secondary';

export type AlertOptions = {
  priority: AlertPriority;
  sameId: boolean;
  defaultAction: AlertDefaultAction;
  noTimer: boolean;
};

export type AlertState = {
  log: Array<string>;
};
