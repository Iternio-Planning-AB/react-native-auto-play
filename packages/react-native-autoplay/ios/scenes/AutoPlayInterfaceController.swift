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

    init(
        interfaceController: CPInterfaceController
    ) {
        self.interfaceController = interfaceController

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

        TemplateStore.removeTemplate(templateId: templateId)

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

        TemplateStore.removeTemplates(templateIds: templateIds)

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
    ) async throws -> Bool {
        if interfaceController.presentedTemplate == nil {
            return false
        }

        try await interfaceController.dismissTemplate(
            animated: animated
        )

        return true
    }

    // MARK: CPInterfaceControllerDelegate
    func templateWillAppear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        TemplateStore.getTemplate(templateId: templateId)?.onWillAppear(
            animated: animated
        )
    }

    func templateDidAppear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        if rootTemplateId == templateId {
            // this makes sure we purge outdated CPSearchTemplate since that one can be popped on with a CarPlay native button we can not intercept
            TemplateStore.purge()
        }

        TemplateStore.getTemplate(templateId: templateId)?.onDidAppear(
            animated: animated
        )
    }

    func templateWillDisappear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        TemplateStore.getTemplate(templateId: templateId)?.onWillDisappear(
            animated: animated
        )
    }

    func templateDidDisappear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        TemplateStore.getTemplate(templateId: templateId)?.onDidDisappear(
            animated: animated
        )

        if aTemplate is CPAlertTemplate {
            TemplateStore.removeTemplate(templateId: templateId)

            HybridAutoPlay.removeListeners(
                templateId: templateId
            )
        }
    }
}
