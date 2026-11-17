//
//  AutoPlayReactHost.mm
//  Pods
//

#import "AutoPlayReactHost.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTDevMenu.h>
#import <objc/message.h>
// source builds expose the headers as React-RCTAppDelegate, the prebuilt core as React_RCTAppDelegate
#if __has_include(<React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>)
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import <React-RCTAppDelegate/RCTDependencyProvider.h>
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>
#import <React-RCTAppDelegate/RCTRootViewFactory.h>
#else
#import <React_RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import <React_RCTAppDelegate/RCTDependencyProvider.h>
#import <React_RCTAppDelegate/RCTReactNativeFactory.h>
#import <React_RCTAppDelegate/RCTRootViewFactory.h>
#endif

static NSString *const kMainModuleNameKey = @"AutoPlayMainModuleName";
static NSString *const kDelegateClassKey = @"AutoPlayReactNativeDelegateClass";
static NSString *const kFactoryClassKey = @"AutoPlayReactNativeFactoryClass";
static NSString *const kDefaultMainModuleName = @"main";

/// Used when the host does not name its own delegate, matches the react-native app template.
@interface AutoPlayDefaultReactNativeDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@implementation AutoPlayDefaultReactNativeDelegate

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

@implementation AutoPlayReactHost {
  // the factory only keeps a weak reference to its delegate
  id<RCTReactNativeFactoryDelegate> _delegate;
  RCTReactNativeFactory *_factory;
  UIViewController *_mainRootViewController;
  // holds the main component when a CarPlay scene starts React Native before the phone scene
  UIWindow *_launchWindow;
}

+ (instancetype)shared
{
  static AutoPlayReactHost *instance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [AutoPlayReactHost new];
  });
  return instance;
}

+ (nullable NSString *)infoPlistString:(NSString *)key
{
  id value = [[NSBundle mainBundle] objectForInfoDictionaryKey:key];
  if ([value isKindOfClass:[NSString class]] && [(NSString *)value length] > 0) {
    return value;
  }
  return nil;
}

- (NSString *)mainModuleName
{
  return [AutoPlayReactHost infoPlistString:kMainModuleNameKey] ?: kDefaultMainModuleName;
}

- (id<RCTReactNativeFactoryDelegate>)createDelegate
{
  NSString *className = [AutoPlayReactHost infoPlistString:kDelegateClassKey];
  if (className != nil) {
    Class delegateClass = NSClassFromString(className);
    if (delegateClass != nil && [delegateClass conformsToProtocol:@protocol(RCTReactNativeFactoryDelegate)]) {
      return [delegateClass new];
    }
    NSLog(
        @"[AutoPlay] %@ = %@ is not a class conforming to RCTReactNativeFactoryDelegate, using the default delegate",
        kDelegateClassKey,
        className);
    NSAssert(NO, @"[AutoPlay] invalid %@: %@", kDelegateClassKey, className);
  }
  return [AutoPlayDefaultReactNativeDelegate new];
}

/// Expo apps need Expo's factory so its app delegate subscribers and react delegate handlers
/// (expo-updates, dev client) run. Looked up at runtime so this pod does not depend on Expo.
- (Class)factoryClass
{
  NSMutableArray<NSString *> *candidates = [NSMutableArray array];
  NSString *configured = [AutoPlayReactHost infoPlistString:kFactoryClassKey];
  if (configured != nil) {
    [candidates addObject:configured];
  }
  // Swift class without an @objc name, so module qualified. Not EXReactNativeFactory: that is
  // its Objective-C base class, which lacks the react delegate handlers.
  [candidates addObject:@"Expo.ExpoReactNativeFactory"];

  for (NSString *name in candidates) {
    Class cls = NSClassFromString(name);
    if (cls != nil && [cls isSubclassOfClass:[RCTReactNativeFactory class]]) {
      return cls;
    }
  }

  if (configured != nil) {
    NSLog(@"[AutoPlay] %@ = %@ is not an RCTReactNativeFactory subclass", kFactoryClassKey, configured);
    NSAssert(NO, @"[AutoPlay] invalid %@: %@", kFactoryClassKey, configured);
  }
  return [RCTReactNativeFactory class];
}

