// Hand-kept (listed in .fernignore). Generated wire tests always pass an explicit
// environment, so nothing else exercises the client a user builds with no options.
import { Speechify, SpeechifyClient, SpeechifyEnvironment } from "../src";

interface CapturedRequest {
    url: string;
    headers: Headers;
}

function offlineClient(
    status = 200,
    body = "{}",
    contentType = "application/json",
): { client: SpeechifyClient; requests: CapturedRequest[] } {
    const requests: CapturedRequest[] = [];
    const fetchStub = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        requests.push({ url: String(input), headers: new Headers(init?.headers) });
        return new Response(body, { status, headers: { "Content-Type": contentType } });
    };
    return { client: new SpeechifyClient({ token: "test-token", fetch: fetchStub as typeof fetch }), requests };
}

describe("a client built with no environment or baseUrl", () => {
    it("names its REST and WebSocket URLs base and websocket", () => {
        expect(SpeechifyEnvironment.Default).toEqual({
            base: "https://api.speechify.ai",
            websocket: "wss://api.speechify.ai",
        });
    });

    it("sends audio.speech to api.speechify.ai", async () => {
        const { client, requests } = offlineClient();

        await client.audio.speech({ input: "Hello", voice_id: "geffen_32", model: "simba-3.5" });

        expect(requests).toHaveLength(1);
        expect(requests[0]?.url).toBe("https://api.speechify.ai/v1/audio/speech");
        expect(requests[0]?.headers.get("Authorization")).toBe("Bearer test-token");
    });

    it("sends the same Speechify-Version from every resource client", async () => {
        const { client, requests } = offlineClient();

        await client.audio.speech({ input: "Hello", voice_id: "geffen_32" });
        await client.models.list();
        await client.voices.list();

        const versions = new Set(requests.map((request) => request.headers.get("Speechify-Version")));
        expect(versions.size).toBe(1);
        expect([...versions][0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    // Framed exactly as the API writes it: a named event, one data line, a blank line.
    it("reads every event of a with-timestamps stream, the final speech.done included", async () => {
        const sse =
            'event: speech.chunk\ndata: {"type":"speech.chunk","audio":"AAAA"}\n\n' +
            'event: speech.done\ndata: {"type":"speech.done","billable_characters_count":5,"audio_duration_ms":120}\n\n';
        const { client } = offlineClient(200, sse, "text/event-stream");

        const events: Speechify.SpeechStreamEvent[] = [];
        for await (const event of await client.audio.streamWithTimestamps({
            body: { input: "Hello", voice_id: "geffen_32" },
        })) {
            events.push(event);
        }

        expect(events.map((event) => event.type)).toEqual(["speech.chunk", "speech.done"]);
        const done = events[1];
        expect(done?.type === "speech.done" && done.billable_characters_count).toBe(5);
    });

    it("throws ContentTooLargeError when the API refuses an oversized body", async () => {
        const { client } = offlineClient(413);

        await expect(client.audio.speech({ input: "Hello", voice_id: "geffen_32" })).rejects.toBeInstanceOf(
            Speechify.ContentTooLargeError,
        );
    });
});
