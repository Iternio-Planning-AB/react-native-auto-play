import { useEffect, useRef, useState } from 'react';
import { HybridAutoPlay } from '..';

/**
 * An effect hook that only runs when the CarPlay/Android Auto screen is visible to the user and dependencies have changed.
 * It behaves like `useEffect`, but the effect function is only executed if the screen is visible.
 *
 * @param moduleName The name of the root module to listen to for focus changes - one of AutoPlayModules or a cluster uuid.
 * @param effect The effect function to run.
 * @param deps An array of dependencies for the effect.
 */
export function useFocusedEffect(
  moduleName: string,
  effect: () => void | (() => void),
  deps: readonly unknown[]
) {
  const [isFocused, setIsFocused] = useState(false);
  const effectRef = useRef(effect);

  useEffect(() => {
    effectRef.current = effect;
  }, [effect]);

  useEffect(() => {
    return HybridAutoPlay.addListenerRenderState(moduleName, (state) => {
      if (state === 'willAppear' || state === 'willDisappear') {
        // react on actual visibility changes only
        return;
      }

      setIsFocused(state === 'didAppear');
    });
  }, [moduleName]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    return effectRef.current();
  }, [isFocused, ...deps]);
}
