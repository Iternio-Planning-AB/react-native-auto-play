//
//  GridTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 11.10.25.
//

import CarPlay

class GridTemplate: AutoPlayHeaderProviding {
    /// `nil` when this template renders as a map panel instead (see `mapPanel`).
    private(set) var template: CPGridTemplate?
    var config: GridTemplateConfig

    var buttons: [NitroGridButton]

    /// Boxed as `Any` since `CPMapPanel` itself is only available on iOS 27+ while this class supports a much lower deployment target.
    private var mapPanel: Any?

    /// `CPMapPanel.delegate` is `weak`, so this keeps the shared delegate alive for as long as the panel exists. Boxed as `Any` for the same reason as `mapPanel`.
    private var mapPanelDelegate: Any?

    override var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    override func getTemplate() throws -> CPTemplate {
        guard let template else {
            throw AutoPlayError.templateIsMapPanel(config.id)
        }
        return template
    }

    override func getPanel() -> Any? {
        return mapPanel
    }

    override func getPanelHeaderActions() -> [NitroAction]? {
        return config.mapConfig?.headerActions
    }

    override func getPanelMapButtons() -> [NitroMapButton]? {
        return config.mapConfig?.mapButtons
    }

    init(config: GridTemplateConfig) {
        self.config = config
        buttons = config.buttons

        let title = Parser.parseText(text: config.title)

        if #available(iOS 27.0, *), config.mapConfig != nil {
            mapPanel = CPMapPanel(
                title: title,
                sections: [CPMapPanelSection(title: nil, items: [])],
                buttonConfiguration: nil
            )
        }
        else {
            template = CPGridTemplate(
                title: title,
                gridButtons: GridTemplate.parseButtons(buttons: buttons),
                id: config.id
            )
        }

        super.init()

        barButtons = config.headerActions

        if #available(iOS 27.0, *), let mapPanel = mapPanel as? CPMapPanel {
            let delegate = AutoPlayMapPanelDelegate(template: self, templateId: config.id)
            mapPanelDelegate = delegate
            mapPanel.delegate = delegate
        }
    }

    static func parseButtons(buttons: [NitroGridButton]) -> [CPGridButton] {
        guard let traitCollection = SceneStore.getRootTraitCollection() else { return [] }
        return Parser.parseGridButtons(buttons: buttons, traitCollection: traitCollection)
    }

    @MainActor
    override func _invalidate() {
        if #available(iOS 27.0, *), let mapPanel = mapPanel as? CPMapPanel {
            let parsedButtons = GridTemplate.parseButtons(buttons: buttons)
            mapPanel.sections.first?.updateItems([CPMapPanelItem(gridButtons: parsedButtons)])
            return
        }

        guard let template else { return }

        setBarButtons(template: template, barButtons: barButtons)

        template.updateGridButtons(GridTemplate.parseButtons(buttons: buttons))
    }

    override func onWillAppear(animated: Bool) {
        config.onWillAppear?(animated)
    }

    override func onDidAppear(animated: Bool) {
        config.onDidAppear?(animated)
    }

    override func onWillDisappear(animated: Bool) {
        config.onWillDisappear?(animated)
    }

    override func onDidDisappear(animated: Bool) {
        config.onDidDisappear?(animated)
    }

    override func onPopped() {
        config.onPopped?()
    }

    @MainActor
    func updateButtons(buttons: [NitroGridButton]) {
        self.buttons = buttons
        invalidate()
    }
}
