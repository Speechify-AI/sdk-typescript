# Reference
## audio
<details><summary><code>client.audio.<a href="/src/api/resources/audio/client/Client.ts">speech</a>({ ...params }) -> Speechify.GetSpeechResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Synthesize speech audio from text or SSML. Returns the complete audio
file plus billing and speech-mark metadata in a single JSON response.
For low-latency playback or long-form text, use POST /v1/audio/stream.
Set `output_format` for explicit sample-rate/bitrate control (e.g.
`pcm_16000` or `ulaw_8000` for telephony).
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.audio.speech({
    audio_format: "mp3",
    input: "Hello! This is the Speechify text-to-speech API.",
    model: "simba-3.2",
    voice_id: "geffen_32"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Speechify.GetSpeechRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AudioClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.audio.<a href="/src/api/resources/audio/client/Client.ts">stream</a>({ ...params }) -> core.BinaryResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Synthesize speech and stream the audio back as it is generated, for
low-latency playback. Set `output_format` in the body for explicit
codec/sample-rate/bitrate control (e.g. `pcm_16000` or `ulaw_8000` for
telephony), or fall back to the Accept header for the container; the
response is raw audio bytes (HTTP chunked). For Base64-encoded audio
with speech-mark metadata in a single JSON response, use
POST /v1/audio/speech.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.audio.stream({
    body: {
        input: "input",
        voice_id: "voice_id"
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Speechify.StreamAudioRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AudioClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.audio.<a href="/src/api/resources/audio/client/Client.ts">streamWithTimestamps</a>({ ...params }) -> core.Stream&lt;Speechify.SpeechStreamEvent&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Synthesize speech and stream it back together with word-level speech
marks, for text highlighting, captions and audio-text synchronization
while the audio is still arriving.

The response is a Server-Sent Events stream. Each `speech.chunk` event
carries a Base64-encoded run of audio, the speech marks that became
final with it, or both - a chunk may carry only one of the two, and the
last chunk of a stream is often marks-only. A terminal `speech.done`
event ends the stream; there is no `[DONE]` sentinel. Ignore any event
type you do not recognize, so that new event types do not break your
integration.

Speech-mark times are absolute milliseconds from the start of the
synthesis, so concatenate the audio chunks into one stream and apply the
marks against that single timeline. Which chunk a mark arrives on is a
delivery detail and carries no meaning. Times stay correct for every
`output_format`: changing the codec or sample rate does not change the
duration.

Speech marks are produced by the streaming-native models. The default
`simba-3.0` and `simba-3.2` both serve this route; the legacy
`simba-english` and `simba-multilingual` models return 400
`speech_marks_unsupported` here.
For Base64-encoded audio and speech marks in one non-streamed JSON
response, on any model, use POST /v1/audio/speech.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const response = await client.audio.streamWithTimestamps({
    body: {
        input: "Streaming long-form audio with the Speechify API.",
        model: "simba-3.2",
        voice_id: "geffen_32"
    }
});
for await (const item of response) {
    console.log(item);
}

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Speechify.StreamWithTimestampsAudioRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `AudioClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## models
<details><summary><code>client.models.<a href="/src/api/resources/models/client/Client.ts">list</a>() -> Speechify.ModelsResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

List the text-to-speech models available for synthesis. Drive a model
picker from this response, then pass a model `id` as the `model`
parameter to POST /v1/audio/speech or /v1/audio/stream. The response
marks the default model (used when a request omits `model`), the
routes each model may be passed to, and which voices it accepts.
Multi-speaker models arrive in a separate `dialogue_models` array
because they are valid only on POST /v1/audio/dialogue. Returns
the full set in a single response: the model catalog is static
platform reference data, so it is intentionally not paginated.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.models.list();

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**requestOptions:** `ModelsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## voices
<details><summary><code>client.voices.<a href="/src/api/resources/voices/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;Speechify.GetVoice, Speechify.ListVoicesResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Lists the voices available to the caller - the shared voice
catalog plus the workspace's cloned voices, whichever member or
service-account key created them. By default
the full catalogue is returned in one response. Pagination is
opt-in: pass `limit` (and then `cursor` from the previous
response) to page through the list while `has_more` is true. Max
page size is 200. Narrow the list with the `type` and `locale`
filters (applied before pagination, so pages stay full).
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.voices.list({
    locale: "en",
    model: "simba-3.2"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.voices.list({
    locale: "en",
    model: "simba-3.2"
});
while (page.hasNextPage()) {
    page = page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Speechify.ListVoicesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VoicesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.voices.<a href="/src/api/resources/voices/client/Client.ts">create</a>({ ...params }) -> Speechify.GetVoice</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Create a cloned voice for the workspace from a 10-30 second audio sample, with verified consent from the speaker.

Cloning requires proof that the speaker agreed to it. Create a consent challenge with `POST /v1/voices/consent-challenges`, show the returned `phrase` to the speaker, record them reading it aloud, and send that recording here as `consent_recording` together with the challenge's `consent_challenge_id`. Speechify transcribes the recording, checks it against the phrase it issued, checks that its speaker is the speaker in your `sample`, and keeps it as the consent record for the voice. The person consenting therefore has to be the person being cloned. A challenge is single use and short-lived, so record and submit in one sitting.

The clone belongs to the workspace rather than the member who created it, and access follows the caller's workspace role and API-key scopes exactly as for any other voice: voices scopes to list it, audio scopes to synthesize with it, and the content-management permission plus a write scope on the key to delete it. Cloned voices are usable self-serve on `simba-3.0`, `simba-english` and `simba-multilingual`. `simba-3.2` also serves cloned voices, currently as a limited release enabled per workspace; contact Speechify to have it enabled for yours.

Callers pinned before `Speechify-Version: 2026-09-13` use the previous flow instead: no challenge, and a `consent` form field carrying the speaker's name and email as a JSON string. That flow is deprecated and will be removed after a sunset window announced in the changelog.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.voices.create({
    sample: fs.createReadStream("/path/to/your/file"),
    consent_recording: fs.createReadStream("/path/to/your/file"),
    "Idempotency-Key": "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    name: "name",
    gender: "male",
    consent_challenge_id: "consent_challenge_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Speechify.CreateVoicesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VoicesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.voices.<a href="/src/api/resources/voices/client/Client.ts">get</a>({ ...params }) -> Speechify.GetVoice</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Fetch a single voice by id - a shared catalogue voice or one of
the workspace's cloned voices. A cloned voice that belongs to
another workspace returns 404, identical to an unknown id, so
voice inventory is never enumerable across tenants.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.voices.get({
    voice_id: "voice_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Speechify.GetVoicesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VoicesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.voices.<a href="/src/api/resources/voices/client/Client.ts">delete</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Delete one of the workspace's cloned voices. Requires the
`content.manage` permission (owner, admin, or member); a
service-account key is authorized by its scopes instead.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.voices.delete({
    voice_id: "voice_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Speechify.DeleteVoicesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VoicesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.voices.<a href="/src/api/resources/voices/client/Client.ts">downloadSample</a>({ ...params }) -> core.BinaryResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Download a personal (cloned) voice sample
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.voices.downloadSample({
    voice_id: "voice_id"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Speechify.DownloadSampleVoicesRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `VoicesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Voices ConsentChallenges
<details><summary><code>client.voices.consentChallenges.<a href="/src/api/resources/voices/resources/consentChallenges/client/Client.ts">create</a>({ ...params }) -> Speechify.ConsentChallenge</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Start the consent check for a voice clone.

Returns a `phrase` for the speaker to read aloud and an `id` that identifies this challenge. Show the phrase to the speaker exactly as returned, record them reading it, then send the recording and the `id` to `POST /v1/voices`, which verifies the recording against the phrase and against the voice sample being cloned, then keeps it as the consent record.

A challenge is single use, is bound to the workspace that created it, and expires at `expires_at` - it is proof that a speaker was in front of a microphone just now, so create it when you are ready to record, not at the start of your flow. If it expires, create another one and record again.

Challenge creation is rate limited per workspace at a few dozen per hour, far more tightly than the rest of the voice surface, because each one precedes a person recording themselves - mint it when your speaker is ready, not speculatively. Read the live ceiling off `RateLimit-*` rather than hard-coding it. **On a `429`, always honour `Retry-After` rather than a fixed backoff of your own**: the wait is measured in minutes and can run to most of an hour. `RateLimit-*` are omitted rather than reporting a bucket that is not the one refusing.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.voices.consentChallenges.create({
    "Idempotency-Key": "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    full_name: "Jane Doe"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `Speechify.voices.CreateConsentChallengeRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ConsentChallengesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

