"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const core = require("../voice-core.js");

test("voice catalog contains the exact three named speakers", () => {
  const raw = fs.readFileSync("data/voices.json", "utf8");
  assert.match(raw, /\\u6797\\u6653/);
  assert.match(raw, /\\u9648\\u5c7f/);
  assert.match(raw, /\\u82cf\\u5b81/);
  assert.match(raw, /\\u5973\\u58f0/);
  assert.match(raw, /\\u7537\\u58f0/);

  const catalog = JSON.parse(raw);
  assert.deepEqual(catalog, {
    version: 2,
    speakers: [
      { id: "lin_xiao", name: "\u6797\u6653", genderLabel: "\u5973\u58f0", azureVoice: "zh-CN-XiaoxiaoNeural", style: "chat", styleDegree: 0.55 },
      { id: "chen_yu", name: "\u9648\u5c7f", genderLabel: "\u7537\u58f0", azureVoice: "zh-CN-YunxiNeural", style: "chat", styleDegree: 0.45 },
      { id: "su_ning", name: "\u82cf\u5b81", genderLabel: "\u5973\u58f0", azureVoice: "zh-CN-XiaoyiNeural", style: null, styleDegree: null },
    ],
  });
  assert.equal(catalog.speakers[0].name, "\u6797\u6653");
  assert.equal(catalog.speakers[1].name, "\u9648\u5c7f");
  assert.equal(catalog.speakers[2].name, "\u82cf\u5b81");
  assert.equal(catalog.speakers[0].genderLabel, "\u5973\u58f0");
  assert.equal(catalog.speakers[1].genderLabel, "\u7537\u58f0");
  assert.equal(catalog.speakers[2].genderLabel, "\u5973\u58f0");
});

test("legacy records with an undefined source remain readable but stay ambiguous", () => {
  assert.deepEqual(core.migrateVoiceRecord({ voiceProfile: "briefing" }), {
    voiceProfile: "briefing",
    speakerId: "chen_yu",
    audioProvider: "system",
    audioDelivery: "system",
    voiceVersion: 1,
  });
});

test("cache delivery on a v2 azure record remains comparable by provider", () => {
  const migrated = core.migrateVoiceRecord({ speakerId: "lin_xiao", audioProvider: "azure", audioSource: "cache", voiceVersion: 2 });
  assert.equal(migrated.audioDelivery, "cache");
  assert.equal(migrated.audioProvider, "azure");
  assert.equal(core.isVoiceComparable(
    { speakerId: "lin_xiao", audioProvider: "azure", voiceVersion: 2 },
    migrated,
  ), true);
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
  assert.equal(
    core.isVoiceComparable(
      { speakerId: "lin_xiao", audioProvider: "azure", voiceVersion: 2 },
      { speakerId: "lin_xiao", audioProvider: "system", voiceVersion: 2 },
    ),
    false,
  );
  assert.equal(
    core.isVoiceComparable(
      { speakerId: "lin_xiao", audioProvider: "azure", voiceVersion: 2 },
      { speakerId: "lin_xiao", audioProvider: "azure", voiceVersion: 1 },
    ),
    false,
  );
});
