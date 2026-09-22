package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import android.graphics.*
import android.util.LruCache
import androidx.car.app.CarContext
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroPointOfInterestColors
import com.margelo.nitro.swe.iternio.reactnativeautoplay.PointOfInterestStatus
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.get

/**
 * Colors of the default pin renderer, each resolved from the template config with a fallback.
 */
data class PinColors(
    val available: Int,
    val busy: Int,
    val inactive: Int,
    val highlight: Int,
) {
    companion object {
        private val DEFAULT_AVAILABLE = Color.parseColor("#008000")
        private val DEFAULT_BUSY = Color.parseColor("#f7d654")
        private val DEFAULT_INACTIVE = Color.parseColor("#AAAAAA")
        private val DEFAULT_HIGHLIGHT = Color.parseColor("#FF6600")

        fun from(config: NitroPointOfInterestColors?, context: CarContext): PinColors {
            return PinColors(
                available = config?.available?.get(context) ?: DEFAULT_AVAILABLE,
                busy = config?.busy?.get(context) ?: DEFAULT_BUSY,
                inactive = config?.inactive?.get(context) ?: DEFAULT_INACTIVE,
                highlight = config?.highlight?.get(context) ?: DEFAULT_HIGHLIGHT,
            )
        }
    }
}

/**
 * Renders map-pin bitmaps for a [PointOfInterestTemplate] ([androidx.car.app.model.PlaceListMapTemplate]).
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

    private val cache = LruCache<String, Bitmap>(50)

    /**
     * @param status one of `Available`, `Busy`, or `Inactive`
     * @param available current-vs-total counter shown as the pin's label (ignored when inactive)
     * @param total denominator for [available]
     * @param hasBadge whether to draw the secondary badge circle
     * @param isHighlighted whether to draw the highlight ring (e.g. for a favorited/selected item)
     * @param colors the colors to draw with, see [PinColors.from]
     */
    fun render(
        status: PointOfInterestStatus,
        available: Int,
        total: Int,
        hasBadge: Boolean,
        isHighlighted: Boolean,
        colors: PinColors,
    ): Bitmap {
        val colorKey = "${colors.available}-${colors.busy}-${colors.inactive}-${colors.highlight}"
        val key = "$status-$available-$total-$hasBadge-$isHighlighted-$colorKey"
        cache.get(key)?.let { return it }

        val bm = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bm)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)

        val pinColor = when (status) {
            PointOfInterestStatus.AVAILABLE -> colors.available
            PointOfInterestStatus.BUSY -> colors.busy
            PointOfInterestStatus.INACTIVE -> colors.inactive
        }

        // 1. Main colored circle — fills most of the bitmap
        paint.style = Paint.Style.FILL
        paint.color = pinColor
        canvas.drawCircle(HALF, HALF, MAIN_RADIUS, paint)

        // 2. Highlight ring
        if (isHighlighted) {
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = 10f
            paint.color = colors.highlight
            canvas.drawCircle(HALF, HALF, MAIN_RADIUS - 5f, paint)
            paint.style = Paint.Style.FILL
            paint.strokeWidth = 0f
        }

        // 3. Center content
        if (status == PointOfInterestStatus.INACTIVE) {
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
            paint.color = if (status == PointOfInterestStatus.BUSY) Color.BLACK else Color.WHITE
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
