//
//  AutoPlayReactHost.h
//  Pods
//
//  Owns the single React Native factory of the app, so host apps do not need any React Native
//  code in their AppDelegate. Kept free of React types on purpose: Swift in this pod is compiled
//  with C++ interop (Nitro), which cannot import React_RCTAppDelegate from the prebuilt React core.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface AutoPlayReactHost : NSObject

+ (instancetype)shared;

/// `AutoPlayMainModuleName` from the Info.plist, `main` when not set. Must match the name the app
/// registers with `AppRegistry.registerComponent`.
@property (nonatomic, readonly) NSString *mainModuleName;

/// Starts React Native and mounts the main component off screen, for a CarPlay scene that
/// connects before the phone scene. JS has to run before CarPlay can request its root views.
- (void)start;

/// Mounts the app's main component in the phone window. The view controller is created once and
/// reused when the phone scene connects again, so the React tree survives a scene reconnect.
- (void)startMainInWindow:(UIWindow *)window
        connectionOptions:(nullable UISceneConnectionOptions *)connectionOptions
    NS_SWIFT_NAME(startMain(in:connectionOptions:));

/// Creates a React root view on the shared React instance, starting it if no scene did so before.
- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties
    NS_SWIFT_NAME(view(moduleName:initialProperties:));

/// Asks the host factory delegate for a native view rendered under the React content of a car
/// surface, via the optional `autoPlayNativeBackdropFor:moduleName:` selector.
/// @param display `root`, `dashboard` or `cluster`
- (nullable UIView *)nativeBackdropForDisplay:(NSString *)display
                                   moduleName:(NSString *)moduleName
    NS_SWIFT_NAME(nativeBackdrop(display:moduleName:));

@end

NS_ASSUME_NONNULL_END
