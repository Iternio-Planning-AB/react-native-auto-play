package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.Action
import androidx.car.app.model.CarIcon
import androidx.car.app.model.Header
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroActionType
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroAlignment
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroImage
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.SymbolFont

object Parser {
    fun parseHeader(context: CarContext, title: String, actions: Array<NitroAction>?): Header {
        return Header.Builder().apply {
            setTitle(title)
            actions?.forEach { action ->
                when (action.alignment) {
                    NitroAlignment.LEADING -> {
                        setStartHeaderAction(parseAction(context, action))
                    }

                    NitroAlignment.TRAILING -> {
                        addEndHeaderAction(parseAction(context, action))
                    }

                    else -> {
                        throw IllegalArgumentException("missing alignment in action ${action.type} ${action.title ?: action.image?.glyph}")
                    }
                }
            }
        }.build()
    }

    fun parseAction(context: CarContext, action: NitroAction): Action {
        if (action.type == NitroActionType.APPICON) {
            return Action.APP_ICON
        }

        if (action.type == NitroActionType.BACK) {
            return Action.BACK
        }

        return Action.Builder().apply {
            setOnClickListener(action.onPress)
            action.image?.let { image ->
                setIcon(parseImage(context, image))
            }
            action.title?.let { title ->
                setTitle(title)
            }
            action.flags?.let { flags ->
                setFlags(flags.toInt())
            }
        }.build()
    }

    fun parseImage(context: CarContext, image: NitroImage): CarIcon {
        return CarIcon.Builder(
            SymbolFont.iconFromNitroImage(
                context, image
            )
        ).build()
    }
}