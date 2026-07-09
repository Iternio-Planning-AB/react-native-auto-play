package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.ParcelFileDescriptor
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
import kotlinx.coroutines.async
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

    @Volatile
    private var cancelledByUser = false

    // STT state — only set when SpeechRecognizer owns the mic
    @Volatile
    private var activeSpeechRecognizer: SpeechRecognizer? = null

    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun start(
        silenceThresholdMs: Long = 1_500,
        maxDurationMs: Long = 10_000,
        preferSpeechToText: Boolean = false,
        onChunk: ((chunk: VoiceInputChunk) -> Unit)? = null,
        language: String? = null,
        startSoundUri: String? = null,
        endSoundUri: String? = null,
    ): VoiceInputResult {
        cancelledByUser = false
        if (!requestAudioFocus()) {
            throw IllegalStateException("Audio focus request denied")
        }
        try {
            val startSoundJob = startSoundUri?.let { uri -> scope.launch { playSound(uri) } }
            val result = if (preferSpeechToText) {
                val context = NitroModules.applicationContext ?: throw IllegalArgumentException()
                if (SpeechRecognizer.isRecognitionAvailable(context)) {
                    if (carContext != null) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            startSTTFromCarAudio(silenceThresholdMs, maxDurationMs, onChunk, language)
                        } else {
                            // Car connected but API < 33: EXTRA_AUDIO_SOURCE unavailable, fall back to PCM
                            startPCM(silenceThresholdMs, maxDurationMs, onChunk)
                        }
                    } else {
                        ThreadUtil.postOnUiAndAwait { startSTT(context, onChunk, language) }.getOrThrow()
                    }
                } else {
                    startPCM(silenceThresholdMs, maxDurationMs, onChunk)
                }
            } else {
                startPCM(silenceThresholdMs, maxDurationMs, onChunk)
            }
            startSoundJob?.join()
            if (cancelledByUser) throw VoiceInputCancelledException()
            endSoundUri?.let { playSound(it) }
            return result
        } finally {
            abandonAudioFocus()
        }
    }

    // MARK: - STT path (SpeechRecognizer owns the mic)

    private suspend fun startSTT(
        context: Context,
        onChunk: ((chunk: VoiceInputChunk) -> Unit)?,
        language: String?
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
                cont.resumeWithException(RuntimeException("SpeechRecognizer error $error"))
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
            language?.let {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, it)
            }
        }

        recognizer.startListening(intent)

        cont.invokeOnCancellation {
            activeSpeechRecognizer = null
            recognizer.destroy()
        }
    }

    // MARK: - STT path fed from CarAudioRecord via a pipe (API 33+)
    @SuppressLint("MissingPermission")
    @RequiresApi(Build.VERSION_CODES.TIRAMISU)
    private suspend fun startSTTFromCarAudio(
        silenceThresholdMs: Long,
        maxDurationMs: Long,
        onChunk: ((chunk: VoiceInputChunk) -> Unit)?,
        language: String?
    ): VoiceInputResult {
        if (!hasVoiceInputPermission()) {
            throw SecurityException("RECORD_AUDIO permission not granted")
        }

        val appContext = NitroModules.applicationContext ?: throw IllegalArgumentException()
        val pipes = ParcelFileDescriptor.createPipe()
        val readFd = pipes[0]
        val pipeOut = ParcelFileDescriptor.AutoCloseOutputStream(pipes[1])

        val sttDeferred = scope.async {
            ThreadUtil.postOnUiAndAwait {
                startSTTWithSource(appContext, readFd, silenceThresholdMs, onChunk, language)
            }.getOrThrow()
        }

        var pcmBytes: ByteArray
        try {
            pcmBytes = recordPCM(silenceThresholdMs, maxDurationMs) { chunk ->
                chunk.audio?.let { ab ->
                    try {
                        pipeOut.write(ab.toByteArray())
                    } catch (_: Exception) {
                        isRecording = false
                    }
                }
            }
        } finally {
            try {
                pipeOut.close()
            } catch (_: Exception) {
            }
            try {
                readFd.close()
            } catch (_: Exception) {
            }
        }

        return try {
            sttDeferred.await()
        } catch (_: Exception) {
            val directBuffer = ByteBuffer.allocateDirect(pcmBytes.size).put(pcmBytes).rewind() as ByteBuffer
            VoiceInputResult(transcription = null, audio = ArrayBuffer.wrap(directBuffer))
        }
    }

    @RequiresApi(Build.VERSION_CODES.TIRAMISU)
    private suspend fun startSTTWithSource(
        context: Context,
        audioSource: ParcelFileDescriptor,
        silenceThresholdMs: Long,
        onChunk: ((chunk: VoiceInputChunk) -> Unit)?,
        language: String?
    ): VoiceInputResult = suspendCancellableCoroutine { cont ->
        val recognizer = SpeechRecognizer.createSpeechRecognizer(context)
        activeSpeechRecognizer = recognizer
        // When EXTRA_AUDIO_SOURCE is used, onResults always returns an empty list — the actual
        // transcription only arrives via onPartialResults. Track the last partial here.
        var lastPartial: String? = null

        recognizer.setRecognitionListener(object : RecognitionListener {
            override fun onResults(results: Bundle?) {
                activeSpeechRecognizer = null
                recognizer.destroy()
                val text =
                    results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()
                        ?: lastPartial
                cont.resume(VoiceInputResult(transcription = text, audio = null))
            }

            override fun onError(error: Int) {
                activeSpeechRecognizer = null
                recognizer.destroy()
                cont.resumeWithException(RuntimeException("SpeechRecognizer error $error"))
            }

            override fun onPartialResults(partialResults: Bundle?) {
                val text = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    ?.firstOrNull()
                if (!text.isNullOrEmpty()) {
                    lastPartial = text
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
            language?.let {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, it)
            }
            putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE, audioSource)
            putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_CHANNEL_COUNT, 1)
            putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_ENCODING, AudioFormat.ENCODING_PCM_16BIT)
            putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_SAMPLING_RATE, SAMPLE_RATE)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, WARMUP_MS)
            putExtra(
                RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS,
                silenceThresholdMs
            )
            putExtra(
                RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS,
                silenceThresholdMs / 2,
            )
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

    @SuppressLint("MissingPermission")
    @RequiresApi(Build.VERSION_CODES.O)
    private suspend fun recordPCM(
        silenceThresholdMs: Long,
        maxDurationMs: Long,
        onChunk: ((chunk: VoiceInputChunk) -> Unit)?,
    ): ByteArray = suspendCancellableCoroutine { cont ->
        if (!hasVoiceInputPermission()) {
            cont.resumeWithException(SecurityException("RECORD_AUDIO permission not granted"))
            return@suspendCancellableCoroutine
        }

        pcmContinuation = cont

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
                        // Whenever the user dismisses the microphone on the car screen, the next call to read will return -1
                        cancelledByUser = carAudioRecord != null && read == -1
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
        // PCM path and car-audio STT pump
        isRecording = false
        carAudioRecord?.stopRecording()
        audioRecord?.stop()
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun requestAudioFocus(): Boolean {
        val appContext = NitroModules.applicationContext ?: return false
        val audioManager = appContext.getSystemService(AudioManager::class.java)
        val audioAttributes = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
            .build()
        val focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
            .setAudioAttributes(audioAttributes)
            .setOnAudioFocusChangeListener { state ->
                if (state == AudioManager.AUDIOFOCUS_LOSS) { stop() }
            }
            .build()
        return if (audioManager.requestAudioFocus(focusRequest) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
            audioFocusRequest = focusRequest
            true
        } else {
            false
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun abandonAudioFocus() {
        audioFocusRequest?.let {
            val audioManager = (NitroModules.applicationContext ?: carContext)
                ?.getSystemService(AudioManager::class.java)
            audioManager?.abandonAudioFocusRequest(it)
        }
        audioFocusRequest = null
    }

    private suspend fun playSound(uri: String) = suspendCancellableCoroutine<Unit> { cont ->
        val context = NitroModules.applicationContext ?: run {
            cont.resume(Unit)
            return@suspendCancellableCoroutine
        }
        val player = MediaPlayer()
        try {
            player.setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                    .build()
            )
            player.setDataSource(context, Uri.parse(uri))
            player.setOnCompletionListener {
                it.release()
                if (cont.isActive) { cont.resume(Unit) }
            }
            player.setOnErrorListener { mp, _, _ ->
                mp.release()
                if (cont.isActive) { cont.resume(Unit) }
                true
            }
            player.prepare()
            player.start()
        } catch (_: Exception) {
            try { player.release() } catch (_: Exception) {}
            if (cont.isActive) { cont.resume(Unit) }
        }
        cont.invokeOnCancellation {
            try { player.release() } catch (_: Exception) {}
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun releaseResources() {
        carAudioRecord?.stopRecording()
        carAudioRecord = null
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
        recordingJob = null
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

        fun hasVoiceInputPermission(): Boolean {
            val context = NitroModules.applicationContext ?: return false
            return ContextCompat.checkSelfPermission(
                context, Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED
        }
    }
}
