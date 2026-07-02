package com.margelo.nitro.swe.iternio.reactnativeautoplay

class TemplateNotFoundException(private val templateId: String) :
    Exception("templateNotFound(\"$templateId\")") {
    override fun toString(): String = "templateNotFound(\"$templateId\")"
}

class VoiceInputCancelledException : Exception("voiceInputCancelled") {
    override fun toString(): String = "voiceInputCancelled"
}
