//
//  RCTLinkingManager+Custom.mm
//  Pods
//  this overrides the original RCTLinkingManager getInitialURL to provide the url the app was started with from a scene delegate
//
//  Created by Manuel Auer on 11.12.25.
//

#import "NitroLinkingManager.h"
#import <React/RCTLinkingManager.h>
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

@implementation RCTLinkingManager (Custom)

RCT_EXPORT_METHOD(getInitialURL:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    NSURL *initialURL = [NitroLinkingManager shared].launchURL;

    if (initialURL) {
        resolve(RCTNullIfNil(initialURL.absoluteString));
        return;
    }
  
    // Fallback to the original implementation
    if (self.bridge.launchOptions[UIApplicationLaunchOptionsURLKey]) {
        initialURL = self.bridge.launchOptions[UIApplicationLaunchOptionsURLKey];
    } else {
        NSDictionary *userActivityDictionary =
            self.bridge.launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey];
        if ([userActivityDictionary[UIApplicationLaunchOptionsUserActivityTypeKey] isEqual:NSUserActivityTypeBrowsingWeb]) {
            initialURL = ((NSUserActivity *)userActivityDictionary[@"UIApplicationLaunchOptionsUserActivityKey"]).webpageURL;
        }
    }
    
    resolve(RCTNullIfNil(initialURL.absoluteString));
}

@end
