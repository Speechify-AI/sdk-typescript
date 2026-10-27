// Hand-kept (listed in .fernignore). Generated wire tests always pass an explicit
// environment, so nothing else exercises the client a user builds with no options.
import { Speechify, SpeechifyClient } from "../src";

interface CapturedRequest {
    url: string;
    headers: Headers;
}

function offlineClient(status = 200): { client: SpeechifyClient; requests: CapturedRequest[] } {
    const requests: CapturedRequest[] = [];
    const fetchStub = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        requests.push({ url: String(input), headers: new Headers(init?.headers) });
        return new Response("{}", { status, headers: { "Content-Type": "application/json" } });
    };
    return { client: new SpeechifyClient({ token: "test-token", fetch: fetchStub as typeof fetch }), requests };
}

describe("a client built with no environment or baseUrl", () => {
    it("sends audio.speech to the production API", async () => {
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

    it("throws ContentTooLargeError when the API refuses an oversized body", async () => {
        const { client } = offlineClient(413);

        await expect(client.audio.speech({ input: "Hello", voice_id: "geffen_32" })).rejects.toBeInstanceOf(
            Speechify.ContentTooLargeError,
        );
    });
});
