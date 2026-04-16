package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.car.app.CarContext
import androidx.car.app.media.CarAudioRecord
import androidx.core.content.ContextCompat
import com.margelo.nitro.NitroModules
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.ByteArrayOutputStream
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine
import kotlin.math.abs

/**
 * Captures audio via CarAudioRecord and buffers raw 16-bit PCM (16 kHz, mono).
 * Call start() to begin recording — it suspends until stop() is called.
 * stop() resolves the suspension with the complete PCM buffer.
 */
class VoiceInputManager(private val carContext: CarContext) {

    private var carAudioRecord: CarAudioRecord? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var recordingJob: Job? = null
    private var continuation: Continuation<ByteArray>? = null
    private val scope = CoroutineScope(Dispatchers.IO)
    @Volatile private var isRecording = false

    /**
     * Acquires audio focus, starts CarAudioRecord, and suspends until stopped.
     * Stops automatically after [silenceThresholdMs] of silence or [maxDurationMs] total.
     * Returns the complete raw PCM buffer (Int16 LE, 16 kHz, mono).
     */
    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun start(
        silenceThresholdMs: Long = 1_500,
        maxDurationMs: Long = 10_000,
    ): ByteArray = suspendCancellableCoroutine { cont ->
        val appContext = NitroModules.applicationContext
        if (appContext == null || ContextCompat.checkSelfPermission(
                appContext,
                android.Manifest.permission.RECORD_AUDIO
            )
            != PackageManager.PERMISSION_GRANTED
        ) {
            cont.resumeWithException(SecurityException("RECORD_AUDIO permission not granted"))
            return@suspendCancellableCoroutine
        }

        continuation = cont

        val audioManager = appContext.getSystemService(AudioManager::class.java)

        val audioAttributes = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
            .build()

        val focusRequest = AudioFocusRequest
            .Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
            .setAudioAttributes(audioAttributes)
            .setOnAudioFocusChangeListener { state ->
                if (state == AudioManager.AUDIOFOCUS_LOSS) {
                    stop()
                }
            }
            .build()

        if (audioManager.requestAudioFocus(focusRequest) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
            continuation = null
            cont.resumeWithException(IllegalStateException("Audio focus request denied"))
            return@suspendCancellableCoroutine
        }

        audioFocusRequest = focusRequest

        val record = CarAudioRecord.create(carContext)
        carAudioRecord = record

        val outputStream = ByteArrayOutputStream()

        isRecording = true
        record.startRecording()

        recordingJob = scope.launch {
            val buffer = ByteArray(CarAudioRecord.AUDIO_CONTENT_BUFFER_SIZE)
            val recordingStart = System.currentTimeMillis()
            var silenceStart: Long? = null

            try {
                while (isRecording) {
                    val read = record.read(buffer, 0, CarAudioRecord.AUDIO_CONTENT_BUFFER_SIZE)
                    if (read < 0) break
                    if (read > 0) {
                        outputStream.write(buffer, 0, read)

                        val now = System.currentTimeMillis()

                        // Max duration check
                        if (now - recordingStart >= maxDurationMs) {
                            break
                        }

                        // Silence detection — each sample is Int16 LE (2 bytes)
                        var peak = 0
                        var i = 0
                        while (i < read - 1) {
                            val sample =
                                (buffer[i].toInt() and 0xFF) or (buffer[i + 1].toInt() shl 8)
                            val abs = abs(sample.toShort().toInt())
                            if (abs > peak) peak = abs
                            i += 2
                        }

                        if (peak < SILENCE_AMPLITUDE_THRESHOLD) {
                            if (silenceStart == null) silenceStart = now
                            if (now - silenceStart >= silenceThresholdMs) break
                        } else {
                            silenceStart = null
                        }
                    }
                }
            } finally {
                releaseResources()
                val capturedContinuation = continuation
                continuation = null
                capturedContinuation?.resume(outputStream.toByteArray())
            }
        }
    }

    /**
     * Stops recording and causes the suspended start() to resume with the captured audio.
     */
    fun stop() {
        isRecording = false
        carAudioRecord?.stopRecording()
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun releaseResources() {
        carAudioRecord?.stopRecording()
        carAudioRecord = null
        recordingJob = null
        audioFocusRequest?.let {
            val audioManager = (NitroModules.applicationContext ?: carContext)
                .getSystemService(AudioManager::class.java)
            audioManager.abandonAudioFocusRequest(it)
        }
        audioFocusRequest = null
    }

    fun dispose() {
        stop()
        scope.cancel()
    }

    companion object {
        private const val SILENCE_AMPLITUDE_THRESHOLD = 500
    }
}
