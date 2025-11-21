//
//  SearchTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 28.10.25.
//

import CarPlay

class SearchTemplate: NSObject, AutoPlayTemplate, CPSearchTemplateDelegate {
    var template: CPSearchTemplate
    var config: SearchTemplateConfig

    var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    func getTemplate() -> CPTemplate {
        return template
    }

    var completionHandler: (([CPListItem]) -> Void)?
    var pushedListTemplate: ListTemplate?
    var searchText = ""
    var isInitialized = false

    init(config: SearchTemplateConfig) {
        self.config = config
        template = CPSearchTemplate(id: config.id)
    }

    func updateSearchResults(results: NitroSection) {
        config.results = results
        invalidate()
    }

    @MainActor
    func invalidate() {
        // if we have pushed a list template update it
        if let listTemplate = pushedListTemplate {
            listTemplate.updateSections(sections: [config.results])
        }

        // otherwise update the search results on the search template
        guard let completionHandler = self.completionHandler else {
            return
        }

        let listItems = Parser.parseSearchResults(
            section: config.results,
            traitCollection: SceneStore.getRootTraitCollection()
        )
        completionHandler(listItems)

        self.completionHandler = nil
    }

    func onWillAppear(animated: Bool) {
        self.pushedListTemplate = nil
        config.onWillAppear?(animated)
    }

    func onDidAppear(animated: Bool) {
        config.onDidAppear?(animated)
        template.delegate = self
    }

    func onWillDisappear(animated: Bool) {
        config.onWillDisappear?(animated)
        template.delegate = nil
    }

    func onDidDisappear(animated: Bool) {
        config.onDidDisappear?(animated)
    }

    func onPopped() {
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
            sections: [config.results],
            mapConfig: nil
        )

        let listTemplate = ListTemplate(config: listConfig)
        self.pushedListTemplate = listTemplate

        // execute callback after creating the template to avoid race condition in updateSearchResults
        config.onSearchTextSubmitted(searchText)

        TemplateStore.addTemplate(
            template: listTemplate,
            templateId: listConfig.id
        )

        // Push the template
        Task { @MainActor in
            do {
                try await RootModule.withInterfaceController {
                    interfaceController in
                    
                    listTemplate.invalidate()

                    let _ = try await interfaceController.pushTemplate(
                        listTemplate.template,
                        animated: true
                    )
                }
            } catch {
                print("Failed to push list template: \(error)")
            }
        }
    }
}
