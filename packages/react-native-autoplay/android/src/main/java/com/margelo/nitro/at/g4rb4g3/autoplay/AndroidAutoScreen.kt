package com.margelo.nitro.at.g4rb4g3.autoplay

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarIcon
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Template
import androidx.car.app.navigation.model.NavigationTemplate
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.AppInfo

class AndroidAutoScreen(
    carContext: CarContext, private val isCluster: Boolean, private val moduleName: String
) : Screen(carContext) {

    var template: Template? = null
    var virtualRenderer: VirtualRenderer? = null

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

    fun setTemplate(template: Template, invalidate: Boolean = false, isSurfaceTemplate: Boolean) {
        UiThreadUtil.runOnUiThread {
            if (isSurfaceTemplate && virtualRenderer == null) {
                virtualRenderer = VirtualRenderer(carContext, moduleName, isCluster)
            }
            this.template = template

            if (invalidate) {
                invalidate()
            }
        }
    }

    override fun onGetTemplate(): Template {
        template?.let {
            return it
        }

        if (isCluster) {
            return NavigationTemplate.Builder().apply {
                setActionStrip(ActionStrip.Builder().apply { addAction(Action.APP_ICON) }
                    .build()).build()
            }.build()
        }

        val appName = AppInfo.getApplicationLabel(carContext)

        return MessageTemplate.Builder(appName).apply {
            setIcon(CarIcon.APP_ICON)
        }.build()
    }

    companion object {
        const val TAG = "AndroidAutoScreen"

        private val screens = mutableMapOf<String, AndroidAutoScreen>()

        fun getScreen(marker: String): AndroidAutoScreen? {
            return screens[marker]
        }
    }
}