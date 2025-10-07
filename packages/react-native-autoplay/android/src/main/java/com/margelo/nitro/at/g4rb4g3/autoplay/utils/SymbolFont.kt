package com.margelo.nitro.at.g4rb4g3.autoplay.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.Typeface
import androidx.core.content.res.ResourcesCompat
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroImage
import androidx.core.graphics.createBitmap
import androidx.core.graphics.drawable.IconCompat
import com.margelo.nitro.autoplay.BuildConfig
import com.margelo.nitro.autoplay.R

object SymbolFont {
    val TAG = "SymbolFont"

    private var typeface: Typeface? = null

    fun loadFont(context: Context) {
        if (typeface != null) {
            return
        }

        typeface = ResourcesCompat.getFont(context, R.font.materialsymbolsoutlined_regular)
    }

    fun imageFromGlyph(
        context: Context,
        glyph: Double,
        size: Float,
        color: Int = android.graphics.Color.BLACK,
        backgroundColor: Int = android.graphics.Color.WHITE
    ): Bitmap? {
        loadFont(context)

        val font = typeface ?: run {
            return null
        }

        val canvasSize = 32
        val bitmap = createBitmap(canvasSize, canvasSize)
        val canvas = Canvas(bitmap)

        // Fill background
        canvas.drawColor(backgroundColor)

        val virtualScreenDensity = context.resources.displayMetrics.density
        val scale = BuildConfig.SCALE_FACTOR * virtualScreenDensity

        // Setup text paint
        val paint = Paint().apply {
            typeface = font
            textSize = size * scale
            this.color = color
            isAntiAlias = true
            textAlign = Paint.Align.LEFT
        }

        // Get the character from codepoint
        val codepoint = glyph.toInt()
        val text = String(Character.toChars(codepoint))

        // Measure text
        val bounds = Rect()
        paint.getTextBounds(text, 0, text.length, bounds)

        // Center the text
        val x = (canvasSize - bounds.width()) / 2f - bounds.left
        val y = (canvasSize - bounds.height()) / 2f - bounds.top

        // Draw text
        canvas.drawText(text, x, y, paint)

        return bitmap
    }

    fun imageFromNitroImage(context: Context, image: NitroImage): Bitmap {
        val color = image.color?.toInt() ?: android.graphics.Color.BLACK
        val backgroundColor = image.backgroundColor?.toInt() ?: android.graphics.Color.WHITE

        return imageFromGlyph(
            context = context,
            glyph = image.glyph,
            size = image.size.toFloat(),
            color = color,
            backgroundColor = backgroundColor
        )!!
    }

    fun iconFromNitroImage(context: Context, image: NitroImage): IconCompat {
        val bitmap = imageFromNitroImage(context, image)

        return IconCompat.createWithBitmap(bitmap)
    }
}