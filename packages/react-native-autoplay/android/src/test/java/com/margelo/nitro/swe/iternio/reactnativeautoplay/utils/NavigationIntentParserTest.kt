package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

import com.margelo.nitro.swe.iternio.reactnativeautoplay.Location
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationAvoidOption
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationAvoidOption.FERRIES
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationAvoidOption.HIGHWAYS
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationAvoidOption.TOLLS
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationIntent
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationIntentType
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationIntentType.ADD_A_STOP
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationIntentType.DIRECTIONS
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationIntentType.NAVIGATION
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationIntentType.SEARCH
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationTravelMode
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationTravelMode.BICYCLING
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationTravelMode.DRIVING
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationTravelMode.TRANSIT
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NavigationTravelMode.WALKING
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class NavigationIntentParserTest {
    /** Takes the full URI like the host sends it and strips "geo:" as Uri would. */
    private fun parse(uri: String): NavigationIntent {
        return NavigationIntentParser.parse(uri.removePrefix("geo:"))
    }

    private fun intent(
        location: Location? = null,
        query: String? = null,
        type: NavigationIntentType = NAVIGATION,
        avoid: Array<NavigationAvoidOption> = emptyArray(),
        mode: NavigationTravelMode? = null,
        entry: String? = null
    ) = NavigationIntent(location, query, type, avoid, mode, entry)

    // examples from Google's navigation intent spec

    @Test
    fun queryOnly() {
        assertEquals(intent(query = "Googleplex"), parse("geo:0,0?q=Googleplex"))
    }

    @Test
    fun addAStopWithMode() {
        assertEquals(
            intent(query = "1600 Amphitheatre parkway", type = ADD_A_STOP, mode = BICYCLING),
            parse("geo:0,0?q=1600+Amphitheatre+parkway&mode=b&intent=add_a_stop")
        )
    }

    @Test
    fun navigationWithMode() {
        assertEquals(
            intent(query = "coffee shop", mode = WALKING),
            parse("geo:0,0?q=coffee+shop&mode=w&intent=navigation")
        )
    }

    @Test
    fun coordinatesAndQuery() {
        assertEquals(
            intent(location = Location(1.1, 2.2), query = "Starbucks on Main Street", mode = WALKING),
            parse("geo:1.1,2.2?q=Starbucks+on+Main+Street&mode=w&intent=navigation")
        )
    }

    @Test
    fun coordinatesWithoutQuery() {
        assertEquals(
            intent(location = Location(1.1, 2.2), mode = WALKING),
            parse("geo:1.1,2.2?mode=w&intent=navigation")
        )
    }

    @Test
    fun addAStopWithCoordinatesAndAddress() {
        assertEquals(
            intent(
                location = Location(47.61594547836694, -122.20373173098756),
                query = "575 Bellevue Square, Bellevue, WA 98004",
                type = ADD_A_STOP
            ),
            parse(
                "geo:47.61594547836694,-122.20373173098756" +
                    "?q=575+Bellevue+Square,+Bellevue,+WA+98004&intent=add_a_stop"
            )
        )
    }

    @Test
    fun avoidTollsAndFerries() {
        assertEquals(
            intent(query = "googleplex", avoid = arrayOf(TOLLS, FERRIES)),
            parse("geo:0,0?q=googleplex&avoid=tf")
        )
    }

    @Test
    fun entryWithCoordinates() {
        assertEquals(
            intent(location = Location(47.61594547836694, -122.20373173098756), entry = "assistant"),
            parse("geo:47.61594547836694,-122.20373173098756?entry=assistant")
        )
    }

    // edge cases

    @Test
    fun zeroCoordinatesWithoutParameters() {
        assertEquals(intent(), parse("geo:0,0"))
    }

    @Test
    fun coordinatesWithoutParameters() {
        assertEquals(intent(location = Location(48.78, 9.18)), parse("geo:48.78,9.18"))
    }

    @Test
    fun emptyQueryPart() {
        assertEquals(intent(location = Location(48.78, 9.18)), parse("geo:48.78,9.18?"))
    }

    @Test
    fun percentEncodedQuery() {
        assertEquals(intent(query = "Königstraße 1"), parse("geo:0,0?q=K%C3%B6nigstra%C3%9Fe%201"))
    }

    @Test
    fun encodedSeparatorsStayInQuery() {
        assertEquals(
            intent(query = "Fish & Chips = good", mode = DRIVING),
            parse("geo:0,0?q=Fish+%26+Chips+%3D+good&mode=d")
        )
    }

    @Test
    fun queryNotFirst() {
        assertEquals(
            intent(query = "Stuttgart", mode = DRIVING, type = DIRECTIONS),
            parse("geo:0,0?mode=d&intent=directions&q=Stuttgart")
        )
    }

    @Test
    fun allAvoidLettersUnknownOnesIgnored() {
        assertEquals(
            intent(query = "X", avoid = arrayOf(HIGHWAYS, TOLLS, FERRIES)),
            parse("geo:0,0?q=X&avoid=hxtzfT")
        )
    }

    @Test
    fun unknownIntentFallsBackToNavigation() {
        assertEquals(intent(query = "X"), parse("geo:0,0?q=X&intent=teleport"))
    }

    @Test
    fun emptyValuesAreUndefined() {
        assertEquals(intent(), parse("geo:0,0?q=&mode=&entry=&avoid="))
    }

    @Test
    fun firstOccurrenceWins() {
        assertEquals(intent(query = "A"), parse("geo:0,0?q=A&q=B"))
    }

    @Test
    fun malformedEscapeKeptRaw() {
        assertEquals(intent(query = "100%"), parse("geo:0,0?q=100%"))
    }

    @Test
    fun uncertaintyAndAltitudeIgnored() {
        assertEquals(intent(location = Location(1.1, 2.2)), parse("geo:1.1,2.2;u=35"))
        assertEquals(intent(location = Location(1.1, 2.2)), parse("geo:1.1,2.2,300"))
    }

    @Test
    fun invalidCoordinates() {
        assertEquals(intent(query = "X"), parse("geo:abc?q=X"))
        assertEquals(intent(query = "X"), parse("geo:91,0?q=X"))
        assertEquals(intent(query = "X"), parse("geo:0,181?q=X"))
        assertEquals(intent(query = "X"), parse("geo:?q=X"))
    }

    @Test
    fun searchOverridesIntentParameter() {
        assertEquals(
            intent(location = Location(48.2, 16.37), query = "charging stations", type = SEARCH),
            NavigationIntentParser.parse("48.2,16.37?q=charging+stations&intent=add_a_stop", true)
        )
    }

    // custom actions

    private fun action(act: String) = NavigationAction(act)

    @Test
    fun googleMapsActionsSeenOnTheDhu() {
        val prefix = "google.maps://maps.google.com/?act="
        assertEquals(
            action("mute"),
            NavigationIntentParser.parseAction("${prefix}1&notts=1")
        )
        assertEquals(
            action("avoid_tolls"),
            NavigationIntentParser.parseAction("${prefix}35&notts=1")
        )
        assertEquals(
            action("avoid_ferries"),
            NavigationIntentParser.parseAction("${prefix}37&notts=1")
        )
        assertEquals(
            action("allow_ferries"),
            NavigationIntentParser.parseAction("${prefix}38&notts=1")
        )
    }

    @Test
    fun hostConvertedGeoAction() {
        assertEquals(
            action("allow_highways"),
            NavigationIntentParser.parseAction("geo:0,0?act=40&")
        )
    }

    @Test
    fun namedGeoAction() {
        assertEquals(
            action("remove_electric_vehicle_fast_charging_filter"),
            NavigationIntentParser.parseAction(
                "geo.action:?act=remove_electric_vehicle_fast_charging_filter"
            )
        )
    }

    @Test
    fun unknownActKeptRaw() {
        assertEquals(action("99"), NavigationIntentParser.parseAction("geo:0,0?act=99"))
        assertEquals(
            action("teleport"),
            NavigationIntentParser.parseAction("geo.action:?act=teleport")
        )
    }

    @Test
    fun destinationIsNoAction() {
        assertNull(NavigationIntentParser.parseAction("geo:0,0?q=Googleplex"))
        assertNull(NavigationIntentParser.parseAction("geo:1.1,2.2"))
        assertNull(NavigationIntentParser.parseAction("geo:0,0?act="))
        assertNull(NavigationIntentParser.parseAction("google.maps://maps.google.com/?notts=1"))
    }

    @Test
    fun unknownModeDropped() {
        assertEquals(intent(query = "Graz"), parse("geo:0,0?q=Graz&mode=q"))
    }

    @Test
    fun modeIsCaseInsensitive() {
        assertEquals(intent(query = "Graz", mode = TRANSIT), parse("geo:0,0?q=Graz&mode=R"))
    }
}
