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
    private static var uriFontNames = [String: String]()

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

        if let error = error?.takeUnretainedValue() {
            print("Failed to register Material font: \(error)")
            return
        }

        SymbolFont.materialFontName = font.fullName as? String
        SymbolFont.isMaterialRegistered = true
    }

    private static func uiFont(for image: GlyphImage, size: CGFloat, fontScale: CGFloat) -> UIFont? {
        let pointSize = size * fontScale

        // Priority 1: font registered natively by name
        if let customName = image.customFontName?.trimmingCharacters(in: .whitespacesAndNewlines),
            !customName.isEmpty
        {
            guard let font = UIFont(name: customName, size: pointSize) else {
                print("Custom font '\(customName)' not found — is it added to the app bundle?")
                return nil
            }
            return font
        }

        // Priority 2: font loaded from a require() asset URI
        if let uri = image.customFontUri?.trimmingCharacters(in: .whitespacesAndNewlines),
            !uri.isEmpty
        {
            if let cachedName = uriFontNames[uri] {
                return UIFont(name: cachedName, size: pointSize)
            }
            guard let fontName = registerFont(from: uri) else {
                print("Failed to load font from URI: \(uri)")
                return nil
            }
            uriFontNames[uri] = fontName
            return UIFont(name: fontName, size: pointSize)
        }

        // Default: bundled Material Symbols
        if !SymbolFont.isMaterialRegistered {
            SymbolFont.loadMaterialFont()
        }

        guard let fontName = SymbolFont.materialFontName else {
            return nil
        }

        return UIFont(name: fontName, size: pointSize)
    }

    private static func registerFont(from uri: String) -> String? {
        var fontData: Data?

        // Try loading as a URL (file:// or http:// in dev)
        if let url = URL(string: uri) {
            fontData = try? Data(contentsOf: url)
        }

        // Fallback: look up by file name in the main bundle
        if fontData == nil {
            let fileName = (uri as NSString).lastPathComponent
            let name = (fileName as NSString).deletingPathExtension
            let ext = (fileName as NSString).pathExtension
            if let bundleURL = Bundle.main.url(forResource: name, withExtension: ext) {
                fontData = try? Data(contentsOf: bundleURL)
            }
        }

        guard let data = fontData as? NSData as CFData?,
            let provider = CGDataProvider(data: data),
            let font = CGFont(provider)
        else {
            return nil
        }

        let fontName = font.fullName as? String

        var error: Unmanaged<CFError>?
        CTFontManagerRegisterGraphicsFont(font, &error)
        // Ignore error — font may already be registered from a previous load

        return fontName
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
