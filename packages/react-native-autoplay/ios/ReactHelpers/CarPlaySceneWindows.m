//
//  CarPlaySceneWindows.m
//  Pods
//
//  Workaround for -[RCTDevMenu showOnShake], which sends `windows` to every connected scene as if
//  it was a UIWindowScene. The CarPlay scenes are plain UIScenes without it, so shaking the phone
//  while one is connected throws an unrecognized selector exception. Remove once React Native skips
//  scenes that are not UIWindowScenes there.
//
//  An empty array on purpose: RCTAppearance.setColorScheme overrides the user interface style of
//  every window it gets from `windows`, returning the CarPlay windows would make the car surfaces
//  follow the phone app's color scheme instead of the car's day/night mode.
//

#import <React/RCTDefines.h>
#import <UIKit/UIKit.h>
#import <objc/runtime.h>

#if RCT_DEV_MENU

// a class rather than a C constructor: the -ObjC linker flag only keeps object files that define
// Objective-C classes when the pod is linked statically
@interface AutoPlayCarPlaySceneWindows : NSObject
@end

@implementation AutoPlayCarPlaySceneWindows

+ (void)load
{
  NSArray<NSString *> *sceneClassNames = @[
    @"CPTemplateApplicationScene",
    @"CPTemplateApplicationDashboardScene",
    @"CPTemplateApplicationInstrumentClusterScene",
  ];

  for (NSString *className in sceneClassNames) {
    Class sceneClass = NSClassFromString(className);
    // backs off on its own should UIKit ever implement it
    if (sceneClass == nil || [sceneClass instancesRespondToSelector:@selector(windows)]) {
      continue;
    }
    IMP emptyWindows = imp_implementationWithBlock(^NSArray<UIWindow *> *(__unused id scene) {
      return @[];
    });
    class_addMethod(sceneClass, @selector(windows), emptyWindows, "@@:");
  }
}

@end

#endif
