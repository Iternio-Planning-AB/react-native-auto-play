import { useEffect, useState } from 'react';
import { HybridAutoPlay } from '../hybrid/HybridAutoPlay';
import type { CleanupCallback } from '../types/Event';

type Props = { children: React.ReactNode; moduleName: string };

/**
 * renders the passed children when the specified scene/screen appeared
 * this makes sure child hooks are executed only when the map template is ready
 */
export default function OnAppearedChildRenderer({ children, moduleName }: Props) {
  const [didAppear, setDidAppear] = useState(false);

  useEffect(() => {
    let remove: CleanupCallback | null = HybridAutoPlay.addListenerRenderState(
      moduleName,
      (renderState) => {
        if (renderState === 'didAppear') {
          remove?.();
          remove = null;
          setDidAppear(true);
        }
      }
    );

    return () => {
      remove?.();
      remove = null;
    };
  }, [moduleName]);

  if (didAppear) {
    return children;
  }

  return null;
}
