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
    model: "simba-3.5",
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

Every model this route accepts produces speech marks here. The default
`simba-3.0`, `simba-3.2` and `simba-3.5` stream marks word by word
alongside the audio. The legacy `simba-english` and `simba-multilingual` models,
still selectable on a workspace pinned before API version `2026-09-21`,
synthesize a sentence at a time, so their marks arrive a sentence at a
time with that sentence's audio; from that version on they return 400
`model_retired` on every synthesis route, and from 2026-11-21 both ids
are served by our current models.
For Base64-encoded audio and speech marks in one non-streamed JSON
response, use POST /v1/audio/speech.
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
        model: "simba-3.5",
        voice_id: "geffen_32"
    }
});

const audioChunks: Buffer[] = [];

for await (const item of response) {
    switch (item.type) {
        case "speech.chunk":
            // `audio` is Base64 and the SDK does not decode it for you. It is
            // absent on a marks-only chunk, which the last chunk often is.
            if (item.audio != null) {
                audioChunks.push(Buffer.from(item.audio, "base64"));
            }
            // Mark times are absolute ms from the start of the synthesis, so
            // they apply to the concatenated audio, not to this chunk.
            for (const mark of item.speech_marks ?? []) {
                console.log(mark.start_time, mark.value);
            }
            break;

        case "speech.error":
            // A failure after the stream has opened arrives as an event, NOT as
            // a thrown error: the 200 status is already committed. The SDK does
            // not raise it for you, so handle it explicitly, otherwise the loop
            // ends normally and you treat truncated audio as a success.
            throw new Error(`${item.error.code}: ${item.error.message}`);

        case "speech.done":
            // Terminal event. There is no `[DONE]` sentinel.
            console.log("billable characters:", item.billable_characters_count);
            console.log("audio duration (ms):", item.audio_duration_ms);
            break;

        default:
            // Ignore unrecognized event types so new ones cannot break you.
            break;
    }
}

const audio = Buffer.concat(audioChunks);

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
catalog plus the cloned voices they can reach, whichever member or
service-account key created them. A clone filed under a project is
listed only for a caller who can reach that project; a clone no
project filed is shared with the whole workspace and is listed for
everyone in it. The list is paged: a request without `limit`
returns the first 50 voices, and `limit` raises that to at most
200. Pass `cursor` from the previous response to fetch the next
page while `has_more` is true. API versions before 2026-07-16
returned the whole catalogue when `limit` was omitted. Narrow the
list with the `type` and `locale` filters.

