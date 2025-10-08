export type DistanceUnits = 'meters' | 'miles' | 'kilometers' | 'yards' | 'feet';

export type Distance = {
  value: number;
  unit: DistanceUnits;
};

export enum TextPlaceholders {
  Distance = '{distance}',
  Duration = '{duration}',
}

export type Text = {
  /**
   * use the `TextPlaceholders.Distance` and `TextPlaceholders.Duration` inside the string to position the distance and duration props
   */
  text: string;
  /**
   * make sure to use `TextPlaceholders.Distance` on the text property
   */
  distance?: Distance;
  /**
   * duration in seconds, make sure to use `TextPlaceholders.Duration` on the text property
   */
  duration?: number;
};
