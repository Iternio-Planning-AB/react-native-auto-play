package com.margelo.nitro.swe.iternio.reactnativeautoplay

import androidx.activity.OnBackPressedCallback
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.ScreenManager
import androidx.car.app.model.Template
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.GridTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.InformationTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.ListTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.MapTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.MessageTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.SearchTemplate

class AndroidAutoScreen(
    carContext: CarContext, private val moduleName: String, private var template: Template
) : Screen(carContext) {

    init {
        marker = moduleName
        screens[moduleName] = this

        lifecycle.addObserver(object : LifecycleEventObserver {
            override fun onStateChanged(
                source: LifecycleOwner, event: Lifecycle.Event
            ) {
                when (event) {
                    Lifecycle.Event.ON_CREATE -> {
                        AndroidAutoTemplate.getTemplate(moduleName)?.onWillAppear()
                    }

                    Lifecycle.Event.ON_RESUME -> {
                        AndroidAutoTemplate.getTemplate(moduleName)?.onDidAppear()
                    }

                    Lifecycle.Event.ON_PAUSE -> {
                        AndroidAutoTemplate.getTemplate(moduleName)?.onWillDisappear()
                    }

                    Lifecycle.Event.ON_STOP -> {
                        AndroidAutoTemplate.getTemplate(moduleName)?.onDidDisappear()
                    }

                    Lifecycle.Event.ON_DESTROY -> {
                        screens.remove(moduleName)
                        HybridAutoPlay.removeListeners(moduleName)
                        AndroidAutoTemplate.getTemplate(moduleName)?.onPopped()
                    }

                    else -> {}
                }
            }
        })

        carContext.onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val config = AndroidAutoTemplate.getConfig(moduleName)
                val backButton = when (config) {
                    is MapTemplateConfig -> config.headerActions?.find { it.type == NitroActionType.BACK }
                    is ListTemplateConfig -> config.headerActions?.find { it.type == NitroActionType.BACK }
                    is GridTemplateConfig -> config.headerActions?.find { it.type == NitroActionType.BACK }
                    is MessageTemplateConfig -> config.headerActions?.find { it.type == NitroActionType.BACK }
                    is SearchTemplateConfig -> config.headerActions?.find { it.type == NitroActionType.BACK }
                    is InformationTemplateConfig -> config.headerActions?.find { it.type == NitroActionType.BACK }
                    else -> null
                }

                if (backButton == null) {
                    isEnabled = false
                    carContext.onBackPressedDispatcher.onBackPressed()
                    isEnabled = true
                    return
                }

                backButton.onPress()
            }
        })
    }

    fun applyConfigUpdate(invalidate: Boolean = false) {
        val config = AndroidAutoTemplate.getConfig(moduleName) ?: return

        when (config) {
            is MapTemplateConfig -> MapTemplate(carContext, config)
            is ListTemplateConfig -> ListTemplate(carContext, config)
            is GridTemplateConfig -> GridTemplate(carContext, config)
            is MessageTemplateConfig -> MessageTemplate(carContext, config)
            is SearchTemplateConfig -> SearchTemplate(carContext, config)
            is InformationTemplateConfig -> InformationTemplate(carContext, config)
            else -> null
        }?.let {
            AndroidAutoTemplate.setTemplate(moduleName, it)
            this.template = it.parse()

            if (!invalidate) {
                return
            }

            UiThreadUtil.runOnUiThread {
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

        fun getScreenManager(): ScreenManager? {
            return screens[AndroidAutoSession.ROOT_SESSION]?.screenManager
        }

        fun invalidateScreens() {
            for (screen in screens) {
                screen.value.applyConfigUpdate(true)
            }
        }

        fun invalidateSurfaceScreens() {
            val sessions =
                AndroidAutoSession.getClusterSessions().plus(AndroidAutoSession.ROOT_SESSION)
            screens.forEach { (key, value) ->
                if (sessions.contains(key)) {
                    value.applyConfigUpdate(invalidate = true)
                }
            }
        }
    }
}