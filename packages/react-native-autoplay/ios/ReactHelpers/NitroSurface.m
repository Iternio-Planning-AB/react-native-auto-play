//
//  NitroSurface.m
//  Pods
//
//  Created by Manuel Auer on 28.11.25.
//

#import "NitroSurface.h"
#import <React/RCTInvalidating.h>
#import <React/RCTRootView.h>
#import <React/RCTSurface.h>
#import <React/RCTSurfaceHostingView.h>

@implementation NitroSurface

+ (void)stop:(nullable UIView *)view {
    if (view == nil) {
        NSLog(@"[AutoPlay] View is nil, ignoring");
        return;
    }

    if ([view isKindOfClass:[RCTSurfaceHostingView class]]) {
        RCTSurfaceHostingView *rootView =
            (RCTSurfaceHostingView *)view;

        if (rootView == nil) {
            NSLog(@"[AutoPlay] rootView == nil, cannot stop");
            return;
        }

        [rootView.surface stop];
        return;
    }

    // a native backdrop puts the React root view into a container next to the backdrop
    for (UIView *subview in view.subviews) {
        if ([subview isKindOfClass:[RCTSurfaceHostingView class]]) {
            [self stop:subview];
            return;
        }
    }

    NSLog(@"[AutoPlay] View is not recognized type, ignoring");
}

@end
