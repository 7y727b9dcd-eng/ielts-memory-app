import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createHandler } from "../src/index.js";

const env = { AZURE_SPEECH_KEY: "secret", AZURE_SPEECH_REGION: "eastasia" };

function createMemoryCache() {
  const store = new Map();
  return {
    async match(request) {
      const response = store.get(request.url);
      return response ? response.clone() : null;
    },
    async put(request, response) {
      store.set(request.url, response.clone());
    },
  };
}

test("worker imports the shared speaker catalog instead of hard-coding Azure voices", () => {
  const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  assert.match(source, /data\/voices\.json/);
  assert.doesNotMatch(source, /zh-CN-XiaoxiaoNeural|zh-CN-YunxiNeural|zh-CN-XiaoyiNeural/);
});

test("health is unavailable when either Azure secret is absent", async () => {
  const handler = createHandler({ fetchImpl: async () => { throw new Error("unused"); }, cache: null });
  const response = await handler(new Request("https://voice.example/v1/health"), {});
  const body = await response.clone().text();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    ok: false,
    service: "listening-training-tts",
    version: 2,
    azureConfigured: false,
  });
  assert.doesNotMatch(body, /secret/);
});

test("health is ready only when both Azure secrets exist", async () => {
  const handler = createHandler({ fetchImpl: async () => { throw new Error("unused"); }, cache: null });
  const response = await handler(new Request("https://voice.example/v1/health"), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "listening-training-tts",
    version: 2,
    azureConfigured: true,
  });
});

test("wildcard CORS preflight is preserved", async () => {
  const handler = createHandler({ fetchImpl: async () => { throw new Error("unused"); }, cache: null });
  const response = await handler(new Request("https://voice.example/v1/tts/task-handoff-1", { method: "OPTIONS" }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(response.headers.get("access-control-allow-methods"), "GET, OPTIONS");
});

test("unknown scenario, profile, and version are rejected before Azure is called", async () => {
  let called = 0;
  const handler = createHandler({ fetchImpl: async () => { called += 1; }, cache: null });
  assert.equal((await handler(new Request("https://voice.example/v1/tts/unknown?profile=lin_xiao&v=2"), env)).status, 404);
  assert.equal((await handler(new Request("https://voice.example/v1/tts/task-handoff-1?profile=robot&v=2"), env)).status, 400);
  assert.equal((await handler(new Request("https://voice.example/v1/tts/task-handoff-1?profile=lin_xiao&v=1"), env)).status, 400);
  assert.equal(called, 0);
});

test("lin xiao and chen yu use the shared v2 Azure speaker settings", async () => {
  const requests = [];
  const handler = createHandler({
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "audio/mpeg" } });
    },
    cache: null,
  });

  const linXiao = await handler(new Request("https://voice.example/v1/tts/task-handoff-1?profile=lin_xiao&v=2"), env);
  const chenYu = await handler(new Request("https://voice.example/v1/tts/task-handoff-1?profile=chen_yu&v=2"), env);

  assert.equal(linXiao.status, 200);
  assert.equal(chenYu.status, 200);
  assert.equal(linXiao.headers.get("content-type"), "audio/mpeg");
  assert.equal(requests[0].init.headers["Ocp-Apim-Subscription-Key"], "secret");
  assert.match(requests[0].url, /eastasia\.tts\.speech\.microsoft\.com/);
  assert.match(requests[0].init.body, /zh-CN-XiaoxiaoNeural/);
  assert.match(requests[0].init.body, /mstts:express-as style="chat" styledegree="0\.55"/);
  assert.match(requests[1].init.body, /zh-CN-YunxiNeural/);
  assert.match(requests[1].init.body, /mstts:express-as style="chat" styledegree="0\.45"/);
});

test("su ning omits express-as while still returning mp3", async () => {
  let request;
  const handler = createHandler({
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response(new Uint8Array([4, 5, 6]), { status: 200, headers: { "content-type": "audio/mpeg" } });
    },
    cache: null,
  });

  const response = await handler(new Request("https://voice.example/v1/tts/task-handoff-1?profile=su_ning&v=2"), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "audio/mpeg");
  assert.match(request.url, /eastasia\.tts\.speech\.microsoft\.com/);
  assert.match(request.init.body, /zh-CN-XiaoyiNeural/);
  assert.doesNotMatch(request.init.body, /mstts:express-as/);
});

test("equivalent v2 requests share the same cache key and call Azure once", async () => {
  let called = 0;
  const handler = createHandler({
    fetchImpl: async () => {
      called += 1;
      return new Response(new Uint8Array([7, 8, 9]), { status: 200, headers: { "content-type": "audio/mpeg" } });
    },
    cache: createMemoryCache(),
  });

  const first = await handler(new Request("https://voice.example/v1/tts/task-handoff-1?profile=lin_xiao&v=2&ignored=yes"), env);
  const second = await handler(new Request("https://voice.example/v1/tts/task-handoff-1?foo=bar&profile=lin_xiao&v=2"), env);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(called, 1);
});

test("Azure upstream failures become 502 responses", async () => {
  const handler = createHandler({
    fetchImpl: async () => new Response("nope", { status: 500 }),
    cache: null,
  });
  const response = await handler(new Request("https://voice.example/v1/tts/task-handoff-1?profile=lin_xiao&v=2"), env);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "speech_upstream_failed", status: 500 });
});
