//
//  SearchTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 28.10.25.
//

import CarPlay

class SearchTemplate: AutoPlayTemplate, CPSearchTemplateDelegate {
    var config: SearchTemplateConfig
    
    var searchText: String = ""
    
    var completionHandler: (([CPListItem]) -> Void)?
    
    var pushedListTemplate: ListTemplate?

    init(config: SearchTemplateConfig) {
        self.config = config
        let template = CPSearchTemplate(id: config.id)

        super.init(
            template: template,
            header: config.headerActions
        )
        
        template.delegate = self
    }
    
    func updateSearchResults(results: NitroSection?) {
        config.results = results
        invalidate()
    }
    
    override func invalidate() {
        // If we have a pushed list template, update it instead
        if let listTemplate = pushedListTemplate {
            if let results = config.results {
                listTemplate.updateSections(sections: [results])
            } else {
                listTemplate.updateSections(sections: [])
            }
            return
        }
        
        // Otherwise, update the search results completion handler
        guard let completionHandler = self.completionHandler else {
            return
        }
    
        var listItems = [] as [CPListItem]
        if (config.results != nil) {
            listItems = Parser.parseSearchResults(section: config.results, traitCollection: traitCollection)
        }
        
        if (listItems.isEmpty) {
            completionHandler([])
        } else {
            completionHandler(listItems)
        }
    }

    override func onWillAppear(animted: Bool) {
        config.onWillAppear?(animted)
    }

    override func onDidAppear(animted: Bool) {
        config.onDidAppear?(animted)
    }

    override func onWillDisappear(animted: Bool) {
        config.onWillDisappear?(animted)
    }

    override func onDidDisappear(animted: Bool) {
        config.onDidDisappear?(animted)
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
        self.searchText = searchText
        config.onSearchTextChanged?(searchText)
        self.completionHandler = completionHandler
    }
    
    func searchTemplate(
        _ searchTemplate: CPSearchTemplate,
        selectedResult item: CPListItem,
        completionHandler: @escaping () -> Void
    ) {
        // Manually trigger the item's handler
        item.handler?(item, completionHandler)
    }
    
    func searchTemplateSearchButtonPressed(
        _ searchTemplate: CPSearchTemplate
    ) {
        // Call the onSearchTextSubmitted callback when search button is pressed
        config.onSearchTextSubmitted?(self.searchText)
        
        // Create a new ListTemplate with the search results
        let listConfig = ListTemplateConfig(
            id: "\(config.id)-results",
            onWillAppear: nil,
            onWillDisappear: nil,
            onDidAppear: nil,
            onDidDisappear: nil,
            onPopped: nil,
            headerActions: nil,
            title: config.title,
            sections: config.results != nil ? [config.results!] : nil
        )
        
        let listTemplate = ListTemplate(config: listConfig)
        self.pushedListTemplate = listTemplate
        
        // Push the template
        Task { @MainActor in
            do {
                try await RootModule.withSceneAndInterfaceController { scene, interfaceController in
                    scene.templateStore.addTemplate(template: listTemplate, templateId: listConfig.id)
                    let _ = try await interfaceController.pushTemplate(listTemplate.template, animated: true)
                }
            } catch {
                print("Failed to push list template: \(error)")
            }
        }
    }
}
