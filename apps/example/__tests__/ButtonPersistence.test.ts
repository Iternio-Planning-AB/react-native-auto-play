import { Flag, type MapTemplate } from '@iternio/react-native-auto-play';
import { AutoTemplate } from '../src/templates/AutoTemplate';

jest.mock('../src/config/AutoManeuver', () => ({ AutoManeuverUtil: {} }));
jest.mock('../src/state/store', () => ({ dispatch: jest.fn() }));

test('map buttons mix persistent custom and pan controls with auto-hiding controls', () => {
  const buttons = AutoTemplate.mapButtons ?? [];

  expect(buttons.map((button) => button.flags)).toEqual([
    Flag.Persistent,
    undefined,
    undefined,
    Flag.Persistent,
  ]);
  expect(buttons[0]?.type).toBe('custom');
  expect(buttons[3]?.type).toBe('pan');
});

test('trip previews mix persistent and auto-hiding buttons', () => {
  const showTripSelector = jest.fn<
    ReturnType<MapTemplate['showTripSelector']>,
    Parameters<MapTemplate['showTripSelector']>
  >();
  const template = { showTripSelector } as unknown as MapTemplate;
  const headerActions = AutoTemplate.mapHeaderActions?.android;

  if (!Array.isArray(headerActions)) {
    throw new Error('Expected Android map header actions');
  }
  const tripButton = headerActions.find(
    (button) =>
      button.type === 'image' &&
      button.image.type === 'glyph' &&
      'name' in button.image &&
      button.image.name === 'flag_check'
  );
  if (!tripButton || tripButton.type !== 'image') {
    throw new Error('Missing trip preview button');
  }
  tripButton.onPress?.(template);

  expect(showTripSelector).toHaveBeenCalledTimes(1);
  const mapButtons = showTripSelector.mock.calls[0]?.[0].mapButtons;
  expect(mapButtons?.map((button) => button.flags)).toEqual([Flag.Persistent, undefined]);
});
