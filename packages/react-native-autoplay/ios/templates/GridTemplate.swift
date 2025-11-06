//
//  GridTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 11.10.25.
//

import CarPlay

class GridTemplate: AutoPlayTemplate {
    var config: GridTemplateConfig

    init(config: GridTemplateConfig) {
        self.config = config

        let template = CPGridTemplate(
            title: Parser.parseText(text: config.title),
            gridButtons: GridTemplate.parseButtons(buttons: config.buttons),
            id: config.id
        )

        super.init(
            template: template,
            header: config.headerActions
        )

        setBarButtons()
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

    override func invalidate() {
        guard let template = self.template as? CPGridTemplate else {
            return
        }

        setBarButtons()

        let buttons = GridTemplate.parseButtons(buttons: config.buttons)
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

    func updateButtons(buttons: [NitroGridButton]) {
        config.buttons = buttons
        invalidate()
    }
}
