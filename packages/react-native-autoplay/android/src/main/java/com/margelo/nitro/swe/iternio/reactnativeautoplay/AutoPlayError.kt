package com.margelo.nitro.swe.iternio.reactnativeautoplay

class TemplateNotFoundException(templateId: String): Exception(templateId) {
    override fun toString(): String = "templateNotFound($message)"
}
