import { useEffect, useState } from 'react';
import { HybridAutoPlay } from '../hybrid/HybridAutoPlay';

type Props = { children: React.ReactNode; moduleName: string };

/**
 * renders the passed children when the specified scene/screen appeared
 * this makes sure child hooks are executed only when the map template is ready
 */
export default function OnAppearedChildRenderer({ children, moduleName }: Props) {
  const [didAppear, setDidAppear] = useState(false);

  useEffect(() => {
    const remove = HybridAutoPlay.addListenerRenderState(moduleName, (renderState) => {
      if (renderState === 'didAppear') {
        remove();
        setDidAppear(true);
      }
    });

    return () => remove();
  });

  if (didAppear) {
    return children;
  }

  return null;
}
