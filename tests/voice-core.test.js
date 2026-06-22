"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const core = require("../voice-core.js");

test("voice catalog contains the exact three named speakers", () => {
  const catalog = JSON.parse(fs.readFileSync("data/voices.json", "utf8"));
  assert.deepEqual(catalog, {
    version: 2,
    speakers: [
      { id: "lin_xiao", name: "鏋楁檽", genderLabel: "濂冲０", azureVoice: "zh-CN-XiaoxiaoNeural", style: "chat", styleDegree: 0.55 },
      { id: "chen_yu", name: "闄堝笨", genderLabel: "鐢峰０", azureVoice: "zh-CN-YunxiNeural", style: "chat", styleDegree: 0.45 },
      { id: "su_ning", name: "鑻忓畞", genderLabel: "濂冲０", azureVoice: "zh-CN-XiaoyiNeural", style: null, styleDegree: null },
    ],
  });
});

test("legacy briefing cache records migrate to the named speaker model", () => {
  assert.deepEqual(core.migrateVoiceRecord({ voiceProfile: "briefing", audioSource: "cache" }), {
    voiceProfile: "briefing",
    audioSource: "cache",
    speakerId: "chen_yu",
    audioProvider: "azure",
    audioDelivery: "cache",
    voiceVersion: 1,
  });
});

test("voice comparison requires exact speaker provider and version matches", () => {
  assert.equal(
    core.isVoiceComparable(
      { speakerId: "lin_xiao", audioProvider: "azure", voiceVersion: 2 },
      { speakerId: "lin_xiao", audioProvider: "azure", voiceVersion: 2 },
    ),
    true,
  );
  assert.equal(
    core.isVoiceComparable(
      { speakerId: "lin_xiao", audioProvider: "azure", voiceVersion: 2 },
      { speakerId: "chen_yu", audioProvider: "azure", voiceVersion: 2 },
    ),
    false,
  );
});
