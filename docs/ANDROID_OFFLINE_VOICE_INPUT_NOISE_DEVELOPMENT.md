# Android Offline Voice Input Noise Robustness Development

## Classification

PATCH: the dictation workflow is unchanged, but the existing feature does not work acceptably when there is background noise. This change fixes recognition accuracy and improves the microphone signal path.

Target Android version: `0.49.1-dev.5` (`versionCode 305`). `0.49.1-dev.4` was a test build with the wrong `modelType` and exited during native model initialization; it is kept only as an artifact. `0.49.1-dev.3` is also kept.

## Observed problem

The bundled `sherpa-onnx-streaming-zipformer-zh-14M-2023-02-23` model is a 14M-parameter model trained on WenetSpeech. It recognizes clean speech well but degrades sharply with a small amount of noise. A local benchmark on `DEV_T0000000000.wav` with additive white noise shows:

| Model | clean CER | white 10 dB | white 5 dB | babble 10 dB | babble 5 dB |
| --- | --- | --- | --- | --- | --- |
| 14M-2023 (current) | 7.1% | 32.1% | 39.3% | 35.7% | 50.0% |
| multi-zh-hans-2023 | 10.7% | 14.3% | 21.4% | 25.0% | 96.4% |
| zh-large-2025 | 0.0% | 3.6% | 7.1% | 25.0% | 39.3% |
| small-ctc-2025 | 3.6% | 10.7% | 14.3% | 32.1% | 32.1% |

`zh-large-2025` is `sherpa-onnx-streaming-zipformer-zh-int8-2025-06-30`, converted from the multi-zh-hans zipformer-large checkpoint. It has the best clean and noisy accuracy of the candidates and is still a streaming transducer, so the existing controller and partial-text flow stay intact.

## Planned changes

1. Replace the model assets with `sherpa-onnx-streaming-zipformer-zh-int8-2025-06-30`:
   - `encoder.int8.onnx`
   - `decoder.onnx`
   - `joiner.int8.onnx`
   - `tokens.txt`
   Update `MODEL_NOTICE.txt` and `android/README.md` with the new source and size.
2. Raise the recognizer's thread count for the larger model to use up to four cores, while keeping at least two.
3. Enable the platform `NoiseSuppressor` and `AutomaticGainControl` on the `AudioRecord` session when the device exposes them. Failures or unavailable effects are ignored so recording still works.
4. Add a first-order 80 Hz high-pass filter to the PCM stream before feature extraction to remove DC offset and low-frequency rumble without touching the speech band.
5. Keep the existing preload, 40 ms blocks, endpoint rules, partial throttling, finishing state, and release/race guards.
6. Keep the old APK artifacts and build a new `0.49.1-dev.5` artifact. `0.49.1-dev.4` stays as a record of the failed `modelType` test build and must not be reused.

## Acceptance criteria

- The model loads and preloads from assets on `10.126.126.2:5555`; no audio is uploaded.
- Dictation still works end to end: permission, listening, partial text, endpoint segmentation, stop, and idle.
- The new model decodes faster than real time on the test device with the configured thread count.
- Recognition of the same noisy benchmark sample is materially better than the 14M model.
- Platform noise suppression and AGC are enabled when available and do not prevent recording when unavailable.
- The debug build succeeds at `0.49.1-dev.5` (`versionCode 305`) and a new APK is written to `artifacts/`.
- The existing `0.49.1-dev.3` and `0.49.1-dev.4` APKs are not overwritten.

## Completion

- The bundled model was replaced with `sherpa-onnx-streaming-zipformer-zh-int8-2025-06-30` (154 MB encoder, 5 MB decoder, 1 MB joiner, tokens). The APK grew from 82 MB (`dev.3`) to 218 MB (`dev.5`).
- `:app:assembleDebug` succeeded at `0.49.1-dev.5` (`versionCode 305`). The APK is `artifacts/codex-remote-android-0.49.1-dev.5-debug.apk`, SHA-256 `49b18f8b0cb66e1307e4abe6c2751790e69280c1b0dadfdf015efa4794d9857e`. The `dev.3` and `dev.4` APKs were left untouched.
- The APK installed on `10.126.126.2:5555`. The earlier `dev.4` native exit was fixed by setting `modelType = "zipformer2"`; `dev.5` loads and runs.
- On-device preload and decode were verified without uploading audio:
  - `model ready in 1049 ms`.
  - `audio effects ns=true agc=false`; the platform exposes `NoiseSuppressor` but not `AutomaticGainControl` on this device, and recording continues normally when AGC is unavailable.
  - Two test sessions decoded 13.16 s and 10.08 s of microphone audio at RTF 0.17 (decode 2179 ms and 1762 ms), comfortably faster than real time.
  - No `FATAL EXCEPTION`; the microphone returned to idle after each session.
- Local benchmark on `DEV_T0000000000.wav` (reference transcript `对我做了介绍啊那么我想说的是呢大家如果对我的研究感兴趣呢`) with additive white and babble noise shows the improvement that motivated the change:

  | Model | clean CER | white 10 dB | white 5 dB | babble 10 dB | babble 5 dB |
  | --- | --- | --- | --- | --- | --- |
  | 14M-2023 (old) | 7.1% | 32.1% | 39.3% | 35.7% | 50.0% |
  | zh-large-2025 (new) | 0.0% | 3.6% | 7.1% | 25.0% | 39.3% |

- The interactive "play a known noisy sentence through a speaker, dictate it, compare the composer text" check was **not completed**. The test device has a Type-C headset attached, which routes both playback and `VOICE_RECOGNITION` capture to the headset; the temporary playback harness could not produce a controlled audible signal for the recorder during the available test window, and the user was not available to dictate live. The microphone path itself was exercised (sessions above), but noisy end-to-end recognition accuracy on this device still needs one manual voice test.
- Temporary test audio, the test playback app, and benchmark scripts/models were removed after use. No audio was uploaded at any point.