- (RCTReactNativeFactory *)factory
{
  if (_factory != nil) {
    return _factory;
  }

  _delegate = [self createDelegate];
  if (_delegate.dependencyProvider == nil) {
    // generated into the host app by codegen, so it can only be looked up at runtime
    Class providerClass = NSClassFromString(@"RCTAppDependencyProvider");
    if (providerClass != nil) {
      _delegate.dependencyProvider = (id<RCTDependencyProvider>)[providerClass new];
    }
  }

  Class factoryClass = [self factoryClass];
  Class expoDelegateClass = NSClassFromString(@"Expo.ExpoReactNativeFactoryDelegate");
  if (expoDelegateClass != nil && factoryClass != [RCTReactNativeFactory class] &&
      ![_delegate isKindOfClass:expoDelegateClass]) {
    // Expo's factory calls fatalError on such a delegate when it creates its root view factory
    NSLog(
        @"[AutoPlay] Expo needs an ExpoReactNativeFactoryDelegate subclass, set %@ in your Info.plist",
        kDelegateClassKey);
  }

  _factory = [[factoryClass alloc] initWithDelegate:_delegate];
#if RCT_DEV_MENU
  _factory.devMenuConfiguration = [[RCTDevMenuConfiguration alloc] initWithDevMenuEnabled:YES
                                                                      shakeGestureEnabled:YES
                                                                 keyboardShortcutsEnabled:YES];
#endif

  // ExpoAppDelegate forwards app lifecycle events to the factory it is bound to
  id appDelegate = UIApplication.sharedApplication.delegate;
  SEL bindSelector = NSSelectorFromString(@"bindReactNativeFactory:");
  if ([appDelegate respondsToSelector:bindSelector]) {
    ((void (*)(id, SEL, id))objc_msgSend)(appDelegate, bindSelector, _factory);
  }

  return _factory;
}

/// Libraries such as expo-system-ui, expo-screen-orientation and expo-updates read
/// UIApplication.sharedApplication.delegate.window, which only exists if the AppDelegate declares it.
- (void)mirrorWindowToAppDelegate:(UIWindow *)window
{
  id<UIApplicationDelegate> appDelegate = UIApplication.sharedApplication.delegate;
  if ([appDelegate respondsToSelector:@selector(setWindow:)]) {
    appDelegate.window = window;
  }
}

- (void)start
{
  if (_mainRootViewController != nil) {
    return;
  }

  // what the AppDelegate used to do on launch, the phone scene picks the view controller up later
  _launchWindow = [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
  [self mirrorWindowToAppDelegate:_launchWindow];
  [self.factory startReactNativeWithModuleName:self.mainModuleName inWindow:_launchWindow launchOptions:nil];
  _mainRootViewController = _launchWindow.rootViewController;
}

- (void)startMainInWindow:(UIWindow *)window connectionOptions:(UISceneConnectionOptions *)connectionOptions
{
  [self mirrorWindowToAppDelegate:window];

  if (_launchWindow != nil) {
    // e.g. expo-system-ui sets the window background while only CarPlay is connected
    window.backgroundColor = _launchWindow.backgroundColor;
    _launchWindow = nil;
  }

  if (_mainRootViewController != nil) {
    window.rootViewController = _mainRootViewController;
    [window makeKeyAndVisible];
    return;
  }

  [self.factory startReactNativeWithModuleName:self.mainModuleName
                                      inWindow:window
                             connectionOptions:connectionOptions];
  _mainRootViewController = window.rootViewController;
}

- (UIView *)viewWithModuleName:(NSString *)moduleName initialProperties:(NSDictionary *)initialProperties
{
  RCTReactNativeFactory *factory = self.factory;
  RCTRootViewFactory *rootViewFactory = factory.rootViewFactory;

  // ExpoReactRootViewFactory overrides viewWithModuleName to create the phone root view through
  // Expo's react delegate handlers, superView is the plain React Native implementation
  SEL superViewSelector = NSSelectorFromString(
      @"superViewWithModuleName:initialProperties:launchOptions:bundleConfiguration:devMenuConfiguration:");
  if ([rootViewFactory respondsToSelector:superViewSelector]) {
    return ((UIView * (*)(id, SEL, NSString *, NSDictionary *, NSDictionary *, id, id)) objc_msgSend)(
        rootViewFactory,
        superViewSelector,
        moduleName,
        initialProperties,
        nil,
        factory.bundleConfiguration,
        factory.devMenuConfiguration);
  }

  return [rootViewFactory viewWithModuleName:moduleName
                           initialProperties:initialProperties
                               launchOptions:nil
                         bundleConfiguration:factory.bundleConfiguration
                        devMenuConfiguration:factory.devMenuConfiguration];
}

- (UIView *)nativeBackdropForDisplay:(NSString *)display moduleName:(NSString *)moduleName
{
  id delegate = self.factory.delegate;
  SEL selector = NSSelectorFromString(@"autoPlayNativeBackdropFor:moduleName:");
  if (![delegate respondsToSelector:selector]) {
    return nil;
  }

  id view = ((id (*)(id, SEL, NSString *, NSString *))objc_msgSend)(delegate, selector, display, moduleName);
  if (view != nil && ![view isKindOfClass:[UIView class]]) {
    NSLog(@"[AutoPlay] autoPlayNativeBackdropFor:moduleName: returned %@, expected a UIView", view);
    return nil;
  }
  return view;
}

@end
