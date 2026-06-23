import scenarios from "../../data/scenarios.json" with { type: "json" };
import voices from "../../data/voices.json" with { type: "json" };

const VERSION = 2;
const SERVICE = "listening-training-tts";
const PUBLIC_SPEAKER_IDS = Object.freeze(["lin_xiao", "chen_yu", "su_ning"]);
const PUBLIC_SPEAKER_ID_SET = new Set(PUBLIC_SPEAKER_IDS);
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" };
const SCENARIOS = new Map(scenarios.scenarios.map((scenario) => [scenario.id, scenario]));

function createSpeakerMap(speakers = voices.speakers) {
  const values = speakers instanceof Map ? speakers.values() : speakers;
  return new Map(
    Array.from(values, (speaker) => [speaker.id, speaker]).filter(([id]) => PUBLIC_SPEAKER_ID_SET.has(id)),
  );
}

const SPEAKERS = createSpeakerMap();

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { ...CORS, "content-type": "application/json; charset=utf-8" } });
}

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]);
}

function buildSsml(text, speaker) {
  const content = speaker.style
    ? `<mstts:express-as style="${speaker.style}" styledegree="${speaker.styleDegree}"><prosody rate="0%">${escapeXml(text)}</prosody></mstts:express-as>`
    : `<prosody rate="0%">${escapeXml(text)}</prosody>`;
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN"><voice name="${speaker.azureVoice}">${content}</voice></speak>`;
}

function getHealth(env) {
  const azureConfigured = Boolean(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION);
  return {
    status: azureConfigured ? 200 : 503,
    body: { ok: azureConfigured, service: SERVICE, version: VERSION, azureConfigured },
  };
}

export function createHandler({ fetchImpl = fetch, cache = globalThis.caches?.default, speakers = SPEAKERS } = {}) {
  const speakerMap = createSpeakerMap(speakers);
  return async function handle(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
    const url = new URL(request.url);
    if (url.pathname === "/v1/health") {
      const health = getHealth(env);
      return json(health.body, health.status);
    }
    const match = url.pathname.match(/^\/v1\/tts\/([^/]+)$/);
    if (!match) return json({ error: "not_found" }, 404);
    const scenario = SCENARIOS.get(decodeURIComponent(match[1]));
    if (!scenario) return json({ error: "unknown_scenario" }, 404);
    const profile = url.searchParams.get("profile");
    const speaker = profile ? speakerMap.get(profile) : null;
    if (!speaker || url.searchParams.get("v") !== String(VERSION)) return json({ error: "invalid_voice_or_version" }, 400);
    if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) return json({ error: "speech_not_configured" }, 503);

    const normalized = new URL(`/v1/tts/${scenario.id}?profile=${speaker.id}&v=${VERSION}`, url.origin).toString();
    const cacheKey = new Request(normalized, { method: "GET" });
    const cached = cache ? await cache.match(cacheKey) : null;
    if (cached) return cached;

    const azure = await fetchImpl(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": env.AZURE_SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "ListeningTrainingTTS/2.0",
      },
      body: buildSsml(scenario.text, speaker),
    });
    if (!azure.ok) return json({ error: "speech_upstream_failed", status: azure.status }, 502);
    const response = new Response(azure.body, { status: 200, headers: { ...CORS, "content-type": "audio/mpeg", "cache-control": "public, max-age=31536000, immutable" } });
    if (cache) await cache.put(cacheKey, response.clone());
    return response;
  };
}

const handle = createHandler();
export default { fetch: handle };
