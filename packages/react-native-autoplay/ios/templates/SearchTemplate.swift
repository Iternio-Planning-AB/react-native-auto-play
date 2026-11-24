//
//  SearchTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 28.10.25.
//

import CarPlay
import NitroModules

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
        // CarPlay waits on every completion handler it handed out, don't leave one unanswered.
        // CarPlay lifecycle callbacks arrive on the main thread.
        MainActor.assumeIsolated {
            answerPendingSearch()
        }
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
        // CarPlay expects every completion handler to be called. A newer request replaces the
        // pending one, so answer that with the current results first instead of dropping it.
        answerPendingSearch()

        self.completionHandler = completionHandler

        if !isInitialized {
            // this makes sure we show the initial items when opening up the template
            invalidate()
            isInitialized = true
            return
        }

        if searchText == self.searchText {
            // CarPlay repeats the request for unchanged text (right after appearing and when
            // closing), there is nothing new to fetch so answer with the current results
            invalidate()
            return
        }

        self.searchText = searchText

        if pushedListTemplate != nil {
            // results go to the pushed list template, the search template keeps what it has
            invalidate()
            return
        }

        config.onSearchTextChanged(searchText)
    }

    /// Calls a still pending completion handler with the current results, see `_invalidate`.
    @MainActor
    private func answerPendingSearch() {
        if completionHandler != nil {
            invalidate()
        }
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
            mapConfig: nil,
            platform: nil
        )

        let listTemplate = ListTemplate(config: listConfig)
        self.pushedListTemplate = listTemplate

        // execute callback after creating the template to avoid race condition in updateSearchResults
        config.onSearchTextSubmitted(searchText)

        // queued so it keeps its order against pushes and pops the submit handler issues from JS
        let _: Promise<Void> = TemplateUpdateQueue.enqueue {
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
