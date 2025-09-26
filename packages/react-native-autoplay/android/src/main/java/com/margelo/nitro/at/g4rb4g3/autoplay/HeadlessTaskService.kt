package com.margelo.nitro.at.g4rb4g3.autoplay

import android.content.Intent
import android.os.Binder
import android.os.IBinder
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class HeadlessTaskService : HeadlessJsTaskService() {
    // we use a bound service so it will never be killed when Android Auto is active
    inner class LocalBinder : Binder() {
        fun getService() = this@HeadlessTaskService
    }

    private val mBinder = LocalBinder()

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig {
        val data = intent?.extras?.let {
            Arguments.fromBundle(it)
        } ?: Arguments.createMap()

        return HeadlessJsTaskConfig(
            taskKey = "AndroidAutoHeadlessJsTask", data = data, isAllowedInForeground = true
        )
    }

    override fun onBind(intent: Intent): IBinder? {
        // Start the headless task when bound
        UiThreadUtil.runOnUiThread {
            startTask(getTaskConfig(intent))
        }
        return mBinder
    }
}