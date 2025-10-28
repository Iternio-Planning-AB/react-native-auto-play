import { useEffect, useState } from 'react';
import { type Permission, PermissionsAndroid, Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import { HybridAutoPlay } from '..';
import type { HybridAndroidAutoTelemetry as NitroHybridAndroidAutoTelemetry } from '../specs/HybridAndroidAutoTelemetry.nitro';
import type { AndroidAutoPermissions, Telemetry } from '../types/Telemetry';

const HybridAndroidAutoTelemetry =
  Platform.OS === 'android'
    ? NitroModules.createHybridObject<NitroHybridAndroidAutoTelemetry>('HybridAndroidAutoTelemetry')
    : null;

interface Props {
  /**
   * Can be used to delay asking for permissions if set to false. True by default.
   * Can be used to request other permissions first, so the permission request dialogs do not overlap.
   * @default true
   */
  requestTelemetryPermissions?: boolean;
  /**
   * The permissions to check.
   */
  requiredPermissions: Array<AndroidAutoPermissions>;
}

/**
 * Hook to check if the telemetry permissions are granted. If the permissions are not granted, it will request them from the user.
 *
 * @namespace Android
 * @param requestTelemetryPermissions If true, the telemetry permissions will be requested from the user. Can be set to false initially, in case other permissions need to be requested first, so the permission request dialogs do not overlap.
 * @param requiredPermissions The permissions to check.
 */
export const useAndroidAutoTelemetry = ({
  requestTelemetryPermissions = true,
  requiredPermissions,
}: Props) => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
    const checkPermissions = async () => {
      const state = await Promise.all(
        requiredPermissions.map((permission) =>
          PermissionsAndroid.check(permission as Permission).catch(() => false)
        )
      );

      setPermissionsGranted(state.every((granted) => granted));
    };

    checkPermissions();
  }, [requiredPermissions]);

  useEffect(() => {
    if (!isConnected || !permissionsGranted) {
      return;
    }

    const remove = HybridAndroidAutoTelemetry?.registerTelemetryListener(
      (tlm: Telemetry | null, errorMessage: string | null) => {
        setError(errorMessage);
        setTelemetry(tlm);
      }
    );

    return () => {
      remove?.();
    };
  }, [isConnected, permissionsGranted]);

  useEffect(() => {
    if (requestTelemetryPermissions && requiredPermissions.length > 0) {
      // PermissionsAndroid is not aware of automotive permissions
      PermissionsAndroid.requestMultiple(requiredPermissions as Array<Permission>)
        .then((value) => {
          const isGranted = requiredPermissions.every(
            (permission) => value[permission as Permission] === 'granted'
          );
          if (!isGranted) {
            console.warn('*** Android Auto telemetry permissions not granted');
            return;
          }
          setPermissionsGranted(true);
        })
        .catch((e) => console.error('*** Android Auto telemetry permissions error', e));
    }
    return;
  }, [requestTelemetryPermissions, requiredPermissions]);

  return {
    /**
     * True if the telemetry permissions are granted, false otherwise.
     */
    permissionsGranted,
    /**
     * The telemetry data.
     */
    telemetry,
    /**
     * The error message if the telemetry listener failed to start.
     */
    error,
  };
};
