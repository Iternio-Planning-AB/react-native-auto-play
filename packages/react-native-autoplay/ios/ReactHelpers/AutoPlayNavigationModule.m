#import "AutoPlayNavigationModule.h"
#import <React/RCTUtils.h>
#import <CarPlay/CarPlay.h>
#import <MapKit/MapKit.h>

// Starts CarPlay navigation via MKMapItem, for apps that need to trigger navigation from JS
// while running in the CarPlay scene — UIApplication.shared.open() is blocked there by the
// CarPlay sandbox (FBSOpenApplicationErrorDomain "Request is not trusted").
@implementation AutoPlayNavigationModule

RCT_EXPORT_MODULE(AutoPlayNavigation)

+ (BOOL)requiresMainQueueSetup { return NO; }

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

static CPTemplateApplicationScene *_Nullable findCarPlayScene(void) {
    for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
        if ([scene isKindOfClass:[CPTemplateApplicationScene class]]) {
            return (CPTemplateApplicationScene *)scene;
        }
    }
    return nil;
}

RCT_EXPORT_METHOD(navigate:(double)lat
                  longitude:(double)lon
                  label:(NSString *)label
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
#if TARGET_OS_SIMULATOR
    reject(@"SIMULATOR", @"Navigation not available in CarPlay Simulator", nil);
    return;
#endif

    CPTemplateApplicationScene *scene = findCarPlayScene();
    if (!scene) {
        reject(@"NO_CARPLAY_SCENE", @"CarPlay not connected", nil);
        return;
    }

    CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake(lat, lon);
    MKPlacemark *placemark = [[MKPlacemark alloc] initWithCoordinate:coordinate];
    MKMapItem *mapItem = [[MKMapItem alloc] initWithPlacemark:placemark];
    mapItem.name = label;

    // openInMapsWithLaunchOptions:fromScene:completionHandler: is available since iOS 13.2
    NSDictionary *opts = @{ MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving };
    [mapItem openInMapsWithLaunchOptions:opts fromScene:scene completionHandler:^(BOOL success) {
        if (success) { resolve(nil); }
        else { reject(@"OPEN_FAILED", @"Failed to open Maps", nil); }
    }];
}

@end
