export type PointOfInterest = {
  id: string;
  title: string;
  line1?: string;
  line2?: string;
  /** @deprecated use `line1` */
  subtitle?: string;
  lat: number;
  lng: number;
  imageUri?: string;
  primaryButtonTitle?: string;
  distanceMeters?: number;
  /**
   * Drives the default pin renderer's color and center label. `"Available"`/`"Busy"` render
   * with the available/total count as the label; anything else renders as inactive with an X.
   */
  status?: 'Available' | 'Busy' | 'Inactive';
  available?: number;
  total?: number;
  hasBadge?: boolean;
  isHighlighted?: boolean;
};
