#import <React/RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

// NOTE: This module exists solely for testing voice input in the example app.
// It is not production-ready and should not be used as a reference implementation.
@interface PCMPlayer : NSObject <RCTBridgeModule>
@end

@implementation PCMPlayer {
    AVAudioPlayer *_player;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup { return NO; }

static void appendUInt32LE(NSMutableData *data, uint32_t value) {
    uint32_t le = CFSwapInt32HostToLittle(value);
    [data appendBytes:&le length:4];
}

static void appendUInt16LE(NSMutableData *data, uint16_t value) {
    uint16_t le = CFSwapInt16HostToLittle(value);
    [data appendBytes:&le length:2];
}

static NSData *buildWav(NSData *pcm, NSInteger sampleRate) {
    NSMutableData *wav = [NSMutableData data];
    uint32_t dataSize = (uint32_t)pcm.length;
    uint32_t byteRate = (uint32_t)(sampleRate * 2); // mono * 16-bit

    [wav appendBytes:"RIFF" length:4];
    appendUInt32LE(wav, 36 + dataSize);
    [wav appendBytes:"WAVE" length:4];
    [wav appendBytes:"fmt " length:4];
    appendUInt32LE(wav, 16);            // chunk size
    appendUInt16LE(wav, 1);             // PCM
    appendUInt16LE(wav, 1);             // mono
    appendUInt32LE(wav, (uint32_t)sampleRate);
    appendUInt32LE(wav, byteRate);
    appendUInt16LE(wav, 2);             // block align
    appendUInt16LE(wav, 16);            // bits per sample
    [wav appendBytes:"data" length:4];
    appendUInt32LE(wav, dataSize);
    [wav appendData:pcm];

    return wav;
}

RCT_EXPORT_METHOD(playPCM:(NSString *)base64
                  sampleRate:(NSInteger)sampleRate
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSData *pcmData = [[NSData alloc] initWithBase64EncodedString:base64 options:0];
    if (!pcmData) {
        reject(@"INVALID_DATA", @"Could not decode base64 PCM data", nil);
        return;
    }

    NSData *wav = buildWav(pcmData, sampleRate);

    NSError *error = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback
                                            mode:AVAudioSessionModeDefault
                                         options:0
                                           error:&error];
    if (error) {
        reject(@"PLAY_ERROR", error.localizedDescription, error);
        return;
    }
    [[AVAudioSession sharedInstance] setActive:YES error:&error];
    if (error) {
        reject(@"PLAY_ERROR", error.localizedDescription, error);
        return;
    }

    _player = [[AVAudioPlayer alloc] initWithData:wav error:&error];
    if (!_player || error) {
        reject(@"PLAY_ERROR", error.localizedDescription, error);
        return;
    }
    [_player play];
    resolve(nil);
}

@end
