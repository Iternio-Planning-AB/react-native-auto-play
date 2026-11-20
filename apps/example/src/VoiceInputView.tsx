import { useNavigationIntent } from '@iternio/react-native-auto-play';
import { Text } from 'react-native';

export function VoiceInputView() {
  const { navigationIntent } = useNavigationIntent();

  if (!navigationIntent) {
    return null;
  }

  const { location, query, intent, avoid, mode, entry } = navigationIntent;
  const coordinates = location ? `${location.lat},${location.lon}` : '-';

  return (
    <Text>
      {`Navigation intent: ${intent}, coordinates: ${coordinates}, query: ${query ?? '-'}, avoid: ${avoid.join(',') || '-'}, mode: ${mode ?? '-'}, entry: ${entry ?? '-'}`}
    </Text>
  );
}
