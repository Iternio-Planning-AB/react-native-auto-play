package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Typeface
import android.util.Log
import androidx.car.app.CarContext
import androidx.core.content.res.ResourcesCompat
import androidx.core.graphics.createBitmap
import com.margelo.nitro.swe.iternio.reactnativeautoplay.BuildConfig
import com.margelo.nitro.swe.iternio.reactnativeautoplay.GlyphImage
import com.margelo.nitro.swe.iternio.reactnativeautoplay.R
import java.io.File
import java.net.URL

object SymbolFont {
    const val TAG = "SymbolFont"

    private var defaultMaterialTypeface: Typeface? = null
    private val androidResTypefaces = mutableMapOf<String, Typeface>()
    private val uriTypefaces = mutableMapOf<String, Typeface>()

    private fun materialTypeface(context: Context): Typeface? {
        if (defaultMaterialTypeface == null) {
            defaultMaterialTypeface =
                ResourcesCompat.getFont(context, R.font.materialsymbolsoutlined_regular)
        }
        return defaultMaterialTypeface
    }

    private fun typefaceForGlyph(context: Context, image: GlyphImage): Typeface? {
        // Priority 1: font registered natively by name (res/font/)
        val rawName = image.customFontName?.trim().orEmpty()
        if (rawName.isNotEmpty()) {
            val resName = rawName.lowercase()
            androidResTypefaces[resName]?.let {
                return it
            }
            val id = context.resources.getIdentifier(resName, "font", context.packageName)
            if (id == 0) {
                Log.w(TAG, "Custom font resource '$resName' not found in res/font/")
                return null
            }
            val fromRes = ResourcesCompat.getFont(context, id) ?: return null
            androidResTypefaces[resName] = fromRes
            return fromRes
        }

        // Priority 2: font loaded from a require() asset URI
        val uri = image.customFontUri?.trim().orEmpty()
        if (uri.isNotEmpty()) {
            uriTypefaces[uri]?.let { return it }
            val typeface = loadTypefaceFromUri(context, uri)
            if (typeface == null) {
                Log.w(TAG, "Failed to load font from URI: $uri")
                return null
            }
            uriTypefaces[uri] = typeface
            return typeface
        }

        return materialTypeface(context)
    }

    @Suppress("SwallowedException")
    private fun loadTypefaceFromUri(context: Context, uri: String): Typeface? {
        return try {
            when {
                uri.startsWith("file:///android_asset/") -> {
                    val assetPath = uri.removePrefix("file:///android_asset/")
                    Typeface.createFromAsset(context.assets, assetPath)
                }
                uri.startsWith("file://") -> {
                    Typeface.createFromFile(uri.removePrefix("file://"))
                }
                uri.startsWith("/") -> {
                    Typeface.createFromFile(uri)
                }
                uri.startsWith("http://") || uri.startsWith("https://") -> {
                    // Dev mode: font served by Metro bundler
                    val cacheFile = File(context.cacheDir, "font_${uri.hashCode()}.ttf")
                    if (!cacheFile.exists()) {
                        URL(uri).openStream().use { input ->
                            cacheFile.outputStream().use { output ->
                                input.copyTo(output)
                            }
                        }
                    }
                    Typeface.createFromFile(cacheFile)
                }
                else -> {
                    // Try as an asset path
                    Typeface.createFromAsset(context.assets, uri)
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to load font from URI '$uri': ${e.message}")
            null
        }
    }

    private fun imageFromGlyph(
        context: Context,
        image: GlyphImage,
        color: Int,
        backgroundColor: Int,
        cornerRadius: Float = 8f, //TODO: make accessible and add it to GlyphImage.cacheKey
    ): Bitmap? {
        val font =
            typefaceForGlyph(context, image) ?: run {
                return null
            }

        val virtualScreenDensity = context.resources.displayMetrics.density
        val scale = BuildConfig.SCALE_FACTOR * virtualScreenDensity

        // Minimum recommended image size is 36dp according to https://developers.google.com/cars/design/create-apps/ux-requirements/templated-apps#navigation
        val canvasSize = (36 * scale).toInt()
        val bitmap = createBitmap(canvasSize, canvasSize)
        val canvas = Canvas(bitmap)

        val rectF = RectF(0f, 0f, canvasSize.toFloat(), canvasSize.toFloat())
        var paint = Paint().apply {
            this.color = backgroundColor
            isAntiAlias = true
        }
        canvas.drawRoundRect(rectF, cornerRadius, cornerRadius, paint)

        val fontScale = (image.fontScale ?: 1.0).toFloat()

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
        val codepoint = image.glyph.toInt()
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

    fun imageFromNitroImage(context: CarContext, image: GlyphImage): Bitmap? {
        var bitmap = BitmapCache.get(context, image)

        if (bitmap != null) {
            return bitmap
        }

        bitmap =
            imageFromGlyph(
                context = context,
                image = image,
                color = image.color.get(context),
                backgroundColor = image.backgroundColor.get(context),
            )

        bitmap?.let {
            BitmapCache.put(context, image, it)
        }

        return bitmap
    }
}
