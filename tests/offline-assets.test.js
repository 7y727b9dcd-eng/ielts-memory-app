"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const worker = fs.readFileSync("sw.js", "utf8");

test("service worker keeps generated speech cache during upgrades", () => {
  assert.match(worker, /PERSISTENT_CACHES/);
  assert.match(worker, /listening-training-audio-v1/);
  assert.match(worker, /!PERSISTENT_CACHES\.has\(key\)/);
});

test("offline shell includes shared catalog and scoring core", () => {
  assert.match(worker, /training-core\.js\?v=14/);
  assert.match(worker, /voice-core\.js\?v=14/);
  assert.match(worker, /data\/scenarios\.json/);
});
