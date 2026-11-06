//
//  UIImage+Checkmark.swift
//  Pods
//

import CarPlay
import UIKit

extension UIImage {
    /// Replaces `UIImage.checkmark`, which stays black in dark mode on iOS 27 CarPlay map panels.
    /// The colors match the black or white text of the list row.
    ///
    /// Map panels show accessory images much smaller than regular list templates do, so the same
    /// image can't look right in both and the disc is sized per surface.
    static func makeCheckmarkImage(
        isPanelItem: Bool,
        traitCollection: UITraitCollection
    ) -> UIImage {
        let discScale: CGFloat = isPanelItem ? 0.9 : 0.55
        let displayScaleTrait = UITraitCollection(displayScale: traitCollection.displayScale)

        let imageAsset = UIImageAsset()
        imageAsset.register(
            drawCheckmarkImage(
                discColor: .black,
                checkColor: .white,
                discScale: discScale,
                displayScale: traitCollection.displayScale
            ),
            with: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                displayScaleTrait,
            ])
        )
        imageAsset.register(
            drawCheckmarkImage(
                discColor: .white,
                checkColor: .black,
                discScale: discScale,
                displayScale: traitCollection.displayScale
            ),
            with: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .dark),
                displayScaleTrait,
            ])
        )

        return imageAsset.image(with: traitCollection)
    }

    private static func drawCheckmarkImage(
        discColor: UIColor,
        checkColor: UIColor,
        discScale: CGFloat,
        displayScale: CGFloat
    ) -> UIImage {
        let canvasSize = CPListItem.maximumImageSize
        let format = UIGraphicsImageRendererFormat()
        format.scale = displayScale
        let renderer = UIGraphicsImageRenderer(size: canvasSize, format: format)

        return renderer.image { _ in
            let discSize = min(canvasSize.width, canvasSize.height) * discScale
            let discRect = CGRect(
                x: (canvasSize.width - discSize) / 2,
                y: (canvasSize.height - discSize) / 2,
                width: discSize,
                height: discSize
            )
            discColor.setFill()
            UIBezierPath(ovalIn: discRect).fill()

            let checkPath = UIBezierPath()
            checkPath.move(
                to: CGPoint(
                    x: discRect.minX + discSize * 0.28,
                    y: discRect.minY + discSize * 0.52
                )
            )
            checkPath.addLine(
                to: CGPoint(
                    x: discRect.minX + discSize * 0.44,
                    y: discRect.minY + discSize * 0.68
                )
            )
            checkPath.addLine(
                to: CGPoint(
                    x: discRect.minX + discSize * 0.72,
                    y: discRect.minY + discSize * 0.34
                )
            )
            checkPath.lineWidth = discSize * 0.1
            checkPath.lineCapStyle = .round
            checkPath.lineJoinStyle = .round
            checkColor.setStroke()
            checkPath.stroke()
        }
    }
}
