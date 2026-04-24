import { Platform } from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
import type { RootState } from '../state/store';

export default async function saveVoiceRecording(getState: () => RootState): Promise<string> {
  const recording = getState().audio.recording;

  if (recording == null) {
    console.log('No recording');
    return 'No recording';
  }
  const folderPath =
    Platform.OS === 'ios' ? RNFetchBlob.fs.dirs.DocumentDir : RNFetchBlob.fs.dirs.LegacyDownloadDir;
  const fileName = `recording-${Date.now()}.pcm`;
  const filePath = `${folderPath}/${fileName}`;

  try {
    await RNFetchBlob.fs.writeFile(filePath, recording, 'base64');
    console.log('Saved audio recording successful!');
    return filePath;
  } catch (e) {
    console.log('Error saving audio recording', e);
    return `Failed to save recording ${e}`;
  }
}
