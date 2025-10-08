//
//  MapTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 03.10.25.
//
import CarPlay
import React

class MapTemplate: Template, CPMapTemplateDelegate {
    var config: NitroMapTemplateConfig

    init(config: NitroMapTemplateConfig) {
        self.config = config

        super.init(template: CPMapTemplate())

        self.template.userInfo = ["id": config.id]

        if let template = self.template as? CPMapTemplate {
            template.mapDelegate = self
        }

        invalidate()
    }

    func invalidate() {
        guard let template = self.template as? CPMapTemplate else { return }

        if let mapButtons = config.mapButtons {
            template.mapButtons = mapButtons.map { button in
                if let image = button.image {
                    let icon = SymbolFont.imageFromNitroImage(image: image)
                    return CPMapButton(image: icon) { _ in
                        button.onPress()
                    }
                }
                return CPMapButton { _ in
                    button.onPress()
                }
            }
        }

        if let actions = config.actions {
            let parsedActions = Parser.parseActions(actions: actions)
            
            template.backButton = parsedActions.backButton
            template.leadingNavigationBarButtons = parsedActions.leadingNavigationBarButtons
            template.trailingNavigationBarButtons = parsedActions.trailingNavigationBarButtons
        }
    }

    // MARK: gestures
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        didUpdatePanGestureWithTranslation: CGPoint,
        velocity: CGPoint
    ) {
        config.onDidUpdatePanGestureWithTranslation?(
            Point(
                x: didUpdatePanGestureWithTranslation.x,
                y: didUpdatePanGestureWithTranslation.y
            ),
            Point(x: velocity.x, y: velocity.y)
        )
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        didUpdateZoomGestureWithCenter center: CGPoint,
        scale: CGFloat,
        velocity: CGFloat
    ) {
        config.onDidUpdateZoomGestureWithCenter?(
            Point(x: center.x, y: center.y),
            scale,
            velocity
        )
    }

    // MARK: display style
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        displayStyleFor maneuver: CPManeuver
    ) -> CPManeuverDisplayStyle {
        return .leadingSymbol  // same as CPManeuverDisplayStyleDefault
        //        if(maneuver.instructionVariants.count == 0) {
        //            return CPManeuverDisplayStyleSymbolOnly;
        //        } else {
        //            return CPManeuverDisplayStyleDefault;
        //        }
    }

    // MARK: navigation events
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        selectedPreviewFor trip: CPTrip,
        using routeChoice: CPRouteChoice
    ) {

    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        startedTrip trip: CPTrip,
        using routeChoice: CPRouteChoice
    ) {

    }

    func mapTemplateDidCancelNavigation(_ mapTemplate: CPMapTemplate) {

    }

    func mapTemplateShouldProvideNavigationMetadata(
        _ mapTemplate: CPMapTemplate
    ) -> Bool {
        // this enables the "standard cluster" & "head up display" maneuvers
        return true
    }

    //MARK: notifications
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        shouldShowNotificationFor maneuver: CPManeuver
    ) -> Bool {
        return false
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        shouldUpdateNotificationFor maneuver: CPManeuver,
        with travelEstimates: CPTravelEstimates
    ) -> Bool {
        return false
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        shouldShowNotificationFor navigationAlert: CPNavigationAlert
    ) -> Bool {
        return false
    }

    // MARK: alerts
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        willShow navigationAlert: CPNavigationAlert
    ) {

    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        didShow navigationAlert: CPNavigationAlert
    ) {

    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        willDismiss navigationAlert: CPNavigationAlert,
        dismissalContext: CPNavigationAlert.DismissalContext
    ) {

    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        didDismiss navigationAlert: CPNavigationAlert,
        dismissalContext: CPNavigationAlert.DismissalContext
    ) {

    }
}
