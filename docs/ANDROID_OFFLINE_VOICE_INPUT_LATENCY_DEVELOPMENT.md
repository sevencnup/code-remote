# Android Offline Voice Input Latency Optimization

## Classification

PATCH: the dictation workflow stays the same, but first-use startup, partial-text responsiveness, and stop behavior are improved. No new user task is introduced.

Target Android version: `0.49.1-dev.3` (`versionCode 303`). `0.49.1-dev.1` and `0.49.1-dev.2` were intermediate test builds kept only as artifacts.

## Observed problems

The first implementation works, but it feels slower than a native input method for four separate reasons:

1. The sherpa-onnx recognizer is created lazily on the first microphone tap, so that tap waits for the model and ONNX session to load.
2. The recorder reads 100 ms blocks, which puts a floor under partial-text latency, and each partial replaces the whole `EditText` text.
3. Endpoint rule 1 waits 2.4 s of silence before committing a segment, so a pause feels unresponsive even though partial text is visible.
4. Tapping stop keeps the listening state until the worker flushes 600 ms of silence, decodes the tail, and releases resources.

## Planned changes

1. Add `preload()` to `OfflineVoiceInput` and call it when the composer is built. Preloading does not request microphone permission and does not start recording. If the user taps the microphone while a preload is in flight, the pending start is remembered and recording begins as soon as the model is ready.
2. Run a short silent decode after loading to warm up the ONNX graph. A preload failure stays silent; the next explicit start retries and reports the error normally.
3. Read 40 ms blocks instead of 100 ms blocks and raise the worker thread to audio priority.
4. Throttle partial-text posts to the main thread to at most about one every 60 ms while always converging on the latest result, so recognition does not flood the UI.
5. Replace only the changed suffix of the composer text instead of calling `setText` with the entire string on every partial result.
6. Shorten endpoint rules to 1.2 s for silence-only and 0.8 s after speech, keeping the 20 s maximum utterance rule.
7. Add a `FINISHING` state. Stopping posts it immediately, the microphone button becomes a disabled microphone, and the worker flushes 250 ms of silence before posting `IDLE`.
8. Post `LISTENING` only after `AudioRecord.startRecording()` succeeds, so the UI never claims to listen before the microphone is live.
9. Keep the existing stop-on-pause, stop-on-send, stop-on-thread-switch, draft merging, and release behavior.

## Acceptance criteria

- After the composer has been visible long enough for preload, tapping the microphone starts recording without waiting for the model to load.
- Tapping the microphone immediately after launch still starts recording once the in-flight preload completes; it must not drop the tap.
- Partial text updates during speech without flooding the main thread, and the final text is unchanged from the previous implementation.
- Tapping stop switches the button to the finishing state promptly and returns to idle after the shortened tail flush.
- Endpoint segmentation commits after about 0.8–1.2 s of silence and continues listening for the next segment.
- Existing behavior is preserved: drafts remain, audio never leaves the device, lifecycle stops still work, and the recognizer is released in `onDestroy`.
- The debug build succeeds at `0.49.1-dev.3` (`versionCode 303`) and installs on `10.126.126.2:5555`.

## Completion

- `:app:assembleDebug` completed successfully. Intermediate artifacts `0.49.1-dev.1` and `0.49.1-dev.2` were kept; the final artifact is `artifacts/codex-remote-android-0.49.1-dev.3-debug.apk` at `0.49.1-dev.3` (`versionCode 303`).
- The final APK installed successfully on `10.126.126.2:5555`. The activity resumed and logcat showed no `FATAL EXCEPTION`.
- Preload was verified without touching the microphone: `libsherpa-onnx-jni.so` loaded during app startup, before any user interaction.
- The interactive microphone/stop check could not be repeated this round because the test device is sitting on a PIN keyguard, so the composer could not be operated from adb. The underlying recognition path was verified on this device with `0.49.0-dev.1`; the new block size, endpoint values, finishing state, and tail flush still need one manual tap/stop pass after the device is unlocked.
- The race between preload completion and a microphone tap, and the race between `onDestroy` and recorder setup, are guarded by the controller lock; a recorder that is cancelled during setup releases its stream and recorder and posts `IDLE`.
