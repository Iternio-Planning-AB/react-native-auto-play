package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.activity.OnBackPressedCallback
import androidx.car.app.CarContext
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarIcon
import androidx.car.app.model.Template
import androidx.car.app.navigation.model.NavigationTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroActionType
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroMapButton
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroMapButtonType
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroMapTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.SymbolFont

class MapTemplate(
    context: CarContext, config: NitroMapTemplateConfig
) : AndroidAutoTemplate<NitroMapTemplateConfig>(context, config) {

    private fun parseMapButtons(buttons: Array<NitroMapButton>): ActionStrip {
        return ActionStrip.Builder().apply {
            buttons.forEach { button ->
                if (button.type == NitroMapButtonType.PAN) {
                    addAction(Action.PAN)
                    return@forEach
                }

                button.image?.let { image ->
                    addAction(Action.Builder().apply {
                        setOnClickListener(button.onPress)
                        setIcon(
                            CarIcon.Builder(
                                SymbolFont.iconFromNitroImage(
                                    context, image
                                )
                            ).build()
                        )
                    }.build())
                }
            }
        }.build()
    }

    private fun parseMapActions(actions: Array<NitroAction>): ActionStrip {
        return ActionStrip.Builder().apply {
            actions.forEach { action ->
                if (action.type == NitroActionType.BACK) {
                    addAction(Action.BACK)
                    context.onBackPressedDispatcher.addCallback(object :
                        OnBackPressedCallback(true) {
                        override fun handleOnBackPressed() {
                            action.onPress()
                        }

                    })
                    return@forEach
                }
                if (action.type == NitroActionType.APPICON) {
                    addAction(Action.APP_ICON)
                    return@forEach
                }
                addAction(Action.Builder().apply {
                    action.title?.let {
                        setTitle(it)
                    }
                    action.image?.let { image ->
                        val icon = CarIcon.Builder(
                            SymbolFont.iconFromNitroImage(
                                context, image
                            )
                        ).build()
                        setIcon(icon)
                    }
                    action.flags?.let {
                        setFlags(it.toInt())
                    }
                    action.onPress.let {
                        setOnClickListener(it)
                    }
                }.build())
            }
        }.build()
    }

    override fun parse(): Template {
        return NavigationTemplate.Builder().apply {
            config.mapButtons?.let { buttons ->
                setMapActionStrip(parseMapButtons(buttons))
            }
            config.actions?.let { actions ->
                setActionStrip(parseMapActions(actions))
            }
        }.build()
    }
}