//
//  MaterialSymbols.swift
//  Pods
//
//  Created by Manuel Auer on 04.10.25.
//

import CoreText
import React
import UIKit

class SymbolFont {
    private static let defaultCanvasSize = 32

    private static var isRegistered = false
    private static var fontName: String?

    static func loadFont() {
        let podBundle = Bundle(for: SymbolFont.self)

        guard
            let bundleURL = podBundle.url(
                forResource: "NitroAutoplay",
                withExtension: "bundle"
            ),
            let resourceBundle = Bundle(url: bundleURL),
            let fontURL = resourceBundle.url(
                forResource: "MaterialSymbolsOutlined-Regular",
                withExtension: "ttf"
            )
        else {
            return
        }

        guard let fontData = try? Data(contentsOf: fontURL) as CFData,
            let provider = CGDataProvider(data: fontData),
            let font = CGFont(provider)
        else {
            return
        }

        var error: Unmanaged<CFError>?
        CTFontManagerRegisterGraphicsFont(font, &error)
        if let error = error?.takeUnretainedValue() {
            print("Failed to register font: \(error)")
        } else {
            print("Font \(font.fullName as String? ?? "unknown") registered")
        }

        SymbolFont.fontName = font.fullName as? String
        SymbolFont.isRegistered = true
    }

    static func imageFromGlyph(
        glyph: Double,
        size: CGFloat,
        lightColor: UIColor,
        darkColor: UIColor,
        backgroundColor: UIColor = .white,
        fontScale: CGFloat = 1,
        noImageAsset: Bool = false,
        traitCollection: UITraitCollection
    ) -> UIImage? {
        if !SymbolFont.isRegistered {
            SymbolFont.loadFont()
        }

        guard let fontName = SymbolFont.fontName,
            let font = UIFont(name: fontName, size: size * fontScale)
        else {
            return nil
        }

        let codepoint = String(UnicodeScalar(UInt32(glyph))!)
        let canvasSize = CGSize(width: size, height: size)
        let rect = CGRect(origin: .zero, size: canvasSize)

        // Create a helper function to draw the image with a specific color
        func createImage(with color: UIColor) -> UIImage? {
            let attributes: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: color,
            ]

            let attrString = NSAttributedString(
                string: codepoint,
                attributes: attributes
            )

            // Start drawing
            UIGraphicsBeginImageContextWithOptions(canvasSize, false, 0)
            guard let context = UIGraphicsGetCurrentContext() else {
                return nil
            }

            // Fill circular background
            context.setFillColor(backgroundColor.cgColor)
            context.fillEllipse(in: rect)

            // Draw glyph
            let textSize = attrString.size()
            let x = (canvasSize.width - textSize.width) / 2
            let y = (canvasSize.height - textSize.height) / 2
            attrString.draw(at: CGPoint(x: x, y: y))

            let image = UIGraphicsGetImageFromCurrentImageContext()
            UIGraphicsEndImageContext()

            return image
        }

        // Create images for both light and dark modes
        guard let lightImage = createImage(with: lightColor),
            let darkImage = createImage(with: darkColor)
        else {
            return nil
        }

        if noImageAsset {
            return traitCollection.userInterfaceStyle == .light
                ? lightImage : darkImage
        }

        // Create a UIImageAsset that contains both light and dark variants
        let imageAsset = UIImageAsset()

        // Register the light image for light trait collection
        let lightTraits = UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .light)
        ])
        imageAsset.register(lightImage, with: lightTraits)

        // Register the dark image for dark trait collection
        let darkTraits = UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .dark)
        ])
        imageAsset.register(darkImage, with: darkTraits)

        // Return an image from the asset that will automatically switch based on the interface style
        return imageAsset.image(with: traitCollection)
    }

    static func imageFromNitroImage(
        image: NitroImage?,
        size: CGFloat = 32,
        fontScale: CGFloat = 1,
        noImageAsset: Bool = false,
        traitCollection: UITraitCollection
    ) -> UIImage? {
        guard let image else { return nil }

        let lightColor = RCTConvert.uiColor(image.lightColor) ?? .black
        let darkColor = RCTConvert.uiColor(image.darkColor) ?? .black
        let backgroundColor =
            RCTConvert.uiColor(image.backgroundColor)
            ?? .white

        return SymbolFont.imageFromGlyph(
            glyph: image.glyph,
            size: size,
            lightColor: lightColor,
            darkColor: darkColor,
            backgroundColor: backgroundColor,
            fontScale: fontScale,
            noImageAsset: noImageAsset,
            traitCollection: traitCollection
        )!
    }

    static func imageFromLanes(
        laneImages: Array<NitroImage>.SubSequence,
        size: Int,
        traitCollection: UITraitCollection
    ) -> UIImage {
        let width = size * laneImages.count
        let height = size

        UIGraphicsBeginImageContextWithOptions(
            CGSize(width: width, height: height),
            false,
            0.0
        )
        defer { UIGraphicsEndImageContext() }
        var xOffset = 0
        for laneImage in laneImages {
            let image = imageFromGlyph(
                glyph: laneImage.glyph,
                size: CGFloat(size),
                lightColor: RCTConvert.uiColor(laneImage.lightColor),
                darkColor: RCTConvert.uiColor(laneImage.darkColor),
                backgroundColor: UIColor.clear,
                traitCollection: traitCollection
            )!
            image.draw(
                in: CGRect(
                    x: xOffset,
                    y: 0,
                    width: Int(size),
                    height: Int(size)
                )
            )
            xOffset += Int(size)
        }
        return UIGraphicsGetImageFromCurrentImageContext()!
    }
}
