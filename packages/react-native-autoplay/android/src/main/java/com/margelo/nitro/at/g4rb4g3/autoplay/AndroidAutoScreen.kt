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
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.AppInfo

class AndroidAutoScreen(
    carContext: CarContext, private val isCluster: Boolean, private val marker: String
) : Screen(carContext) {

    var template: Template? = null
    var virtualRenderer: VirtualRenderer? = null

    init {
        // temp code, remove once setTemplate js call is done
        val template = NavigationTemplate.Builder().apply {
            setActionStrip(ActionStrip.Builder().apply { addAction(Action.APP_ICON) }
                .build()).build()
        }.build()

        setTemplate(template = template, isSurfaceTemplate = true)
        // end temp code

        lifecycle.addObserver(object : LifecycleEventObserver {
            override fun onStateChanged(
                source: LifecycleOwner, event: Lifecycle.Event
            ) {
                when (event) {
                    Lifecycle.Event.ON_CREATE -> {
                        HybridAutoPlay.emitTemplateState(marker, VisibilityState.WILLAPPEAR)
                    }

                    Lifecycle.Event.ON_RESUME -> {
                        HybridAutoPlay.emitTemplateState(marker, VisibilityState.DIDAPPEAR)
                    }

                    Lifecycle.Event.ON_PAUSE -> {
                        HybridAutoPlay.emitTemplateState(marker, VisibilityState.WILLDISAPPEAR)
                    }

                    Lifecycle.Event.ON_DESTROY -> {
                        HybridAutoPlay.emitTemplateState(marker, VisibilityState.DIDDISAPPEAR)
                    }

                    else -> {}
                }
            }

        })
    }

    fun setTemplate(template: Template, invalidate: Boolean = false, isSurfaceTemplate: Boolean) {
        if (isSurfaceTemplate && virtualRenderer == null) {
            virtualRenderer = VirtualRenderer(carContext, isCluster)
        }
        this.template = template

        if (invalidate) {
            invalidate()
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
    }
}