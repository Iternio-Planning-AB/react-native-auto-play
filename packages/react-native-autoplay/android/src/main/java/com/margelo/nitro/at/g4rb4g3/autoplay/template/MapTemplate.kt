package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.AppManager
import androidx.car.app.CarContext
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.Alert
import androidx.car.app.model.AlertCallback
import androidx.car.app.model.CarColor
import androidx.car.app.model.CarIcon
import androidx.car.app.model.Template
import androidx.car.app.navigation.NavigationManager
import androidx.car.app.navigation.NavigationManagerCallback
import androidx.car.app.navigation.model.Destination
import androidx.car.app.navigation.model.NavigationTemplate
import androidx.car.app.navigation.model.RoutingInfo
import androidx.car.app.navigation.model.Trip
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoSession
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.AlertActionStyle
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.AlertDismissalReason
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.MapTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroActionType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroColor
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroMapButton
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroMapButtonType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroNavigationAlert
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.TravelEstimates
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.TripConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.TripPoint
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.VisibleTravelEstimate
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.SymbolFont
import java.security.InvalidParameterException

class MapTemplate(
    context: CarContext, config: MapTemplateConfig
) : AndroidAutoTemplate<MapTemplateConfig>(context, config) {

    override val isRenderTemplate = true
    override val templateId: String
        get() = config.id

    private var alertId: Double? = null

    init {
        mapTemplate = this
    }

    private fun parseMapButtons(buttons: Array<NitroMapButton>): ActionStrip {
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
                                SymbolFont.iconFromNitroImage(
                                    context, image
                                )
                            ).build()
                        )
                    }.build())
                }
            }
        }.build()
    }

    private fun parseMapActions(headerActions: Array<NitroAction>): ActionStrip {
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
        }.build()
    }

    override fun parse(): Template {
        return NavigationTemplate.Builder().apply {
            config.mapButtons?.let { buttons ->
                setMapActionStrip(parseMapButtons(buttons))
            }
            config.headerActions?.let { headerActions ->
                setActionStrip(parseMapActions(headerActions))
            }
            config.guidanceBackgroundColor?.let {
                setBackgroundColor(Parser.parseColor(it))
            }
            destinationTravelEstimates[config.visibleTravelEstimate]?.let {
                setDestinationTravelEstimate(
                    Parser.parseTravelEstimates(it)
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
                    alertId = null
                    if (!isAutoDismissal) {
                        alertConfig.onDidDismiss?.let {
                            it(AlertDismissalReason.USER)
                        }
                    }
                }
            })
        }.build()

        if (alertId != alertConfig.id) {
            alertId = alertConfig.id
            alertConfig.onWillShow?.let { it() }
        }

        context.getCarService(AppManager::class.java).showAlert(alert)
    }

    fun updateGuidanceBackgroundColor(color: NitroColor?) {
        config = config.copy(guidanceBackgroundColor = color)
        applyConfigUpdate()
    }

    fun updateVisibleTravelEstimate(
        visibleTravelEstimate: VisibleTravelEstimate
    ) {
        config = config.copy(visibleTravelEstimate = visibleTravelEstimate)
        applyConfigUpdate()
    }

    companion object {
        var isNavigating = false
        var navigationInfo: RoutingInfo? = null

        private var mapTemplate: MapTemplate? = null
        private lateinit var navigationManager: NavigationManager
        private var destinationTravelEstimates = mutableMapOf<VisibleTravelEstimate, TravelEstimates>()


        private val navigationManagerCallback = object : NavigationManagerCallback {
            override fun onAutoDriveEnabled() {

            }

            override fun onStopNavigation() {
                navigationEnded()
            }
        }

        fun updateTrip(steps: Array<TripPoint>) {
            val trip = Trip.Builder().apply {
                steps.map { step ->
                    val travelEstimate = Parser.parseTravelEstimates(step.travelEstimates)
                    addDestination(
                        Destination.Builder().apply {
                            setName(step.name)
                        }.build(), travelEstimate
                    )
                }
            }.build()

            UiThreadUtil.runOnUiThread {
                navigationManager.updateTrip(trip)
            }
        }

        fun updateDestinationTravelEstimates(steps: Array<TripPoint>) {
            destinationTravelEstimates[VisibleTravelEstimate.FIRST] = steps.first().travelEstimates
            destinationTravelEstimates[VisibleTravelEstimate.LAST] = steps.last().travelEstimates
        }

        fun startNavigation(trip: TripConfig) {
            isNavigating = true
            val steps = trip.routeChoice.steps

            updateDestinationTravelEstimates(steps)

            mapTemplate?.applyConfigUpdate()

            UiThreadUtil.runOnUiThread {
                val context = AndroidAutoSession.getRootContext()
                    ?: throw InvalidParameterException("startNavigation, could not get root car context")

                navigationManager = context.getCarService(NavigationManager::class.java)
                navigationManager.setNavigationManagerCallback(navigationManagerCallback)
                navigationManager.navigationStarted()

                updateTrip(steps)
            }
        }

        fun updateTravelEstimates(steps: Array<TripPoint>) {
            updateDestinationTravelEstimates(steps)
            mapTemplate?.applyConfigUpdate()

            updateTrip(steps)
        }

        fun stopNavigation() {
            UiThreadUtil.runOnUiThread {
                navigationManager.navigationEnded()
            }
            navigationEnded()
        }

        fun navigationEnded() {
            isNavigating = false
            destinationTravelEstimates.clear()
            navigationInfo = null

            mapTemplate?.applyConfigUpdate()
        }
    }
}