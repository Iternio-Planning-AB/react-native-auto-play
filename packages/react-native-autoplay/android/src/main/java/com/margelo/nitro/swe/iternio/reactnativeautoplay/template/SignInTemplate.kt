package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import android.content.Intent
import android.os.Bundle
import android.util.Base64
import androidx.car.app.CarContext
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarIcon
import androidx.car.app.model.InputCallback
import androidx.car.app.model.ParkedOnlyOnClickListener
import androidx.car.app.model.Template
import androidx.car.app.model.signin.InputSignInMethod
import androidx.car.app.model.signin.InputSignInMethod.INPUT_TYPE_DEFAULT
import androidx.car.app.model.signin.InputSignInMethod.INPUT_TYPE_PASSWORD
import androidx.car.app.model.signin.PinSignInMethod
import androidx.car.app.model.signin.ProviderSignInMethod
import androidx.car.app.model.signin.QRCodeSignInMethod
import androidx.car.app.model.signin.SignInTemplate
import androidx.core.graphics.drawable.IconCompat
import androidx.core.net.toUri
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.margelo.nitro.NitroModules
import com.margelo.nitro.swe.iternio.reactnativeautoplay.KeyboardType
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroActionType
import com.margelo.nitro.swe.iternio.reactnativeautoplay.R
import com.margelo.nitro.swe.iternio.reactnativeautoplay.SignInTemplateConfig
import com.margelo.nitro.swe.iternio.reactnativeautoplay.SignInWithGoogleActivity
import com.margelo.nitro.swe.iternio.reactnativeautoplay.TextInputType
import org.json.JSONObject
import java.security.InvalidParameterException

