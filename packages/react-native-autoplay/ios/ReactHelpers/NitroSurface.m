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
#import <React/RCTSurfaceHostingProxyRootView.h>

@implementation NitroSurface

+ (void)stop:(nullable UIView *)view {
    if (view == nil) {
        NSLog(@"[AutoPlay] View is nil, ignoring");
        return;
    }

    if ([view isKindOfClass:[RCTSurfaceHostingProxyRootView class]]) {
        RCTSurfaceHostingProxyRootView *rootView =
            (RCTSurfaceHostingProxyRootView *)view;
        RCTSurface *surface = rootView.surface;

        if (surface == nil) {
            NSLog(@"[AutoPlay] surface == nil, cannot stop");
            return;
        }

        [surface stop];
        return;
    }
    
    if ([view isKindOfClass:[RCTRootView class]]) {
        RCTRootView *rootView = (RCTRootView *)view;
        UIView<RCTInvalidating> *contentView = (UIView<RCTInvalidating> *)rootView.contentView;
        
        if ([contentView conformsToProtocol:@protocol(RCTInvalidating)]) {
            [contentView invalidate];
        } else {
            NSLog(@"[AutoPlay] contentView does not conform to RCTInvalidating");
        }
        return;
    }

    NSLog(@"[AutoPlay] View is not recognized type, ignoring");
}

@end
