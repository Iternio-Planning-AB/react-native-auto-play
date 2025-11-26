import { useCallback, useEffect, useState } from 'react';
import { HybridAutoPlay, type Location } from '..';

export const useVoiceInput = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [voiceInputResult, setVoiceInputResult] = useState<
    | {
        coordinates: Location | undefined;
        query: string | undefined;
      }
    | undefined
  >();

  /**
   * Resets the voice input result to undefined. This is useful when you want to clear the voice input result after processing it.
   */
  const resetVoiceInputResult = useCallback(() => {
    setVoiceInputResult(undefined);
  }, []);

  useEffect(() => {
    const removeDidConnect = HybridAutoPlay.addListener('didConnect', () => setIsConnected(true));
    const removeDidDisconnect = HybridAutoPlay.addListener('didDisconnect', () =>
      setIsConnected(false)
    );

    setIsConnected(HybridAutoPlay.isConnected());

    return () => {
      removeDidConnect();
      removeDidDisconnect();
    };
  }, []);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const remove = HybridAutoPlay.addListenerVoiceInput((coordinates, query) => {
      if (coordinates || query) {
        setVoiceInputResult({ coordinates, query });
      } else {
        setVoiceInputResult(undefined);
      }
    });

    return () => {
      remove();
    };
  }, [isConnected]);

  return { voiceInputResult, resetVoiceInputResult };
};
