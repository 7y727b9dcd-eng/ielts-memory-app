"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const core = require("../training-core.js");

test("slot method uses F1 across unique information types", () => {
  assert.equal(core.scoreSlotMethod(["person", "time"], ["person", "action", "time"]), 0.8);
  assert.equal(core.scoreSlotMethod([], ["person"]), 0);
});

test("delayed response combines intent and constraint accuracy", () => {
  assert.equal(core.scoreDelayedMethod(1, [0], [0, 1]), 0.8667);
  assert.equal(core.scoreDelayedMethod(0, [], [0]), 0);
});

test("metacognitive method rewards relevant prediction and calibrated confidence", () => {
  const score = core.scoreMetaMethod({
    predictedTypes: ["time", "action"],
    actualTypes: ["time", "action", "reason"],
    confidence: 4,
    detailScore: 0.8,
    reviewed: true,
  });
  assert.equal(score, 1);
});

test("baseline summary stores the actual source fields and stable duration", () => {
  const result = core.summarizeBaseline([
    { detailScore: 0.75, intentScore: 1, replayCount: 0, duration: 20, voiceProfile: "natural", speakerId: "system", audioProvider: "system", voiceVersion: 2, audioSource: "system" },
    { detailScore: 0.5, intentScore: 1, replayCount: 1, duration: 34, voiceProfile: "natural", speakerId: "system", audioProvider: "system", voiceVersion: 2, audioSource: "system" },
  ]);
  assert.deepEqual(result, {
    detailScore: 0.625,
    intentScore: 1,
    onePassRate: 0.5,
    stableDuration: 20,
    speakerId: "system",
    audioProvider: "system",
    voiceVersion: 2,
    completedAt: result.completedAt,
  });
  assert.match(result.completedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("progress needs five comparable questions and detects improvement", () => {
  const baseline = { detailScore: 0.7, intentScore: 0.8, stableDuration: 20, speakerId: "lin_xiao", audioProvider: "azure", voiceVersion: 2 };
  assert.equal(core.evaluateProgress(baseline, Array(4).fill({ detailScore: 0.9, intentScore: 0.9, duration: 30 })).status, "collecting");
  const improved = core.evaluateProgress(baseline, Array(5).fill({ detailScore: 0.8, intentScore: 0.82, duration: 25 }));
  assert.equal(improved.status, "improved");
  assert.equal(improved.detailDelta, 10);
});

test("method trend compares first five with latest five after ten questions", () => {
  const attempts = [0.4, 0.5, 0.6, 0.5, 0.5, 0.7, 0.8, 0.9, 0.8, 0.8].map((methodScore) => ({ methodScore }));
  assert.deepEqual(core.evaluateMethodTrend(attempts), { count: 10, firstFive: 0.5, latestFive: 0.8, delta: 30 });
});
