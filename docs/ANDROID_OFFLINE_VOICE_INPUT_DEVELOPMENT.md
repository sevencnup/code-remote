# Android Offline Voice Input Development

## Classification

MINOR: the Android composer gains offline speech-to-text input, so users can dictate a message on a device without sending audio to a server or using a cloud ASR service.

Target Android version: `0.49.0-dev.1` (`versionCode 300`).

## Goal

- Add a microphone action to the existing native chat composer.
- Record 16 kHz mono PCM on the device and recognize Chinese speech locally with sherpa-onnx.
- Insert partial recognition into the composer while the user speaks and keep the final text when the utterance ends.
- Preserve any draft that was already in the composer.
- Never upload audio. The feature must work without a Codex Remote server connection, apart from the normal message send that follows.
- Stop and release the microphone when the app leaves the foreground, the user sends, switches chats, or closes the app.

## Model choice

Use `csukuangfj/sherpa-onnx-streaming-zipformer-zh-14M-2023-02-23` (Apache-2.0), int8 transducer files:

- `encoder-epoch-99-avg-1.int8.onnx`
- `decoder-epoch-99-avg-1.int8.onnx`
- `joiner-epoch-99-avg-1.int8.onnx`
- `tokens.txt`

The bundled model is about 25 MB. It is a Chinese streaming model; English words are limited to short Latin fragments. Larger bilingual and punctuation models are intentionally deferred to keep the APK practical.

## Design and implementation steps

1. Add the JitPack repository and the sherpa-onnx Android dependency at the app level. Keep the existing repository-mode restriction.
2. Place the four int8 model files under `android/app/src/main/assets/offline-asr/` and disable compression for `.onnx` assets so the native runtime can map them.
3. Add the `RECORD_AUDIO` runtime permission to the manifest.
4. Implement `OfflineVoiceInput` as a small controller:
   - lazily create the `OnlineRecognizer` from assets on a background thread;
   - create `AudioRecord` at 16 kHz, mono, PCM16, preferring `VOICE_RECOGNITION`;
   - stream 100 ms blocks to an `OnlineStream`, decode while ready, and report partial text;
   - use sherpa-onnx endpoint rules to finish an utterance, report final text, and reset the stream;
   - flush a short silence block on stop so the last words are recognized;
   - report loading, listening, idle, and error states to the activity;
   - release the stream and recorder on a single owning thread.
5. Integrate the controller with the composer:
   - add a microphone button before the send button in the footer;
   - request the microphone permission on first use;
   - snapshot the existing draft and replace only the voice segment while listening;
   - append each final segment with a sensible separator;
   - show stop state while recording and report load/permission/recognition errors with the existing toast.
6. Stop capture before sending, on `onPause`, on chat switches, when rebuilding the composer, and on back; release the recognizer in `onDestroy`.
7. Avoid excessive draft writes while partial results update by keeping the existing watcher behavior, but only writing the composer text that is already visible.
8. Add an English UI string set and a microphone vector icon.
9. Build the Android debug variant, keep a new versioned APK artifact, and update the version and changelog.

## Acceptance criteria

- The composer shows a microphone action; tapping it asks for microphone permission when needed.
- On first use the app reports that the offline model is loading, then starts listening.
- Speaking Chinese updates the composer with partial text; pausing produces a final segment and continues listening.
- Tapping stop commits the last partial result and returns the action to the microphone state.
- Existing draft text remains before the dictated text; sending, pausing the app, switching chats, and closing the app stop recording.
- The recognizer and recorder are released; no audio leaves the device.
- The Android debug build completes successfully at `0.49.0-dev.1` (`versionCode 300`).

## Completion

- `:app:assembleDebug` completed successfully. The APK bundles the int8 model assets uncompressed and sherpa-onnx native libraries for `arm64-v8a` and `armeabi-v7a`.
- `0.49.0-dev.1` / `versionCode 300` was installed on `10.126.126.2:5555`.
- On-device verification: tapping the microphone loaded `libsherpa-onnx-jni.so`, opened a 16 kHz mono `AudioRecord` with the voice-recognition source, displayed the stop state, and streamed recognized Chinese text into the composer. Tapping stop closed the recorder and restored the microphone icon while keeping the transcript.
- The test transcript was cleared from the composer afterward. No cloud ASR or network audio upload is used.
- The bundled model is Chinese-focused and has no punctuation model; dictated text is inserted without automatic punctuation.
