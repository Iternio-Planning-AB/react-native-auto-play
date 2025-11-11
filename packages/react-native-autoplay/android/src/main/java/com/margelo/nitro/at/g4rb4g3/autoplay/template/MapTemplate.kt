package com.margelo.nitro.at.g4rb4g3.autoplay.template

import android.graphics.Color
import androidx.car.app.AppManager
import androidx.car.app.CarContext
import androidx.car.app.model.Action
import androidx.car.app.model.Alert
import androidx.car.app.model.AlertCallback
import androidx.car.app.model.CarColor
import androidx.car.app.model.CarIcon
import androidx.car.app.model.Template
import androidx.car.app.navigation.NavigationManager
import androidx.car.app.navigation.NavigationManagerCallback
import androidx.car.app.navigation.model.Destination
import androidx.car.app.navigation.model.MessageInfo
import androidx.car.app.navigation.model.NavigationTemplate
import androidx.car.app.navigation.model.RoutingInfo
import androidx.car.app.navigation.model.TravelEstimate
import androidx.car.app.navigation.model.Trip
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoScreen
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoSession
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.AlertActionStyle
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.AlertDismissalReason
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.MapTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroManeuver
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroMapButton
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroNavigationAlert
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.TripConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.TripPoint
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.VisibleTravelEstimate
import java.security.InvalidParameterException

