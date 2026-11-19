package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Typeface
import androidx.car.app.CarContext
import androidx.core.content.res.ResourcesCompat
import androidx.core.graphics.createBitmap
import com.margelo.nitro.swe.iternio.reactnativeautoplay.BuildConfig
import com.margelo.nitro.swe.iternio.reactnativeautoplay.GlyphBackgroundShape
import com.margelo.nitro.swe.iternio.reactnativeautoplay.GlyphImage

object SymbolFont {
    private var cachedFontName: String? = null
    private var cachedTypeface: Typeface? = null

    private fun loadTypeface(context: Context, fontName: String): Typeface? {
        if (fontName == cachedFontName) return cachedTypeface
        val id = context.resources.getIdentifier(
            fontName.lowercase(), "font", context.packageName
        )
        if (id == 0) return null
        val tf = ResourcesCompat.getFont(context, id) ?: return null
        cachedFontName = fontName
        cachedTypeface = tf
        return tf
    }

    private fun imageFromGlyph(
        context: Context,
        glyphImage: GlyphImage,
        color: Int,
        backgroundColor: Int,
        sizeDp: Int,
    ): Bitmap? {
        val font =
            loadTypeface(context, glyphImage.fontName) ?: run {
                return null
            }

        val virtualScreenDensity = context.resources.displayMetrics.density
        val scale = BuildConfig.SCALE_FACTOR * virtualScreenDensity

        val canvasSize = (sizeDp * scale).toInt()
        val bitmap = createBitmap(canvasSize, canvasSize)
        val canvas = Canvas(bitmap)

        val rectF = RectF(0f, 0f, canvasSize.toFloat(), canvasSize.toFloat())
        var paint = Paint().apply {
            this.color = backgroundColor
            isAntiAlias = true
        }
        if (glyphImage.backgroundShape == GlyphBackgroundShape.CIRCLE) {
            canvas.drawOval(rectF, paint)
        } else {
            // without an explicit radius keep the fixed 8px (not dp) radius used before the
            // background shape became configurable, so existing glyphs look unchanged
            val cornerRadius =
                glyphImage.backgroundCornerRadius?.let { (it * scale).toFloat() }
                    ?: DEFAULT_CORNER_RADIUS_PX
            val radius = cornerRadius.coerceIn(0f, canvasSize / 2f)
            canvas.drawRoundRect(rectF, radius, radius, paint)
        }

        val fontScale = (glyphImage.fontScale ?: 1.0).toFloat()

        // Setup text paint
        paint.reset()
        paint = Paint().apply {
            typeface = font
            textSize = canvasSize.toFloat() * fontScale
            this.color = color
            isAntiAlias = true
            textAlign = Paint.Align.LEFT
        }

        // Get the character from codepoint
        val codepoint = glyphImage.glyph.toInt()
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

    private const val DEFAULT_CORNER_RADIUS_PX = 8f

    // Minimum recommended image size is 36dp according to https://developers.google.com/cars/design/create-apps/ux-requirements/templated-apps#navigation
    const val DEFAULT_SIZE_DP = 36

    /**
     * placeholders stand in for photos that can be drawn much larger than an icon, e.g. in a large
     * grid item, Android Auto blurs an upscaled 36dp glyph there but scales a larger one down cleanly
     */
    const val PLACEHOLDER_SIZE_DP = 96

    fun imageFromNitroImage(
        context: CarContext,
        image: GlyphImage,
        sizeDp: Int = DEFAULT_SIZE_DP
    ): Bitmap? {
        var bitmap = BitmapCache.get(context, image, sizeDp)

        if (bitmap != null) {
            return bitmap
        }

        bitmap =
            imageFromGlyph(
                context = context,
                glyphImage = image,
                color = image.color.get(context),
                backgroundColor = image.backgroundColor.get(context),
                sizeDp = sizeDp,
            )

        bitmap?.let {
            BitmapCache.put(context, image, sizeDp, it)
        }

        return bitmap
    }
}
