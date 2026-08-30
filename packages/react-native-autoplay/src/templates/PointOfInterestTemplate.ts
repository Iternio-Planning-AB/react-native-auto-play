import { DeviceEventEmitter, NativeModules } from 'react-native';
import type { EmitterSubscription } from 'react-native';
import type { PointOfInterest } from '../types/PointOfInterest';

const POIModule = (NativeModules.PointOfInterestModule ?? null) as {
  push(params: object): Promise<string>;
  update(params: object): Promise<void>;
  pop(params: object): Promise<void>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
} | null;

let idCounter = 0;

function serializeItems(items: PointOfInterest[]) {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    line1: item.line1 ?? item.subtitle ?? '',
    line2: item.line2 ?? '',
    subtitle: item.subtitle ?? '',
    lat: item.lat,
    lng: item.lng,
    imageUri: item.imageUri ?? null,
    primaryButtonTitle: item.primaryButtonTitle ?? null,
    distanceMeters: item.distanceMeters ?? 0,
    status: item.status ?? 'Inactive',
    available: item.available ?? 0,
    total: item.total ?? 1,
    hasBadge: item.hasBadge ?? false,
    isHighlighted: item.isHighlighted ?? false,
  }));
}

export type ActionStripConfig = {
  label: string;
  toastMessage: string;
};

export type PointOfInterestTemplateConfig = {
  title: string;
  items: PointOfInterest[];
  actionStrip?: ActionStripConfig;
  onSelectItem?: (id: string) => void;
  onPopped?: () => void;
};

/**
 * A `PlaceListMapTemplate` (Android Auto) / `CPPointOfInterestTemplate` (CarPlay) list of
 * pinned places, e.g. for "find nearby X" flows. Requires the native `PointOfInterestModule`
 * to be linked (autolinked by this package).
 */
export class PointOfInterestTemplate {
  private readonly templateId: string;
  private subscriptions: EmitterSubscription[] = [];

  constructor(private readonly config: PointOfInterestTemplateConfig) {
    this.templateId = `poi_${Date.now()}_${idCounter++}`;
  }

  push(): void {
    if (!POIModule) return;

    if (this.config.onSelectItem) {
      this.subscriptions.push(
        DeviceEventEmitter.addListener('PoiSelectItem', (event: { templateId: string; itemId: string }) => {
          if (event.templateId === this.templateId) {
            this.config.onSelectItem?.(event.itemId);
          }
        })
      );
    }

    if (this.config.onPopped) {
      this.subscriptions.push(
        DeviceEventEmitter.addListener('PoiPopped', (event: { templateId: string }) => {
          if (event.templateId === this.templateId) {
            this.cleanup();
            this.config.onPopped?.();
          }
        })
      );
    }

    const params: Record<string, unknown> = {
      id: this.templateId,
      title: this.config.title,
      items: serializeItems(this.config.items),
    };
    if (this.config.actionStrip) {
      params.actionStrip = this.config.actionStrip;
    }

    POIModule.push(params).catch(() => {});
  }

  updateItems(items: PointOfInterest[], actionStrip?: ActionStripConfig): void {
    if (!POIModule) return;
    const params: Record<string, unknown> = {
      id: this.templateId,
      items: serializeItems(items),
    };
    if (actionStrip) {
      params.actionStrip = actionStrip;
    }
    POIModule.update(params).catch(() => {});
  }

  pop(): void {
    this.cleanup();
    POIModule?.pop({ id: this.templateId }).catch(() => {});
  }

  private cleanup(): void {
    this.subscriptions.forEach((s) => s.remove());
    this.subscriptions = [];
  }
}
