package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import com.margelo.nitro.swe.iternio.reactnativeautoplay.AndroidAutoScreen
import com.margelo.nitro.swe.iternio.reactnativeautoplay.AssetImage
import com.margelo.nitro.swe.iternio.reactnativeautoplay.GlyphImage
import com.margelo.nitro.swe.iternio.reactnativeautoplay.RemoteImage
import java.util.concurrent.Executors
import kotlin.math.roundToInt

/**
 * Background downloads for remote images with a placeholder.
 *
 * Without a placeholder an uncached image blocks the template build until it is downloaded or the
 * timeout hits. With a placeholder the template is built right away and the download runs in the
 * background. The loader remembers which templates asked for the image while they were built (see
 * [com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate.render]) and
 * rebuilds those still on screen once it is available. Templates popped in the meantime are
 * skipped, the image just stays in the cache.
 */
object RemoteImageLoader {
    private const val TAG = "RemoteImageLoader"

    /** how long a background download may take before the placeholder stays */
    const val DEFAULT_BACKGROUND_TIMEOUT_MS = 10_000L

    /** how long building a template waits for an uncached image */
    const val DEFAULT_BLOCKING_TIMEOUT_MS = 500L

    /**
     * a failed download is not retried before this, otherwise every rebuild of a template would
     * start a new download for a broken URL
     */
    private const val FAILURE_RETRY_INTERVAL_MS = 30_000L

    /**
     * a finished download is not repeated before this. The rebuild it triggers should find the image
     * in the cache, if the cache dropped it already the placeholder stays rather than downloading and
     * rebuilding in a loop
     */
    private const val LOADED_RETRY_INTERVAL_MS = 10_000L

    /**
     * Android Auto recommends large images to target a 224 x 224 dp bounding box, see
     * https://developer.android.com/reference/androidx/car/app/model/Row#IMAGE_TYPE_LARGE()
     */
    private const val MAX_IMAGE_SIZE_DP = 224

    /**
     * remote images are downscaled to this size (longer side) before they are cached, the car
     * screen never draws them larger and full size photos would not fit the BitmapCache
     */
    fun maxImageSizePx(context: Context): Int =
        (MAX_IMAGE_SIZE_DP * context.resources.displayMetrics.density).roundToInt()

    /**
     * downloads finishing within this time after the first one are drawn in one rebuild, which also
     * keeps rebuilds at least this far apart. Android Auto drops template updates sent in quick
     * succession, a grid of photos otherwise kept showing the placeholder for some of them.
     */
    private const val REDRAW_DELAY_MS = 1_000L

    private val currentTemplateId = ThreadLocal<String?>()

    private val lock = Any()

    /** cache key -> ids of the templates that showed its placeholder while it downloads */
    private val waitingTemplateIds = HashMap<String, MutableSet<String>>()
    private val failedAt = HashMap<String, Long>()
    private val loadedAt = HashMap<String, Long>()
    private val templateIdsToRedraw = HashSet<String>()

    private val executor = Executors.newCachedThreadPool { runnable ->
        Thread(runnable, "AutoPlayRemoteImages").apply { isDaemon = true }
    }
    private val mainHandler = Handler(Looper.getMainLooper())

    /**
     * remote images parsed in [block] are redrawn on the template [templateId] once downloaded,
     * thread local since templates are parsed on the update queue and on the main thread
     */
    fun <T> withTemplate(templateId: String, block: () -> T): T {
        val previous = currentTemplateId.get()
        currentTemplateId.set(templateId)
        try {
            return block()
        } finally {
            currentTemplateId.set(previous)
        }
    }

    /**
     * a background download can only redraw a template, outside of a template build images have to
     * be loaded blocking
     */
    val isBuildingTemplate: Boolean
        get() = currentTemplateId.get() != null

    /**
     * runs [download] in the background for the template currently being built, unless it runs
     * already or failed recently. [download] caches the image and returns whether that worked.
     */
    fun loadInBackground(cacheKey: String, download: () -> Boolean) {
        val templateId = currentTemplateId.get() ?: return

        val startDownload = synchronized(lock) {
            failedAt[cacheKey]?.let { failed ->
                if (SystemClock.elapsedRealtime() - failed < FAILURE_RETRY_INTERVAL_MS) {
                    return
                }
                failedAt.remove(cacheKey)
            }
            loadedAt[cacheKey]?.let { loaded ->
                if (SystemClock.elapsedRealtime() - loaded < LOADED_RETRY_INTERVAL_MS) {
                    return
                }
                loadedAt.remove(cacheKey)
            }

            val waiting = waitingTemplateIds[cacheKey]
            if (waiting != null) {
                waiting.add(templateId)
                false
            } else {
                waitingTemplateIds[cacheKey] = mutableSetOf(templateId)
                true
            }
        }

        if (!startDownload) {
            return
        }

        executor.execute {
            val success = try {
                download()
            } catch (e: Exception) {
                Log.w(TAG, "downloading $cacheKey failed", e)
                false
            }

            val templateIds = synchronized(lock) {
                if (success) {
                    loadedAt[cacheKey] = SystemClock.elapsedRealtime()
                } else {
                    failedAt[cacheKey] = SystemClock.elapsedRealtime()
                }
                waitingTemplateIds.remove(cacheKey) ?: emptySet()
            }

            // a failed download keeps the placeholder that is shown already
            if (success) {
                scheduleRedraw(templateIds)
            }
        }
    }

    private fun scheduleRedraw(templateIds: Set<String>) {
        if (templateIds.isEmpty()) {
            return
        }

        val isScheduled = synchronized(lock) {
            val isScheduled = templateIdsToRedraw.isNotEmpty()
            templateIdsToRedraw.addAll(templateIds)
            isScheduled
        }

        if (isScheduled) {
            return
        }

        mainHandler.postDelayed({
            val ids = synchronized(lock) {
                val ids = templateIdsToRedraw.toSet()
                templateIdsToRedraw.clear()
                ids
            }

            TemplateUpdateQueue.post {
                ids.forEach { templateId ->
                    // a popped template's screen is unregistered, the image stays cached for it
                    AndroidAutoScreen.getScreen(templateId)?.applyConfigUpdate(invalidate = true)
                }
            }
        }, REDRAW_DELAY_MS)
    }
}

val RemoteImage.hasPlaceholder: Boolean
    get() = placeholderGlyphImage != null || placeholderAssetImage != null

/** the placeholder asset, flattened into placeholder* fields on the JS side */
val RemoteImage.placeholderAssetImage: AssetImage?
    get() {
        val uri = placeholderUri ?: return null
        val width = placeholderWidth ?: return null
        val height = placeholderHeight ?: return null
        val scale = placeholderScale ?: return null
        val packagerAsset = placeholderPackagerAsset ?: return null

        return AssetImage(uri, width, height, scale, placeholderColor, packagerAsset)
    }

/** the placeholder glyph, flattened into placeholder* fields on the JS side */
val RemoteImage.placeholderGlyphImage: GlyphImage?
    get() {
        val glyph = placeholderGlyph ?: return null
        val fontName = placeholderFontName ?: return null
        val color = placeholderColor ?: return null
        val backgroundColor = placeholderBackgroundColor ?: return null

        return GlyphImage(glyph, fontName, color, backgroundColor, placeholderFontScale)
    }
