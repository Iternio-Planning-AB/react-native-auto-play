//
//  Template.swift
//  Pods
//
//  Created by Manuel Auer on 03.10.25.
//

import CarPlay

class AutoPlayTemplate: NSObject {
    let template: CPTemplate
    var barButtons: [NitroAction]?

    init(template: CPTemplate, header: [NitroAction]?) {
        self.template = template
        self.barButtons = header

        super.init()
    }

    @MainActor
    func setBarButtons() {
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

    @MainActor
    open func invalidate() {
        print("\(type(of: self)) lacks invalidate implementation")
    }

    open func onWillAppear(animated: Bool) {
        print("\(type(of: self)) lacks onWillAppear implementation")
    }

    open func onDidAppear(animated: Bool) {
        print("\(type(of: self)) lacks onDidAppear implementation")
    }

    open func onWillDisappear(animated: Bool) {
        print("\(type(of: self)) lacks onWillDisappear implementation")
    }

    open func onDidDisappear(animated: Bool) {
        print("\(type(of: self)) lacks onDidDisappear implementation")
    }

    open func onPopped() {
        print("\(type(of: self)) lacks onPopped implementation")
    }

    open func traitCollectionDidChange() {}
}
