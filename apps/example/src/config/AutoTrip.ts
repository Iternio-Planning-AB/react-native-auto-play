import type { TripPreviewTextConfiguration, TripsConfig } from '@iternio/react-native-auto-play';

export const AutoTrip: Array<TripsConfig> = [
  {
    id: '#0',
    routeChoices: [
      {
        id: '#0-0',
        summaryVariants: ['Fastest route'],
        additionalInformationVariants: ['Fastest route'],
        selectionSummaryVariants: ['1 charge stop'],
        steps: [
          {
            latitude: 0,
            longitude: 0,
            name: 'Your position',
            travelEstimates: {
              distanceRemaining: { value: 0, unit: 'meters' },
              timeRemaining: {
                seconds: 0,
                timezone: 'Europe/Vienna',
              },
            },
          },
          {
            latitude: 0,
            longitude: 0,
            name: 'Charger',
            travelEstimates: {
              distanceRemaining: { unit: 'kilometers', value: 200 },
              timeRemaining: {
                seconds: 2 * 3600,
                timezone: 'Europe/Berlin',
              },
              tripText: {
                text: 'Blazing fast charger',
              },
            },
          },
          {
            latitude: 0,
            longitude: 0,
            name: 'Kyiv',
            travelEstimates: {
              distanceRemaining: { unit: 'kilometers', value: 400 },
              timeRemaining: {
                seconds: 4.5 * 3600,
                timezone: 'Europe/Kyiv',
              },
              tripText: {
                text: 'From 🇦🇹 with sweat, tears and pain 😉',
              },
            },
          },
        ],
      },
      {
        id: '#0-1',
        summaryVariants: ['Shortest route'],
        additionalInformationVariants: ['Shortest route'],
        selectionSummaryVariants: ['2 charge stop'],
        steps: [
          {
            latitude: 0,
            longitude: 0,
            name: 'Your position',
            travelEstimates: {
              distanceRemaining: { value: 0, unit: 'meters' },
              timeRemaining: {
                seconds: 0,
                timezone: 'Europe/Vienna',
              },
            },
          },
          {
            latitude: 0,
            longitude: 0,
            name: 'Kyiv',
            travelEstimates: {
              distanceRemaining: { unit: 'kilometers', value: 350 },
              timeRemaining: {
                seconds: 5.5 * 3600,
                timezone: 'Europe/Kyiv',
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: '#1',
    routeChoices: [
      {
        id: '#1-0',
        summaryVariants: ['Fastest route'],
        additionalInformationVariants: ['Fastest route'],
        selectionSummaryVariants: ['1 charge stop'],
        steps: [
          {
            latitude: 0,
            longitude: 0,
            name: 'Your position',
            travelEstimates: {
              distanceRemaining: { value: 0, unit: 'meters' },
              timeRemaining: {
                seconds: 0,
                timezone: 'Europe/Vienna',
              },
            },
          },
          {
            latitude: 0,
            longitude: 0,
            name: 'Charger',
            travelEstimates: {
              distanceRemaining: { unit: 'kilometers', value: 200 },
              timeRemaining: {
                seconds: 2 * 3600,
                timezone: 'Europe/Berlin',
              },
            },
          },
          {
            latitude: 0,
            longitude: 0,
            name: 'Kyiv',
            travelEstimates: {
              distanceRemaining: { unit: 'kilometers', value: 400 },
              timeRemaining: {
                seconds: 4.5 * 3600,
                timezone: 'Europe/Kyiv',
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: '#2',
    routeChoices: [
      {
        id: '#2-0',
        summaryVariants: ['Shortest route'],
        additionalInformationVariants: ['Shortest route'],
        selectionSummaryVariants: ['2 charge stop'],
        steps: [
          {
            latitude: 0,
            longitude: 0,
            name: 'Your position',
            travelEstimates: {
              distanceRemaining: { value: 0, unit: 'meters' },
              timeRemaining: {
                seconds: 0,
                timezone: 'Europe/Vienna',
              },
            },
          },
          {
            latitude: 0,
            longitude: 0,
            name: 'Kyiv',
            travelEstimates: {
              distanceRemaining: { unit: 'kilometers', value: 350 },
              timeRemaining: {
                seconds: 5.5 * 3600,
                timezone: 'Europe/Kyiv',
              },
            },
          },
        ],
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
