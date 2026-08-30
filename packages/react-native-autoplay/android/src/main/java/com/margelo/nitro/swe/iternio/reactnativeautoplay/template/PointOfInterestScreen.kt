package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import android.Manifest
import android.content.pm.PackageManager
import android.text.Spannable
import android.text.SpannableString
import androidx.car.app.CarContext
import androidx.car.app.CarToast
import androidx.car.app.Screen
import androidx.car.app.constraints.ConstraintManager
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarIcon
import androidx.car.app.model.CarLocation
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
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

data class ActionStripConfig(val label: String, val toastMessage: String)

data class PoiItemData(
    val id: String,
    val title: String,
    val line1: String = "",
    val line2: String = "",
    val imageUri: String? = null,
    val lat: Double,
    val lng: Double,
    val distanceMeters: Double = 0.0,
    val status: String = "Inactive",
    val available: Int = 0,
    val total: Int = 1,
    val hasBadge: Boolean = false,
    val isHighlighted: Boolean = false,
)

/**
 * A [PlaceListMapTemplate]-backed screen driven from JS via [PointOfInterestModule], with pins
 * rendered by [PinBitmapRenderer]. Pairs with the JS-side `PointOfInterestTemplate` wrapper.
 */
class PointOfInterestScreen(
    carContext: CarContext,
    private val title: String,
    private var items: List<PoiItemData>,
    private val reactContext: ReactApplicationContext,
    val templateId: String,
    private var actionStripConfig: ActionStripConfig? = null,
) : Screen(carContext) {

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

    override fun onGetTemplate(): Template {
        return try {
            // setCurrentLocationEnabled(true) crashes the whole car app with a
            // SecurityException ("does not have the required location permission(s)") if the
            // OS-level runtime permission was denied — only enable it once the app actually
            // holds ACCESS_FINE_LOCATION or ACCESS_COARSE_LOCATION.
            val hasLocationPermission =
                carContext.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) ==
                    PackageManager.PERMISSION_GRANTED ||
                carContext.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) ==
                    PackageManager.PERMISSION_GRANTED

            val builder = PlaceListMapTemplate.Builder()
                .setTitle(title.ifBlank { "Places" })
                .setHeaderAction(Action.BACK)
                .setCurrentLocationEnabled(hasLocationPermission)

            actionStripConfig?.let { cfg ->
                val action = Action.Builder()
                    .setTitle(cfg.label)
                    .setOnClickListener {
                        CarToast.makeText(carContext, cfg.toastMessage, CarToast.LENGTH_LONG).show()
                    }
                    .build()
                builder.setActionStrip(ActionStrip.Builder().addAction(action).build())
            }

            if (items.isEmpty()) {
                builder.setLoading(true)
            } else {
                val itemListBuilder = ItemList.Builder()
                // Use the host's declared place-list limit instead of a hardcoded count so as
                // many pins/rows as the car allows are shown. Exceeding the limit would make
                // setItemList() throw, so we never take more than this.
                val maxRows = carContext
                    .getCarService(ConstraintManager::class.java)
                    .getContentLimit(ConstraintManager.CONTENT_LIMIT_TYPE_PLACE_LIST)
                    .coerceAtLeast(1)
                items.take(maxRows).forEach { item ->
                    val titleText = item.title.ifBlank { "Place" }

                    val pinBitmap = PinBitmapRenderer.render(
                        item.status, item.available, item.total,
                        item.hasBadge, item.isHighlighted,
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
                    val line1WithDistance = SpannableString(
                        if (item.line1.isNotBlank()) "  ${item.line1}" else " ",
                    ).apply {
                        setSpan(
                            DistanceSpan.create(toDisplayDistance(item.distanceMeters)),
                            0, 1,
                            Spannable.SPAN_INCLUSIVE_INCLUSIVE,
                        )
                    }

                    val rowBuilder = Row.Builder()
                        .setTitle(titleText)
                        .setMetadata(
                            Metadata.Builder()
                                .setPlace(placeBuilder.build())
                                .build(),
                        )
                        .addText(line1WithDistance)
                        .setOnClickListener {
                            // PlaceListMapTemplate: tapping the pin only scrolls to the row;
                            // actual selection fires here when the user taps the row itself.
                            reactContext
                                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                                ?.emit("PoiSelectItem", Arguments.createMap().apply {
                                    putString("templateId", templateId)
                                    putString("itemId", item.id)
                                })
                        }

                    if (item.line2.isNotBlank()) rowBuilder.addText(item.line2)

                    // validateNoRowsHaveBothMarkersAndImages() is enforced on the full
                    // ItemList by PlaceListMapTemplate.Builder.setItemList() — not catchable
                    // per-row. The map pin (PlaceMarker) takes priority; row icon is
                    // intentionally omitted.
                    itemListBuilder.addItem(rowBuilder.build())
                }
                builder.setItemList(itemListBuilder.build())
            }

            builder.build()
        } catch (e: Exception) {
            // Returning a safe empty loading template instead of re-throwing prevents the Car
            // App Library rendering loop from crashing the entire Android Auto session.
            PlaceListMapTemplate.Builder().setLoading(true).build()
        }
    }

    fun updateItems(newItems: List<PoiItemData>) {
        items = newItems
        invalidate()
    }

    fun updateActionStrip(config: ActionStripConfig?) {
        actionStripConfig = config
        invalidate()
    }

    companion object {
        fun parseItems(array: ReadableArray): List<PoiItemData> {
            val result = mutableListOf<PoiItemData>()
            for (i in 0 until array.size()) {
                val map: ReadableMap = array.getMap(i) ?: continue
                val line1 = map.getString("line1")
                    ?: map.getString("subtitle")  // backwards compat
                    ?: ""
                result.add(PoiItemData(
                    id = map.getString("id") ?: continue,
                    title = map.getString("title") ?: "",
                    line1 = line1,
                    line2 = map.getString("line2") ?: "",
                    imageUri = map.getString("imageUri"),
                    lat = map.getDouble("lat"),
                    lng = map.getDouble("lng"),
                    distanceMeters = if (map.hasKey("distanceMeters")) map.getDouble("distanceMeters") else 0.0,
                    status = map.getString("status") ?: "Inactive",
                    available = if (map.hasKey("available")) map.getInt("available") else 0,
                    total = if (map.hasKey("total")) map.getInt("total") else 1,
                    hasBadge = map.hasKey("hasBadge") && map.getBoolean("hasBadge"),
                    isHighlighted = map.hasKey("isHighlighted") && map.getBoolean("isHighlighted"),
                ))
            }
            return result
        }
    }
}
