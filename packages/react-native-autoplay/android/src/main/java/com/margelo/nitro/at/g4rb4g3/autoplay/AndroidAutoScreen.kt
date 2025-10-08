package com.margelo.nitro.at.g4rb4g3.autoplay

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.ScreenManager
import androidx.car.app.model.Template
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.UiThreadUtil

class AndroidAutoScreen(
    carContext: CarContext, private val isCluster: Boolean, private val moduleName: String, private var template: Template
) : Screen(carContext) {

    init {
        marker = moduleName
        screens.put(moduleName, this)

        lifecycle.addObserver(object : LifecycleEventObserver {
            override fun onStateChanged(
                source: LifecycleOwner, event: Lifecycle.Event
            ) {
                when (event) {
                    Lifecycle.Event.ON_CREATE -> {
                        HybridAutoPlay.emitTemplateState(moduleName, VisibilityState.WILLAPPEAR)
                    }

                    Lifecycle.Event.ON_RESUME -> {
                        HybridAutoPlay.emitTemplateState(moduleName, VisibilityState.DIDAPPEAR)
                    }

                    Lifecycle.Event.ON_PAUSE -> {
                        HybridAutoPlay.emitTemplateState(moduleName, VisibilityState.WILLDISAPPEAR)
                    }

                    Lifecycle.Event.ON_DESTROY -> {
                        HybridAutoPlay.emitTemplateState(moduleName, VisibilityState.DIDDISAPPEAR)
                    }

                    else -> {}
                }
            }

        })
    }

    fun setTemplate(template: Template, invalidate: Boolean = false) {
        this.template = template
        UiThreadUtil.runOnUiThread {
            if (invalidate) {
                invalidate()
            }
        }
    }

    override fun onGetTemplate(): Template {
        return template
    }

    companion object {
        const val TAG = "AndroidAutoScreen"

        private val screens = mutableMapOf<String, AndroidAutoScreen>()

        fun getScreen(marker: String): AndroidAutoScreen? {
            return screens[marker]
        }

        fun getScreenManager(marker: String): ScreenManager? {
            return screens[marker]?.screenManager
        }
    }
}