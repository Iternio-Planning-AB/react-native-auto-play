package com.margelo.nitro.at.g4rb4g3.autoplay.template

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
import com.margelo.nitro.at.g4rb4g3.autoplay.MapTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.SymbolFont

class MapTemplate(
    context: CarContext, config: MapTemplateConfig
) : AndroidAutoTemplate<MapTemplateConfig>(context, config) {

    override val isRenderTemplate = true
    override val templateId: String
        get() = config.id

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

    override fun setTemplateActions(actions: Array<NitroAction>?) {
        config = config.copy(actions = actions)
        super.applyConfigUpdate()
    }

    override fun onWillAppear() {
        config.onWillAppear?.let { it(null) }
    }

    override fun onWillDisappear() {
        config.onWillDisappear?.let { it(null) }
    }

    override fun onDidAppear() {
        config.onDidAppear?.let { it(null) }
    }

    override fun onDidDisappear() {
        config.onDidDisappear?.let { it(null) }
    }

    override fun onPopped() {
        config.onPopped?.let { it() }
        templates.remove(templateId)
    }

    fun setMapActions(buttons: Array<NitroMapButton>?) {
        config = config.copy(mapButtons = buttons)
        super.applyConfigUpdate()
    }
}