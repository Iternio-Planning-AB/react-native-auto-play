//
//  NitroLinkingManager.h
//  Pods
//
//  Created by Manuel Auer on 11.12.25.
//

#import <Foundation/Foundation.h>

@interface NitroLinkingManager : NSObject

@property (atomic, strong) NSURL *launchURL;
@property (atomic, assign) BOOL initialURLRequested;

+ (instancetype)shared;
- (void)continueUserActivity:(NSUserActivity *)userActivity;
- (void)openURL:(UIOpenURLContext *)urlContext;

@end
