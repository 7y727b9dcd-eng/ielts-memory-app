"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const index = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const manifest = fs.readFileSync("manifest.webmanifest", "utf8");
const worker = fs.readFileSync("sw.js", "utf8");
const speakerCatalog = JSON.parse(fs.readFileSync("data/voices.json", "utf8")).speakers;

function createElement(id) {
  return {
    id,
    innerHTML: "",
    textContent: "",
    value: "",
    disabled: false,
    checked: false,
    classList: { add() {}, remove() {}, toggle() {} },
    querySelectorAll() { return []; },
    addEventListener() {},
  };
}

function createAppRuntime({ fetchImpl, includeSpeechSynthesis = false, trainingCore = {}, voiceCore = {} } = {}) {
  const elements = new Map();
  const previewButton = { disabled: false, dataset: { speakerPreview: "lin_xiao" } };
  const document = {
    readyState: "loading",
    documentElement: { dataset: {} },
    addEventListener() {},
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement(id));
      return elements.get(id);
    },
    querySelector(selector) {
      return selector.includes("data-speaker-preview") ? previewButton : null;
    },
    querySelectorAll() { return []; },
    createElement,
  };
  const window = {
    TrainingCore: {
      summarizeBaseline() {},
      scoreSlotMethod() {},
      scoreMetaMethod() {},
      scoreDelayedMethod() {},
      evaluateProgress(_baseline, items) { return { status: "collecting", count: items.length }; },
      evaluateMethodTrend(items) { return { count: items.length }; },
      ...trainingCore,
    },
    VoiceCore: {
      migrateVoiceRecord(value) { return value; },
      isVoiceComparable(baseline, attempt) {
        return Boolean(baseline && attempt && baseline.speakerId === attempt.speakerId && baseline.audioProvider === attempt.audioProvider && Number(baseline.voiceVersion) === Number(attempt.voiceVersion));
      },
      LEGACY_SPEAKERS: { natural: "lin_xiao", briefing: "chen_yu", calm: "su_ning", system: "system" },
      ...voiceCore,
    },
    addEventListener() {},
  };
  const speechSynthesis = {
    cancel() {},
    speak() {},
    getVoices() { return []; },
  };
  if (includeSpeechSynthesis) window.speechSynthesis = speechSynthesis;
  const context = {
    document,
    window,
    console,
    fetch: fetchImpl || (async () => ({ ok: false, json: async () => ({}) })),
    AbortController,
    Audio: function Audio() { return { play: async () => {}, pause() {}, removeAttribute() {}, load() {} }; },
    URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
    performance: { now() { return 0; } },
    setTimeout() { return 1; },
    clearTimeout() {},
    localStorage: { getItem() { return null; }, setItem() {} },
    indexedDB: {},
    Intl,
    Date,
    Math,
  };
  if (includeSpeechSynthesis) {
    context.speechSynthesis = speechSynthesis;
    context.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) { this.text = text; };
  }
  vm.createContext(context);
  vm.runInContext(`${app}
globalThis.__speakerRuntime = {
  setSpeakerState(catalog, state, settingsPatch = {}) {
    speakerCatalog = catalog;
    speakerCatalogMap = new Map(catalog.map((speaker) => [speaker.id, speaker]));
    voiceServiceState = state;
    settings = { ...settings, ...settingsPatch };
  },
  renderSpeakerChoices,
  updateSpeakerSelectOptions,
  checkVoiceService,
  previewSpeaker,
  renderMethodProgress,
  setProgressState(baselineSummary, nextAttempts) {
    profile = { ...profile, baselineSummary };
    attempts = nextAttempts;
  }
};`, context);
  return {
    context,
    previewButton,
    getElement(id) { return document.getElementById(id); },
  };
}

test("interactive speaker setup uses generated speaker choices instead of voice type cards", () => {
  assert.match(index, /id="speakerChoiceGrid"/);
  assert.doesNotMatch(index, /name="voiceProfile"/);
  assert.doesNotMatch(index, /\u81ea\u7136\u4ea4\u6d41/);
  assert.doesNotMatch(index, /\u6e05\u6670\u6c47\u62a5/);
  assert.doesNotMatch(index, /\u6c89\u7a33\u8bf4\u660e/);
});

