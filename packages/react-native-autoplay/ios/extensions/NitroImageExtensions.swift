//
//  NitroImage.swift
//  Pods
//
//  Created by Manuel Auer on 04.11.25.
//

protocol ImageProtocol {
    var glyphImage: GlyphImage? { get }
    var assetImage: AssetImage? { get }
}

extension NitroImage: ImageProtocol {
    var glyphImage: GlyphImage? {
        if case let .first(glyph) = self { return glyph }
        return nil
    }
    var assetImage: AssetImage? {
        if case let .second(asset) = self { return asset }
        return nil
    }
}

extension Variant_GlyphImage_AssetImage: ImageProtocol {
    var glyphImage: GlyphImage? {
        if case let .first(glyph) = self { return glyph }
        return nil
    }
    var assetImage: AssetImage? {
        if case let .second(asset) = self { return asset }
        return nil
    }
}
