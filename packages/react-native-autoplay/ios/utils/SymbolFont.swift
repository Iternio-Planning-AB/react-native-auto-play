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
        color: UIColor = .black,
        backgroundColor: UIColor = .white,
        canvasSize: Int = defaultCanvasSize
    ) -> UIImage? {
        if !SymbolFont.isRegistered {
            SymbolFont.loadFont()
        }

        guard let fontName = SymbolFont.fontName,
            let font = UIFont(name: fontName, size: size)
        else {
            return nil
        }

        let attributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: color,
        ]

        let codepoint = String(UnicodeScalar(UInt32(glyph))!)
        let attrString = NSAttributedString(
            string: codepoint,
            attributes: attributes
        )
        let canvasSize = CGSize(
            width: canvasSize,
            height: canvasSize
        )
        let rect = CGRect(origin: .zero, size: canvasSize)

        // Start drawing
        UIGraphicsBeginImageContextWithOptions(canvasSize, false, 0)
        guard let context = UIGraphicsGetCurrentContext() else { return nil }

        // Fill background
        context.setFillColor(backgroundColor.cgColor)
        context.fill(rect)

        // Draw glyph
        let textSize = attrString.size()
        let x = (canvasSize.width - textSize.width) / 2
        let y = (canvasSize.height - textSize.height) / 2
        attrString.draw(at: CGPoint(x: x, y: y))

        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()

        return image
    }

    static func imageFromNitroImage(image: NitroImage?) -> UIImage? {
        guard let image else { return nil }

        let color = RCTConvert.uiColor(image.color) ?? .black
        let backgroundColor =
            RCTConvert.uiColor(image.backgroundColor)
            ?? .white

        return SymbolFont.imageFromGlyph(
            glyph: image.glyph,
            size: image.size,
            color: color,
            backgroundColor: backgroundColor
        )!
    }

    static func imageFromLanes(
        laneImages: [LaneImage],
        size: Int,
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
                color: RCTConvert.uiColor(laneImage.color),
                backgroundColor: UIColor.clear,
                canvasSize: Int(size)
            )!
            image.draw(
                in: CGRect(
                    x: xOffset,
                    y: 0,
                    width: Int(image.size.width),
                    height: Int(image.size.height)
                )
            )
            xOffset += Int(size)
        }
        return UIGraphicsGetImageFromCurrentImageContext()!
    }
}
