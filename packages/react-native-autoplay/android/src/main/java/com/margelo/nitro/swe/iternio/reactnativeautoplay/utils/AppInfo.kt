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

    fun getApplicationIcon(context: Context): Drawable? {
        val packageManager = context.packageManager
        return try {
            packageManager.getApplicationIcon(context.applicationInfo.packageName)
        } catch (e: PackageManager.NameNotFoundException) {
            AppCompatResources.getDrawable(context, android.R.mipmap.sym_def_app_icon)
        }
    }
}