class MapTemplate(
    context: CarContext, config: MapTemplateConfig, initNavigationManager: Boolean = false
) : AndroidAutoTemplate<MapTemplateConfig>(context, config) {

    override val isRenderTemplate = true
    override val templateId: String
        get() = config.id

    private var alertPriority = 0
    private var alertIds: HashSet<Int> = HashSet()


    init {
        if (initNavigationManager) {
            val navigationManagerCallback = object : NavigationManagerCallback {
                override fun onAutoDriveEnabled() {
                    config.onAutoDriveEnabled?.let {
                        it()
                    }
                }

                override fun onStopNavigation() {
                    navigationEnded()
                    config.onStopNavigation()
                }
            }

            UiThreadUtil.runOnUiThread {
                navigationManager = context.getCarService(NavigationManager::class.java)
                navigationManager.setNavigationManagerCallback(navigationManagerCallback)
            }
        }
    }

    override fun parse(): Template {
        return NavigationTemplate.Builder().apply {
            setBackgroundColor(cardBackgroundColor)
            config.mapButtons?.let { buttons ->
                setMapActionStrip(Parser.parseMapActions(context, buttons))
            }
            config.headerActions?.let { headerActions ->
                setActionStrip(Parser.parseMapHeaderActions(context, headerActions))
            }
            val travelEstimates =
                if (config.visibleTravelEstimate == VisibleTravelEstimate.FIRST) destinationTravelEstimates.firstOrNull() else destinationTravelEstimates.lastOrNull()
            travelEstimates?.let {
                setDestinationTravelEstimate(
                    Parser.parseTravelEstimates(it.travelEstimates)
                )
            }
            if (isNavigating) {
                navigationInfo?.let {
                    setNavigationInfo(it)
                } ?: run {
                    setNavigationInfo(RoutingInfo.Builder().apply {
                        setLoading(true)
                    }.build())
                }
            }
        }.build()
    }

    override fun setTemplateHeaderActions(headerActions: Array<NitroAction>?) {
        config = config.copy(headerActions = headerActions)
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
        applyConfigUpdate()
    }

    fun showAlert(alertConfig: NitroNavigationAlert) {
        if (alertPriority > alertConfig.priority) {
            // ignore alerts with lower priority than current alert
            return
        }

        val title = Parser.parseText(alertConfig.title)
        val durationMillis = alertConfig.durationMs.toLong()

        val alert = Alert.Builder(alertConfig.id.toInt(), title, durationMillis).apply {
            var isAutoDismissal = false

            alertConfig.subtitle?.let { subtitle -> setSubtitle(Parser.parseText(subtitle)) }
            alertConfig.image?.let { image -> setIcon(Parser.parseImage(context, image)) }
            addAction(Action.Builder().apply {
                setTitle(alertConfig.primaryAction.title)
                setFlags(Action.FLAG_PRIMARY)
                setFlags(Action.FLAG_DEFAULT)
                setOnClickListener(alertConfig.primaryAction.onPress)
                alertConfig.primaryAction.style?.let { style ->
                    if (style == AlertActionStyle.DESTRUCTIVE) {
                        setBackgroundColor(CarColor.RED)
                    }
                }
            }.build())
            alertConfig.secondaryAction?.let { action ->
                addAction(Action.Builder().apply {
                    setTitle(action.title)
                    setOnClickListener(action.onPress)
                    action.style?.let { style ->
                        if (style == AlertActionStyle.DESTRUCTIVE) {
                            setBackgroundColor(CarColor.RED)
                        }
                    }
                }.build())
            }
            setCallback(object : AlertCallback {
                override fun onCancel(reason: Int) {
                    isAutoDismissal = true
                    when (reason) {
                        AlertCallback.REASON_TIMEOUT -> alertConfig.onDidDismiss?.let {
                            it(
                                AlertDismissalReason.TIMEOUT
                            )
                        }

                        AlertCallback.REASON_USER_ACTION -> alertConfig.onDidDismiss?.let {
                            it(AlertDismissalReason.USER)
                        }

                        AlertCallback.REASON_NOT_SUPPORTED -> {
                            // we make sure that this can be called on navigation templates already so this should never happen
                        }
                    }
                }

                override fun onDismiss() {
                    alertIds.remove(alertConfig.id.toInt())
                    if (alertIds.isEmpty()) {
                        alertPriority = 0
                    }

                    if (!isAutoDismissal) {
                        alertConfig.onDidDismiss?.let {
                            it(AlertDismissalReason.USER)
                        }
                    }
                }
            })
        }.build()

        if (!alertIds.contains(alert.id)) {
            alertConfig.onWillShow?.let { it() }
            alertIds.add(alert.id)
            alertPriority = alertConfig.priority.toInt()
        }

        context.getCarService(AppManager::class.java).showAlert(alert)
    }

    fun updateVisibleTravelEstimate(
        visibleTravelEstimate: VisibleTravelEstimate
    ) {
        config = config.copy(visibleTravelEstimate = visibleTravelEstimate)
        applyConfigUpdate()
    }

    companion object {
        private lateinit var navigationManager: NavigationManager
        var isNavigating = false
        var navigationInfo: NavigationTemplate.NavigationInfo? = null
        var cardBackgroundColor: CarColor = CarColor.createCustom(Color.BLACK, Color.BLACK)

        private var destinationTravelEstimates: Array<TripPoint> = arrayOf()

        fun getTripDestinations(): Map<Destination, TravelEstimate> {
            return mutableMapOf<Destination, TravelEstimate>().apply {
                destinationTravelEstimates.forEach { step ->
                    val destination = Destination.Builder().apply {
                        setName(step.name)
                    }.build()

                    val travelEstimates = Parser.parseTravelEstimates(step.travelEstimates)

                    put(destination, travelEstimates)
                }
            }
        }

        fun updateTripDestinations() {
            val tripDestinations = getTripDestinations()
            UiThreadUtil.runOnUiThread {
                navigationManager.updateTrip(Trip.Builder().apply {
                    tripDestinations.forEach {
                        addDestination(it.key, it.value)
                    }
                }.build())
            }
        }

        fun startNavigation(trip: TripConfig) {
            isNavigating = true
            val steps = trip.routeChoice.steps

            destinationTravelEstimates = steps

            AndroidAutoScreen.invalidateSurfaceScreens()

            UiThreadUtil.runOnUiThread {
                navigationManager.navigationStarted()

                updateTripDestinations()
            }
        }

        fun updateTravelEstimates(steps: Array<TripPoint>) {
            destinationTravelEstimates = steps

            AndroidAutoScreen.invalidateSurfaceScreens()
        }

        fun stopNavigation() {
            if (!this::navigationManager.isInitialized) {
                return
            }

            UiThreadUtil.runOnUiThread {
                navigationManager.navigationEnded()
            }
            navigationEnded()
        }

        fun navigationEnded() {
            isNavigating = false
            destinationTravelEstimates = arrayOf()
            navigationInfo = null

            AndroidAutoScreen.invalidateSurfaceScreens()
        }

        fun updateManeuvers(maneuvers: NitroManeuver) {
            if (!isNavigating) {
                return
            }

            val context = AndroidAutoSession.getRootContext()
                ?: throw InvalidParameterException("updateManeuvers, could not get root car context")

            if (!this::navigationManager.isInitialized) {
                throw InvalidParameterException("updateManeuvers, navigationManager not initialized, did you call startNavigation?")
            }

            val routingInfo = maneuvers.asFirstOrNull()
            val messageInfo = maneuvers.asSecondOrNull()

            if (routingInfo.isNullOrEmpty() && messageInfo == null) {
                navigationInfo = null
                AndroidAutoScreen.invalidateSurfaceScreens()
                return
            }

            if (messageInfo != null) {
                val backgroundColor =
                    if (context.isDarkMode) messageInfo.cardBackgroundColor.darkColor else messageInfo.cardBackgroundColor.lightColor
                cardBackgroundColor = Parser.parseColor(backgroundColor)

                navigationInfo = MessageInfo.Builder(messageInfo.title).apply {
                    messageInfo.text?.let {
                        setText(it)
                    }
                    messageInfo.image?.let {
                        setImage(Parser.parseImage(context, it))
                    }
                }.build()

                AndroidAutoScreen.invalidateSurfaceScreens()
                return
            }

            val current = routingInfo?.getOrNull(0)
            val next = routingInfo?.getOrNull(1)

            if (current == null) {
                return
            }

            val backgroundColor =
                if (context.isDarkMode) current.cardBackgroundColor.darkColor else current.cardBackgroundColor.lightColor
            cardBackgroundColor = Parser.parseColor(backgroundColor)

            val currentStep = Parser.parseStep(context, current)
            val nextStep = next?.let { Parser.parseStep(context, it) }

            navigationInfo = RoutingInfo.Builder().apply {
                setCurrentStep(
                    currentStep, Parser.parseDistance(current.travelEstimates.distanceRemaining)
                )
                nextStep?.let { setNextStep(it) }
            }.build()

            AndroidAutoScreen.invalidateSurfaceScreens()

            UiThreadUtil.runOnUiThread {
                navigationManager.updateTrip(Trip.Builder().apply {
                    addStep(
                        currentStep, Parser.parseTravelEstimates(current.travelEstimates)
                    )
                    nextStep?.let {
                        addStep(it, Parser.parseTravelEstimates(next.travelEstimates))
                    }
                    getTripDestinations().forEach {
                        addDestination(it.key, it.value)
                    }
                }.build())
            }
        }
    }
}