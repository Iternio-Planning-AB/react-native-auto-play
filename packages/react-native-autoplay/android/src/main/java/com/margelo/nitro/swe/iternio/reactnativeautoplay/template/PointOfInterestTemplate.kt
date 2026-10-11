package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import android.Manifest
import android.content.pm.PackageManager
import android.text.Spannable
import android.text.SpannableString
import androidx.car.app.CarContext
import androidx.car.app.constraints.ConstraintManager
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarIcon
import androidx.car.app.model.CarLocation
import androidx.car.app.model.CarText
import androidx.car.app.model.Distance
import androidx.car.app.model.DistanceSpan
import androidx.car.app.model.ItemList
import androidx.car.app.model.Metadata
import androidx.car.app.model.Place
import androidx.car.app.model.PlaceListMapTemplate
import androidx.car.app.model.PlaceMarker
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import androidx.core.graphics.drawable.IconCompat
import com.margelo.nitro.swe.iternio.reactnativeautoplay.AutoText
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.PointOfInterest
import com.margelo.nitro.swe.iternio.reactnativeautoplay.PointOfInterestStatus
import com.margelo.nitro.swe.iternio.reactnativeautoplay.PointOfInterestTemplateConfig

class PointOfInterestTemplate(context: CarContext, config: PointOfInterestTemplateConfig) :
    AndroidAutoTemplate<PointOfInterestTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id
    override val autoDismissMs = config.autoDismissMs

    override fun parse(): Template {
        return try {
            parsePlaceListMap()
        } catch (e: Exception) {
            // Returning a safe empty loading template instead of re-throwing prevents the Car
            // App Library rendering loop from crashing the entire Android Auto session.
            PlaceListMapTemplate.Builder().setLoading(true).build()
        }
    }

    private fun parsePlaceListMap(): Template {
        // setCurrentLocationEnabled(true) crashes the whole car app with a
        // SecurityException ("does not have the required location permission(s)") if the
        // OS-level runtime permission was denied — only enable it once the app actually
        // holds ACCESS_FINE_LOCATION or ACCESS_COARSE_LOCATION.
        val hasLocationPermission =
            context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED ||
            context.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED

        val builder = PlaceListMapTemplate.Builder()
            .setTitle(parseTitle(config.title, "Places"))
            .setHeaderAction(Action.BACK)
            .setCurrentLocationEnabled(hasLocationPermission)

        config.actionStrip?.let { actionStrip ->
            builder.setActionStrip(
                ActionStrip.Builder()
                    .addAction(
                        Action.Builder()
                            .setTitle(actionStrip.label)
                            .setOnClickListener { actionStrip.onPress() }
                            .build()
                    )
                    .build()
            )
        }

        if (config.items.isEmpty()) {
            builder.setLoading(true)
            return builder.build()
        }

        val pinColors = PinColors.from(config.colors, context)
        val itemListBuilder = ItemList.Builder()
        // Use the host's declared place-list limit instead of a hardcoded count so as
        // many pins/rows as the car allows are shown. Exceeding the limit would make
        // setItemList() throw, so we never take more than this.
        val maxRows = context
            .getCarService(ConstraintManager::class.java)
            .getContentLimit(ConstraintManager.CONTENT_LIMIT_TYPE_PLACE_LIST)
            .coerceAtLeast(1)

        config.items.take(maxRows).forEach { item ->
            val pinBitmap = PinBitmapRenderer.render(
                status = item.status ?: PointOfInterestStatus.INACTIVE,
                available = item.available?.toInt() ?: 0,
                total = item.total?.toInt() ?: 1,
                hasBadge = item.hasBadge ?: false,
                isHighlighted = item.isHighlighted ?: false,
                colors = pinColors,
            )
            val pinIcon = CarIcon.Builder(IconCompat.createWithBitmap(pinBitmap)).build()

            val placeBuilder = Place.Builder(CarLocation.create(item.lat, item.lng))
                .setMarker(
                    PlaceMarker.Builder()
                        .setIcon(pinIcon, PlaceMarker.TYPE_IMAGE)
                        .build(),
                )

            // PlaceListMapTemplate requires every non-browsable row to carry a
            // DistanceSpan on its title or one of its text lines — otherwise the host
            // shows a meaningless placeholder distance instead of the real one.
            // Prepend it to line1 as a spanned leading space; the host renders that
            // character as the live, locale-formatted distance (e.g. "40 m"). A
            // second, unspanned space follows it so the rendered distance doesn't run
            // into line1's own text.
            val line1 = item.line1 ?: ""
            val line1WithDistance = SpannableString(
                if (line1.isNotBlank()) "  $line1" else " ",
            ).apply {
                setSpan(
                    DistanceSpan.create(toDisplayDistance(item.distanceMeters ?: 0.0)),
                    0, 1,
                    Spannable.SPAN_INCLUSIVE_INCLUSIVE,
                )
            }

            val rowBuilder = Row.Builder()
                .setTitle(parseTitle(item.title, "Place"))
                .setMetadata(
                    Metadata.Builder()
                        .setPlace(placeBuilder.build())
                        .build(),
                )
                .addText(line1WithDistance)
                .setOnClickListener {
                    // PlaceListMapTemplate: tapping the pin only scrolls to the row;
                    // actual selection fires here when the user taps the row itself.
                    config.onSelectItem?.let { it(item.id) }
                }

            item.line2?.let { line2 ->
                if (line2.isNotBlank()) {
                    rowBuilder.addText(line2)
                }
            }

            // validateNoRowsHaveBothMarkersAndImages() is enforced on the full
            // ItemList by PlaceListMapTemplate.Builder.setItemList() — not catchable
            // per-row. The map pin (PlaceMarker) takes priority; row icon is
            // intentionally omitted.
            itemListBuilder.addItem(rowBuilder.build())
        }

        builder.setItemList(itemListBuilder.build())
        return builder.build()
    }

    // Row.Builder/PlaceListMapTemplate reject an empty title, so fall back to a placeholder for blank ones.
    private fun parseTitle(text: AutoText, fallback: String): CarText {
        return if (text.text.isBlank()) {
            CarText.create(fallback)
        } else {
            Parser.parseText(text)
        }
    }

    // Distance.create() renders displayDistance as-is in the given unit — it does NOT
    // auto-convert. Passing raw meters with UNIT_METERS unconditionally (regardless of
    // magnitude) produces results like "134363.5 m" for a 134 km route. Switch to
    // kilometers above 1 km, matching common navigation-UI convention.
    private fun toDisplayDistance(distanceMeters: Double): Distance {
        return if (distanceMeters < 1000.0) {
            Distance.create(Math.round(distanceMeters).toDouble(), Distance.UNIT_METERS)
        } else {
            val km = Math.round(distanceMeters / 100.0) / 10.0
            Distance.create(km, Distance.UNIT_KILOMETERS)
        }
    }

    fun updateItems(items: Array<PointOfInterest>) {
        config = config.copy(items = items)
        super.applyConfigUpdate()
    }

    /**
     * A `PlaceListMapTemplate` only exposes a single header action, which is always the back
     * button, so there is nothing to apply here.
     */
    override fun setTemplateHeaderActions(headerActions: Array<NitroAction>?) {}

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
}
