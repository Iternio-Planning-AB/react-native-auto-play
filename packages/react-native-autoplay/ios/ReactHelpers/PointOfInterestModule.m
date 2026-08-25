#import "PointOfInterestModule.h"
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <CarPlay/CarPlay.h>
#import <MapKit/MapKit.h>

@interface PointOfInterestModule () <CPPointOfInterestTemplateDelegate>
@property (nonatomic, strong) NSMutableDictionary<NSString *, CPPointOfInterestTemplate *> *activeTemplates;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSArray<NSString *> *> *itemIdsByTemplateId;
@end

@implementation PointOfInterestModule

RCT_EXPORT_MODULE(PointOfInterestModule)

@synthesize bridge = _bridge;

+ (BOOL)requiresMainQueueSetup { return NO; }

- (instancetype)init {
    self = [super init];
    if (self) {
        _activeTemplates = [NSMutableDictionary new];
        _itemIdsByTemplateId = [NSMutableDictionary new];
    }
    return self;
}

static CPTemplateApplicationScene *_Nullable findCarPlayScene(void) {
    for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
        if ([scene isKindOfClass:[CPTemplateApplicationScene class]]) {
            return (CPTemplateApplicationScene *)scene;
        }
    }
    return nil;
}

/// Returns a shared NSCache for rendered pin images.
static NSCache<NSString *, UIImage *> *pinCache(void) {
    static NSCache *cache;
    static dispatch_once_t token;
    dispatch_once(&token, ^{ cache = [NSCache new]; cache.countLimit = 50; });
    return cache;
}

/// Renders a colored-circle pin matching PinBitmapRenderer's Android counterpart, at 70x70pt.
/// This is an opinionated default (status colors + an "available/total" label) rather than a
/// generic pin API — apps with a different marker model will want their own renderer.
/// status: "Available" | "Busy" | anything else (rendered as inactive)
static UIImage *renderPinImage(NSDictionary *item) {
    NSString *status = item[@"status"] ?: @"Inactive";
    NSInteger available = [item[@"available"] integerValue];
    NSInteger total = MAX(1, [item[@"total"] integerValue]);
    BOOL hasBadge = [item[@"hasBadge"] boolValue];

    NSString *cacheKey = [NSString stringWithFormat:@"%@-%ld-%ld-%d", status, (long)available, (long)total, hasBadge];
    UIImage *cached = [pinCache() objectForKey:cacheKey];
    if (cached) return cached;

    UIColor *pinColor;
    if ([status isEqualToString:@"Available"]) {
        pinColor = [UIColor colorWithRed:0.0f green:0.502f blue:0.0f alpha:1.0f]; // #008000
    } else if ([status isEqualToString:@"Busy"]) {
        pinColor = [UIColor colorWithRed:0.969f green:0.839f blue:0.329f alpha:1.0f]; // #f7d654
    } else {
        pinColor = [UIColor colorWithRed:0.667f green:0.667f blue:0.667f alpha:1.0f]; // #AAAAAA
    }

    const CGFloat sz = 70.0f;
    const CGFloat mainRadius = 28.0f;
    const CGFloat badgeR = 9.0f;
    const CGFloat badgeCx = sz - badgeR - 4.0f;
    const CGFloat badgeCy = badgeR + 4.0f;

    UIGraphicsBeginImageContextWithOptions(CGSizeMake(sz, sz), NO, 0.0f);

    UIBezierPath *circle = [UIBezierPath bezierPathWithOvalInRect:
        CGRectMake(sz / 2 - mainRadius, sz / 2 - mainRadius, mainRadius * 2, mainRadius * 2)];
    [pinColor setFill];
    [circle fill];

    BOOL isKnownStatus = [status isEqualToString:@"Available"] || [status isEqualToString:@"Busy"];
    if (!isKnownStatus) {
        UIBezierPath *cross = [UIBezierPath new];
        CGFloat d = 12.0f;
        [cross moveToPoint:CGPointMake(sz / 2 - d, sz / 2 - d)];
        [cross addLineToPoint:CGPointMake(sz / 2 + d, sz / 2 + d)];
        [cross moveToPoint:CGPointMake(sz / 2 + d, sz / 2 - d)];
        [cross addLineToPoint:CGPointMake(sz / 2 - d, sz / 2 + d)];
        cross.lineWidth = 5.0f;
        cross.lineCapStyle = kCGLineCapRound;
        [[UIColor whiteColor] setStroke];
        [cross stroke];
    } else {
        NSString *txt = [NSString stringWithFormat:@"%ld/%ld", (long)available, (long)total];
        UIFont *font = [UIFont boldSystemFontOfSize:14.0f];
        UIColor *textColor = [status isEqualToString:@"Busy"] ? [UIColor blackColor] : [UIColor whiteColor];
        NSDictionary *attrs = @{ NSFontAttributeName: font, NSForegroundColorAttributeName: textColor };
        CGSize ts = [txt sizeWithAttributes:attrs];
        [txt drawAtPoint:CGPointMake((sz - ts.width) / 2, (sz - ts.height) / 2) withAttributes:attrs];
    }

    if (hasBadge) {
        UIBezierPath *badge = [UIBezierPath bezierPathWithOvalInRect:
            CGRectMake(badgeCx - badgeR, badgeCy - badgeR, badgeR * 2, badgeR * 2)];
        [pinColor setFill];
        [badge fill];
        [[UIColor whiteColor] setStroke];
        badge.lineWidth = 1.5f;
        [badge stroke];

        NSDictionary *plusAttrs = @{
            NSFontAttributeName: [UIFont boldSystemFontOfSize:badgeR],
            NSForegroundColorAttributeName: [UIColor whiteColor],
        };
        CGSize plusSize = [@"+" sizeWithAttributes:plusAttrs];
        [@"+" drawAtPoint:CGPointMake(badgeCx - plusSize.width / 2, badgeCy - plusSize.height / 2) withAttributes:plusAttrs];
    }

    UIImage *img = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    if (img) [pinCache() setObject:img forKey:cacheKey];
    return img;
}

