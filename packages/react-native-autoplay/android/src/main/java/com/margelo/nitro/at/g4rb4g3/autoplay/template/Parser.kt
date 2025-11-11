package com.margelo.nitro.at.g4rb4g3.autoplay.template

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.text.Spannable
import android.text.SpannableString
import android.text.Spanned
import android.util.Log
import androidx.car.app.CarContext
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarColor
import androidx.car.app.model.CarIcon
import androidx.car.app.model.CarIconSpan
import androidx.car.app.model.CarText
import androidx.car.app.model.DateTimeWithZone
import androidx.car.app.model.Distance
import androidx.car.app.model.DistanceSpan
import androidx.car.app.model.DurationSpan
import androidx.car.app.model.Header
import androidx.car.app.model.ItemList
import androidx.car.app.model.Row
import androidx.car.app.model.Toggle
import androidx.car.app.navigation.model.Lane
import androidx.car.app.navigation.model.LaneDirection
import androidx.car.app.navigation.model.Maneuver
import androidx.car.app.navigation.model.Step
import androidx.car.app.navigation.model.TravelEstimate
import androidx.core.graphics.createBitmap
import androidx.core.graphics.drawable.IconCompat
import com.facebook.common.references.CloseableReference
import com.facebook.datasource.DataSources
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.image.CloseableBitmap
import com.facebook.imagepipeline.request.ImageRequestBuilder
import com.facebook.react.views.imagehelper.ImageSource
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoScreen
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.AssetImage
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.AutoText
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.DistanceUnits
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.DurationWithTimeZone
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.ForkType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.GlyphImage
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.KeepType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.ListTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.ManeuverType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroActionType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroAlignment
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroAttributedString
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroButtonStyle
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroColor
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroImage
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroManeuver
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroMapButton
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroMapButtonType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroRoutingManeuver
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroRow
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroSectionType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.OffRampType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.OnRampType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.TrafficSide
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.TravelEstimates
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.TurnType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.Variant_GlyphImage_AssetImage
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.SymbolFont
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import kotlin.math.abs

object Parser {
    const val TAG = "Parser"

    fun parseHeader(
        context: CarContext, title: AutoText, headerActions: Array<NitroAction>?
    ): Header {
        return Header.Builder().apply {
            setTitle(parseText(title))
            headerActions?.forEach { action ->
                when (action.alignment) {
                    NitroAlignment.LEADING -> {
                        setStartHeaderAction(parseAction(context, action))
                    }

                    NitroAlignment.TRAILING -> {
                        addEndHeaderAction(parseAction(context, action))
                    }

                    else -> {
                        throw IllegalArgumentException("missing alignment in action ${action.type} ${action.title}")
                    }
                }
            }
        }.build()
    }

