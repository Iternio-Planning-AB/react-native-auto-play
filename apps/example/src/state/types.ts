export enum SliceName {
  Navigation = 'navigation',
  Audio = 'audio',
}

export type NavigationState = {
  isNavigating: boolean;
  selectedTrip: { tripId: string; routeId: string } | null;
};

export type AudioState = {
  recording: string | null;
};
