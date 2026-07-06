"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const worker = fs.readFileSync("sw.js", "utf8");
const ipaWorkflow = fs.readFileSync(".github/workflows/build-altstore-ipa.yml", "utf8");
const iosProject = fs.readFileSync("AltStore-App/project.yml", "utf8");
const audioManifest = fs.readFileSync("data/audio-manifest.json", "utf8");
const pagesWorkflowPath = ".github/workflows/deploy-listening-pwa.yml";

test("service worker keeps generated speech cache during upgrades", () => {
  assert.match(worker, /PERSISTENT_CACHES/);
  assert.match(worker, /listening-training-audio-v2/);
  assert.match(worker, /!PERSISTENT_CACHES\.has\(key\)/);
});

test("offline shell includes shared catalog and scoring core", () => {
  assert.match(worker, /listening-training-pwa-v18/);
  assert.match(worker, /training-core\.js\?v=18/);
  assert.match(worker, /voice-core\.js\?v=18/);
  assert.match(worker, /app\.js\?v=18/);
  assert.match(worker, /manifest\.webmanifest\?v=18/);
  assert.match(worker, /data\/scenarios\.json/);
  assert.match(worker, /data\/voices\.json/);
  assert.match(worker, /data\/audio-manifest\.json/);
});

test("offline shell pre-caches the local three-speaker audio pack", () => {
  assert.match(audioManifest, /"provider": "local-pack"/);
  assert.match(audioManifest, /"lin_xiao"/);
  assert.match(audioManifest, /"chen_yu"/);
  assert.match(audioManifest, /"su_ning"/);
  assert.match(worker, /LOCAL_AUDIO_ASSETS/);
  assert.match(worker, /audio\/scenarios\/lin_xiao\/task-handoff-1\.mp3/);
  assert.match(worker, /audio\/scenarios\/chen_yu\/task-handoff-1\.mp3/);
  assert.match(worker, /audio\/scenarios\/su_ning\/task-handoff-1\.mp3/);
});

test("iOS package stages the shared voice runtime and v15 release metadata", () => {
  assert.match(ipaWorkflow, /"voice-core\.js"/);
  assert.match(ipaWorkflow, /cp index\.html styles\.css app\.js training-core\.js voice-core\.js manifest\.webmanifest sw\.js AltStore-App\/Web\//);
  assert.match(ipaWorkflow, /cp -R data AltStore-App\/Web\/data/);
  assert.match(ipaWorkflow, /cp -R audio AltStore-App\/Web\/audio/);
  assert.match(iosProject, /MARKETING_VERSION: 1\.2\.1/);
  assert.match(iosProject, /CURRENT_PROJECT_VERSION: 15/);
});

test("GitHub Pages workflow publishes the HTTPS PWA with local audio only", () => {
  assert.equal(fs.existsSync(pagesWorkflowPath), true);
  const pagesWorkflow = fs.readFileSync(pagesWorkflowPath, "utf8");
  assert.match(pagesWorkflow, /actions\/configure-pages/);
  assert.match(pagesWorkflow, /actions\/upload-pages-artifact/);
  assert.match(pagesWorkflow, /actions\/deploy-pages/);
  assert.match(pagesWorkflow, /cp index\.html styles\.css app\.js training-core\.js voice-core\.js manifest\.webmanifest sw\.js public\//);
  assert.match(pagesWorkflow, /cp -R data icons audio public\//);
  assert.doesNotMatch(pagesWorkflow, /AZURE|SPEECH|SECRET|wrangler/i);
});
