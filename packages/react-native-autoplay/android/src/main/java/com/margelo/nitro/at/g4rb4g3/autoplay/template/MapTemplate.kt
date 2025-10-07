package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.activity.OnBackPressedCallback
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarIcon
import androidx.car.app.model.Template
import androidx.car.app.navigation.model.NavigationTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoSession
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroActionType
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroMapButtonType
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroMapTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.SymbolFont

class MapTemplate(
    private val config: NitroMapTemplateConfig
) {
    fun parse(): Template {
        val context =
            AndroidAutoSession.getRootContext() //TODO: this should actually use the proper screen/session context

        return NavigationTemplate.Builder().apply {
            setActionStrip(
                ActionStrip.Builder().apply {
                    addAction(Action.APP_ICON)
                    addAction(Action.Builder().apply {
                        setTitle("title")
                        setFlags(Action.FLAG_DEFAULT)
                    }.build())
                }.build()
            ).build()
            context?.let { context ->
                config.mapButtons?.let { buttons ->
                    setMapActionStrip(ActionStrip.Builder().apply {
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
                    }.build())
                }
                config.actions?.let { actions ->
                    setActionStrip(ActionStrip.Builder().apply {
                        actions.forEach { action ->
                            if (action.type == NitroActionType.BACK) {
                                addAction(Action.BACK)
                                context.onBackPressedDispatcher.addCallback(object : OnBackPressedCallback(true) {
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
                    }.build())
                }
            }
        }.build()
    }
}