package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

/** Encodes 16-bit signed little-endian PCM to G.711 µ-law/A-law (ITU-T reference algorithm). */
object G711 {
    private const val ULAW_BIAS = 0x84
    private const val ULAW_CLIP = 8159

    private val ULAW_EXP_LUT = intArrayOf(
        0, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4,
        5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
        6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
        6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
        7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
        7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
        7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
        7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    )

    private val ALAW_SEG_END = intArrayOf(0x1F, 0x3F, 0x7F, 0xFF, 0x1FF, 0x3FF, 0x7FF, 0xFFF)

    private fun search(value: Int, table: IntArray): Int {
        for (i in table.indices) {
            if (value <= table[i]) return i
        }
        return table.size
    }

    private fun linearToUlaw(sampleIn: Int): Byte {
        var sample = sampleIn
        val sign = (sample shr 8) and 0x80
        if (sign != 0) sample = -sample
        if (sample > ULAW_CLIP) sample = ULAW_CLIP
        sample += ULAW_BIAS
        val exponent = ULAW_EXP_LUT[(sample shr 7) and 0xFF]
        val mantissa = (sample shr (exponent + 3)) and 0x0F
        var ulawByte = (sign or (exponent shl 4) or mantissa).inv()
        if (ulawByte == 0) ulawByte = 0x02
        return ulawByte.toByte()
    }

    private fun linearToAlaw(sampleIn: Int): Byte {
        var sample = sampleIn shr 3
        val mask: Int
        if (sample >= 0) {
            mask = 0xD5
        } else {
            mask = 0x55
            sample = -sample - 1
        }

        val seg = search(sample, ALAW_SEG_END)
        val alawByte = if (seg >= 8) {
            0x7F xor mask
        } else {
            var aval = seg shl 4
            aval = if (seg < 2) aval or ((sample shr 1) and 0x0F) else aval or ((sample shr seg) and 0x0F)
            aval xor mask
        }
        return alawByte.toByte()
    }

    /** Encodes 16-bit signed little-endian PCM bytes to 8-bit G.711. Drops a trailing odd byte, if any. */
    fun encode(pcm16le: ByteArray, encoding: (Int) -> Byte): ByteArray {
        val sampleCount = pcm16le.size / 2
        val out = ByteArray(sampleCount)
        for (i in 0 until sampleCount) {
            val lo = pcm16le[i * 2].toInt() and 0xFF
            val hi = pcm16le[i * 2 + 1].toInt()
            val sample = (hi shl 8) or lo
            out[i] = encoding(sample)
        }
        return out
    }

    fun encodeUlaw(pcm16le: ByteArray): ByteArray = encode(pcm16le, ::linearToUlaw)
    fun encodeAlaw(pcm16le: ByteArray): ByteArray = encode(pcm16le, ::linearToAlaw)
}