    fun parseMapHeaderActions(context: CarContext, headerActions: Array<NitroAction>): ActionStrip {
        return ActionStrip.Builder().apply {
            headerActions.forEach { action ->
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
                            parseImage(
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

    fun parseMapActions(context: CarContext, buttons: Array<NitroMapButton>): ActionStrip {
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
                                parseImage(
                                    context, image
                                )
                            ).build()
                        )
                    }.build())
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
            action.style?.let { style ->
                if (style == NitroButtonStyle.CANCEL || style == NitroButtonStyle.DESTRUCTIVE) {
                    setBackgroundColor(CarColor.RED)
                }
                if (style == NitroButtonStyle.CONFIRM || style == NitroButtonStyle.DEFAULT) {
                    setBackgroundColor(CarColor.BLUE)
                }
            }
        }.build()
    }

    fun parseImage(context: CarContext, image: Variant_GlyphImage_AssetImage): CarIcon {
        return parseImage(context, image.asFirstOrNull(), image.asSecondOrNull())
    }

    fun parseImage(context: CarContext, image: NitroImage): CarIcon {
        return parseImage(context, image.asFirstOrNull(), image.asSecondOrNull())
    }

    fun parseImage(context: CarContext, glyphImage: GlyphImage?, assetImage: AssetImage?): CarIcon {
        val bitmap = parseImageToBitmap(context, glyphImage, assetImage)

        bitmap?.let {
            return CarIcon.Builder(IconCompat.createWithBitmap(it)).build()
        }

        // this should not be possible, we just wanna satisfy kotlin
        return CarIcon.APP_ICON
    }

    fun parseImageToBitmap(
        context: CarContext, glyphImage: GlyphImage?, assetImage: AssetImage?
    ): Bitmap? {
        glyphImage?.let {
            return SymbolFont.imageFromNitroImage(
                context, it
            )
        }
        assetImage?.let {
            return parseAssetImage(context, it)
        }

        return null
    }

    fun parseImages(context: CarContext, images: List<NitroImage>): CarIcon {
        return CarIcon.Builder(SymbolFont.imageFromNitroImages(context, images)).build()
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

    fun parseDistance(distance: com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.Distance): Distance {
        val unit = when (distance.unit) {
            DistanceUnits.METERS -> Distance.UNIT_METERS
            DistanceUnits.MILES -> Distance.UNIT_MILES
            DistanceUnits.YARDS -> Distance.UNIT_YARDS
            DistanceUnits.FEET -> Distance.UNIT_FEET
            DistanceUnits.KILOMETERS -> Distance.UNIT_KILOMETERS
        }
        return Distance.create(distance.value, unit)
    }

    fun parseSearchResult(
        context: CarContext,
        rows: Array<NitroRow>,
    ): ItemList {
        return ItemList.Builder().apply {
            rows.forEachIndexed { index, row ->
                addItem(Row.Builder().apply {
                    setTitle(parseText(row.title))
                    row.detailedText?.let { detailedText ->
                        addText(parseText(detailedText))
                    }
                    row.image?.let { image ->
                        setImage(CarIcon.Builder(parseImage(context, image)).build())
                    }
                    row.onPress?.let {
                        setOnClickListener {
                            row.onPress(null)
                        }
                    }
                }.build())
            }
        }.build()
    }

    fun parseRows(
        context: CarContext,
        rows: Array<NitroRow>,
        sectionIndex: Int,
        templateId: String,
        sectionType: NitroSectionType
    ): ItemList {
        val selectedIndex = rows.indexOfFirst { item -> item.selected == true }
            .let { if (it == -1) if (sectionType == NitroSectionType.RADIO) 0 else null else it }

        return ItemList.Builder().apply {
            selectedIndex?.let {
                setSelectedIndex(selectedIndex)
                setOnSelectedListener {
                    // onPress is always defined on radio lists
                    rows[it].onPress!!(null)
                    AndroidAutoTemplate.getTypedConfig<ListTemplateConfig>(templateId)
                        ?.let { config ->
                            val items =
                                config.sections?.get(sectionIndex)?.items?.mapIndexed { index, item ->
                                    item.copy(selected = it == index)
                                }?.toTypedArray() ?: return@let

                            val section = config.sections[sectionIndex].copy(items = items)
                            config.sections[sectionIndex] = section

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
                            // onpPress is always defined on toggle rows
                            row.onPress!!(isChecked)
                            val item = row.copy(checked = isChecked)
                            rows[index] = item
                            AndroidAutoScreen.getScreen(templateId)?.applyConfigUpdate()
                        }.apply {
                            setEnabled(row.enabled)
                            setChecked(checked)
                        }.build())
                    } ?: run {
                        if (selectedIndex == null && row.onPress != null) {
                            setOnClickListener {
                                row.onPress(null)
                            }
                        }
                    }

                }.build())
            }
        }.build()
    }

    fun formatToTimestamp(time: DurationWithTimeZone): String {
        val calendar = Calendar.getInstance().apply {
            add(Calendar.SECOND, time.seconds.toInt())
        }

        val formatter = SimpleDateFormat("HH:mm", Locale.getDefault())
        return formatter.format(calendar.time)
    }

    fun parseDurationWithTimeZone(time: DurationWithTimeZone): DateTimeWithZone {
        val calendar = Calendar.getInstance().apply {
            add(Calendar.SECOND, time.seconds.toInt())
        }

        return DateTimeWithZone.create(
            calendar.time.time, TimeZone.getTimeZone(time.timezone)
        )
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

    fun parseText(context: CarContext, variant: NitroAttributedString): SpannableString {
        val images =
            variant.images?.sortedBy { it.position } ?: return SpannableString(variant.text)

        val builder = StringBuilder(variant.text)
        images.forEachIndexed { index, image ->
            val pos = image.position.toInt().coerceIn(0, builder.length)
            builder.insert(pos + index, " ")
        }

        val text = SpannableString(builder.toString())
        images.forEachIndexed { index, image ->
            val carIcon = parseImage(context, image.image)
            val start = (image.position.toInt() + index).coerceIn(0, text.length - 1)
            val end = start + 1

            text.setSpan(
                CarIconSpan.create(carIcon), start, end, Spanned.SPAN_INCLUSIVE_EXCLUSIVE
            )
        }
        return text
    }

    fun parseText(context: CarContext, variants: Array<NitroAttributedString>): CarText {
        val text = parseText(context, variants.first())

        return CarText.Builder(text).apply {
            variants.forEachIndexed { index, variant ->
                if (index == 0) {
                    // the first one is on the constructor of the CarText.Builder
                    return@forEachIndexed
                }
                addVariant(parseText(context, variant))
            }
        }.build()
    }

    fun parseTravelEstimates(travelEstimates: TravelEstimates): TravelEstimate {
        val travelEstimate = TravelEstimate.Builder(
            parseDistance(travelEstimates.distanceRemaining),
            parseDurationWithTimeZone(travelEstimates.timeRemaining)
        ).apply {
            setRemainingTimeSeconds(travelEstimates.timeRemaining.seconds.toLong())
            travelEstimates.tripText?.let {
                setTripText(parseText(it))
            }
//            travelEstimates.tripIcon?.let {
//                setTripIcon(CarIcon.APP_ICON)
//            }
        }.build()

        return travelEstimate
    }

    fun parseColor(color: Double): CarColor {
        return CarColor.createCustom(
            color.toInt(), color.toInt()
        )
    }

    fun parseColor(color: NitroColor): CarColor {
        return CarColor.createCustom(
            color.lightColor.toInt(), color.darkColor.toInt()
        )
    }

    fun parseColor(color: Double, colorDark: Double): CarColor {
        return CarColor.createCustom(
            color.toInt(), colorDark.toInt()
        )
    }

    fun parseAssetImage(context: CarContext, image: AssetImage): Bitmap? {
        val source = ImageSource(context, image.uri)
        val imageRequest = ImageRequestBuilder.newBuilderWithSource(source.uri).build()
        val dataSource = Fresco.getImagePipeline().fetchDecodedImage(imageRequest, context)
        val result = DataSources.waitForFinalResult(dataSource)

        var bitmap: Bitmap? = null

        result?.let {
            val image = it.get()
            if (image is CloseableBitmap) {
                bitmap = image.underlyingBitmap.copy(Bitmap.Config.ARGB_8888, false)
            }

            CloseableReference.closeSafely(result)
            it.close()
        }

        if (bitmap == null) {
            return null
        }

        image.color?.let {
            val tintColor =
                if (context.isDarkMode) image.color.darkColor else image.color.lightColor
            val result = createBitmap(bitmap.width, bitmap.height)
            val canvas = Canvas(result)
            val paint = Paint()

            paint.colorFilter = PorterDuffColorFilter(tintColor.toInt(), PorterDuff.Mode.SRC_IN)
            canvas.drawBitmap(bitmap, 0f, 0f, paint)

            return result
        }

        return bitmap
    }

    fun parseManeuver(context: CarContext, nitroManeuver: NitroRoutingManeuver): Maneuver {
        val maneuverType = when (nitroManeuver.maneuverType) {
            ManeuverType.DEPART -> Maneuver.TYPE_DEPART
            ManeuverType.ARRIVE -> Maneuver.TYPE_DESTINATION
            ManeuverType.ARRIVELEFT -> Maneuver.TYPE_DESTINATION_LEFT
            ManeuverType.ARRIVERIGHT -> Maneuver.TYPE_DESTINATION_RIGHT
            ManeuverType.STRAIGHT -> Maneuver.TYPE_STRAIGHT
            ManeuverType.TURN -> {
                when (nitroManeuver.turnType) {
                    TurnType.NOTURN -> Maneuver.TYPE_STRAIGHT
                    TurnType.SLIGHTLEFT -> Maneuver.TYPE_TURN_SLIGHT_LEFT
                    TurnType.SLIGHTRIGHT -> Maneuver.TYPE_TURN_SLIGHT_RIGHT
                    TurnType.NORMALLEFT -> Maneuver.TYPE_TURN_NORMAL_LEFT
                    TurnType.NORMALRIGHT -> Maneuver.TYPE_TURN_NORMAL_RIGHT
                    TurnType.SHARPLEFT -> Maneuver.TYPE_TURN_SHARP_LEFT
                    TurnType.SHARPRIGHT -> Maneuver.TYPE_TURN_SHARP_RIGHT
                    TurnType.UTURNLEFT -> Maneuver.TYPE_U_TURN_LEFT
                    TurnType.UTURNRIGHT -> Maneuver.TYPE_U_TURN_RIGHT
                    null -> Maneuver.TYPE_UNKNOWN
                }
            }

            ManeuverType.ROUNDABOUT -> {
                if (nitroManeuver.exitNumber != null && nitroManeuver.angle != null) {
                    if (nitroManeuver.trafficSide == TrafficSide.LEFT) {
                        Maneuver.TYPE_ROUNDABOUT_ENTER_AND_EXIT_CW_WITH_ANGLE
                    } else {
                        Maneuver.TYPE_ROUNDABOUT_ENTER_AND_EXIT_CCW_WITH_ANGLE
                    }
                } else if (nitroManeuver.exitNumber != null) {
                    if (nitroManeuver.trafficSide == TrafficSide.LEFT) {
                        Maneuver.TYPE_ROUNDABOUT_ENTER_AND_EXIT_CW
                    } else {
                        Maneuver.TYPE_ROUNDABOUT_ENTER_AND_EXIT_CCW
                    }
                } else {
                    if (nitroManeuver.trafficSide == TrafficSide.LEFT) {
                        Maneuver.TYPE_ROUNDABOUT_ENTER_CW
                    } else {
                        Maneuver.TYPE_ROUNDABOUT_ENTER_CCW
                    }
                }
            }

            ManeuverType.OFFRAMP -> {
                when (nitroManeuver.offRampType) {
                    OffRampType.SLIGHTLEFT -> Maneuver.TYPE_OFF_RAMP_SLIGHT_LEFT
                    OffRampType.SLIGHTRIGHT -> Maneuver.TYPE_OFF_RAMP_SLIGHT_RIGHT
                    OffRampType.NORMALLEFT -> Maneuver.TYPE_OFF_RAMP_NORMAL_LEFT
                    OffRampType.NORMALRIGHT -> Maneuver.TYPE_OFF_RAMP_NORMAL_RIGHT
                    null -> Maneuver.TYPE_UNKNOWN
                }
            }

            ManeuverType.ONRAMP -> {
                when (nitroManeuver.onRampType) {
                    OnRampType.SLIGHTLEFT -> Maneuver.TYPE_ON_RAMP_SLIGHT_LEFT
                    OnRampType.SLIGHTRIGHT -> Maneuver.TYPE_ON_RAMP_SLIGHT_RIGHT
                    OnRampType.NORMALLEFT -> Maneuver.TYPE_ON_RAMP_NORMAL_LEFT
                    OnRampType.NORMALRIGHT -> Maneuver.TYPE_ON_RAMP_NORMAL_RIGHT
                    OnRampType.SHARPLEFT -> Maneuver.TYPE_ON_RAMP_SHARP_LEFT
                    OnRampType.SHARPRIGHT -> Maneuver.TYPE_ON_RAMP_SHARP_RIGHT
                    OnRampType.UTURNLEFT -> Maneuver.TYPE_ON_RAMP_U_TURN_LEFT
                    OnRampType.UTURNRIGHT -> Maneuver.TYPE_ON_RAMP_U_TURN_RIGHT
                    null -> Maneuver.TYPE_UNKNOWN
                }
            }

            ManeuverType.FORK -> {
                when (nitroManeuver.forkType) {
                    ForkType.LEFT -> Maneuver.TYPE_FORK_LEFT
                    ForkType.RIGHT -> Maneuver.TYPE_FORK_RIGHT
                    null -> Maneuver.TYPE_UNKNOWN
                }
            }

            ManeuverType.ENTERFERRY -> {
                Maneuver.TYPE_FERRY_BOAT
            }

            ManeuverType.KEEP -> {
                when (nitroManeuver.keepType) {
                    KeepType.LEFT -> Maneuver.TYPE_KEEP_LEFT
                    KeepType.RIGHT -> Maneuver.TYPE_KEEP_RIGHT
                    KeepType.FOLLOWROAD -> Maneuver.TYPE_STRAIGHT
                    null -> Maneuver.TYPE_UNKNOWN
                }
            }
        }

        return Maneuver.Builder(maneuverType).apply {
            setIcon(parseImage(context, nitroManeuver.symbolImage))
            if (nitroManeuver.maneuverType == ManeuverType.ROUNDABOUT) {
                nitroManeuver.exitNumber?.let {
                    setRoundaboutExitNumber(it.toInt())
                }
                nitroManeuver.angle?.let {
                    setRoundaboutExitAngle(it.toInt())
                }
            }
        }.build()
    }

    fun parseStep(context: CarContext, nitroManeuver: NitroRoutingManeuver): Step {
        return Step.Builder(parseText(context, nitroManeuver.attributedInstructionVariants)).apply {
            nitroManeuver.roadName?.firstOrNull()?.let {
                setRoad(it)
            }
            setManeuver(parseManeuver(context, nitroManeuver))
            nitroManeuver.linkedLaneGuidance?.let { laneGuidance ->
                val lanes = laneGuidance.lanes.mapNotNull { it.asFirstOrNull() }
                lanes.forEach { lane ->
                    addLane(Lane.Builder().apply {
                        addDirection(
                            LaneDirection.create(
                                parseAngle(lane.highlightedAngle.toInt()), lane.isPreferred
                            )
                        )
                    }.build())
                }

                val laneImages = laneGuidance.lanes.mapNotNull {
                    it.asFirstOrNull()?.image ?: it.asSecondOrNull()?.image
                }
                if (laneImages.isNotEmpty()) {
                    setLanesImage(parseImages(context, laneImages))
                }
            }
        }.build()
    }

    fun parseAngle(angle: Int): Int {
        val absAngle = abs(angle)

        return when {
            absAngle < 10 -> LaneDirection.SHAPE_STRAIGHT
            angle in 10 until 45 -> LaneDirection.SHAPE_SLIGHT_RIGHT
            angle in -45 until -10 -> LaneDirection.SHAPE_SLIGHT_LEFT
            angle in 45 until 135 -> LaneDirection.SHAPE_NORMAL_RIGHT
            angle in -135 until -45 -> LaneDirection.SHAPE_NORMAL_LEFT
            angle in 135 until 175 -> LaneDirection.SHAPE_SHARP_RIGHT
            angle in -175 until -135 -> LaneDirection.SHAPE_SHARP_LEFT
            angle in 175..180 -> LaneDirection.SHAPE_U_TURN_RIGHT
            angle in -180..-175 -> LaneDirection.SHAPE_U_TURN_LEFT
            else -> LaneDirection.SHAPE_UNKNOWN
        }
    }
}