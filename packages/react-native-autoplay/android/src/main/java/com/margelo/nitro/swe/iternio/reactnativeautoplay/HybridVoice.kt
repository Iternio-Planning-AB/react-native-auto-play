package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class HybridVoice : HybridVoiceSpec() {
    @Volatile
    private var voiceInputManager: VoiceInputManager? = null

    override fun hasVoiceInputPermission(): Boolean {
        return VoiceInputManager.hasVoiceInputPermission()
    }

    override fun requestVoiceInputPermission(): Promise<Boolean> {
        return Promise.async {
            if (hasVoiceInputPermission()) {
                return@async true
            }

            val carContext = AndroidAutoSession.getRootContext()

            if (carContext != null) {
                suspendCancellableCoroutine { cont ->
                    carContext.requestPermissions(
                        listOf(android.Manifest.permission.RECORD_AUDIO)
                    ) { approved, _ ->
                        cont.resume(approved.contains(android.Manifest.permission.RECORD_AUDIO))
                    }
                }
            } else {
                val context = NitroModules.applicationContext ?: return@async false
                val activity =
                    context.currentActivity as? PermissionAwareActivity ?: return@async false
                val code = (Math.random() * 10000).toInt()

                suspendCancellableCoroutine { cont ->
                    activity.requestPermissions(
                        arrayOf(android.Manifest.permission.RECORD_AUDIO),
                        code,
                        PermissionListener { requestCode, _, grantResults ->
                            if (requestCode != code) {
                                return@PermissionListener false
                            }
                            cont.resume(
                                grantResults.isNotEmpty() &&
                                    grantResults.first() == PackageManager.PERMISSION_GRANTED
                            )
                            true
                        }
                    )
                }
            }
        }
    }

    override fun startVoiceInput(
        silenceThresholdMs: Double?,
        maxDurationMs: Double?,
        listeningText: String?,
        preferSpeechToText: Boolean?,
        onChunk: ((chunk: VoiceInputChunk) -> Unit)?,
    ): Promise<VoiceInputResult> {
        return Promise.async {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                throw UnsupportedOperationException("startVoiceInput requires at least API level ${Build.VERSION_CODES.O}")
            }

            val manager = VoiceInputManager(AndroidAutoSession.getRootContext())
            voiceInputManager = manager

            try {
                manager.start(
                    silenceThresholdMs = silenceThresholdMs?.toLong() ?: 1_500L,
                    maxDurationMs = maxDurationMs?.toLong() ?: 10_000L,
                    preferSpeechToText = preferSpeechToText ?: false,
                    onChunk = onChunk,
                )
            } finally {
                voiceInputManager = null
                manager.dispose()
            }
        }
    }

    override fun stopVoiceInput() {
        voiceInputManager?.stop()
    }
}
