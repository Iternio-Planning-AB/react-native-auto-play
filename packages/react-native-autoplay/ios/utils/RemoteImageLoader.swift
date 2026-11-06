//
//  RemoteImageLoader.swift
//  Pods
//

import ImageIO
import UIKit

/// Downloads and caches remote images.
///
/// Without a placeholder an uncached image blocks the template build until it is downloaded or
/// the timeout hits. With a placeholder the template is built right away and the download runs in
/// the background. The loader remembers which templates asked for the image while they were built
/// (see `AutoPlayTemplate.invalidate`) and redraws those still in the template store once it is
/// available. Templates popped in the meantime are skipped, the image just stays in the cache.
enum RemoteImageLoader {
    private static let cache: NSCache<NSString, UIImage> = {
        let cache = NSCache<NSString, UIImage>()
        cache.countLimit = 50
        cache.totalCostLimit = 8 * 1024 * 1024  // 8 MB, matching Android's BitmapCache
        return cache
    }()

    /// Shared session — long-lived by design; failed tasks don't invalidate it.
    private static let session = URLSession(configuration: .default)

    /// How long a template build waits for an image without placeholder.
    static let defaultBlockingTimeoutSeconds: TimeInterval = 0.5

    /// How long a background download may take before the placeholder stays.
    static let defaultBackgroundTimeoutSeconds: TimeInterval = 10

    /// A failed background download is not retried before this, otherwise every redraw of a
    /// template would start a new download for a broken URL.
    private static let failureRetryIntervalSeconds: TimeInterval = 30

    /// A finished download is not repeated before this. The redraw it triggers should find the
    /// image in the cache, if the cache dropped it already the placeholder stays rather than
    /// downloading and redrawing in a loop.
    private static let loadedRetryIntervalSeconds: TimeInterval = 10

    /// Downloads finishing close together are drawn in one go.
    private static let redrawDelaySeconds: TimeInterval = 0.1

    private static let lock = NSLock()
    /// cache key -> ids of the templates that showed its placeholder while it downloads
    private static var waitingTemplateIds: [String: Set<String>] = [:]
    private static var failedAt: [String: Date] = [:]
    private static var loadedAt: [String: Date] = [:]
    private static var templateIdsToRedraw = Set<String>()

    private static let templateIdKey = "ReactNativeAutoPlayRemoteImageTemplateId"

    private static func locked<T>(_ body: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return body()
    }

    /// Remote images parsed in `body` are redrawn on the template `templateId` once downloaded.
    /// Thread local, parsing can happen on any thread.
    static func withTemplate<T>(_ templateId: String?, _ body: () throws -> T) rethrows -> T {
        let dictionary = Thread.current.threadDictionary
        let previous = dictionary[templateIdKey]
        dictionary[templateIdKey] = templateId
        defer { dictionary[templateIdKey] = previous }

        return try body()
    }

    private static var currentTemplateId: String? {
        return Thread.current.threadDictionary[templateIdKey] as? String
    }

    /// Blocks until the image is downloaded, `nil` on failure or timeout.
    static func load(
        uri: String,
        timeoutSeconds: TimeInterval,
        maxPixelSize: Int
    ) -> UIImage? {
        let key = cacheKey(uri: uri, maxPixelSize: maxPixelSize)
        if let cached = cache.object(forKey: key as NSString) {
            return cached
        }

        guard let url = URL(string: uri) else { return nil }

        var request = URLRequest(url: url)
        request.timeoutInterval = timeoutSeconds

        var resultData: Data?
        let semaphore = DispatchSemaphore(value: 0)
        let task = session.dataTask(with: request) { data, _, _ in
            resultData = data
            semaphore.signal()
        }
        task.resume()
        if semaphore.wait(timeout: .now() + timeoutSeconds) == .timedOut {
            task.cancel()
            return nil
        }

        guard let data = resultData,
            let image = decodeImage(data: data, maxPixelSize: maxPixelSize)
        else {
            return nil
        }

        store(image: image, key: key)
        return image
    }

