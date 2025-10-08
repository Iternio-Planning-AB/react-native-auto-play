package com.margelo.nitro.at.g4rb4g3.autoplay.template

import android.text.Spannable
import android.text.SpannableString
import androidx.car.app.CarContext
import androidx.car.app.model.Action
import androidx.car.app.model.CarIcon
import androidx.car.app.model.CarText
import androidx.car.app.model.Distance
import androidx.car.app.model.DistanceSpan
import androidx.car.app.model.DurationSpan
import androidx.car.app.model.Header
import com.margelo.nitro.at.g4rb4g3.autoplay.DistanceUnits
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroActionType
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroAlignment
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroImage
import com.margelo.nitro.at.g4rb4g3.autoplay.Text
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.SymbolFont

object Parser {
    fun parseHeader(context: CarContext, title: CarText, actions: Array<NitroAction>?): Header {
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

    val PLACEHOLDER_DISTANCCE = "{distance}"
    val PLACEHOLDER_DURATION = "{duration}"

    fun parseText(text: Text): CarText {
        val span = SpannableString(text.text)
        text.distance?.let { distance ->
            span.setSpan(
                DistanceSpan.create(parseDistance(distance)),
                text.text.indexOf(PLACEHOLDER_DISTANCCE),
                text.text.indexOf(PLACEHOLDER_DISTANCCE) + PLACEHOLDER_DISTANCCE.length,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }
        text.duration?.let { duration ->
            span.setSpan(
                DurationSpan.create(duration.toLong()),
                text.text.indexOf(PLACEHOLDER_DURATION),
                text.text.indexOf(PLACEHOLDER_DURATION) + PLACEHOLDER_DURATION.length,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }
        return CarText.Builder(span).build()
    }

    fun parseDistance(distance: com.margelo.nitro.at.g4rb4g3.autoplay.Distance): Distance {
        val unit = when (distance.unit) {
            DistanceUnits.METERS -> Distance.UNIT_METERS
            DistanceUnits.MILES -> Distance.UNIT_MILES_P1
            DistanceUnits.YARDS -> Distance.UNIT_YARDS
            DistanceUnits.FEET -> Distance.UNIT_FEET
            DistanceUnits.KILOMETERS -> Distance.UNIT_KILOMETERS_P1
        }
        return Distance.create(distance.value, unit)
    }
}