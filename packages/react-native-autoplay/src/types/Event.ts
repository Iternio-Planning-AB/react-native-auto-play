export type EventName = 'didConnect' | 'didDisconnect';
export type RemoveListener = () => void;
export type VisibilityState = 'willAppear' | 'didAppear' | 'willDisappear' | 'didDisappear';
export type SafeAreaInsets = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  /**
   * legacy layout is considered as anything before Material Expression 3, on these the insets are quite buggy
   * @namespace Android
   */
  isLegacyLayout?: boolean;
};
