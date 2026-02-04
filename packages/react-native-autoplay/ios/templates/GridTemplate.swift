//
//  GridTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 11.10.25.
//

import CarPlay

class GridTemplate: AutoPlayHeaderProviding {
    let template: CPGridTemplate
    var config: GridTemplateConfig

    var buttons: [NitroGridButton]

    override var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    override func getTemplate() -> CPTemplate {
        return template
    }

    init(config: GridTemplateConfig) {
        self.config = config
        buttons = config.buttons

        template = CPGridTemplate(
            title: Parser.parseText(text: config.title),
            gridButtons: GridTemplate.parseButtons(buttons: buttons),
            id: config.id
        )

        super.init()

        barButtons = config.headerActions

    }

    static func parseButtons(buttons: [NitroGridButton]) -> [CPGridButton] {
        let gridButtonHeight: CGFloat

        if #available(iOS 26.0, *) {
            gridButtonHeight = CPGridTemplate.maximumGridButtonImageSize.height
        }
        else {
            gridButtonHeight = 44
        }

        let traitCollection = SceneStore.getRootTraitCollection()

        return buttons.compactMap { button in
            var image: UIImage?

            if let glyphImage = button.image.glyphImage {
                image = SymbolFont.imageFromNitroImage(
                    image: glyphImage,
                    size: gridButtonHeight,
                    traitCollection: traitCollection
                )
            }

            if let assetImage = button.image.assetImage {
                image = Parser.parseAssetImage(
                    assetImage: assetImage,
                    traitCollection: traitCollection
                )
            }

            guard let image = image else { return nil }
            guard let title = Parser.parseText(text: button.title) else { return nil }

            return CPGridButton(
                titleVariants: [title],
                image: image
            ) { _ in
                button.onPress()
            }
        }
    }

    @MainActor
    override func _invalidate() {
        setBarButtons(template: template, barButtons: barButtons)

        let buttons = GridTemplate.parseButtons(buttons: buttons)
        template.updateGridButtons(buttons)
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
