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
