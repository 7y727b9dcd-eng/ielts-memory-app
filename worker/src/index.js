import catalog from "../../data/scenarios.json" with { type: "json" };

const VOICES = Object.freeze({
  natural: { name: "zh-CN-XiaoxiaoNeural", style: "chat", degree: "0.7" },
  briefing: { name: "zh-CN-YunxiNeural", style: "assistant", degree: "0.7" },
  calm: { name: "zh-CN-XiaoyiNeural", style: "serious", degree: "0.6" },
});
const SCENARIOS = new Map(catalog.scenarios.map((scenario) => [scenario.id, scenario]));
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" };

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { ...CORS, "content-type": "application/json; charset=utf-8" } });
}

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]);
}

function buildSsml(text, voice) {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN"><voice name="${voice.name}"><mstts:express-as style="${voice.style}" styledegree="${voice.degree}"><prosody rate="0%">${escapeXml(text)}</prosody></mstts:express-as></voice></speak>`;
}

export function createHandler({ fetchImpl = fetch, cache = globalThis.caches?.default } = {}) {
  return async function handle(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
    const url = new URL(request.url);
    if (url.pathname === "/v1/health") return json({ ok: true, service: "listening-training-tts", version: 1 });
    const match = url.pathname.match(/^\/v1\/tts\/([^/]+)$/);
    if (!match) return json({ error: "not_found" }, 404);
    const scenario = SCENARIOS.get(decodeURIComponent(match[1]));
    if (!scenario) return json({ error: "unknown_scenario" }, 404);
    const profile = url.searchParams.get("profile") || "natural";
    const voice = VOICES[profile];
    if (!voice || url.searchParams.get("v") !== "1") return json({ error: "invalid_voice_or_version" }, 400);
    if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) return json({ error: "speech_not_configured" }, 503);

    const normalized = new URL(`/v1/tts/${scenario.id}?profile=${profile}&v=1`, url.origin).toString();
    const cacheKey = new Request(normalized, { method: "GET" });
    const cached = cache ? await cache.match(cacheKey) : null;
    if (cached) return cached;

    const azure = await fetchImpl(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": env.AZURE_SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "ListeningTrainingTTS/1.0",
      },
      body: buildSsml(scenario.text, voice),
    });
    if (!azure.ok) return json({ error: "speech_upstream_failed", status: azure.status }, 502);
    const response = new Response(azure.body, { status: 200, headers: { ...CORS, "content-type": "audio/mpeg", "cache-control": "public, max-age=31536000, immutable" } });
    if (cache) await cache.put(cacheKey, response.clone());
    return response;
  };
}

const handle = createHandler();
export default { fetch: handle };
