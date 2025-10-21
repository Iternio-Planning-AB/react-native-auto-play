package com.margelo.nitro.at.g4rb4g3.autoplay

import androidx.activity.OnBackPressedCallback
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.ScreenManager
import androidx.car.app.model.Template
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.GridTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.HybridAutoPlay
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.ListTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.MapTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroActionType
import com.margelo.nitro.at.g4rb4g3.autoplay.template.AndroidAutoTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.GridTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.ListTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.MapTemplate

class AndroidAutoScreen(
    carContext: CarContext, private val moduleName: String, private var template: Template
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
            val clusterSessions = AndroidAutoSession.getClusterSessions()
            return screens.firstNotNullOfOrNull {
                if (clusterSessions.contains(it.key)) {
                    return null
                }
                return it.value.screenManager
            }
        }
    }
}