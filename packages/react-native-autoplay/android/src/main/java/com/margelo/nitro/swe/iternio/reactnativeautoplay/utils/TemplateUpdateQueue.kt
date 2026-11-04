package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

import android.util.Log
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.core.Promise
import java.util.concurrent.Callable
import java.util.concurrent.ExecutionException
import java.util.concurrent.Executors

/**
 * Serial queue for everything that changes a template config or rebuilds a template from it.
 *
 * A config update copies the config and rebuilds the screen from the registered template, so two
 * updates running at the same time drop one of the changes (e.g. setHeaderActions and
 * setMapButtons fired from the same React commit). Jobs are queued on the calling thread, the JS
 * thread for hybrid methods, which keeps them in JS call order.
 * Not the main thread since parsing can block on remote images.
 *
 * Screen stack operations (push, pop, trip selector) are main thread only but go through here as
 * well, [enqueueOnUi] and [postOnUi] hand them to the main thread from the queue. Both are FIFO, so
 * a stack operation keeps its JS call order against other stack operations and config updates.
 *
 * A job must never wait on the JS or the main thread, [runAndWait] callers block on the queue.
 */
object TemplateUpdateQueue {
    private const val TAG = "TemplateUpdateQueue"

    @Volatile
    private var thread: Thread? = null

    private val executor = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "AutoPlayTemplateUpdates").apply { isDaemon = true }.also { thread = it }
    }

    private val isOnQueue: Boolean
        get() = Thread.currentThread() === thread

    /**
     * fire and forget, for callers that can not report a failure back to JS
     */
    fun post(job: () -> Unit) {
        executor.execute {
            try {
                job()
            } catch (e: Exception) {
                Log.e(TAG, "template update failed", e)
            }
        }
    }

    /**
     * blocks until the job ran and rethrows its exception, for callers that need the update applied
     * before they continue - not from the JS thread, it waits for everything queued before
     */
    fun <T> runAndWait(job: () -> T): T {
        // a job that ends up in here again would wait for itself forever
        if (isOnQueue) {
            return job()
        }

        try {
            return executor.submit(Callable { job() }).get()
        } catch (e: ExecutionException) {
            throw e.cause ?: e
        }
    }

    /**
     * for hybrid methods returning a Promise, settled once the job ran
     */
    fun enqueue(job: () -> Unit): Promise<Unit> {
        val promise = Promise<Unit>()
        executor.execute {
            try {
                job()
                promise.resolve(Unit)
            } catch (e: Throwable) {
                promise.reject(e)
            }
        }
        return promise
    }

    /**
     * for hybrid methods returning a Promise that have to run on the main thread, [prepare] runs on
     * the queue first, then [job] is posted to the main thread and the promise settles once it ran.
     * The queue does not wait for [job], it moves on once it is posted.
     */
    fun enqueueOnUi(prepare: (() -> Unit)? = null, job: () -> Unit): Promise<Unit> {
        val promise = Promise<Unit>()
        executor.execute {
            try {
                prepare?.invoke()
            } catch (e: Throwable) {
                promise.reject(e)
                return@execute
            }

            UiThreadUtil.runOnUiThread {
                try {
                    job()
                    promise.resolve(Unit)
                } catch (e: Throwable) {
                    promise.reject(e)
                }
            }
        }
        return promise
    }

    /**
     * fire and forget on the main thread, for callers that can not report a failure back to JS
     */
    fun postOnUi(job: () -> Unit) {
        executor.execute {
            UiThreadUtil.runOnUiThread {
                try {
                    job()
                } catch (e: Exception) {
                    Log.e(TAG, "template update failed", e)
                }
            }
        }
    }
}
