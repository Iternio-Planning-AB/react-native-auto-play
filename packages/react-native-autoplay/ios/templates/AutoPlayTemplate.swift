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
    var traitCollection = UIScreen.main.traitCollection

    init(template: CPTemplate, header: [NitroAction]?) {
        self.template = template
        self.barButtons = header

        super.init()
    }

    func setBarButtons() {
        guard let template = template as? CPBarButtonProviding else { return }

        if let headerActions = barButtons {
            let parsedActions = Parser.parseHeaderActions(
                headerActions: headerActions,
                traitCollection: traitCollection
            )

            template.backButton = parsedActions.backButton
            template.leadingNavigationBarButtons =
                parsedActions.leadingNavigationBarButtons
            template.trailingNavigationBarButtons =
                parsedActions.trailingNavigationBarButtons
        }
    }

    open func invalidate() {
        print("\(type(of: self)) lacks invalidate implementation")
    }

    open func onWillAppear(animted: Bool) {
        print("\(type(of: self)) lacks onWillAppear implementation")
    }

    open func onDidAppear(animted: Bool) {
        print("\(type(of: self)) lacks onDidAppear implementation")
    }

    open func onWillDisappear(animted: Bool) {
        print("\(type(of: self)) lacks onWillDisappear implementation")
    }

    open func onDidDisappear(animted: Bool) {
        print("\(type(of: self)) lacks onDidDisappear implementation")
    }

    open func onPopped() {
        print("\(type(of: self)) lacks onPopped implementation")
    }

    open func traitCollectionDidChange(traitColleciton: UITraitCollection) {
        self.traitCollection = traitColleciton
    }
}
