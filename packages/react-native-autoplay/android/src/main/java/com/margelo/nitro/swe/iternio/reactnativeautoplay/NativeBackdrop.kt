package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.view.View
import androidx.car.app.CarContext

/**
 * An optional host-app-provided native View rendered under the React surface of the
 * Android Auto root display — the Android counterpart of the iOS `getRootViewForAutoplay`
 * AppDelegate hook. Lets a host compose a native map beneath its React overlay, e.g. a
 * native map view that cannot be hosted as a React Native view on the virtual display
 * (Fragment-based map SDK wrappers are bound to the phone Activity).
 *
 * Contract: register `NativeBackdropRegistry.factory` before the CarAppService starts
 * (Application.onCreate). The factory is consulted once per presentation (i.e. again after
 * every surface resize); each backdrop is destroyed when its presentation is replaced or the
 * renderer stops. A factory that throws is logged and ignored — the surface still renders.
 */
interface NativeBackdrop {
    /** Added as the presentation root's FIRST child, match-parent. */
    val view: View

    /** The car's day/night changed (CarContext.isDarkMode) — redraw accordingly. */
    fun onColorSchemeChanged(dark: Boolean)

    /** Release everything; must be idempotent. */
    fun destroy()
}

object NativeBackdropRegistry {
    @Volatile
    var factory: ((CarContext) -> NativeBackdrop)? = null
}
