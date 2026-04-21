package com.example

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PCMPlayerModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = NAME

    companion object {
        const val NAME = "PCMPlayer"
    }

    @ReactMethod
    fun playPCM(
        base64: String,
        sampleRate: Int,
        promise: Promise,
    ) {
        Log.d(NAME, "playPCM called, base64 length=${base64.length}, sampleRate=$sampleRate")
        try {
            val pcm = Base64.decode(base64, Base64.DEFAULT)
            Log.d(NAME, "PCM bytes=${pcm.size}")

            val minBuffer = AudioTrack.getMinBufferSize(
                sampleRate,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
            )

            val audioTrack = AudioTrack.Builder().setAudioAttributes(
                    AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build(),
                ).setAudioFormat(
                    AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate).setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build(),
                ).setBufferSizeInBytes(minBuffer).setTransferMode(AudioTrack.MODE_STREAM).build()

            Log.d(NAME, "AudioTrack state=${audioTrack.state} playState=${audioTrack.playState}")

            if (audioTrack.state != AudioTrack.STATE_INITIALIZED) {
                promise.reject(
                    "INIT_ERROR",
                    "AudioTrack failed to initialize (state=${audioTrack.state})"
                )
                return
            }

            audioTrack.play()

            Thread {
                try {
                    var offset = 0
                    while (offset < pcm.size) {
                        val written = audioTrack.write(pcm, offset, pcm.size - offset)
                        if (written < 0) {
                            break
                        }
                        offset += written
                    }
                    // Wait for playback to drain then release
                    audioTrack.stop()
                    audioTrack.release()
                    Log.d(NAME, "Playback complete")
                } catch (e: Exception) {
                    Log.e(NAME, "Playback error: ${e.message}")
                }
            }.start()

            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(NAME, "playPCM error: ${e.message}")
            promise.reject("PLAY_ERROR", e.message, e)
        }
    }
}
