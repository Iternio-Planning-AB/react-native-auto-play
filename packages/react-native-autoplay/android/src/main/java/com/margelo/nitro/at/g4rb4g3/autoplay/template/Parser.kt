package com.margelo.nitro.at.g4rb4g3.autoplay.template

import android.text.Spannable
import android.text.SpannableString
import android.util.Log
import androidx.car.app.CarContext
import androidx.car.app.model.Action
import androidx.car.app.model.CarIcon
import androidx.car.app.model.CarText
import androidx.car.app.model.Distance
import androidx.car.app.model.DistanceSpan
import androidx.car.app.model.DurationSpan
import androidx.car.app.model.Header
import androidx.car.app.model.ItemList
import androidx.car.app.model.Row
import androidx.car.app.model.Toggle
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoScreen
import com.margelo.nitro.at.g4rb4g3.autoplay.AutoText
import com.margelo.nitro.at.g4rb4g3.autoplay.DistanceUnits
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroActionType
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroAlignment
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroImage
import com.margelo.nitro.at.g4rb4g3.autoplay.ListTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroRow
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.SymbolFont
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

object Parser {
    const val TAG = "Parser"

    fun parseHeader(context: CarContext, title: AutoText, actions: Array<NitroAction>?): Header {
        return Header.Builder().apply {
            setTitle(parseText(title))
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

    const val PLACEHOLDER_DISTANCE = "{distance}"
    const val PLACEHOLDER_DURATION = "{duration}"

    fun parseText(text: AutoText): CarText {
        val span = SpannableString(text.text)
        text.distance?.let { distance ->
            if (!text.text.contains(PLACEHOLDER_DISTANCE)) {
                Log.w(TAG, "got duration without $PLACEHOLDER_DISTANCE placeholder")
                return@let
            }
            span.setSpan(
                DistanceSpan.create(parseDistance(distance)),
                text.text.indexOf(PLACEHOLDER_DISTANCE),
                text.text.indexOf(PLACEHOLDER_DISTANCE) + PLACEHOLDER_DISTANCE.length,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }
        text.duration?.let { duration ->
            if (!text.text.contains(PLACEHOLDER_DURATION)) {
                Log.w(TAG, "got duration without $PLACEHOLDER_DURATION placeholder")
                return@let
            }
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
            DistanceUnits.MILES -> Distance.UNIT_MILES
            DistanceUnits.YARDS -> Distance.UNIT_YARDS
            DistanceUnits.FEET -> Distance.UNIT_FEET
            DistanceUnits.KILOMETERS -> Distance.UNIT_KILOMETERS
        }
        return Distance.create(distance.value, unit)
    }

    fun parseRows(
        context: CarContext,
        rows: Array<NitroRow>,
        sectionIndex: Int,
        selectedIndex: Double?,
        templateId: String
    ): ItemList {
        return ItemList.Builder().apply {
            selectedIndex?.let {
                setSelectedIndex(selectedIndex.toInt())
                setOnSelectedListener {
                    rows[it].onPress(null)
                    AndroidAutoTemplate.getTypedConfig<ListTemplateConfig>(templateId)
                        ?.let { config ->
                            val section = config.sections?.get(sectionIndex)
                                ?.copy(selectedIndex = it.toDouble())
                                ?: return@let
                            config.sections.set(sectionIndex, section)

                            AndroidAutoScreen.getScreen(templateId)?.applyConfigUpdate()
                        }
                }
            }
            rows.forEachIndexed { index, row ->
                addItem(Row.Builder().apply {
                    setTitle(parseText(row.title))
                    setEnabled(row.enabled)
                    row.detailedText?.let { detailedText ->
                        addText(parseText(detailedText))
                    }
                    row.image?.let { image ->
                        setImage(CarIcon.Builder(parseImage(context, image)).build())
                    }
                    row.browsable?.let { browsable ->
                        setBrowsable(browsable)
                    }
                    row.checked?.let { checked ->
                        setToggle(Toggle.Builder { isChecked ->
                            row.onPress(isChecked)
                            val item = row.copy(checked = isChecked)
                            rows[index] = item
                            AndroidAutoScreen.getScreen(templateId)?.applyConfigUpdate()
                        }.apply {
                            setEnabled(row.enabled)
                            setChecked(checked)
                        }.build())
                    } ?: run {
                        if (selectedIndex == null) {
                            setOnClickListener {
                                row.onPress(null)
                            }
                        }
                    }

                }.build())
            }
        }.build()
    }

    fun formatToTimestamp(duration: Double): String {
        val calendar = Calendar.getInstance()
        calendar.add(Calendar.SECOND, duration.toInt())

        val formatter = SimpleDateFormat("HH:mm", Locale.getDefault())
        return formatter.format(calendar.time)
    }

    fun parseText(strings: Array<String>): CarText {
        return CarText.Builder(strings.first()).apply {
            strings.forEachIndexed { index, string ->
                if (index == 0) {
                    // the first one is on the constructor of the CarText.Builder
                    return@forEachIndexed
                }
                addVariant(string)
            }
        }.build()
    }
}