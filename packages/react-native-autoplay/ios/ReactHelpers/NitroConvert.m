//
//  NitroConvert.m
//  Pods
//
//  Created by Manuel Auer on 04.11.25.
//

// this is required for old architecture support since the React pod can not be imported

#import "NitroConvert.h"
#import <React/RCTConvert.h>

@implementation NitroConvert
+ (UIColor *)uiColor:(id)json {
    return [RCTConvert UIColor:json];
}

+ (nonnull UIImage *)uiImage:(nonnull id)json {
    return [RCTConvert UIImage:json];
}
@end
