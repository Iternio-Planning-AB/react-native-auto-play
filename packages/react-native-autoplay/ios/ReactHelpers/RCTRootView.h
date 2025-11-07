//
//  RootView.h
//  Pods
//
//  Created by Manuel Auer on 07.11.25.
//

// this is required for old architecture support since the React pod can not be imported

#ifdef RCT_NEW_ARCH_ENABLED

#else

#import <Foundation/Foundation.h>

@protocol RCTInvalidating <NSObject>

- (void)invalidate;

@end

@interface RCTRootView : UIView
/**
 * The React-managed contents view of the root view.
 */
@property(nonatomic, strong, readonly) UIView *contentView;
@end

#endif
