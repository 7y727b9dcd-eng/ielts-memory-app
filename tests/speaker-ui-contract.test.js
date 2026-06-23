"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const index = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const manifest = fs.readFileSync("manifest.webmanifest", "utf8");
const worker = fs.readFileSync("sw.js", "utf8");

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
