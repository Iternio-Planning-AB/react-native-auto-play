//
//  CarPlayViewController.swift
//
//  Created by Manuel Auer on 30.09.25.
//

class AutoPlaySceneViewController: UIViewController {
    let moduleName: String

    public init(view: UIView, moduleName: String) {
        self.moduleName = moduleName

        super.init(nibName: nil, bundle: nil)

        self.view = view
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func traitCollectionDidChange(
        _ previousTraitCollection: UITraitCollection?
    ) {
        guard
            let template = SceneStore.getScene(moduleName: moduleName)?
                .templateStore.getTemplate(templateId: moduleName)
                as? MapTemplate
        else {
            return
        }

        let isDark = traitCollection.userInterfaceStyle == .dark
        template.config.onAppearanceDidChange?(isDark ? .dark : .light)
        template.traitCollectionDidChange(traitColleciton: traitCollection)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        HybridAutoPlay.emitSafeAreaInsets(
            moduleName: moduleName,
            safeAreaInsets: self.view.safeAreaInsets
        )
    }
}
