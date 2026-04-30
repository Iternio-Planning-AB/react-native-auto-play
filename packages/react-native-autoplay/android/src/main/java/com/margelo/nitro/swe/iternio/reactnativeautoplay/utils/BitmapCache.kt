package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

import android.graphics.Bitmap
import android.util.LruCache
import androidx.car.app.CarContext
import com.margelo.nitro.swe.iternio.reactnativeautoplay.AssetImage
import com.margelo.nitro.swe.iternio.reactnativeautoplay.GlyphImage
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroColor
import com.margelo.nitro.swe.iternio.reactnativeautoplay.RemoteImage

object BitmapCache {
    private val maxMemory = Runtime.getRuntime().maxMemory()
    private val cacheSize = minOf(maxMemory / 8, 8388608).toInt() //limit cache to 8 megabyte

    private val bitmapCache = object : LruCache<String, Bitmap>(cacheSize) {
        override fun sizeOf(key: String, bitmap: Bitmap): Int {
            return bitmap.byteCount
        }
    }

    fun get(context: CarContext, image: GlyphImage): Bitmap? {
        val key = image.cacheKey(context)
        return get(key)
    }

    fun put(context: CarContext, image: GlyphImage, bitmap: Bitmap) {
        val key = image.cacheKey(context)
        put(key, bitmap)
    }

    fun get(context: CarContext, image: AssetImage): Bitmap? {
        val key = image.cacheKey(context)
        return get(key)
    }

    fun put(context: CarContext, image: AssetImage, bitmap: Bitmap) {
        val key = image.cacheKey(context)
        put(key, bitmap)
    }

    fun get(context: CarContext, image: RemoteImage): Bitmap? {
        val key = image.cacheKey(context)
        return get(key)
    }

    fun put(context: CarContext, image: RemoteImage, bitmap: Bitmap) {
        val key = image.cacheKey(context)
        put(key, bitmap)
    }

    private fun get(key: String): Bitmap? {
        synchronized(bitmapCache) {
            return bitmapCache.get(key)
        }
    }

    private fun put(key: String, bitmap: Bitmap) {
        synchronized(bitmapCache) {
            bitmapCache.put(key, bitmap)
        }
    }
}

fun NitroColor.get(context: CarContext): Int =
    if (context.isDarkMode) this.darkColor.toInt() else this.lightColor.toInt()

fun AssetImage.cacheKey(context: CarContext): String =
    this.color?.let { "${this.uri}/${it.get(context)}" } ?: run { this.uri }

fun RemoteImage.cacheKey(context: CarContext): String =
    this.color?.let { "${this.uri}/${it.get(context)}" } ?: run { this.uri }

fun GlyphImage.cacheKey(context: CarContext): String =
    "$fontName/$glyph/${color.get(context)}/${backgroundColor.get(context)}/$fontScale"