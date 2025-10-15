import type { TripConfig, TripPreviewTextConfiguration } from '@g4rb4g3/react-native-autoplay';

export const AutoTrip: Array<TripConfig> = [
  {
    id: '#0',
    destination: { latitude: 0, longitude: 0, name: 'Dresden' },
    origin: { latitude: 0, longitude: 0, name: 'Your position' },
    routeChoices: [
      {
        id: '#0-0',
        summaryVariants: ['Fastest route'],
        additionalInformationVariants: ['Fastest route'],
        selectionSummaryVariants: ['1 charge stop'],
        travelEstimates: {
          distanceRemaining: { unit: 'kilometers', value: 409 },
          timeRemaining: 5 * 3600,
        },
      },
      {
        id: '#0-1',
        summaryVariants: ['Shortest route'],
        additionalInformationVariants: ['Shortest route'],
        selectionSummaryVariants: ['2 charge stops'],
        travelEstimates: {
          distanceRemaining: { unit: 'kilometers', value: 502 },
          timeRemaining: 6 * 3600,
        },
      },
    ],
  },
  {
    id: '#1',
    destination: { latitude: 0, longitude: 0, name: 'Dresden' },
    origin: { latitude: 0, longitude: 0, name: 'Your position' },
    routeChoices: [
      {
        id: '#1-0',
        summaryVariants: ['Fastest route'],
        additionalInformationVariants: ['Fastest route'],
        selectionSummaryVariants: ['1 charge stop'],
        travelEstimates: {
          distanceRemaining: { unit: 'kilometers', value: 409 },
          timeRemaining: 5 * 3600,
        },
      },
    ],
  },
  {
    id: '#2',
    destination: { latitude: 0, longitude: 0, name: 'Dresden' },
    origin: { latitude: 0, longitude: 0, name: 'Your position' },
    routeChoices: [
      {
        id: '#2-0',
        summaryVariants: ['Shortest route'],
        additionalInformationVariants: ['Shortest route'],
        selectionSummaryVariants: ['2 charge stop'],
        travelEstimates: {
          distanceRemaining: { unit: 'kilometers', value: 350 },
          timeRemaining: 6 * 3600,
        },
      },
    ],
  },
];

export const TextConfig: TripPreviewTextConfiguration = {
  additionalRoutesButtonTitle: 'Alternatives',
  overviewButtonTitle: 'Overview',
  startButtonTitle: 'Start',
  travelEstimatesTitle: 'Arrival:',
};
