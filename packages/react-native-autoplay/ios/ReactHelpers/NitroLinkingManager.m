//
//  NitroLinkingManager.m
//  Pods
//
//  Created by Manuel Auer on 11.12.25.
//

#import "NitroLinkingManager.h"
#import "React/RCTLinkingManager.h"

@implementation NitroLinkingManager

+ (instancetype)shared {
    static NitroLinkingManager *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    return sharedInstance;
}

// Before JS has asked for the initial URL nothing observes RCTLinkingManager's event, so keep the URL for getInitialURL.
// The scene entry points, RCTLinkingManager's app delegate ones return NO for scene based apps
// since react-native 0.88 and drop the URL.
- (void)continueUserActivity:(NSUserActivity *)userActivity scene:(UIScene *)scene {
    if (!self.initialURLRequested && [userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]
        && userActivity.webpageURL != nil) {
        self.launchURL = userActivity.webpageURL;
    }
    [RCTLinkingManager scene:scene continueUserActivity:userActivity];
}

- (void)openURL:(UIOpenURLContext *)urlContext scene:(UIScene *)scene {
    NSURL *url = urlContext.URL;
    if (!self.initialURLRequested && url != nil) {
        self.launchURL = url;
    }

    [RCTLinkingManager scene:scene openURLContexts:[NSSet setWithObject:urlContext]];
}

@end
