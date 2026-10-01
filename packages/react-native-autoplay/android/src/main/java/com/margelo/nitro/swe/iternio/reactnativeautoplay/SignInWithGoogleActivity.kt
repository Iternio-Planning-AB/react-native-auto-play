package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.os.Binder
import android.os.Bundle
import android.os.IBinder
import androidx.activity.ComponentActivity
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.Scopes
import com.google.android.gms.common.api.Scope
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.launch
import java.security.InvalidParameterException

class SignInWithGoogleActivity : ComponentActivity() {

    private var callback: OnSignInComplete? = null
    private var idCredential: GoogleIdTokenCredential? = null

    private val authLauncher = registerForActivityResult(
        ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        val auth = runCatching {
            Identity.getAuthorizationClient(this)
                .getAuthorizationResultFromIntent(result.data)
        }.getOrNull()
        finishWith(auth?.serverAuthCode)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        callback = intent.extras?.getBinder(BINDER_KEY) as OnSignInComplete?
        val serverClientId = intent.extras?.getString("serverClientId")
            ?: throw InvalidParameterException("missing serverClientId parameter")

        lifecycleScope.launch {
            // 1. Authentication: ID token
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(GetSignInWithGoogleOption.Builder(serverClientId).build())
                .build()
            try {
                val result = CredentialManager.create(this@SignInWithGoogleActivity)
                    .getCredential(this@SignInWithGoogleActivity, request)
                idCredential = GoogleIdTokenCredential.createFrom(result.credential.data)
            } catch (_: Exception) {
                callback?.onSignInComplete(null, null)
                finish()
                return@launch
            }

            // 2. Authorization: server auth code
            val authRequest = AuthorizationRequest.builder()
                // matches the legacy DEFAULT_SIGN_IN + requestEmail() scopes, so the exchanged
                // server auth code grants the same access as before the Credential Manager migration
                .setRequestedScopes(
                    listOf(Scope(Scopes.OPEN_ID), Scope(Scopes.PROFILE), Scope(Scopes.EMAIL))
                )
                .requestOfflineAccess(serverClientId)
                .build()
            Identity.getAuthorizationClient(this@SignInWithGoogleActivity)
                .authorize(authRequest)
                .addOnSuccessListener { res ->
                    if (res.hasResolution()) {
                        authLauncher.launch(
                            IntentSenderRequest.Builder(res.pendingIntent!!.intentSender).build()
                        )
                    } else {
                        finishWith(res.serverAuthCode)
                    }
                }
                .addOnFailureListener { finishWith(null) }
        }
    }

    private fun finishWith(serverAuthCode: String?) {
        callback?.onSignInComplete(idCredential, serverAuthCode)
        finish()
    }

    /**
     * Binder callback to provide to the sign in activity.
     */
    abstract class OnSignInComplete : Binder(), IBinder {
        /**
         * Notifies that sign in flow completed.
         *
         * @param credential the account signed in or `null` if there were issues signing in.
         */
        abstract fun onSignInComplete(
            credential: GoogleIdTokenCredential?,
            serverAuthCode: String?
        )
    }

    companion object {
        const val BINDER_KEY = "SignInWithGoogleActivity"
    }
}