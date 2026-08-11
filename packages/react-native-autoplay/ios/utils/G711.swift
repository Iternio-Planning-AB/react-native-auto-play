import Foundation

/// Encodes 16-bit signed little-endian PCM to G.711 µ-law/A-law (ITU-T reference algorithm).
enum G711 {
    private static let ulawBias = 0x84
    private static let ulawClip = 8159

    private static let ulawExpLut: [Int] = [
        0, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4,
        5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
        6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
        6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
        7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
        7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
        7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
        7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    ]

    private static let alawSegEnd = [0x1F, 0x3F, 0x7F, 0xFF, 0x1FF, 0x3FF, 0x7FF, 0xFFF]

    private static func search(_ value: Int, _ table: [Int]) -> Int {
        for (i, boundary) in table.enumerated() where value <= boundary {
            return i
        }
        return table.count
    }

    private static func linearToUlaw(_ sampleIn: Int) -> UInt8 {
        var sample = sampleIn
        let sign = (sample >> 8) & 0x80
        if sign != 0 { sample = -sample }
        if sample > ulawClip { sample = ulawClip }
        sample += ulawBias
        let exponent = ulawExpLut[(sample >> 7) & 0xFF]
        let mantissa = (sample >> (exponent + 3)) & 0x0F
        var ulawByte = ~(sign | (exponent << 4) | mantissa)
        ulawByte &= 0xFF
        if ulawByte == 0 { ulawByte = 0x02 }
        return UInt8(ulawByte)
    }

    private static func linearToAlaw(_ sampleIn: Int) -> UInt8 {
        var sample = sampleIn >> 3
        let mask: Int
        if sample >= 0 {
            mask = 0xD5
        }
        else {
            mask = 0x55
            sample = -sample - 1
        }

        let seg = search(sample, alawSegEnd)
        let alawByte: Int
        if seg >= 8 {
            alawByte = 0x7F ^ mask
        }
        else {
            var aval = seg << 4
            aval |= seg < 2 ? (sample >> 1) & 0x0F : (sample >> seg) & 0x0F
            alawByte = aval ^ mask
        }
        return UInt8(alawByte & 0xFF)
    }

    /// Encodes 16-bit signed little-endian PCM data to 8-bit G.711. Drops a trailing odd byte, if any.
    private static func encode(_ pcm16le: Data, _ encoding: (Int) -> UInt8) -> Data {
        let sampleCount = pcm16le.count / 2
        var out = [UInt8](repeating: 0, count: sampleCount)
        pcm16le.withUnsafeBytes { (raw: UnsafeRawBufferPointer) in
            for i in 0..<sampleCount {
                let lo = Int(raw[i * 2])
                let hi = Int(Int8(bitPattern: raw[i * 2 + 1]))
                let sample = (hi << 8) | lo
                out[i] = encoding(sample)
            }
        }
        return Data(out)
    }

    static func encodeUlaw(_ pcm16le: Data) -> Data { encode(pcm16le, linearToUlaw) }
    static func encodeAlaw(_ pcm16le: Data) -> Data { encode(pcm16le, linearToAlaw) }
}
