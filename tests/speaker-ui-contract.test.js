"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const index = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("app.js", "utf8");

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

test("task 3 keeps exactly one explicit system fallback speaker path", () => {
  assert.match(app, /const SYSTEM_SPEAKER\s*=\s*Object\.freeze\(\s*\{[^}]*id:\s*"system"/s);
});
