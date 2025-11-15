package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.app.Activity
import android.app.Application
import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.os.Bundle

class ActivityRenderStateProvider : ContentProvider() {
    companion object {
        const val TAG = "ActivityRenderStateProvider"
        var currentState: VisibilityState = VisibilityState.DIDDISAPPEAR
            private set
    }

    val applicationRenderStateObserver = object : Application.ActivityLifecycleCallbacks {
        override fun onActivityPaused(activity: Activity) {
            // we don't have such fine grained states then iOS provides here
            // so we fire both to make sure all registered callbacks are triggered
            HybridAutoPlay.emitRenderState("main", VisibilityState.WILLDISAPPEAR)
            HybridAutoPlay.emitRenderState("main", VisibilityState.DIDDISAPPEAR)

            currentState = VisibilityState.DIDDISAPPEAR
        }

        override fun onActivityResumed(activity: Activity) {
            // we don't have such fine grained states then iOS provides here
            // so we fire both to make sure all registered callbacks are triggered
            HybridAutoPlay.emitRenderState("main", VisibilityState.WILLAPPEAR)
            HybridAutoPlay.emitRenderState("main", VisibilityState.DIDAPPEAR)

            currentState = VisibilityState.DIDAPPEAR
        }

        override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
        override fun onActivityDestroyed(activity: Activity) {}
        override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
        override fun onActivityStarted(activity: Activity) {}
        override fun onActivityStopped(activity: Activity) {}
    }

    override fun onCreate(): Boolean {
        val application = context?.applicationContext as? Application ?: return false
        application.registerActivityLifecycleCallbacks(applicationRenderStateObserver)
        return true
    }

    override fun delete(
        uri: Uri, selection: String?, selectionArgs: Array<out String?>?
    ): Int {
        return 0
    }

    override fun getType(uri: Uri): String? {
        return null
    }

    override fun insert(
        uri: Uri, values: ContentValues?
    ): Uri? {
        return null
    }

    override fun query(
        uri: Uri,
        projection: Array<out String?>?,
        selection: String?,
        selectionArgs: Array<out String?>?,
        sortOrder: String?
    ): Cursor? {
        return null
    }

    override fun update(
        uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String?>?
    ): Int {
        return 0
    }
}