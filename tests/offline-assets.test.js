"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const worker = fs.readFileSync("sw.js", "utf8");
const ipaWorkflow = fs.readFileSync(".github/workflows/build-altstore-ipa.yml", "utf8");
const iosProject = fs.readFileSync("AltStore-App/project.yml", "utf8");

test("service worker keeps generated speech cache during upgrades", () => {
  assert.match(worker, /PERSISTENT_CACHES/);
  assert.match(worker, /listening-training-audio-v2/);
  assert.match(worker, /!PERSISTENT_CACHES\.has\(key\)/);
});

test("offline shell includes shared catalog and scoring core", () => {
  assert.match(worker, /listening-training-pwa-v16/);
  assert.match(worker, /training-core\.js\?v=16/);
  assert.match(worker, /voice-core\.js\?v=16/);
  assert.match(worker, /app\.js\?v=16/);
  assert.match(worker, /manifest\.webmanifest\?v=16/);
  assert.match(worker, /data\/scenarios\.json/);
  assert.match(worker, /data\/voices\.json/);
});

test("iOS package stages the shared voice runtime and v15 release metadata", () => {
  assert.match(ipaWorkflow, /"voice-core\.js"/);
  assert.match(ipaWorkflow, /cp index\.html styles\.css app\.js training-core\.js voice-core\.js manifest\.webmanifest sw\.js AltStore-App\/Web\//);
  assert.match(ipaWorkflow, /cp -R data AltStore-App\/Web\/data/);
  assert.match(iosProject, /MARKETING_VERSION: 1\.2\.1/);
  assert.match(iosProject, /CURRENT_PROJECT_VERSION: 15/);
});
