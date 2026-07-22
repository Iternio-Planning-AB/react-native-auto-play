import type { HybridObject } from 'react-native-nitro-modules';
import type { CleanupCallback } from '../types/Event';
import type { WindowInformation } from '../types/RootComponent';

/**
 * Android-only access to render-surface window dimensions. On iOS this module does not exist —
 * use the platform-split `HybridAndroidWindowInformation` wrapper which resolves to `null` there.
 */
export interface AndroidWindowInformation extends HybridObject<{ android: 'kotlin' }> {
  /**
   * callback for window dimension changes, fired when the host recreates the render surface
   * with a different size (some head units run Android Auto windowed and resize it at runtime).
   * Root components rendered via a template's `component` prop do NOT need this — their
   * `window` prop is kept up to date automatically. Use this listener only for
   * size-dependent logic living outside a root component.
   * Fires with the last known window information immediately if the surface is already initialized.
   * @param moduleName one of @AutoPlayModules or a cluster scene uuid
   * @namespace Android
   */
  addWindowInformationListener(
    moduleName: string,
    callback: (window: WindowInformation) => void
  ): CleanupCallback;
}
