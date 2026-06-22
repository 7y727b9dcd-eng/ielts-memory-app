import assert from "node:assert/strict";
import test from "node:test";
import { createHandler } from "../src/index.js";

const env = { AZURE_SPEECH_KEY: "secret", AZURE_SPEECH_REGION: "eastasia" };

test("health endpoint reports readiness without exposing secrets", async () => {
  const handler = createHandler({ fetchImpl: async () => { throw new Error("unused"); }, cache: null });
  const response = await handler(new Request("https://voice.example/v1/health"), env);
  const body = await response.clone().text();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "listening-training-tts", version: 1 });
  assert.doesNotMatch(body, /secret/);
});

test("unknown scenario and voice are rejected before Azure is called", async () => {
  let called = 0;
  const handler = createHandler({ fetchImpl: async () => { called += 1; }, cache: null });
  assert.equal((await handler(new Request("https://voice.example/v1/tts/unknown?profile=natural&v=1"), env)).status, 404);
  assert.equal((await handler(new Request("https://voice.example/v1/tts/task-handoff-1?profile=robot&v=1"), env)).status, 400);
  assert.equal(called, 0);
});

test("valid request sends SSML to Azure and returns MP3", async () => {
  let request;
  const handler = createHandler({
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "audio/mpeg" } });
    },
    cache: null,
  });
  const response = await handler(new Request("https://voice.example/v1/tts/task-handoff-1?profile=natural&v=1&ignored=yes"), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "audio/mpeg");
  assert.match(request.url, /eastasia\.tts\.speech\.microsoft\.com/);
  assert.equal(request.init.headers["Ocp-Apim-Subscription-Key"], "secret");
  assert.match(request.init.body, /zh-CN-XiaoxiaoNeural/);
  assert.match(request.init.body, /mstts:express-as style="chat"/);
});