static CPPointOfInterest *buildPOI(NSDictionary *item, UIImage * _Nullable pinImage) {
    double lat = [item[@"lat"] doubleValue];
    double lng = [item[@"lng"] doubleValue];
    CLLocationCoordinate2D coord = CLLocationCoordinate2DMake(lat, lng);
    MKPlacemark *placemark = [[MKPlacemark alloc] initWithCoordinate:coord];
    MKMapItem *mapItem = [[MKMapItem alloc] initWithPlacemark:placemark];
    mapItem.name = item[@"title"] ?: @"";

    NSString *line1 = item[@"line1"] ?: item[@"subtitle"] ?: @"";
    NSString *line2 = item[@"line2"];

    CPPointOfInterest *poi = [[CPPointOfInterest alloc]
        initWithLocation:mapItem
                   title:item[@"title"] ?: @""
                subtitle:line1
                 summary:line2.length > 0 ? line2 : nil
             detailTitle:nil
          detailSubtitle:nil
           detailSummary:nil
                pinImage:pinImage];

    return poi;
}

RCT_EXPORT_METHOD(push:(NSDictionary *)params
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    NSString *templateId = params[@"id"] ?: [[NSUUID UUID] UUIDString];
    NSString *title = params[@"title"] ?: @"";
    NSArray *itemDicts = params[@"items"] ?: @[];

    NSMutableArray<CPPointOfInterest *> *pois = [NSMutableArray new];
    NSMutableArray<NSString *> *itemIds = [NSMutableArray new];

    for (NSDictionary *item in itemDicts) {
        UIImage *pinImage = renderPinImage(item);
        [pois addObject:buildPOI(item, pinImage)];
        [itemIds addObject:item[@"id"] ?: @""];
    }

    if (pois.count == 0) {
        reject(@"EMPTY_POIS", @"CPPointOfInterestTemplate requires at least 1 POI", nil);
        return;
    }

    dispatch_async(dispatch_get_main_queue(), ^{
        @try {
        CPTemplateApplicationScene *scene = findCarPlayScene();
        if (!scene) {
            reject(@"NO_CARPLAY_SCENE", @"CarPlay not connected", nil);
            return;
        }

        CPPointOfInterestTemplate *poiTemplate =
            [[CPPointOfInterestTemplate alloc] initWithTitle:title
                                           pointsOfInterest:pois
                                              selectedIndex:NSNotFound];
        // AutoPlayInterfaceController.templateWillAppear reads template.userInfo["id"] and
        // force-unwraps it — this is required, not optional. Without it the app crashes with
        // EXC_BREAKPOINT (SIGTRAP).
        poiTemplate.userInfo = @{ @"id": templateId };
        poiTemplate.pointOfInterestDelegate = self;

        self.activeTemplates[templateId] = poiTemplate;
        self.itemIdsByTemplateId[templateId] = itemIds;

        [scene.interfaceController pushTemplate:poiTemplate animated:YES completion:^(BOOL success, NSError *error) {
            if (success) {
                resolve(templateId);
            } else {
                NSLog(@"[PointOfInterestModule] pushTemplate failed: %@ — %@", error.domain, error.localizedDescription);
                [self.activeTemplates removeObjectForKey:templateId];
                [self.itemIdsByTemplateId removeObjectForKey:templateId];
                reject(@"PUSH_ERROR", error.localizedDescription ?: @"Failed to push", error);
            }
        }];
        } @catch (NSException *ex) {
            NSLog(@"[PointOfInterestModule] push exception: %@ — %@", ex.name, ex.reason);
            reject(@"EXCEPTION", ex.reason ?: @"Unknown exception in push", nil);
        }
    });
}

