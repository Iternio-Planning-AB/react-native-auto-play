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

- (void)continueUserActivity:(NSUserActivity *)userActivity {
    [RCTLinkingManager application:UIApplication.sharedApplication
              continueUserActivity:userActivity
                restorationHandler:^(NSArray *_Nullable _){
                }];
}

- (void)openURL:(UIOpenURLContext *)urlContext {
    NSURL *url = urlContext.URL;
    NSDictionary<UIApplicationOpenURLOptionsKey, id> *options = @{
        UIApplicationOpenURLOptionsSourceApplicationKey :
                urlContext.options.sourceApplication
            ?: @"",
        UIApplicationOpenURLOptionsAnnotationKey : urlContext.options.annotation
            ?: @""
    };

    [RCTLinkingManager application:UIApplication.sharedApplication
                           openURL:url
                           options:options];
}

@end
