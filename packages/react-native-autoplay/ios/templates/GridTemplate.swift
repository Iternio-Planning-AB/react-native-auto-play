//
//  GridTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 11.10.25.
//

import CarPlay

class GridTemplate: AutoPlayTemplate, AutoPlayHeaderProviding {
    let template: CPGridTemplate
    var config: GridTemplateConfig

    var barButtons: [NitroAction]? {
        get {
            return config.headerActions
        }
        set {
            config.headerActions = newValue
            setBarButtons(template: template, barButtons: newValue)
        }
    }

    var autoDismissMs: Double? {
        return config.autoDismissMs
    }
    
    func getTemplate() -> CPTemplate {
        return template
    }

    init(config: GridTemplateConfig) {
        self.config = config

        template = CPGridTemplate(
            title: Parser.parseText(text: config.title),
            gridButtons: GridTemplate.parseButtons(buttons: config.buttons),
            id: config.id
        )
    }

    static func parseButtons(buttons: [NitroGridButton]) -> [CPGridButton] {
        let gridButtonHeight: CGFloat

        if #available(iOS 26.0, *) {
            gridButtonHeight = CPGridTemplate.maximumGridButtonImageSize.height
        } else {
            gridButtonHeight = 44
        }

        return buttons.map { button in
            var image: UIImage?

            if let glyphImage = button.image.glyphImage {
                image = SymbolFont.imageFromNitroImage(
                    image: glyphImage,
                    size: gridButtonHeight,
                    traitCollection: SceneStore.getRootTraitCollection()
                )!
            }

            if let assetImage = button.image.assetImage {
                image = Parser.parseAssetImage(
                    assetImage: assetImage,
                    traitCollection: SceneStore.getRootTraitCollection()
                )
            }

            return CPGridButton(
                titleVariants: [Parser.parseText(text: button.title)!],
                image: image!
            ) { _ in
                button.onPress()
            }
        }
    }

    func invalidate() {
        setBarButtons(template: template, barButtons: config.headerActions)

        let buttons = GridTemplate.parseButtons(buttons: config.buttons)
        template.updateGridButtons(buttons)
    }

    func onWillAppear(animated: Bool) {
        config.onWillAppear?(animated)
    }

    func onDidAppear(animated: Bool) {
        config.onDidAppear?(animated)
    }

    func onWillDisappear(animated: Bool) {
        config.onWillDisappear?(animated)
    }

    func onDidDisappear(animated: Bool) {
        config.onDidDisappear?(animated)
    }

    func onPopped() {
        config.onPopped?()
    }

    @MainActor
    func updateButtons(buttons: [NitroGridButton]) {
        config.buttons = buttons
        invalidate()
    }
}
