import CarPlay

class VoiceInputTemplate: AutoPlayTemplate {
    let template: CPVoiceControlTemplate
    private let onDidDisappearCallback: () -> Void

    override func getTemplate() -> CPTemplate {
        return template
    }

    init(
        voiceControlStates: [CPVoiceControlState],
        id: String,
        onDidDisappear: @escaping () -> Void
    ) {
        self.template = CPVoiceControlTemplate(voiceControlStates: voiceControlStates, id: id)
        self.onDidDisappearCallback = onDidDisappear

        super.init()

        try? RootModule.withTemplateStore { templateStore in
            templateStore.addTemplate(template: self, templateId: id)
        }
    }

    override func onDidDisappear(animated: Bool) {
        onDidDisappearCallback()

        try? RootModule.withTemplateStore { templateStore in
            templateStore.removeTemplate(templateId: self.template.id)
        }
    }
}
