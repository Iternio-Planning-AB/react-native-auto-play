//
//  PinBitmapRenderer.swift
//  Pods
//

import NitroModules
import UIKit

/// Colors of the default pin renderer, each resolved from the template config with a fallback.
struct PinColors {
    let available: UIColor
    let busy: UIColor
    let inactive: UIColor
    let highlight: UIColor

    private static let defaultAvailable = UIColor(red: 0.0, green: 0.502, blue: 0.0, alpha: 1.0)
    private static let defaultBusy = UIColor(red: 0.969, green: 0.839, blue: 0.329, alpha: 1.0)
    private static let defaultInactive = UIColor(red: 0.667, green: 0.667, blue: 0.667, alpha: 1.0)
    private static let defaultHighlight = UIColor(red: 1.0, green: 0.4, blue: 0.0, alpha: 1.0)

    static func from(
        _ config: NitroPointOfInterestColors?,
        traitCollection: UITraitCollection?
    ) -> PinColors {
        return PinColors(
            available: resolve(config?.available, fallback: defaultAvailable, traitCollection: traitCollection),
            busy: resolve(config?.busy, fallback: defaultBusy, traitCollection: traitCollection),
            inactive: resolve(config?.inactive, fallback: defaultInactive, traitCollection: traitCollection),
            highlight: resolve(config?.highlight, fallback: defaultHighlight, traitCollection: traitCollection)
        )
    }

    /// `Parser.parseColor` returns a dynamic color, but the pin is drawn into a bitmap and needs
    /// a concrete one. Without a connected scene there is no trait collection to resolve against,
    /// so fall back to the dark variant — same as `Parser.parseColor` itself does.
    private static func resolve(
        _ color: NitroColor?,
        fallback: UIColor,
        traitCollection: UITraitCollection?
    ) -> UIColor {
        guard let color else { return fallback }

        let dynamicColor = Parser.parseColor(color: color)
        return dynamicColor.resolvedColor(
            with: traitCollection ?? UITraitCollection(userInterfaceStyle: .unspecified)
        )
    }

    var cacheKey: String {
        return [available, busy, inactive, highlight].map { color in
            var red: CGFloat = 0
            var green: CGFloat = 0
            var blue: CGFloat = 0
            var alpha: CGFloat = 0
            _ = color.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
            return "\(red)-\(green)-\(blue)-\(alpha)"
        }.joined(separator: ",")
    }
}

/// Renders map-pin images for a `PointOfInterestTemplate`, mirroring the Android
/// `PinBitmapRenderer`.
///
/// This is an opinionated default (status colors + an "available/count" label, matching a
/// three-state availability model) rather than a generic pin API — apps with a different
/// marker model will want their own renderer with the same shape.
enum PinBitmapRenderer {
    private static let size: CGFloat = 70
    private static let mainRadius: CGFloat = 28
    private static let badgeRadius: CGFloat = 9
    private static let badgeCenterX = size - badgeRadius - 4
    private static let badgeCenterY = badgeRadius + 4

    private static let cache: NSCache<NSString, UIImage> = {
        let cache = NSCache<NSString, UIImage>()
        cache.countLimit = 50
        return cache
    }()

    /// - Parameters:
    ///   - status: one of `available`, `busy`, or `inactive`
    ///   - available: current-vs-total counter shown as the pin's label (ignored when inactive)
    ///   - total: denominator for `available`
    ///   - hasBadge: whether to draw the secondary badge circle
    ///   - isHighlighted: whether to draw the highlight ring, e.g. for a favorited item
    ///   - colors: the colors to draw with, see `PinColors.from`
    static func render(
        status: PointOfInterestStatus,
        available: Int,
        total: Int,
        hasBadge: Bool,
        isHighlighted: Bool,
        colors: PinColors
    ) -> UIImage {
        let cacheKey = "\(status.stringValue)-\(available)-\(total)-\(hasBadge)-\(isHighlighted)-\(colors.cacheKey)"
        if let cached = cache.object(forKey: cacheKey as NSString) {
            return cached
        }

        let pinColor: UIColor
        switch status {
        case .available:
            pinColor = colors.available
        case .busy:
            pinColor = colors.busy
        case .inactive:
            pinColor = colors.inactive
        }

        let center = CGPoint(x: size / 2, y: size / 2)

        let renderer = UIGraphicsImageRenderer(size: CGSize(width: size, height: size))
        let image = renderer.image { _ in
            let circle = UIBezierPath(
                ovalIn: CGRect(
                    x: center.x - mainRadius,
                    y: center.y - mainRadius,
                    width: mainRadius * 2,
                    height: mainRadius * 2
                )
            )
            pinColor.setFill()
            circle.fill()

            if isHighlighted {
                let ring = UIBezierPath(
                    arcCenter: center,
                    radius: mainRadius * 0.94,
                    startAngle: 0,
                    endAngle: .pi * 2,
                    clockwise: true
                )
                ring.lineWidth = mainRadius * 0.12
                colors.highlight.setStroke()
                ring.stroke()
            }

            if status == .inactive {
                let cross = UIBezierPath()
                let d: CGFloat = 12
                cross.move(to: CGPoint(x: center.x - d, y: center.y - d))
                cross.addLine(to: CGPoint(x: center.x + d, y: center.y + d))
                cross.move(to: CGPoint(x: center.x + d, y: center.y - d))
                cross.addLine(to: CGPoint(x: center.x - d, y: center.y + d))
                cross.lineWidth = 5
                cross.lineCapStyle = .round
                UIColor.white.setStroke()
                cross.stroke()
            } else {
                let text = "\(available)/\(total)"
                let textColor: UIColor = status == .busy ? .black : .white
                let attributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.boldSystemFont(ofSize: 14),
                    .foregroundColor: textColor,
                ]
                let textSize = text.size(withAttributes: attributes)
                text.draw(
                    at: CGPoint(
                        x: center.x - textSize.width / 2,
                        y: center.y - textSize.height / 2
                    ),
                    withAttributes: attributes
                )
            }

            if hasBadge {
                let badge = UIBezierPath(
                    ovalIn: CGRect(
                        x: badgeCenterX - badgeRadius,
                        y: badgeCenterY - badgeRadius,
                        width: badgeRadius * 2,
                        height: badgeRadius * 2
                    )
                )
                pinColor.setFill()
                badge.fill()
                UIColor.white.setStroke()
                badge.lineWidth = 1.5
                badge.stroke()

                let plusAttributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.boldSystemFont(ofSize: badgeRadius),
                    .foregroundColor: UIColor.white,
                ]
                let plusSize = "+".size(withAttributes: plusAttributes)
                "+".draw(
                    at: CGPoint(
                        x: badgeCenterX - plusSize.width / 2,
                        y: badgeCenterY - plusSize.height / 2
                    ),
                    withAttributes: plusAttributes
                )
            }
        }

        cache.setObject(image, forKey: cacheKey as NSString)

        return image
    }
}
