# Changelog

## [4.0.1](https://github.com/Speechify-AI/sdk-typescript/compare/4.0.0...4.0.1) (2026-08-19)


### Bug Fixes

* align Fern-generated SDK version strings with published 4.0.0 ([#18](https://github.com/Speechify-AI/sdk-typescript/issues/18)) ([3b72093](https://github.com/Speechify-AI/sdk-typescript/commit/3b720932f1c88586d217f35d43b58d1191b923a2))

## [4.0.0](https://github.com/Speechify-AI/sdk-typescript/compare/3.0.1...4.0.0) (2026-08-19)


### ⚠ BREAKING CHANGES

* default API version is now `2026-09-13`.

### Features

* regenerate SDK for API 2026-09-13 with consent-challenge voice cloning ([#16](https://github.com/Speechify-AI/sdk-typescript/issues/16)) ([23a8e2f](https://github.com/Speechify-AI/sdk-typescript/commit/23a8e2fd1c53f3c8801bc4f14259fb60cf11330c))

## [3.0.1](https://github.com/SpeechifyInc/speechify-api-sdk-typescript/compare/3.0.0...3.0.1) (2026-07-10)


### Bug Fixes

* bump SDK_VERSION to 3.0.0 ([#11](https://github.com/SpeechifyInc/speechify-api-sdk-typescript/issues/11)) ([2b22469](https://github.com/SpeechifyInc/speechify-api-sdk-typescript/commit/2b22469a9182b7bc509ff7f624d8240096b0f874))
* correct SDK_VERSION and release 3.0.1 ([#14](https://github.com/SpeechifyInc/speechify-api-sdk-typescript/issues/14)) ([7b09e8b](https://github.com/SpeechifyInc/speechify-api-sdk-typescript/commit/7b09e8b9a216606618f411be5518c67e889cba3d))

## [3.0.0](https://github.com/SpeechifyInc/speechify-api-sdk-typescript/compare/2.0.0...3.0.0) (2026-07-10)


### ⚠ BREAKING CHANGES

* removed voice types `CreatedVoice`, `CreateVoiceModel`, `CreateVoiceLanguage`; `GetSpeechResponse.audio_format` redocumented as the audio codec. Additive: new `AudioFormat.Ulaw` value, `output_format` field, `AudioOutputFormat` / `PaginationMeta` / `ListVoicesResponse`, `ConflictError`.

### Features

* regenerate SDK on fern-typescript-sdk@3.70.1 (TTS surface) ([#8](https://github.com/SpeechifyInc/speechify-api-sdk-typescript/issues/8)) ([df2eb69](https://github.com/SpeechifyInc/speechify-api-sdk-typescript/commit/df2eb690bed2c4edccf2cc42834c266478a0e7ac))

## [2.0.0](https://github.com/SpeechifyInc/speechify-api-sdk-typescript/compare/1.0.2...2.0.0) (2026-06-22)


### ⚠ BREAKING CHANGES

* `new SpeechifyClient({ token: ... })` is now `new SpeechifyClient({ apiKey: ... })`. The `tts.` namespace has been removed — call sites move from `client.tts.audio.speech(...)` to `client.audio.speech(...)` and from `client.tts.voices.X` to `client.voices.X`. Method return type changed from `Promise<T>` to `core.HttpResponsePromise<T>`; both are awaitable and resolve to `T` but type-import sites may need updates. Generator-line crossed `0.x` → `3.x` (plus image rename `fern-typescript-node-sdk` → `fern-typescript-sdk`), so internal/private code paths have moved.

### Features

* regenerate SDK on fern-typescript-sdk@3.70.1 with TTS-only surface ([#6](https://github.com/SpeechifyInc/speechify-api-sdk-typescript/issues/6)) ([69ff4e4](https://github.com/SpeechifyInc/speechify-api-sdk-typescript/commit/69ff4e4eb77984bcbca8ea5ab9f18a25b89e8f47))
