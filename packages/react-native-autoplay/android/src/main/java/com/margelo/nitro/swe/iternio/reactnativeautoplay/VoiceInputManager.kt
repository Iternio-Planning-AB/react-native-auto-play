package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.annotation.RequiresApi
import androidx.car.app.CarContext
import androidx.car.app.media.CarAudioRecord
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.ArrayBuffer
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.ThreadUtil
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.math.abs

/**
 * Captures 16-bit PCM audio (16 kHz, mono).
 * When [carContext] is provided uses CarAudioRecord (Android Auto/Automotive),
 * otherwise falls back to standard AudioRecord.
 *
 * When preferSpeechToText is true and SpeechRecognizer is available, it owns
 * the microphone and streams partial results; the PCM path is not used.
 * When SpeechRecognizer is unavailable the manager falls back to PCM recording.
 */
class VoiceInputManager(
    private val carContext: CarContext?,
) {
    // PCM recording state
    private var carAudioRecord: CarAudioRecord? = null
    private var audioRecord: AudioRecord? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var recordingJob: Job? = null
    private var pcmContinuation: Continuation<ByteArray>? = null
    private val scope = CoroutineScope(Dispatchers.IO)

    @Volatile
    private var isRecording = false

    // STT state — only set when SpeechRecognizer owns the mic
    @Volatile
    private var activeSpeechRecognizer: SpeechRecognizer? = null

    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun start(
        silenceThresholdMs: Long = 1_500,
        maxDurationMs: Long = 10_000,
        preferSpeechToText: Boolean = false,
        onChunk: ((chunk: VoiceInputChunk) -> Unit)? = null,
    ): VoiceInputResult {
        if (preferSpeechToText) {
            val context = NitroModules.applicationContext ?: throw IllegalArgumentException()
            if (SpeechRecognizer.isRecognitionAvailable(context)) {
                return ThreadUtil.postOnUiAndAwait { startSTT(context, onChunk) }.getOrThrow()
            }
        }
        return startPCM(silenceThresholdMs, maxDurationMs, onChunk)
    }

    // MARK: - STT path (SpeechRecognizer owns the mic)

    private suspend fun startSTT(
        context: android.content.Context,
        onChunk: ((chunk: VoiceInputChunk) -> Unit)?,
    ): VoiceInputResult = suspendCancellableCoroutine { cont ->
        val recognizer = SpeechRecognizer.createSpeechRecognizer(context)
        activeSpeechRecognizer = recognizer

        recognizer.setRecognitionListener(object : RecognitionListener {
            override fun onResults(results: Bundle?) {
                activeSpeechRecognizer = null
                recognizer.destroy()
                val text =
                    results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()
                cont.resume(VoiceInputResult(transcription = text, audio = null))
            }

            override fun onError(error: Int) {
                activeSpeechRecognizer = null
                recognizer.destroy()
                // Return empty transcription — caller sees null audio and null transcription
                cont.resume(VoiceInputResult(transcription = null, audio = null))
            }

            override fun onPartialResults(partialResults: Bundle?) {
                val text = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    ?.firstOrNull()
                if (!text.isNullOrEmpty()) {
                    onChunk?.invoke(VoiceInputChunk(partial = text, audio = null))
                }
            }

            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
            )
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }

        recognizer.startListening(intent)

        cont.invokeOnCancellation {
            activeSpeechRecognizer = null
            recognizer.destroy()
        }
    }

    // MARK: - PCM path

    @RequiresApi(Build.VERSION_CODES.O)
    private suspend fun startPCM(
        silenceThresholdMs: Long,
        maxDurationMs: Long,
        onChunk: ((chunk: VoiceInputChunk) -> Unit)?,
    ): VoiceInputResult {
        val pcmBytes = recordPCM(silenceThresholdMs, maxDurationMs, onChunk)
        val directBuffer =
            ByteBuffer.allocateDirect(pcmBytes.size).put(pcmBytes).rewind() as ByteBuffer
        return VoiceInputResult(transcription = null, audio = ArrayBuffer.wrap(directBuffer))
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private suspend fun recordPCM(
        silenceThresholdMs: Long,
        maxDurationMs: Long,
        onChunk: ((chunk: VoiceInputChunk) -> Unit)?,
    ): ByteArray = suspendCancellableCoroutine { cont ->
        val appContext = NitroModules.applicationContext
        if (appContext == null || ContextCompat.checkSelfPermission(
                appContext,
                android.Manifest.permission.RECORD_AUDIO,
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            cont.resumeWithException(SecurityException("RECORD_AUDIO permission not granted"))
            return@suspendCancellableCoroutine
        }

        pcmContinuation = cont

        val audioManager = appContext.getSystemService(AudioManager::class.java)

        val audioAttributes =
            AudioAttributes.Builder().setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE).build()

        val focusRequest =
            AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                .setAudioAttributes(audioAttributes).setOnAudioFocusChangeListener { state ->
                    if (state == AudioManager.AUDIOFOCUS_LOSS) {
                        stop()
                    }
                }.build()

        if (audioManager.requestAudioFocus(focusRequest) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
            pcmContinuation = null
            cont.resumeWithException(IllegalStateException("Audio focus request denied"))
            return@suspendCancellableCoroutine
        }

        audioFocusRequest = focusRequest

        val bufferSize: Int

        if (carContext != null) {
            val record = CarAudioRecord.create(carContext)
            carAudioRecord = record
            bufferSize = CarAudioRecord.AUDIO_CONTENT_BUFFER_SIZE
            isRecording = true
            record.startRecording()
        } else {
            val minBuffer = AudioRecord.getMinBufferSize(
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
            )
            bufferSize = maxOf(minBuffer, PHONE_BUFFER_SIZE)
            val record = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize,
            )
            audioRecord = record
            isRecording = true
            record.startRecording()
        }

        val outputStream = ByteArrayOutputStream()

        recordingJob = scope.launch {
            val buffer = ByteArray(bufferSize)
            val recordingStart = System.currentTimeMillis()
            var silenceStart: Long? = null

            try {
                while (isRecording) {
                    val read = carAudioRecord?.read(buffer, 0, bufferSize) ?: audioRecord?.read(
                        buffer,
                        0,
                        bufferSize,
                    ) ?: -1

                    if (read < 0) {
                        break
                    }

                    if (read > 0) {
                        outputStream.write(buffer, 0, read)

                        onChunk?.let { cb ->
                            val chunk = ByteArray(read) { buffer[it] }
                            val direct =
                                ByteBuffer.allocateDirect(read).put(chunk).rewind() as ByteBuffer
                            cb(VoiceInputChunk(partial = null, audio = ArrayBuffer.wrap(direct)))
                        }

                        val now = System.currentTimeMillis()
                        val elapsedMs = now - recordingStart

                        if (elapsedMs >= maxDurationMs) {
                            break
                        }

                        // Silence detection — skip during warm-up
                        if (elapsedMs >= WARMUP_MS) {
                            var peak = 0
                            var i = 0
                            while (i < read - 1) {
                                val sample =
                                    (buffer[i].toInt() and 0xFF) or (buffer[i + 1].toInt() shl 8)
                                val absSample = abs(sample.toShort().toInt())
                                if (absSample > peak) {
                                    peak = absSample
                                }
                                i += 2
                            }

                            if (peak < SILENCE_AMPLITUDE_THRESHOLD) {
                                if (silenceStart == null) {
                                    silenceStart = now
                                }
                                if (now - silenceStart >= silenceThresholdMs) {
                                    break
                                }
                            } else {
                                silenceStart = null
                            }
                        }
                    }
                }
            } finally {
                releaseResources()
                val captured = pcmContinuation
                pcmContinuation = null
                captured?.resume(outputStream.toByteArray())
            }
        }
    }

    fun stop() {
        // STT path: stopListening() triggers onResults/onError which resolves the continuation
        activeSpeechRecognizer?.let { recognizer ->
            UiThreadUtil.runOnUiThread {
                recognizer.stopListening()
            }
        }
        // PCM path
        isRecording = false
        carAudioRecord?.stopRecording()
        audioRecord?.stop()
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun releaseResources() {
        carAudioRecord?.stopRecording()
        carAudioRecord = null
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
        recordingJob = null
        audioFocusRequest?.let {
            val audioManager = (NitroModules.applicationContext ?: carContext)?.getSystemService(
                AudioManager::class.java,
            )
            audioManager?.abandonAudioFocusRequest(it)
        }
        audioFocusRequest = null
    }

    fun dispose() {
        stop()
        scope.cancel()
    }

    companion object {
        private const val SILENCE_AMPLITUDE_THRESHOLD = 500
        private const val WARMUP_MS = 500L
        private const val SAMPLE_RATE = 16_000
        private const val PHONE_BUFFER_SIZE = 3_200 // ~100ms at 16kHz/16-bit/mono
    }
}
