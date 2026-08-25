package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import android.graphics.*
import android.util.LruCache

/**
 * Renders map-pin bitmaps for a [PointOfInterestScreen] ([androidx.car.app.model.PlaceListMapTemplate]).
 *
 * Android Auto constraint: `PlaceMarker.TYPE_IMAGE` always renders the provided bitmap inside
 * the default white teardrop pin chrome — there's no API to suppress it. This renderer works
 * with that constraint by producing a flat colored circle that reads cleanly as the badge
 * content inside the white pin shell, instead of competing with it.
 *
 * This is an opinionated default (status colors + an "available/count" label, matching a
 * three-state availability model) rather than a generic pin API — apps with a different
 * marker model will want their own renderer with the same shape.
 *
 * Composition: white pin chrome (host-drawn) → colored circle (this bitmap) → label text.
 */
object PinBitmapRenderer {

    private const val SIZE = 210
    private const val HALF = SIZE / 2f   // 105f

    // Main circle — slightly inset so the highlight ring has room
    private const val MAIN_RADIUS = 84f

    // Secondary badge — small colored circle in the upper-right quadrant
    private const val BADGE_CX = 162f
    private const val BADGE_CY = 48f
    private const val BADGE_R  = 26f

    private val COLOR_AVAILABLE = Color.parseColor("#008000")
    private val COLOR_BUSY      = Color.parseColor("#f7d654")
    private val COLOR_INACTIVE  = Color.parseColor("#AAAAAA")
    private val COLOR_HIGHLIGHT = Color.parseColor("#FF6600")

    private val cache = LruCache<String, Bitmap>(50)

    /**
     * @param status one of `"Available"`, `"Busy"`, or anything else (rendered as inactive)
     * @param available current-vs-total counter shown as the pin's label (ignored when inactive)
     * @param total denominator for [available]
     * @param hasBadge whether to draw the secondary badge circle
     * @param isHighlighted whether to draw the highlight ring (e.g. for a favorited/selected item)
     */
    fun render(
        status: String,
        available: Int,
        total: Int,
        hasBadge: Boolean,
        isHighlighted: Boolean,
    ): Bitmap {
        val key = "$status-$available-$total-$hasBadge-$isHighlighted"
        cache.get(key)?.let { return it }

        val bm = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bm)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)

        val pinColor = when (status) {
            "Available" -> COLOR_AVAILABLE
            "Busy" -> COLOR_BUSY
            else -> COLOR_INACTIVE
        }

        // 1. Main colored circle — fills most of the bitmap
        paint.style = Paint.Style.FILL
        paint.color = pinColor
        canvas.drawCircle(HALF, HALF, MAIN_RADIUS, paint)

        // 2. Highlight ring
        if (isHighlighted) {
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = 10f
            paint.color = COLOR_HIGHLIGHT
            canvas.drawCircle(HALF, HALF, MAIN_RADIUS - 5f, paint)
            paint.style = Paint.Style.FILL
            paint.strokeWidth = 0f
        }

        // 3. Center content
        if (status != "Available" && status != "Busy") {
            // White × to indicate unavailable
            paint.color = Color.WHITE
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = 13f
            paint.strokeCap = Paint.Cap.ROUND
            val d = 28f
            canvas.drawLine(HALF - d, HALF - d, HALF + d, HALF + d, paint)
            canvas.drawLine(HALF + d, HALF - d, HALF - d, HALF + d, paint)
            paint.style = Paint.Style.FILL
            paint.strokeWidth = 0f
        } else {
            val label = "$available/$total"
            paint.color = if (status == "Busy") Color.BLACK else Color.WHITE
            paint.textSize = if (label.length > 3) 50f else 62f
            paint.textAlign = Paint.Align.CENTER
            paint.typeface = Typeface.DEFAULT_BOLD
            canvas.drawText(label, HALF, HALF + paint.textSize * 0.35f, paint)
            paint.typeface = Typeface.DEFAULT
            paint.textAlign = Paint.Align.LEFT
        }

        // 4. Secondary badge — colored circle with a short label in the upper-right
        if (hasBadge) {
            paint.style = Paint.Style.FILL
            paint.color = pinColor
            canvas.drawCircle(BADGE_CX, BADGE_CY, BADGE_R, paint)
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = 3f
            paint.color = Color.WHITE
            canvas.drawCircle(BADGE_CX, BADGE_CY, BADGE_R, paint)
            paint.style = Paint.Style.FILL
            paint.color = Color.WHITE
            paint.textSize = BADGE_R * 0.9f
            paint.textAlign = Paint.Align.CENTER
            paint.typeface = Typeface.DEFAULT_BOLD
            canvas.drawText("+", BADGE_CX, BADGE_CY + paint.textSize * 0.35f, paint)
            paint.typeface = Typeface.DEFAULT
            paint.textAlign = Paint.Align.LEFT
        }

        cache.put(key, bm)
        return bm
    }
}
