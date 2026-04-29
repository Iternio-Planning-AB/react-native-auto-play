//
//  MaterialSymbols.swift
//  Pods
//
//  Created by Manuel Auer on 04.10.25.
//

import CoreText
import UIKit

class SymbolFont {
    private static var isMaterialRegistered = false
    private static var materialFontName: String?

    static func loadMaterialFont() {
        let podBundle = Bundle(for: SymbolFont.self)

        guard
            let bundleURL = podBundle.url(
                forResource: "ReactNativeAutoPlay",
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

        SymbolFont.materialFontName = font.fullName as? String
        SymbolFont.isMaterialRegistered = true
    }

    private static func uiFont(for image: GlyphImage, size: CGFloat, fontScale: CGFloat) -> UIFont? {
        let pointSize = size * fontScale

        if let customName = image.customFontName?.trimmingCharacters(in: .whitespacesAndNewlines),
            !customName.isEmpty
        {
            return UIFont(name: customName, size: pointSize)
        }

        if !SymbolFont.isMaterialRegistered {
            SymbolFont.loadMaterialFont()
        }

        guard let fontName = SymbolFont.materialFontName else {
            return nil
        }

        return UIFont(name: fontName, size: pointSize)
    }

    // creates a single color UIImage
    static func imageFromGlyph(
        image: GlyphImage,
        foregroundColor: UIColor,
        backgroundColor: UIColor,
        size: CGFloat,
        fontScale: CGFloat
    ) -> UIImage? {
        guard let font = uiFont(for: image, size: size, fontScale: fontScale) else {
            return nil
        }

        guard let scalar = UnicodeScalar(UInt32(image.glyph)) else {
            return nil
        }
        let codepoint = String(Character(scalar))
        let canvasSize = CGSize(width: size, height: size)
        let rect = CGRect(origin: .zero, size: canvasSize)

        let attributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: foregroundColor,
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

        let uiImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()

        return uiImage
    }

    static func imageFromGlyph(
        image: GlyphImage,
        size: CGFloat,
        foregroundColor: NitroColor,
        backgroundColor: NitroColor,
        fontScale: CGFloat,
        traitCollection: UITraitCollection
    ) -> UIImage? {
        guard
            let lightImage = imageFromGlyph(
                image: image,
                foregroundColor: Parser.doubleToColor(
                    value: foregroundColor.lightColor
                ),
                backgroundColor: Parser.doubleToColor(
                    value: backgroundColor.lightColor
                ),
                size: size,
                fontScale: fontScale
            ),
            let darkImage = imageFromGlyph(
                image: image,
                foregroundColor: Parser.doubleToColor(
                    value: foregroundColor.darkColor
                ),
                backgroundColor: Parser.doubleToColor(
                    value: backgroundColor.darkColor
                ),
                size: size,
                fontScale: fontScale
            )
        else {
            return nil
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
        image: GlyphImage?,
        size: CGFloat = 32,
        noImageAsset: Bool = false,
        traitCollection: UITraitCollection
    ) -> UIImage? {
        guard let image else { return nil }

        let fontScale = image.fontScale ?? 1.0

        if noImageAsset {
            let foregroundColor = Parser.doubleToColor(
                value: traitCollection.userInterfaceStyle == .light
                    ? image.color.lightColor : image.color.darkColor
            )

            let backgroundColor = Parser.doubleToColor(
                value: traitCollection.userInterfaceStyle == .light
                    ? image.backgroundColor.lightColor
                    : image.backgroundColor.darkColor
            )

            return SymbolFont.imageFromGlyph(
                image: image,
                foregroundColor: foregroundColor,
                backgroundColor: backgroundColor,
                size: size,
                fontScale: fontScale
            )
        }

        return SymbolFont.imageFromGlyph(
            image: image,
            size: size,
            foregroundColor: image.color,
            backgroundColor: image.backgroundColor,
            fontScale: fontScale,
            traitCollection: traitCollection
        )
    }
}
