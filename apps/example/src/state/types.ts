export enum SliceName {
  Navigation = 'navigation',
}

export type NavigationState = {
  isNavigating: boolean;
  selectedTrip: { tripId: string; routeId: string } | null;
};
