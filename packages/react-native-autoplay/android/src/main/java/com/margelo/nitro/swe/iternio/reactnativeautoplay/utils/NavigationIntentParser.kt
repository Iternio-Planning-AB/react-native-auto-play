package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

import com.margelo.nitro.swe.iternio.reactnativeautoplay.Location
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationAvoidOption
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationIntent
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationIntentType
import java.net.URLDecoder

/**
 * Parses the geo: URI of an androidx.car.app.action.NAVIGATE intent, following Google's
 * navigation intent spec: geo:lat,lon?q=query&intent=x&avoid=y&mode=z&entry=w
 *
 * Plain Kotlin without android.net.Uri, so it runs in JVM unit tests without Robolectric.
 */
object NavigationIntentParser {
    /**
     * act numbers of the custom actions, from the Android Auto host app 18.0 (its converter turns
     * geo.action:?act=<name> into geo:0,0?act=<number>). Not documented by Google. Confirmed on
     * the DHU for 1, 35, 37 and 38, which arrived as google.maps://maps.google.com/?act=N&notts=1.
     */
    private val actionCodes = mapOf(
        1 to "mute",
        2 to "unmute",
        3 to "show_traffic",
        4 to "hide_traffic",
        5 to "show_satellite",
        6 to "hide_satellite",
        7 to "show_alternates",
        8 to "route_overview",
        9 to "exit_navigation",
        11 to "query_next_turn",
        12 to "distance_to_next_turn",
        13 to "time_to_next_turn",
        14 to "distance_to_destination",
        15 to "time_to_destination",
        16 to "eta",
        17 to "go_back",
        19 to "show_directions_list",
        21 to "query_current_road",
        27 to "query_destination",
        28 to "follow_mode",
        35 to "avoid_tolls",
        36 to "allow_tolls",
        37 to "avoid_ferries",
        38 to "allow_ferries",
        39 to "avoid_highways",
        40 to "allow_highways",
        41 to "report_crash",
        44 to "report_traffic_jam",
        45 to "report_police",
        46 to "report_hazard",
        47 to "resume_navigation",
        48 to "report_road_closure",
        49 to "clear_search_results",
        50 to "remove_next_stop",
        55 to "apply_electric_vehicle_connector_filter",
        56 to "remove_electric_vehicle_connector_filter",
        57 to "apply_electric_vehicle_payment_filter",
        58 to "remove_electric_vehicle_payment_filter",
        59 to "apply_electric_vehicle_fast_charging_filter",
        60 to "remove_electric_vehicle_fast_charging_filter"
    )

    /**
     * A custom action when the URI carries an act parameter, under any scheme: numeric act as the
     * host forwards it (google.maps://...?act=35, geo:0,0?act=35) or named (geo.action:?act=mute).
     * Numeric act is mapped to the documented name, so JS gets the same value on Android Auto
     * (numbers) and Android Automotive (names). Unknown values are passed through unchanged.
     * Null when there is no act, i.e. the URI is a destination.
     * @param dataString the full, still encoded intent data (Intent.getDataString)
     */
    fun parseAction(dataString: String): NavigationAction? {
        val queryIndex = dataString.indexOf('?')
        if (queryIndex < 0) {
            return null
        }
        val act = parseQuery(dataString.substring(queryIndex + 1))["act"]?.trim()
        if (act.isNullOrEmpty()) {
            return null
        }

        return NavigationAction(act = act.toIntOrNull()?.let { actionCodes[it] } ?: act)
    }

    /**
     * @param encodedSchemeSpecificPart the part after "geo:", still percent-encoded
     * (Uri.getEncodedSchemeSpecificPart). The decoded one would turn an encoded "&" or "=" in q
     * into a parameter separator.
     */
    fun parse(encodedSchemeSpecificPart: String): NavigationIntent {
        val queryIndex = encodedSchemeSpecificPart.indexOf('?')
        val coordinatesPart = if (queryIndex >= 0) {
            encodedSchemeSpecificPart.substring(0, queryIndex)
        } else {
            encodedSchemeSpecificPart
        }
        val parameters = if (queryIndex >= 0) {
            parseQuery(encodedSchemeSpecificPart.substring(queryIndex + 1))
        } else {
            emptyMap()
        }

        return NavigationIntent(
            location = parseCoordinates(coordinatesPart),
            query = parameters["q"]?.trim()?.ifEmpty { null },
            intent = parseIntentType(parameters["intent"]),
            avoid = parseAvoid(parameters["avoid"]),
            mode = parameters["mode"]?.trim()?.ifEmpty { null },
            entry = parameters["entry"]?.trim()?.ifEmpty { null }
        )
    }

    /**
     * "lat,lon", optionally followed by an altitude or ";u=" uncertainty (RFC 5870).
     * Null for 0,0, which the spec uses for "no coordinates", and for invalid input.
     */
    fun parseCoordinates(coordinatesPart: String): Location? {
        val parts = decode(coordinatesPart).substringBefore(';').split(',')
        if (parts.size < 2 || parts.size > 3) {
            return null
        }

        val lat = parts[0].trim().toDoubleOrNull() ?: return null
        val lon = parts[1].trim().toDoubleOrNull() ?: return null

        if (lat == 0.0 && lon == 0.0) {
            return null
        }
        if (lat < -90.0 || lat > 90.0 || lon < -180.0 || lon > 180.0) {
            return null
        }

        return Location(lat, lon)
    }

    /** First occurrence of a key wins, like Uri.getQueryParameter. */
    private fun parseQuery(query: String): Map<String, String> {
        val parameters = LinkedHashMap<String, String>()
        query.split('&').forEach { pair ->
            if (pair.isEmpty()) {
                return@forEach
            }
            val separatorIndex = pair.indexOf('=')
            val key = decode(if (separatorIndex >= 0) pair.substring(0, separatorIndex) else pair)
            val value = if (separatorIndex >= 0) decode(pair.substring(separatorIndex + 1)) else ""
            parameters.putIfAbsent(key, value)
        }
        return parameters
    }

    /** Unknown values fall back to navigation, the spec's default when the parameter is absent. */
    private fun parseIntentType(value: String?): NavigationIntentType {
        return when (value?.trim()?.lowercase()) {
            "add_a_stop" -> NavigationIntentType.ADD_A_STOP
            "directions" -> NavigationIntentType.DIRECTIONS
            else -> NavigationIntentType.NAVIGATION
        }
    }

    private fun parseAvoid(value: String?): Array<NavigationAvoidOption> {
        if (value == null) {
            return emptyArray()
        }
        return value.lowercase().mapNotNull {
            when (it) {
                't' -> NavigationAvoidOption.TOLLS
                'h' -> NavigationAvoidOption.HIGHWAYS
                'f' -> NavigationAvoidOption.FERRIES
                else -> null
            }
        }.distinct().toTypedArray()
    }

    /** Decodes "+" and "%XX"; keeps the raw text when it holds a malformed escape. */
    private fun decode(value: String): String {
        return try {
            URLDecoder.decode(value, "UTF-8")
        } catch (e: IllegalArgumentException) {
            value
        }
    }
}
