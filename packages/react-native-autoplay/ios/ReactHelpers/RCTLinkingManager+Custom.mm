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
    [NitroLinkingManager shared].initialURLRequested = YES;
    NSURL *initialURL = [NitroLinkingManager shared].launchURL;
    [NitroLinkingManager shared].launchURL = nil;

    // No fallback to the launch options like the original implementation: WindowApplicationSceneDelegate
    // stores the scene's launch URL in NitroLinkingManager already, and the launch options survive a
    // reload, so every new JS instance would get the link that cold started the app again.
    resolve(RCTNullIfNil(initialURL.absoluteString));
}

@end
