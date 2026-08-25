#import <React/RCTBridgeModule.h>

// Uses RCTBridgeModule (not RCTEventEmitter) for compatibility with the RN new architecture.
// Events are sent via RCTDeviceEventEmitter on the bridge directly.
@interface PointOfInterestModule : NSObject <RCTBridgeModule>
@end
