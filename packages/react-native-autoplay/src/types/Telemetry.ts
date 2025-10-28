import type { Permission } from 'react-native/types';

export type AndroidAutoPermissions =
  | Permission
  | AndroidAutoTelemetryPermissions
  | AndroidAutomotiveTelemetryPermissions;

export enum AndroidAutoTelemetryPermissions {
  Speed = 'com.google.android.gms.permission.CAR_SPEED',
  Energy = 'com.google.android.gms.permission.CAR_FUEL',
  Odometer = 'com.google.android.gms.permission.CAR_MILEAGE',
}

export enum AndroidAutomotiveTelemetryPermissions {
  Info = 'android.car.permission.CAR_INFO',
  Speed = 'android.car.permission.CAR_SPEED',
  Energy = 'android.car.permission.CAR_ENERGY',
  ExteriorEnvironment = 'android.car.permission.CAR_EXTERIOR_ENVIRONMENT',
  EnergyPorts = 'android.car.permission.CAR_ENERGY_PORTS',
}

export type PermissionRequestResult = { granted: Array<string>; denied: Array<string> } | null;

type NumericTelemetryItem = {
  /**
   * timestamp in seconds when the value was received on native side
   */
  timestamp: number;
  value: number;
};

type StringTelemetryItem = {
  /**
   * timestamp in seconds when the value was received on native side
   */
  timestamp: number;
  value: string;
};

type VehicleTelemetryItem = {
  name?: StringTelemetryItem;
  year?: NumericTelemetryItem;
  manufacturer?: StringTelemetryItem;
};

export type Telemetry = {
  /**
   * Speed in km/h
   */
  speed?: NumericTelemetryItem;
  /**
   * Fuel level in %
   */
  fuelLevel?: NumericTelemetryItem;
  /**
   * Battery level in %
   */
  batteryLevel?: NumericTelemetryItem;
  /**
   * Range in km
   */
  range?: NumericTelemetryItem;
  /**
   * Odometer in km
   */
  odometer?: NumericTelemetryItem;
  /**
   * Vehicle information
   */
  vehicle?: VehicleTelemetryItem;
};
