//
//  AutoPlayInterfaceController.swift
//  Pods
//
//  Created by Manuel Auer on 12.10.25.
//

import CarPlay

@MainActor
class AutoPlayInterfaceController: NSObject, CPInterfaceControllerDelegate {
    let interfaceController: CPInterfaceController
    let templateStore: TemplateStore

    init(
        interfaceController: CPInterfaceController,
        templateStore: TemplateStore
    ) {
        self.interfaceController = interfaceController
        self.templateStore = templateStore

        super.init()

        self.interfaceController.delegate = self
    }

    var carTraitCollection: UITraitCollection {
        return interfaceController.carTraitCollection
    }

    var rootTemplate: CPTemplate {
        interfaceController.rootTemplate
    }

    var topTemplate: CPTemplate? {
        interfaceController.topTemplate
    }

    var templates: [CPTemplate] {
        interfaceController.templates
    }

    var topTemplateId: String? {
        return interfaceController.topTemplate?.id
    }

    var rootTemplateId: String? {
        return interfaceController.rootTemplate.id
    }

    func hasPresentedTemplate() -> Bool {
        return interfaceController.presentedTemplate != nil
    }

    func pushTemplate(
        _ templateToPush: CPTemplate,
        animated: Bool
    ) async throws -> Bool {
        return try await interfaceController.pushTemplate(
            templateToPush,
            animated: animated
        )
    }

    func setRootTemplate(
        _ rootTemplate: CPTemplate,
        animated: Bool
    ) async throws -> Bool {
        return try await interfaceController.setRootTemplate(
            rootTemplate,
            animated: animated
        )
    }

    func popTemplate(
        animated: Bool
    ) async throws -> String? {
        guard let templateId = topTemplateId else { return nil }

        try await interfaceController.popTemplate(
            animated: animated
        )

        self.templateStore.removeTemplate(templateId: templateId)

        return templateId
    }

    func popToRootTemplate(
        animated: Bool
    ) async throws -> [String] {
        var templateIds: [String] = []

        templates.forEach { template in
            let templateId = template.id

            if templateId == rootTemplateId {
                return
            }
            templateIds.append(templateId)
        }

        try await interfaceController.popToRootTemplate(
            animated: animated
        )

        self.templateStore.removeTemplates(templateIds: templateIds)

        return templateIds
    }

    func popToTemplate(templateId: String, animated: Bool) async throws
        -> [String]
    {
        guard
            let template = interfaceController.templates.first(
                where: {
                    templateId == $0.id
                })
        else { return [] }

        var templateIds: [String] = interfaceController.templates.map {
            template in template.id
        }

        if let startIndex = templateIds.firstIndex(where: {
            $0 == templateId
        }),
            let endIndex = templateIds.firstIndex(where: {
                $0 == topTemplateId
            })
        {
            templateIds = Array(templateIds[(startIndex)..<endIndex])
        }

        try await interfaceController.pop(
            to: template,
            animated: animated
        )

        return templateIds
    }

    func presentTemplate(
        _ templateToPresent: CPTemplate,
        animated: Bool
    ) async throws -> Bool {
        return try await interfaceController.presentTemplate(
            templateToPresent,
            animated: animated
        )
    }

    func dismissTemplate(
        animated: Bool
    ) async throws -> String? {
        let templateId = interfaceController.presentedTemplate?.id

        try await interfaceController.dismissTemplate(
            animated: animated
        )

        if templateId != nil {
            self.templateStore.removeTemplate(templateId: templateId!)
            return templateId
        }

        return nil
    }

    // MARK: CPInterfaceControllerDelegate
    func templateWillAppear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        do {
            try RootModule.withTemplate(templateId: templateId) { template in
                template.onWillAppear(animted: animated)
            }
        } catch let error {
            print("failed to call onWillAppear for \(templateId): \(error)")
        }
    }

    func templateDidAppear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        do {
            try RootModule.withTemplate(templateId: templateId) { template in
                template.onDidAppear(animted: animated)
            }
        } catch let error {
            print("failed to call onDidAppear for \(templateId): \(error)")
        }
    }

    func templateWillDisappear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        do {
            try RootModule.withTemplate(templateId: templateId) { template in
                template.onWillDisappear(animted: animated)
            }
        } catch let error {
            print("failed to call onWillDisappear for \(templateId): \(error)")
        }
    }

    func templateDidDisappear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        do {
            try RootModule.withTemplate(templateId: templateId) { template in
                template.onDidDisappear(animted: animated)
            }
        } catch let error {
            print("failed to call onDidDisappear for \(templateId): \(error)")
        }
    }
}
