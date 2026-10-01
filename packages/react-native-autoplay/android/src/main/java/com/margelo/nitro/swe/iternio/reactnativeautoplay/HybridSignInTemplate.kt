package com.margelo.nitro.swe.iternio.reactnativeautoplay

import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.SignInTemplate

class HybridSignInTemplate : HybridSignInTemplateSpec() {
    override fun createSignInTemplate(config: SignInTemplateConfig) {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("createSignInTemplate failed, no carContext found")

        assertSignInMethodAvailable(config)

        val template = SignInTemplate(context, config)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }

    override fun updateTemplate(templateId: String, config: SignInTemplateConfig): Promise<Unit> {
        return Promise.async {
            assertSignInMethodAvailable(config)
            val template = AndroidAutoTemplate.getTemplate<SignInTemplate>(templateId)
            template.updateTemplate(config)
        }
    }

    override fun isGoogleSignInAvailable(): Boolean {
        val context = NitroModules.applicationContext ?: return false

        // on older versions sign in with google is no longer supported
        val googleServiceMinVersion = 230815045
        val available = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(
                context, googleServiceMinVersion
            )
        return ConnectionResult.SUCCESS == available
    }

    private fun assertSignInMethodAvailable(config: SignInTemplateConfig) {
        if (config.signInMethod?.asFourthOrNull() != null && !isGoogleSignInAvailable()) {
            throw PlayServicesUnavailableException()
        }
    }
}