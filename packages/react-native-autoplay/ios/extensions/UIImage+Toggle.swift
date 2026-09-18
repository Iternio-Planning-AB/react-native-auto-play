//
//  UIImage+Drawables.swift
//  Pods
//
//  Created by Manuel Auer on 10.10.25.
//

import UIKit

extension UIImage {
    static func makeToggleImage(
        enabled: Bool,
        maximumImageSize: CGSize,
        traitCollection: UITraitCollection
    ) -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = traitCollection.displayScale
        let renderer = UIGraphicsImageRenderer(size: maximumImageSize, format: format)
        return renderer.image { ctx in
            // Draw the track as a pill, centered vertically
            let trackHeight = maximumImageSize.height * 0.5
            let trackY = (maximumImageSize.height - trackHeight) / 2
            let trackRect = CGRect(
                x: 0,
                y: trackY,
                width: maximumImageSize.width,
                height: trackHeight
            )
            let trackRadius = trackHeight / 2
            let trackColor = enabled ? UIColor.systemGreen : UIColor.systemGray
            let trackPath = UIBezierPath(
                roundedRect: trackRect,
                cornerRadius: trackRadius
            )
            trackColor.setFill()
            trackPath.fill()

            // Draw the thumb as rounded rectangle taking half the width of the track
            let thumbWidth = maximumImageSize.width / 2
            let thumbHeight = trackHeight - 5
            let thumbY = trackY + (trackHeight - thumbHeight) / 2
            let thumbX =
                enabled
                ? maximumImageSize.width - thumbWidth - 3
                : 3.0
            let thumbRect = CGRect(
                x: thumbX,
                y: thumbY,
                width: thumbWidth,
                height: thumbHeight
            )
            let thumbCornerRadius = thumbHeight / 2
            let thumbPath = UIBezierPath(
                roundedRect: thumbRect,
                cornerRadius: thumbCornerRadius
            )
            UIColor.white.setFill()
            thumbPath.fill()
        }
    }
}
