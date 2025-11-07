//
//  NitroConvert.h
//  Pods
//
//  Created by Manuel Auer on 04.11.25.
//

// this is required for old architecture support since the React pod can not be imported

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface NitroConvert : NSObject
+ (UIColor *)uiColor:(id)json;
+ (UIImage *)uiImage:(id)json;
@end

NS_ASSUME_NONNULL_END
