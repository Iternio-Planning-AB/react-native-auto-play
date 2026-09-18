//
//  SearchTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 28.10.25.
//

import CarPlay

class SearchTemplate: AutoPlayTemplate, CPSearchTemplateDelegate {
    var template: CPSearchTemplate
    var config: SearchTemplateConfig
    var results: NitroSection

    override var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    override func getTemplate() -> CPTemplate {
        return template
    }

    var completionHandler: (([CPListItem]) -> Void)?
    var pushedListTemplate: ListTemplate?
    var searchText = ""
    var isInitialized = false

    init(config: SearchTemplateConfig) {
        self.config = config
        results = config.results

        template = CPSearchTemplate(id: config.id)
    }

    func updateSearchResults(results: NitroSection) {
        self.results = results
        invalidate()
    }

    @MainActor
    override func _invalidate() {
        // if we have pushed a list template update it
        if let listTemplate = pushedListTemplate {
            listTemplate.updateSections(sections: [results])
        }

        // otherwise update the search results on the search template
        guard let completionHandler = self.completionHandler else {
            return
        }

        guard let traitCollection = SceneStore.getRootTraitCollection() else {
            return
        }

        let listItems = Parser.parseSearchResults(
            section: results,
            traitCollection: traitCollection
        )
        completionHandler(listItems)

        self.completionHandler = nil
    }

    override func onWillAppear(animated: Bool) {
        self.pushedListTemplate = nil
        config.onWillAppear?(animated)
    }

    override func onDidAppear(animated: Bool) {
        config.onDidAppear?(animated)
        template.delegate = self
    }

    override func onWillDisappear(animated: Bool) {
        config.onWillDisappear?(animated)
        template.delegate = nil
    }

    override func onDidDisappear(animated: Bool) {
        config.onDidDisappear?(animated)
    }

    override func onPopped() {
        config.onPopped?()
    }

    // MARK: - CPSearchTemplateDelegate

    func searchTemplate(
        _ searchTemplate: CPSearchTemplate,
        updatedSearchText searchText: String,
        completionHandler: @escaping ([CPListItem]) -> Void
    ) {
        self.completionHandler = completionHandler

        if !isInitialized {
            // this makes sure we show the initial items when opening up the template
            invalidate()
            isInitialized = true
            return
        }

        if searchText == self.searchText {
            return
        }

        self.searchText = searchText

        if pushedListTemplate != nil {
            return
        }

        config.onSearchTextChanged(searchText)
    }

    func searchTemplate(
        _ searchTemplate: CPSearchTemplate,
        selectedResult item: CPListItem,
        completionHandler: @escaping () -> Void
    ) {
        item.handler?(item, completionHandler)
    }

    func searchTemplateSearchButtonPressed(
        _ searchTemplate: CPSearchTemplate
    ) {

        // Create a new ListTemplate with the search results
        let listConfig = ListTemplateConfig(
            id: "\(config.id)-results",
            onWillAppear: nil,
            onWillDisappear: nil,
            onDidAppear: nil,
            onDidDisappear: nil,
            onPopped: nil,
            autoDismissMs: nil,
            headerActions: config.headerActions,
            title: config.title,
            sections: [results],
            mapConfig: nil
        )

        let listTemplate = ListTemplate(config: listConfig)
        self.pushedListTemplate = listTemplate

        // execute callback after creating the template to avoid race condition in updateSearchResults
        config.onSearchTextSubmitted(searchText)

        // Push the template
        Task { @MainActor in
            do {
                try await RootModule.withSceneAndInterfaceController {
                    scene,
                    interfaceController in

                    scene.templateStore.addTemplate(
                        template: listTemplate,
                        templateId: listConfig.id
                    )

                    listTemplate.invalidate()

                    let _ = try await interfaceController.pushTemplate(
                        try listTemplate.getTemplate(),
                        animated: true
                    )
                }
            }
            catch {
                print("Failed to push list template: \(error)")
            }
        }
    }
}
