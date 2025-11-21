//
//  Template.swift
//  Pods
//
//  Created by Manuel Auer on 03.10.25.
//

import CarPlay

protocol AutoPlayTemplate {
    var autoDismissMs: Double? { get }

    @MainActor func invalidate()
    func onWillAppear(animated: Bool)
    func onDidAppear(animated: Bool)
    func onWillDisappear(animated: Bool)
    func onDidDisappear(animated: Bool)
    func onPopped()
    func traitCollectionDidChange()
    func getTemplate() -> CPTemplate
}

extension AutoPlayTemplate {
    func traitCollectionDidChange() {
        // this can be implemented optionally
    }
}

protocol AutoPlayHeaderProviding {
    @MainActor var barButtons: [NitroAction]? { get set }
}

@MainActor
func setBarButtons(template: CPTemplate, barButtons: [NitroAction]?) {
    guard let template = template as? CPBarButtonProviding else { return }

    if let headerActions = barButtons {
        let parsedActions = Parser.parseHeaderActions(
            headerActions: headerActions,
            traitCollection: SceneStore.getRootTraitCollection()
        )

        template.backButton = parsedActions.backButton
        template.leadingNavigationBarButtons =
            parsedActions.leadingNavigationBarButtons
        template.trailingNavigationBarButtons =
            parsedActions.trailingNavigationBarButtons
    }
}