RCT_EXPORT_METHOD(update:(NSDictionary *)params
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    NSString *templateId = params[@"id"];
    NSArray *itemDicts = params[@"items"] ?: @[];

    NSMutableArray<CPPointOfInterest *> *pois = [NSMutableArray new];
    NSMutableArray<NSString *> *itemIds = [NSMutableArray new];

    for (NSDictionary *item in itemDicts) {
        UIImage *pinImage = renderPinImage(item);
        [pois addObject:buildPOI(item, pinImage)];
        [itemIds addObject:item[@"id"] ?: @""];
    }

    dispatch_async(dispatch_get_main_queue(), ^{
        CPPointOfInterestTemplate *poiTemplate = self.activeTemplates[templateId];
        if (!poiTemplate) {
            reject(@"NOT_FOUND", @"Template not found", nil);
            return;
        }
        self.itemIdsByTemplateId[templateId] = itemIds;
        [poiTemplate setPointsOfInterest:pois selectedIndex:NSNotFound];
        resolve(nil);
    });
}

RCT_EXPORT_METHOD(pop:(NSDictionary *)params
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *templateId = params[@"id"];
        [self.activeTemplates removeObjectForKey:templateId];
        [self.itemIdsByTemplateId removeObjectForKey:templateId];

        CPTemplateApplicationScene *scene = findCarPlayScene();
        if (!scene) {
            reject(@"NO_CARPLAY_SCENE", @"CarPlay not connected", nil);
            return;
        }
        [scene.interfaceController popTemplateAnimated:YES completion:^(BOOL success, NSError *error) {
            if (success) { resolve(nil); }
            else { reject(@"POP_ERROR", error.localizedDescription ?: @"Failed to pop", error); }
        }];
    });
}

#pragma mark - CPPointOfInterestTemplateDelegate

- (void)pointOfInterestTemplate:(CPPointOfInterestTemplate *)poiTemplate
         didSelectPointOfInterest:(CPPointOfInterest *)pointOfInterest
{
    NSString *templateId = nil;
    NSString *itemId = nil;

    for (NSString *tid in self.activeTemplates) {
        if (self.activeTemplates[tid] == poiTemplate) {
            templateId = tid;
            NSArray *ids = self.itemIdsByTemplateId[tid];
            NSUInteger idx = [poiTemplate.pointsOfInterest indexOfObject:pointOfInterest];
            if (idx != NSNotFound && idx < ids.count) {
                itemId = ids[idx];
            }
            break;
        }
    }

    if (templateId && itemId) {
        [self.bridge.eventDispatcher sendDeviceEventWithName:@"PoiSelectItem"
            body:@{ @"templateId": templateId, @"itemId": itemId }];
    }
}

- (void)pointOfInterestTemplate:(CPPointOfInterestTemplate *)poiTemplate
            didChangeMapRegion:(MKCoordinateRegion)region
{
    // Not used currently — reserved for future region-based refresh
}

@end
