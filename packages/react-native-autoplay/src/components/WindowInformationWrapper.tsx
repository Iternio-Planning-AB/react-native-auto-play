import type React from 'react';
import { createElement, useEffect, useState } from 'react';
import { HybridAndroidWindowInformation } from '../hybrid/HybridAndroidWindowInformation';
import type { RootComponentInitialProps } from '../types/RootComponent';

/**
 * Renders a user-provided root component and keeps its `window` prop up to date when the host
 * recreates the render surface with new dimensions (some head units run Android Auto windowed
 * and resize it at runtime), so consumers can simply read `props.window` without registering a
 * listener themselves.
 * On iOS this only passes the initial props through — CarPlay windows keep their size for the
 * lifetime of a scene, so there is nothing to subscribe to.
 */
export function WindowInformationWrapper({
  moduleName,
  component,
  componentProps,
}: {
  moduleName: string;
  component: React.ComponentType<RootComponentInitialProps>;
  componentProps: RootComponentInitialProps;
}) {
  const [window, setWindow] = useState(componentProps.window);

  useEffect(() => {
    return HybridAndroidWindowInformation?.addWindowInformationListener(moduleName, setWindow);
  }, [moduleName]);

  return createElement(component, { ...componentProps, window });
}