A page can come back with fewer than `limit` voices, and a short
page - an empty one included - is not the end of the list. Keep
following `next_cursor` while `has_more` is true.
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
    model: "simba-3.5",
    project_id: "proj_01arz3ndektsv4rrffq69g5fav"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.voices.list({
    locale: "en",
    model: "simba-3.5",
    project_id: "proj_01arz3ndektsv4rrffq69g5fav"
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

The clone belongs to the workspace rather than the member who created it, and access follows the caller's workspace role and API-key scopes exactly as for any other voice: voices scopes to list it, audio scopes to synthesize with it, and the content-management permission plus a write scope on the key to delete it. Cloned voices are usable self-serve on `simba-3.0` (and, on a workspace pinned before API version `2026-09-21`, on the retired `simba-english` and `simba-multilingual`, which from 2026-11-21 are served by our current models and still take cloned voices). `simba-3.2` and `simba-3.5` also serve cloned voices.

The previous flow, a `consent` form field carrying the speaker's name and email as a JSON string, was switched off on 2026-09-23 for every API version: a create that sends `consent` and no `consent_challenge_id` returns 400 `consent_verification_required`.

Voice cloning is not available in some jurisdictions. A request from one returns 403 `voice_cloning_unavailable_in_region` before consent verification runs, so it does not spend the challenge. The location is read from the IP address that sends the request, which is your server's when your backend calls the API; a location header in the request is ignored.
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

A voice that is also a member's personal voice (one cloned
before workspaces owned voices and adopted into this workspace)
is removed from the workspace only; the person keeps it.
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

## projects
<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;Speechify.Project, Speechify.ListProjectsResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

List the workspace's projects, newest first. The implicit Default
project is not a row and is never listed; resources with no
`project_id` live in it. Archived projects are hidden unless
`include_archived=true`, and purged ones unless
`include_purged=true`. Cursor-paginated: omit `cursor` for the
first page; walk pages while `has_more` is true (default page size
50, max 200).
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
const pageableResponse = await client.projects.list();
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.projects.list();
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

**request:** `Speechify.ListProjectsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">create</a>({ ...params }) -> Speechify.Project</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Create a project in the caller's workspace. Names are unique per
workspace (case-insensitive). A workspace holds at most 100 live
projects; at the cap the create refuses with
`409 project_limit_reached` until one is deleted.
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
await client.projects.create({
    name: "Production"
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

**request:** `Speechify.CreateProjectRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">get</a>({ ...params }) -> Speechify.Project</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Fetch one project by id, scoped to the caller's workspace. Returns
404 for missing or foreign-workspace projects — project existence
is never leaked across workspaces.
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
await client.projects.get({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t"
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

**request:** `Speechify.GetProjectsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">delete</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Delete a project. With no body it deletes a project that holds
nothing, and refuses one that does; `mode` is how you say what
should happen to what it holds.

**Empty** (no body): the project is removed only while it holds no
resources. A project that holds any is refused with 409
`project_not_empty`, and the refusal enumerates what is inside:
`error.details.resource_count` is the total, and
`error.details.contents` names each kind with a count and up to five
names. Every project row also carries that total as
`resource_count`, so an application can find the projects it may
delete in one list call. Records of work never hold a project open
and are not counted.

**Detach** (`mode: detach`): only the grouping row is removed; every
resource in the project moves to the implicit Default project, where
it stays readable and is listed by `?project_id=default`. Refused
with 409 `project_has_scoped_credentials` while an API key, service
account, vault credential, webhook endpoint, member grant or pending
invite is scoped to the project, because detaching any of those
would silently widen it.

**Purge** (`mode: purge` with `confirm` equal to the project's
name): available only on an ARCHIVED project, because a teardown
needs a state you can sit in and reverse first; a live project is
refused with the coded `409 project_not_archived`. Archive the
project, confirm it is the one you mean, then purge. The project is
removed WITH its contents in one transaction: the resources it holds
and its scoped webhook endpoints and vault credentials are deleted,
API keys and service accounts pinned to the project are revoked, and
member grants and pending-invite scopes on the project are cleared.
Resources with a lifecycle and a delete of their own, such as
stores, hosted APIs and files, are not removed: they move to the
Default project, and because they do hold a project open, an
unqualified delete refuses while any of them is in the project.
Refused with 409 while a resource that must be released first is
still attached (the refusal names it), while a member's only project
grant is this one, or while a live invite carries only this project
(clearing either would widen that person to the whole workspace, the
invite one acceptance earlier).

**A purge is recoverable for 30 days.** The project disappears from
every list and read immediately, and its name is freed for reuse,
but the project and its resources are kept and permanently deleted
only once the window closes. `POST
/v1/projects/{project_id}/restore` brings the project and its
resources back inside that window; the credentials the purge revoked
and the grants it cleared stay that way.

The 409 carries the blockers under `error.details.blockers` (`kind`,
typed `id`, `name`, and the `blocks` modes each refuses), their
total under `error.details.blocker_count`, and, for existing
clients, the same rows under `error.details.credentials`. The lists
are capped at 50 rows; the counts are not, and the refusal is
decided on the count.
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
await client.projects.delete({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t",
    mode: "purge",
    confirm: "Staging"
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

**request:** `Speechify.DeleteProjectRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">update</a>({ ...params }) -> Speechify.Project</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Edit a project in place - its name, its monthly spend limit, or its
capacity ceilings - keeping the same id so every grouped resource
follows the edit with no re-pointing. Names are unique per
workspace (case-insensitive). The limit fields require
`billing.manage`; a capacity ceiling above the workspace's own is
refused, since it could never apply.
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
await client.projects.update({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t"
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

**request:** `Speechify.UpdateProjectRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">archive</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Archive a project. From then on nothing new starts or bills inside
it: requests on a credential pinned to the project, and every new
piece of work attributed to it, are refused with the coded `409
project_archived`. Work already in flight is left to finish.
Everything in the project stays readable and its configuration stays
editable, and the project still answers by id.

Idempotent: archiving an archived project is a no-op. Reverse it
with the unarchive operation.
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
await client.projects.archive({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t"
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

**request:** `Speechify.ArchiveProjectsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">unarchive</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Lift a project's archive so work and spend resume inside it.
Idempotent: unarchiving a live project is a no-op.
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
await client.projects.unarchive({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t"
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

**request:** `Speechify.UnarchiveProjectsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">restore</a>({ ...params }) -> Speechify.ProjectRestore</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Walk back a purge. A purged project is recoverable for 30 days: its
row and its contents are kept, hidden from every list and read, and
permanently deleted only once the window expires.

**What comes back:** the project and exactly the resources the purge
removed. A resource you had deleted yourself before the purge stays
deleted.

**What does NOT come back, on purpose:** every credential the purge
revoked stays revoked, and every grant it cleared stays cleared. API
keys and service accounts pinned to the project are not re-issued,
vault credentials and webhook endpoints scoped to it are not
undeleted, and member grants and pending-invite scopes are not
restored. Bringing a credential or a grant back would re-grant
access somebody deliberately ended, so the restore reports them
under `still_revoked` instead. Re-create the credentials and
re-grant the members the project still needs.

The project returns ARCHIVED, the state it was purged from, so
nothing dispatches or bills inside it until you unarchive it.

Refused with `409 project_not_purged` when the project was never
purged, `409 project_restore_window_expired` once the 30 days have
passed, and `409 project_name_taken` when another project has taken
this one's name since the purge (a purge frees the name immediately
- rename the project holding it, then restore).
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
await client.projects.restore({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t"
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

**request:** `Speechify.RestoreProjectsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">audit</a>({ ...params }) -> core.Page&lt;Speechify.ProjectAuditEvent, Speechify.ProjectAuditResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Who changed this project's access or its lifecycle state, and when.
Newest first. Covers the last 90 days; paginate by passing `cursor`
from the previous response.

Each entry names the SUBJECT (whose access changed) and the ACTOR (who
changed it), with the role the actor held at the time. When a change
was made by Speechify support acting on the workspace's behalf, the
entry also carries that admin's email, so a support-initiated change
never reads as one a colleague made.

Requires `members.manage_project_scope` (owner or admin): who widened
a member's access is a stronger fact than who currently holds it.
Returns 404 for missing or foreign-workspace projects.
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
const pageableResponse = await client.projects.audit({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.projects.audit({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t"
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

**request:** `Speechify.AuditProjectsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">listMembers</a>({ ...params }) -> core.Page&lt;Speechify.ProjectMember, Speechify.ProjectMembersResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

List the workspace members granted access to this project, oldest
grant first. Paginate by passing `cursor` from the previous response.

A member with no grants anywhere is workspace-wide and does not appear
here: this lists people who have been narrowed to specific projects,
not everyone who can reach this one.
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
const pageableResponse = await client.projects.listMembers({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.projects.listMembers({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t"
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

**request:** `Speechify.ListMembersProjectsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">grantMember</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Grant a workspace member access to this project. Once a member holds
any grant, they see and touch only the projects they have been granted.

Requires `members.manage_project_scope` (owner or admin). An owner or
billing admin cannot be scoped: both already hold workspace-wide access
that a project scope would contradict without restricting anything.
Idempotent: granting a project the member already holds is a no-op.
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
await client.projects.grantMember({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t",
    user_id: "user_kb3fim3yjnyto3kxli4g4ysdmyzgiuttjrudswlkgbawk"
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

**request:** `Speechify.GrantProjectMemberRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.projects.<a href="/src/api/resources/projects/client/Client.ts">revokeMember</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Remove a member's access to this project.

A member who loses their last grant is not locked out - they return
to workspace-wide access, because holding no grants is the unrestricted
state. To restrict someone, grant them the projects they should keep
rather than revoking everything. Requires `members.manage_project_scope`.
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
await client.projects.revokeMember({
    project_id: "proj_01jqr8x9zg5k2m3n4p5q6r7s8t",
    user_id: "user_kb3fim3yjnyto3kxli4g4ysdmyzgiuttjrudswlkgbawk"
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

**request:** `Speechify.RevokeMemberProjectsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ProjectsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## workspaces
<details><summary><code>client.workspaces.<a href="/src/api/resources/workspaces/client/Client.ts">getEntitlements</a>() -> Speechify.EntitlementsResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

The per-tier entitlements catalog plus the caller's RESOLVED
entitlements for the current workspace (tier defaults composed with
any per-tenant override). Readable with an API key as well as a
console session: it is how an integration learns what it may use
before a feature endpoint answers `402`. Branch on
`current.voice_cloning` and `current.hosted_apis_access`, and size
traffic from
`current.tts_requests_per_second` and `current.tts_concurrency`. The
console renders quota affordances and upgrade-card limits from the
same single server-authoritative source instead of a hardcoded
mirror.
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
await client.workspaces.getEntitlements();

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

**requestOptions:** `WorkspacesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Audio Watermark
<details><summary><code>client.audio.watermark.<a href="/src/api/resources/audio/resources/watermark/client/Client.ts">detect</a>({ ...params }) -> Speechify.WatermarkDetectionResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Check whether a clip carries the watermark Speechify seals into audio it
generates. Upload the audio as `audio`; nothing about it is stored, and
no voice is read or written.

Read the answer carefully in one direction. A `watermarked: true` is
positive evidence that the audio came from Speechify synthesis. A
`watermarked: false` is NOT proof that it did not: only models
redeployed since the watermark shipped mark their output, the detector
needs at least three seconds of clear speech to judge, and re-encoding
or changing the speed of a clip degrades the mark. Treat a negative as
the absence of evidence rather than as evidence of absence.

Checks are rate-limited well below the synthesis budget: this is a
forensic question, not a data-plane call.
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
await client.audio.watermark.detect({
    audio: fs.createReadStream("/path/to/your/file")
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

**request:** `Speechify.audio.DetectWatermarkRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WatermarkClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.audio.watermark.<a href="/src/api/resources/audio/resources/watermark/client/Client.ts">verify</a>({ ...params }) -> Speechify.WatermarkVerificationResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

The public AI detection tool. Ask whether a clip carries the watermark
Speechify seals into audio it generates, with no account, no API key and
no credential of any kind.

`verify` answers; `detect` measures. This route returns a bare yes or no,
the way verifying a signature does. Its sibling
`POST /v1/audio/watermark/detect` takes an API key and returns the
detector's confidence alongside the verdict.

This is the programmatic half of the tool published at
<https://speechify.ai/detect>, and it exists so the tool can be invoked
without visiting our website, as California's AI Transparency Act
(BPC 22757.2) requires. Nothing about the clip is stored, and nothing
identifying about you is collected or retained.

The answer is a bare verdict. `watermarked: true` is positive evidence
that the audio came from Speechify synthesis. `watermarked: false` is
NOT proof that it did not: only models redeployed since the watermark
shipped mark their output, the detector needs at least three seconds of
clear speech to judge, and re-encoding or changing the speed of a clip
degrades the mark. Treat a negative as the absence of evidence rather
than as evidence of absence.

Because the tool takes no credential, it is rate-limited per client
address and shares a platform-wide budget: expect a 429 under sustained
automated use, and retry after the interval the response advertises.
Use `POST /v1/audio/watermark/detect` with an API key for the detector's
confidence score and a per-workspace allowance of its own.
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
await client.audio.watermark.verify({
    audio: fs.createReadStream("/path/to/your/file")
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

**request:** `Speechify.audio.VerifyWatermarkRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `WatermarkClient.RequestOptions` 
    
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

Like `POST /v1/voices`, a challenge requested from a jurisdiction where voice cloning is not available returns 403 `voice_cloning_unavailable_in_region` and issues no phrase. The location is read from the IP address that sends the request, which is your server's when your backend calls the API.
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

## Webhooks Endpoints
<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;Speechify.WebhookEndpoint, Speechify.ListWebhookEndpointsResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

The caller's workspace's registered webhook endpoints. Cursor-paginated:
omit `cursor` for the first page; walk pages while `has_more` is true
(default page size 50, max 200). The signing `secret` is never returned
here — it is shown only when an endpoint is created or its secret is
rotated. Filter by delivery scope with `project_id`.
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
const pageableResponse = await client.webhooks.endpoints.list({
    project_id: "proj_01arz3ndektsv4rrffq69g5fav"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.webhooks.endpoints.list({
    project_id: "proj_01arz3ndektsv4rrffq69g5fav"
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

**request:** `Speechify.webhooks.ListEndpointsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">create</a>({ ...params }) -> Speechify.WebhookEndpoint</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Register a webhook endpoint. Speechify mints an HMAC signing secret
and returns it in the response `secret` field — exactly once. Store it
then; subsequent reads omit it (rotate it with the rotate-secret action
if lost). Select events via `enabled_events`: a list of catalog event
names or `["*"]` for every event. Optionally scope delivery to one
project with `project_id`; omit it for a workspace-wide endpoint that
receives every project's events. Limited to 50 endpoints per workspace.
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
await client.webhooks.endpoints.create({
    url: "https://example.com/speechify/webhooks",
    enabled_events: ["project.spend_budget.warning"],
    description: "Example description."
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

**request:** `Speechify.webhooks.CreateWebhookEndpointRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">get</a>({ ...params }) -> Speechify.WebhookEndpoint</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Fetch a webhook endpoint by id. The signing secret is never returned.
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
await client.webhooks.endpoints.get({
    webhook_endpoint_id: "whe_01jqr8x9zg5k2m3n4p5q6r7s8t"
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

**request:** `Speechify.webhooks.GetEndpointsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">delete</a>({ ...params }) -> void</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Delete a webhook endpoint. In-flight deliveries stop; returns 204 on success.
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
await client.webhooks.endpoints.delete({
    webhook_endpoint_id: "whe_01jqr8x9zg5k2m3n4p5q6r7s8t"
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

**request:** `Speechify.webhooks.DeleteEndpointsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">update</a>({ ...params }) -> Speechify.WebhookEndpoint</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Partial update; omitted fields are left unchanged. Set `disabled` to pause delivery without deleting the endpoint.
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
await client.webhooks.endpoints.update({
    webhook_endpoint_id: "whe_01jqr8x9zg5k2m3n4p5q6r7s8t",
    url: "https://example.com/webhook",
    enabled_events: ["example"],
    description: "Example description.",
    disabled: false
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

**request:** `Speechify.webhooks.UpdateWebhookEndpointRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">rotateSecret</a>({ ...params }) -> Speechify.WebhookEndpoint</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Mint a new HMAC signing secret for the endpoint and return it in the
response `secret` field (shown exactly once). The previous secret stops
signing immediately, so accept both during your cutover window.
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
await client.webhooks.endpoints.rotateSecret({
    webhook_endpoint_id: "whe_01jqr8x9zg5k2m3n4p5q6r7s8t"
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

**request:** `Speechify.webhooks.RotateSecretEndpointsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.webhooks.endpoints.<a href="/src/api/resources/webhooks/resources/endpoints/client/Client.ts">listDeliveries</a>({ ...params }) -> core.Page&lt;Speechify.WebhookEndpointDelivery, Speechify.ListWebhookEndpointDeliveriesResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Delivery attempts for one webhook endpoint, newest first. One row per
(endpoint, event, resource), updated in place across retries. Each row
includes the exact request payload and signed headers Speechify sent
(`request_body`, `request_headers`) and the response your server returned
(`last_status_code`, `last_response_body`, `last_response_headers`), so
you can verify the signature and debug failures. Cursor-paginated: omit
`cursor` for the first page; walk pages while `has_more` is true (default
page size 50, max 200).

An endpoint that was not a target of an event has no row for it: a
project-scoped endpoint records nothing for another project's events.
An empty list therefore means either nothing matched or nothing
happened. To tell them apart, check the project's own activity first:
activity there with no delivery here is a defect to report; none there
means there was nothing to deliver.
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
const pageableResponse = await client.webhooks.endpoints.listDeliveries({
    webhook_endpoint_id: "whe_01jqr8x9zg5k2m3n4p5q6r7s8t"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.webhooks.endpoints.listDeliveries({
    webhook_endpoint_id: "whe_01jqr8x9zg5k2m3n4p5q6r7s8t"
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

**request:** `Speechify.webhooks.ListDeliveriesEndpointsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `EndpointsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