    /// Returns the cached image, otherwise `nil` and downloads it in the background for the
    /// template currently being built. Outside of a template build there is nothing to redraw
    /// later, so it blocks like `load(uri:timeoutSeconds:)` instead, for the blocking default:
    /// `timeoutSeconds` only limits the background download and would hold up the update here.
    static func loadInBackground(
        uri: String,
        timeoutSeconds: TimeInterval?,
        maxPixelSize: Int
    ) -> UIImage? {
        let key = cacheKey(uri: uri, maxPixelSize: maxPixelSize)
        if let cached = cache.object(forKey: key as NSString) {
            return cached
        }

        guard let templateId = currentTemplateId else {
            return load(
                uri: uri,
                timeoutSeconds: defaultBlockingTimeoutSeconds,
                maxPixelSize: maxPixelSize
            )
        }

        guard let url = URL(string: uri) else { return nil }

        let startDownload = locked {
            if let failed = failedAt[key] {
                if Date().timeIntervalSince(failed) < failureRetryIntervalSeconds {
                    return false
                }
                failedAt[key] = nil
            }
            if let loaded = loadedAt[key] {
                if Date().timeIntervalSince(loaded) < loadedRetryIntervalSeconds {
                    return false
                }
                loadedAt[key] = nil
            }

            if waitingTemplateIds[key] != nil {
                waitingTemplateIds[key]?.insert(templateId)
                return false
            }

            waitingTemplateIds[key] = [templateId]
            return true
        }

        if !startDownload {
            return nil
        }

        let timeout = timeoutSeconds ?? defaultBackgroundTimeoutSeconds
        let task = session.dataTask(with: URLRequest(url: url)) { data, _, _ in
            let image = data.flatMap { decodeImage(data: $0, maxPixelSize: maxPixelSize) }

            if let image {
                store(image: image, key: key)
            }

            let templateIds = locked {
                if image == nil {
                    failedAt[key] = Date()
                }
                else {
                    loadedAt[key] = Date()
                }
                return waitingTemplateIds.removeValue(forKey: key) ?? []
            }

            // a failed download keeps the placeholder that is shown already
            if image != nil {
                scheduleRedraw(templateIds: templateIds)
            }
        }
        task.resume()

        // URLRequest.timeoutInterval only limits the time between packets, not the whole download
        DispatchQueue.global().asyncAfter(deadline: .now() + timeout) {
            task.cancel()
        }

        return nil
    }

    /// Decodes straight to the downscaled size, a full size photo is never held in memory.
    private static func decodeImage(data: Data, maxPixelSize: Int) -> UIImage? {
        let sourceOptions = [kCGImageSourceShouldCache: false] as CFDictionary
        guard let source = CGImageSourceCreateWithData(data as CFData, sourceOptions) else {
            return nil
        }

        let thumbnailOptions =
            [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceShouldCacheImmediately: true,
                kCGImageSourceThumbnailMaxPixelSize: maxPixelSize,
            ] as CFDictionary

        guard let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, thumbnailOptions) else {
            return nil
        }
        return UIImage(cgImage: cgImage)
    }

    /// An image used at different sizes is cached once per size.
    private static func cacheKey(uri: String, maxPixelSize: Int) -> String {
        return "\(uri)#\(maxPixelSize)"
    }

    private static func store(image: UIImage, key: String) {
        let cost = Int(image.size.width * image.size.height * image.scale * image.scale * 4)
        cache.setObject(image, forKey: key as NSString, cost: cost)
    }

    private static func scheduleRedraw(templateIds: Set<String>) {
        if templateIds.isEmpty {
            return
        }

        let isScheduled = locked {
            let isScheduled = !templateIdsToRedraw.isEmpty
            templateIdsToRedraw.formUnion(templateIds)
            return isScheduled
        }

        if isScheduled {
            return
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + redrawDelaySeconds) {
            let templateIds = locked {
                let templateIds = templateIdsToRedraw
                templateIdsToRedraw.removeAll()
                return templateIds
            }

            TemplateUpdateQueue.post {
                guard let templateStore = SceneStore.getRootScene()?.templateStore else {
                    return
                }

                for templateId in templateIds {
                    // popped templates are gone from the store, the image stays cached for them
                    guard let template = try? templateStore.getTemplate(templateId: templateId)
                    else { continue }

                    template.invalidate()
                }
            }
        }
    }
}
