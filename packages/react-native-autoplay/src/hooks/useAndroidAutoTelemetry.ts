import { useEffect, useState } from 'react';
import { type Permission, PermissionsAndroid } from 'react-native';
import { HybridAndroidAutoTelemetry } from '../hybrid/HybridAndroidAutoTelemetry';
import { HybridAutoPlay } from '../hybrid/HybridAutoPlay';

import type { AndroidAutoPermissions, Telemetry } from '../types/Telemetry';

type Props =
  | {
      /**
       * Can be used to delay asking for permissions if set to false. True by default.
       * Can be used to request other permissions first, so the permission request dialogs do not overlap.
       * @default true
       */
      requestTelemetryPermissions: true;
      /**
       * The permissions to check.
       */
      requiredPermissions: Array<AndroidAutoPermissions>;
      /**
       * Android Automotive specific permission request properties
       */
      automotivePermissionRequest?: {
        /**
         * message to be shown on the permission request screen
         */
        message: string;
        /**
         * primary action button text
         */
        grantButtonText: string;
        /**
         * secondary action button text, if not specified button will not be shown
         */
        cancelButtonText?: string;
      };
      /**
       * set to true in case your build variant targets Android Automotive
       */
      isAndroidAutomotive?: boolean;
    }
  | {
      requestTelemetryPermissions: false | undefined;
      requiredPermissions?: never;
      automotivePermissionRequest?: never;
      isAndroidAutomotive?: boolean;
    };

/**
 * Hook to check if the telemetry permissions are granted. If the permissions are not granted, it will request them from the user.
 *
 * @namespace Android
 * @param requestTelemetryPermissions If true, the telemetry permissions will be requested from the user. Can be set to false initially, in case other permissions need to be requested first, so the permission request dialogs do not overlap.
 * @param requiredPermissions The permissions to check.
 */
export const useAndroidAutoTelemetry = ({
  requestTelemetryPermissions = true,
  requiredPermissions = [],
  automotivePermissionRequest,
  isAndroidAutomotive = false,
}: Props) => {
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(isAndroidAutomotive);

  useEffect(() => {
    if (isAndroidAutomotive) {
      return;
    }

    const removeDidConnect = HybridAutoPlay.addListener('didConnect', () => setIsConnected(true));
    const removeDidDisconnect = HybridAutoPlay.addListener('didDisconnect', () =>
      setIsConnected(false)
    );

    setIsConnected(HybridAutoPlay.isConnected());

    return () => {
      removeDidConnect();
      removeDidDisconnect();
    };
  }, [isAndroidAutomotive]);

  useEffect(() => {
    const checkPermissions = async () => {
      const state = await Promise.all(
        requiredPermissions.map((permission) =>
          PermissionsAndroid.check(permission as Permission).catch(() => false)
        )
      );

      setPermissionsGranted(state.every((granted) => granted));
    };

    void checkPermissions();
  }, [requiredPermissions]);

  useEffect(() => {
    if (!isConnected || !permissionsGranted) {
      return;
    }

    try {
      const remove = HybridAndroidAutoTelemetry?.registerTelemetryListener(setTelemetry);
      return () => remove?.();
    } catch (e) {
      if (e instanceof Error) {
        setError(`${e.name}: ${e.message}\n${e.stack ?? ''}`.trim());
      } else {
        setError(String(e));
      }
    }

    return;
  }, [isConnected, permissionsGranted]);

  useEffect(() => {
    if (!requestTelemetryPermissions || requiredPermissions.length === 0) {
      return;
    }

    if (permissionsGranted !== false) {
      // either wait for permission request to finish or do nothing in case permissions are granted already
      return;
    }

    if (automotivePermissionRequest?.message != null) {
      HybridAndroidAutoTelemetry?.requestAutomotivePermissions(
        requiredPermissions,
        automotivePermissionRequest.message,
        automotivePermissionRequest.grantButtonText,
        automotivePermissionRequest.cancelButtonText
      ).then(({ granted, denied }) => {
        const isGranted = granted.length === requiredPermissions.length;
        setPermissionsGranted(isGranted);

        if (!isGranted) {
          setError(`Android Automotive permissions denied: [${denied.join(',')}]`);
        }
      });
      return;
    }

    // PermissionsAndroid is not aware of Android Auto related permissions
    PermissionsAndroid.requestMultiple(requiredPermissions as Array<Permission>)
      .then((result) => {
        const isGranted = requiredPermissions.every(
          (permission) => result[permission as Permission] === 'granted'
        );
        if (!isGranted) {
          console.warn('Android Auto telemetry permissions not granted');
          return;
        }
        setPermissionsGranted(true);
      })
      .catch((e) => console.error('Android Auto telemetry permissions error', e));
  }, [
    requestTelemetryPermissions,
    requiredPermissions,
    permissionsGranted,
    automotivePermissionRequest?.cancelButtonText,
    automotivePermissionRequest?.grantButtonText,
    automotivePermissionRequest?.message,
  ]);

  return {
    /**
     * null on pending permission check, True if the telemetry permissions are granted, false otherwise.
     */
    permissionsGranted,
    /**
     * The telemetry data, might be a partial update not containing all properties of the regular timed updates.
     * For example gear changes are emitted immediately without all the other telemetry data.
     */
    telemetry,
    /**
     * The error message if the telemetry listener failed to start.
     */
    error,
  };
};