class SignInTemplate(
    context: CarContext, config: SignInTemplateConfig
) : AndroidAutoTemplate<SignInTemplateConfig>(context, config) {

    override val isRenderTemplate = false

    override val templateId: String
        get() = config.id

    override val autoDismissMs = config.autoDismissMs

    fun updateTemplate(config: SignInTemplateConfig) {
        config.signInMethod?.let {
            this.config = this.config.copy(signInMethod = config.signInMethod)
        }
        config.title?.let {
            this.config = this.config.copy(title = config.title)
        }
        config.headerActions?.let {
            this.config = this.config.copy(headerActions = config.headerActions)
        }
        config.actions?.let {
            this.config = this.config.copy(actions = config.actions)
        }
        config.instructions?.let {
            this.config = this.config.copy(instructions = config.instructions)
        }
        config.additionalText?.let {
            this.config = this.config.copy(additionalText = config.additionalText)
        }
        super.applyConfigUpdate()
    }

    override fun parse(): Template {
        val qrSignIn = config.signInMethod?.asFirstOrNull()
        val pinSignIn = config.signInMethod?.asSecondOrNull()
        val inputSignIn = config.signInMethod?.asThirdOrNull()
        val googleSignIn = config.signInMethod?.asFourthOrNull()

        val templateBuilder = when {
            qrSignIn != null -> {
                val url = qrSignIn.url
                SignInTemplate.Builder(QRCodeSignInMethod(url.toUri()))
            }

            pinSignIn != null -> {
                val pin = pinSignIn.pin
                SignInTemplate.Builder(PinSignInMethod(pin))
            }

            inputSignIn != null -> {
                SignInTemplate.Builder(InputSignInMethod.Builder(object : InputCallback {
                    override fun onInputSubmitted(text: String) {
                        inputSignIn.callback(text)
                    }
                }).apply {
                    inputSignIn.keyboardType?.let { kt ->
                        when (kt) {
                            KeyboardType.DEFAULT -> setKeyboardType(InputSignInMethod.KEYBOARD_DEFAULT)
                            KeyboardType.EMAIL -> setKeyboardType(InputSignInMethod.KEYBOARD_EMAIL)
                            KeyboardType.PHONE -> setKeyboardType(InputSignInMethod.KEYBOARD_PHONE)
                            KeyboardType.NUMBER -> setKeyboardType(InputSignInMethod.KEYBOARD_NUMBER)
                        }
                    }
                    when (inputSignIn.inputType) {
                        TextInputType.DEFAULT -> setInputType(INPUT_TYPE_DEFAULT)
                        TextInputType.PASSWORD -> setInputType(INPUT_TYPE_PASSWORD)
                    }
                    inputSignIn.hint?.let { setHint(it) }
                    inputSignIn.errorMessage?.let { setErrorMessage(it) }
                    inputSignIn.defaultValue?.let { setDefaultValue(it) }
                    inputSignIn.showKeyboardByDefault?.let { setShowKeyboardByDefault(it) }
                }.build())
            }

            googleSignIn != null -> {
                val signInAction = Action.Builder().apply {
                    setTitle(googleSignIn.signInButtonText)
                    setIcon(
                        CarIcon.Builder(
                            IconCompat.createWithResource(
                                context, R.drawable.google
                            )
                        ).build()
                    )
                    setOnClickListener(ParkedOnlyOnClickListener.create {
                        val extras = Bundle(2)
                        extras.putBinder(
                            SignInWithGoogleActivity.BINDER_KEY,
                            object : SignInWithGoogleActivity.OnSignInComplete() {
                                override fun onSignInComplete(
                                    credential: GoogleIdTokenCredential?,
                                    serverAuthCode: String?
                                ) {
                                    if (credential == null) {
                                        googleSignIn.callback("Error signing in", null)
                                        return
                                    }
                                    googleSignIn.callback(
                                        null,
                                        com.margelo.nitro.swe.iternio.reactnativeautoplay.GoogleSignInAccount(
                                            serverAuthCode = serverAuthCode,
                                            email = credential.id,
                                            id = subFromIdToken(credential.idToken),
                                            displayName = credential.displayName,
                                            photoUrl = credential.profilePictureUri?.toString(),
                                            idToken = credential.idToken,
                                            givenName = credential.givenName,
                                            familyName = credential.familyName
                                        )
                                    )
                                }
                            })
                        extras.putString("serverClientId", googleSignIn.serverClientId)
                        NitroModules.applicationContext?.startActivity(
                            Intent().setClass(context, SignInWithGoogleActivity::class.java)
                                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).putExtras(extras)
                        )
                    })
                }.build()
                SignInTemplate.Builder(ProviderSignInMethod(signInAction))
            }

            else -> throw InvalidParameterException("missing SignInTemplate builder")
        }

        return templateBuilder.apply {
            config.title?.let {
                setTitle(it)
            }
            config.instructions?.let {
                setInstructions(it)
            }
            config.additionalText?.let {
                setAdditionalText(it)
            }
            config.headerActions?.let { headerActions ->
                headerActions.find { it.type == NitroActionType.BACK || it.type == NitroActionType.APPICON }
                    ?.let {
                        setHeaderAction(Parser.parseAction(context, it))
                    }

                val endHeaderActions = headerActions.filter { it.type == NitroActionType.CUSTOM }
                if (endHeaderActions.isNotEmpty()) {
                    val actionStripBuilder = ActionStrip.Builder()

                    endHeaderActions.forEach {
                        actionStripBuilder.addAction(Parser.parseAction(context, it))
                    }
                    setActionStrip(actionStripBuilder.build())
                }
            }
            config.actions?.let {
                it.forEach { action ->
                    addAction(Parser.parseAction(context, action, true))
                }
            }
        }.build()
    }

    override fun setTemplateHeaderActions(headerActions: Array<NitroAction>?) {
        config = config.copy(headerActions = headerActions)
        super.applyConfigUpdate()
    }

    override fun onWillAppear() {
        config.onWillAppear?.let { it(null) }
    }

    override fun onWillDisappear() {
        config.onWillDisappear?.let { it(null) }
    }

    override fun onDidAppear() {
        config.onDidAppear?.let { it(null) }
    }

    override fun onDidDisappear() {
        config.onDidDisappear?.let { it(null) }
    }

    override fun onPopped() {
        config.onPopped?.let { it() }
        templates.remove(templateId)
    }

    private fun subFromIdToken(idToken: String): String? = runCatching {
        val payload = idToken.split(".")[1]
        val json = String(
            Base64.decode(payload, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP),
            Charsets.UTF_8
        )
        JSONObject(json).getString("sub")
    }.getOrNull()
}