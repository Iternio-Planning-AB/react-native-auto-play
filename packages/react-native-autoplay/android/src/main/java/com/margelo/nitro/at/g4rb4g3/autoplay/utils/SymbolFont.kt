package com.margelo.nitro.at.g4rb4g3.autoplay.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.Typeface
import androidx.car.app.CarContext
import androidx.core.content.res.ResourcesCompat
import androidx.core.graphics.createBitmap
import androidx.core.graphics.drawable.IconCompat
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroImage
import com.margelo.nitro.autoplay.BuildConfig
import com.margelo.nitro.autoplay.R

object SymbolFont {
    const val TAG = "SymbolFont"

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
        color: Int = android.graphics.Color.BLACK,
        backgroundColor: Int = android.graphics.Color.WHITE
    ): Bitmap? {
        loadFont(context)

        val font = typeface ?: run {
            return null
        }

        val virtualScreenDensity = context.resources.displayMetrics.density
        val scale = BuildConfig.SCALE_FACTOR * virtualScreenDensity

        // Minimum recommended image size is 36dp according to https://developers.google.com/cars/design/create-apps/ux-requirements/templated-apps#navigation
        val canvasSize = (36 * scale).toInt()
        val bitmap = createBitmap(canvasSize, canvasSize)
        val canvas = Canvas(bitmap)

        // Fill background
        canvas.drawColor(backgroundColor)

        // Setup text paint
        val paint = Paint().apply {
            typeface = font
            textSize = canvasSize.toFloat()
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

    fun imageFromNitroImage(context: CarContext, image: NitroImage): Bitmap {
        val color =
            (if (context.isDarkMode) image.darkColor?.toInt() else image.lightColor?.toInt())
                ?: android.graphics.Color.BLACK
        val backgroundColor = image.backgroundColor?.toInt() ?: android.graphics.Color.WHITE

        return imageFromGlyph(
            context = context,
            glyph = image.glyph,
            color = color,
            backgroundColor = backgroundColor
        )!!
    }

    fun iconFromNitroImage(context: CarContext, image: NitroImage): IconCompat {
        val bitmap = imageFromNitroImage(context, image)

        return IconCompat.createWithBitmap(bitmap)
    }
}