package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

import android.content.Context
import android.content.pm.PackageManager
import android.graphics.drawable.Drawable
import androidx.appcompat.content.res.AppCompatResources

object AppInfo {
    fun getApplicationLabel(context: Context): CharSequence {
        val customLabelId = context.resources.getIdentifier(
            "AutoPlayClusterSplashScreenLabel", "string", context.packageName
        )

        if (customLabelId > 0) {
            return context.resources.getString(customLabelId)
        }

        val packageManager = context.packageManager
        return try {
            packageManager.getApplicationLabel(context.applicationInfo)
        } catch (_: PackageManager.NameNotFoundException) {
            "react-native-autoplay"
        }
    }

    /**
     * Title shown on the [androidx.car.app.model.PaneTemplate] loading screen while waiting
     * for JS to render the first real screen. Override by declaring a string resource named
     * `AutoPlayLoadingLabel` in the host app, same convention as [getApplicationLabel]'s
     * `AutoPlayClusterSplashScreenLabel`.
     */
    fun getLoadingLabel(context: Context, appName: CharSequence): String {
        val customId = context.resources.getIdentifier("AutoPlayLoadingLabel", "string", context.packageName)
        return if (customId > 0) context.resources.getString(customId)
        else "Loading $appName…"
    }

    fun getApplicationIcon(context: Context): Drawable? {
        val packageManager = context.packageManager
        return try {
            packageManager.getApplicationIcon(context.applicationInfo.packageName)
        } catch (e: PackageManager.NameNotFoundException) {
            AppCompatResources.getDrawable(context, android.R.mipmap.sym_def_app_icon)
        }
    }
}