test("task 3 upgrades the browser contract to v2 cloud voice health checks", () => {
  assert.match(app, /const AUDIO_CACHE_NAME = "listening-training-audio-v2";/);
  assert.match(app, /const TTS_VERSION = "2";/);
  assert.match(app, /async function loadSpeakerCatalog\(/);
  assert.match(app, /function renderSpeakerChoices\(/);
  assert.match(app, /async function checkVoiceService\(/);
  assert.match(app, /\/v1\/health/);
  assert.match(app, /AbortController/);
  assert.match(app, /4000/);
  assert.match(app, /azureConfigured/);
  assert.match(app, /version\s*===\s*2|version\s*!==\s*2|Number\(.*version.*\)\s*===\s*2/s);
});

test("task 3 keeps web assets aligned on pwa v15 while preserving audio cache v2", () => {
  assert.match(index, /href="\.\/manifest\.webmanifest\?v=15"/);
  assert.match(index, /styles\.css\?v=15/);
  assert.match(index, /training-core\.js\?v=15/);
  assert.match(index, /voice-core\.js\?v=15/);
  assert.match(index, /app\.js\?v=15/);
  assert.match(manifest, /"start_url": "\.\/index\.html\?v=15"/);
  assert.match(worker, /const CACHE_NAME = "listening-training-pwa-v15";/);
  assert.match(worker, /const AUDIO_CACHE_NAME = "listening-training-audio-v2";/);
  assert.match(worker, /\.\/index\.html\?v=15/);
  assert.match(worker, /\.\/styles\.css\?v=15/);
  assert.match(worker, /\.\/training-core\.js\?v=15/);
  assert.match(worker, /\.\/voice-core\.js\?v=15/);
  assert.match(worker, /\.\/app\.js\?v=15/);
});

test("task 3 uses voices.json as the only cloud speaker catalog source", () => {
  assert.match(app, /const VOICE_CATALOG_URL = "\.\/data\/voices\.json";/);
  assert.doesNotMatch(app, /DEFAULT_SPEAKER_CATALOG/);
  assert.doesNotMatch(app, /const VOICE_PROFILES\s*=/);
  assert.match(app, /const SYSTEM_SPEAKER\s*=\s*Object\.freeze\(/);
  assert.match(app, /const LEGACY_VOICE_PROFILE_BY_SPEAKER\s*=\s*Object\.freeze\(/);
  assert.match(app, /let speakerCatalog = \[\];/);
  assert.match(app, /let speakerCatalogMap = new Map\(\);/);
  assert.match(app, /return \[\];/);
});

test("task 3 keeps one explicit system fallback path and disables named speakers when cloud voice is unavailable", () => {
  assert.match(app, /const SYSTEM_SPEAKER\s*=\s*Object\.freeze\(\s*\{[^}]*id:\s*"system"/s);
  assert.match(app, /const cloudSpeakersReady = voiceServiceState\.available && speakerCatalog\.length > 0;/);
  assert.match(app, /cloudSpeakersReady\s*\?\s*speakerCatalog\.map\(\(speaker\)\s*=>\s*\(\{\s*\.\.\.speaker,\s*available:\s*true,\s*disabled:\s*false\s*\}\)\)/s);
  assert.match(app, /\{\s*\.\.\.SYSTEM_SPEAKER,\s*available:\s*true,\s*disabled:\s*false,\s*checked:\s*true\s*\}/s);
  assert.match(app, /speakerCatalog\.map\(\(speaker\)\s*=>\s*\(\{\s*\.\.\.speaker,\s*available:\s*false,\s*disabled:\s*true\s*\}\)\)/s);
  assert.match(app, /const options = cloudSpeakersReady \? speakerCatalog : \[SYSTEM_SPEAKER\];/);
  assert.match(app, /select\.disabled = !cloudSpeakersReady/);
});

test("task 3 preview fallback guards browsers without speechSynthesis", () => {
  assert.match(app, /if\s*\(!\("speechSynthesis" in window\)\)\s*\{\s*\$\("voiceSetupStatus"\)\.textContent = .*?return;\s*\}/s);
});

test("runtime disables named speaker controls when cloud voice is unavailable", () => {
  const runtime = createAppRuntime();
  runtime.context.__speakerRuntime.setSpeakerState(speakerCatalog, { available: false, reason: "unreachable", endpoint: "", version: 2 });

  runtime.context.__speakerRuntime.updateSpeakerSelectOptions();
  assert.equal(runtime.getElement("speakerIdInput").disabled, true);
  assert.match(runtime.getElement("speakerIdInput").innerHTML, /value="system"/);
  assert.doesNotMatch(runtime.getElement("speakerIdInput").innerHTML, /value="lin_xiao"/);

  runtime.context.__speakerRuntime.renderSpeakerChoices("lin_xiao");
  const html = runtime.getElement("speakerChoiceGrid").innerHTML;
  assert.match(html, /value="system" checked/);
  assert.match(html, /value="lin_xiao"[^>]*disabled/);
  assert.match(html, /value="chen_yu"[^>]*disabled/);
  assert.match(html, /value="su_ning"[^>]*disabled/);
});

test("runtime health check requires azure readiness and v2 contract", async () => {
  const healthBodies = [
    { ok: true, azureConfigured: true, version: 2 },
    { ok: true, azureConfigured: true, version: 1 },
  ];
  const requestedUrls = [];
  const runtime = createAppRuntime({
    fetchImpl: async (url) => {
      requestedUrls.push(String(url));
      return { ok: true, json: async () => healthBodies.shift() };
    },
  });
  runtime.context.__speakerRuntime.setSpeakerState(speakerCatalog, { available: false, reason: "not_configured", endpoint: "", version: 2 }, { ttsEndpoint: "https://voice.example/" });

  const ready = await runtime.context.__speakerRuntime.checkVoiceService();
  const stale = await runtime.context.__speakerRuntime.checkVoiceService();

  assert.equal(requestedUrls[0], "https://voice.example/v1/health");
  assert.equal(ready.available, true);
  assert.equal(stale.available, false);
  assert.ok(["unavailable", "unhealthy"].includes(stale.reason));
});

test("runtime preview immediately restores the button when no speech synthesis fallback exists", async () => {
  const runtime = createAppRuntime({ includeSpeechSynthesis: false });
  runtime.context.__speakerRuntime.setSpeakerState(speakerCatalog, { available: false, reason: "unreachable", endpoint: "", version: 2 }, { ttsEndpoint: "" });

  await runtime.context.__speakerRuntime.previewSpeaker("lin_xiao");

  assert.equal(runtime.previewButton.disabled, false);
  assert.match(runtime.getElement("voiceSetupStatus").textContent, /无法试用设备语音/);
});

test("runtime method progress renders actual-source filtering and excluded counts", () => {
  const runtime = createAppRuntime();
  runtime.context.__speakerRuntime.setProgressState(
    { detail: 0.7, intent: 1, stableDuration: 20, speakerId: "system", audioProvider: "system", voiceVersion: 2 },
    [
      { methodId: "slot", sessionComplete: true, detailScore: 0.8, intentScore: 1, duration: 20, speakerId: "system", audioProvider: "system", voiceVersion: 2 },
      { methodId: "slot", sessionComplete: true, detailScore: 0.9, intentScore: 1, duration: 25, speakerId: "lin_xiao", audioProvider: "azure", voiceVersion: 2 },
      { methodId: "meta", sessionComplete: true, detailScore: 0.8, intentScore: 1, duration: 20, speakerId: "system", audioProvider: "system", voiceVersion: 1 },
      { methodId: "delayed", sessionComplete: true, detailScore: 0.8, intentScore: 1, duration: 20, speakerId: "system", audioProvider: "system", voiceVersion: 2 },
    ],
  );

  runtime.context.__speakerRuntime.renderMethodProgress();

  const html = runtime.getElement("methodProgressGrid").innerHTML;
  assert.match(html, /说话人：设备语音 · 来源：设备语音/);
  assert.match(html, /信息槽位压缩[\s\S]*可比 1 \/ 5 题[\s\S]*另有 1 题因人物或实际音源不同未纳入结论/);
  assert.match(html, /预测—监控—复盘[\s\S]*可比 0 \/ 5 题[\s\S]*另有 1 题因人物或实际音源不同未纳入结论/);
  assert.match(html, /先理解后应答[\s\S]*可比 1 \/ 5 题[\s\S]*另有 0 题因人物或实际音源不同未纳入结论/);
});
